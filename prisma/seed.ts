
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  // Create first admin user
  const adminPassword = await hashPassword('admin123');
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: adminPassword
    },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      notices: {
        create: [
          {
            title: 'Platform Launch',
            content: 'We are excited to launch our new platform!',
            important: true,
          },
        ],
      },
    },
  });

  // Create second admin user
  const admin2Password = await hashPassword('admin456');
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@example.com' },
    update: {
      password: admin2Password
    },
    create: {
      name: 'Second Admin',
      email: 'admin2@example.com',
      password: admin2Password,
      role: UserRole.ADMIN,
    },
  });

  // Teacher User
  const teacherPassword = await hashPassword('teacher123');
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {
      password: teacherPassword
    },
    create: {
      name: 'Mr. Sharma',
      email: 'teacher@example.com',
      password: teacherPassword,
      role: UserRole.TEACHER,
      notices: {
        create: [
          {
            title: 'Class Schedule Update',
            content: 'Class timings have changed for next week.',
          },
          {
            title: 'Assignment Reminder',
            content: 'Submit assignments before Friday.',
            important: true,
          },
        ],
      },
    },
  });

  // Student Users
  const studentPassword = await hashPassword('student123');
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {
      password: studentPassword
    },
    create: {
      name: 'Alice Khan',
      email: 'student1@example.com',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {
      password: studentPassword
    },
    create: {
      name: 'Rahul Verma',
      email: 'student2@example.com',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  });

  console.log('Seeded users and notices:', {
    admin1,
    admin2,
    teacherUser,
    student1,
    student2,
  });
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
