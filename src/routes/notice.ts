
import express from 'express';
import prisma from '../db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { UserRole } from '@prisma/client';

export const noticeRoutes = express.Router();

// Get all notices
noticeRoutes.get('/', async (req, res) => {
  try {
    let { startDate, endDate } = req.query;
    
    // Build filter conditions
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        createdAt: {
          ...(startDate && { gte: new Date(startDate as string) }),
          ...(endDate && { lte: new Date(endDate as string) }),
        }
      };
    }
    
    const notices = await prisma.notice.findMany({
      where: dateFilter,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data for frontend use
    const formattedNotices = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      important: notice.important,
      createdAt: notice.createdAt,
      authorId: notice.authorId,
      authorName: notice.author.name
    }));
    
    res.status(200).json(formattedNotices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Server error fetching notices' });
  }
});

// Create a notice (teachers and admin only)
noticeRoutes.post('/', authenticateToken, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), async (req, res) => {
  try {
    const { title, content, important = false } = req.body;
    const authorId = req.user?.userId;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        important,
        authorId: authorId as string,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      important: notice.important,
      createdAt: notice.createdAt,
      authorId: notice.authorId,
      authorName: notice.author.name
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Server error creating notice' });
  }
});

// Delete a notice (by author or admin)
noticeRoutes.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    // Check if notice exists
    const notice = await prisma.notice.findUnique({
      where: { id }
    });

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    // Check if user is authorized to delete
    // Admin can delete any notice
    // Teachers can only delete their own notices
    if (userRole !== UserRole.ADMIN && notice.authorId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this notice' });
    }

    // Delete notice
    await prisma.notice.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Server error deleting notice' });
  }
});
