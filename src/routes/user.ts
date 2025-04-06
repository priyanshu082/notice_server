
import express from 'express';
import prisma from '../db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

export const userRoutes = express.Router();

// Get all users (admin only)
userRoutes.get('/', authenticateToken, authorizeRoles(UserRole.ADMIN), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    // Count ADMIN users to ensure we don't have more than 2
    const adminCount = users.filter(user => user.role === UserRole.ADMIN).length;
    
    res.status(200).json({
      users,
      adminCount
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Create user (admin only)
userRoutes.post('/', authenticateToken, authorizeRoles(UserRole.ADMIN), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }
    
    // Check if trying to create an admin user when we already have 2
    if (role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN }
      });
      
      if (adminCount >= 2) {
        return res.status(403).json({ message: 'Maximum of 2 admin users already exist' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

// Update user role (admin only)
userRoutes.put('/:id/role', authenticateToken, authorizeRoles(UserRole.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if trying to create an admin user when we already have 2
    if (role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { 
          role: UserRole.ADMIN,
          NOT: { id: id }
        }
      });
      
      if (adminCount >= 2) {
        return res.status(403).json({ message: 'Maximum of 2 admin users already exist' });
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// Delete user (admin only)
userRoutes.delete('/:id', authenticateToken, authorizeRoles(UserRole.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If the user is an admin, check if their deletion would leave at least one admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN }
      });
      
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Cannot delete the last admin user' });
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});
