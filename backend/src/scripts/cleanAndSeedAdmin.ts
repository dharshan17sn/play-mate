import { prisma, database } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

async function main() {
  logger.info('👤 Starting admin cleanup and seeding...');

  try {
    // Connect to database if not connected
    await database.connect();

    // 1. Delete existing admin if any
    const existingAdminByUserId = await prisma.user.findUnique({
      where: { user_id: 'admin' },
    });

    const existingAdminByEmail = await prisma.user.findUnique({
      where: { email: 'admin@playmate.com' },
    });

    if (existingAdminByUserId) {
      logger.info('🗑️ Found existing admin user by user_id, deleting...');
      // Delete user's related data first to prevent foreign key constraint violations
      await prisma.userGame.deleteMany({ where: { userId: 'admin' } });
      await prisma.teamMember.deleteMany({ where: { userId: 'admin' } });
      await prisma.notification.deleteMany({ where: { userId: 'admin' } });
      await prisma.user.delete({ where: { user_id: 'admin' } });
      logger.info('🗑️ Deleted existing admin by user_id');
    }

    if (existingAdminByEmail && existingAdminByEmail.user_id !== 'admin') {
      logger.info('🗑️ Found existing admin user by email, deleting...');
      const otherUserId = existingAdminByEmail.user_id;
      await prisma.userGame.deleteMany({ where: { userId: otherUserId } });
      await prisma.teamMember.deleteMany({ where: { userId: otherUserId } });
      await prisma.notification.deleteMany({ where: { userId: otherUserId } });
      await prisma.user.delete({ where: { user_id: otherUserId } });
      logger.info('🗑️ Deleted existing admin by email');
    }

    // 2. Hash password
    const password = 'admin@123?';
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        user_id: 'admin',
        displayName: 'Admin',
        email: 'admin@playmate.com',
        passwordHash: hashedPassword,
        gender: 'Male',
        location: 'System',
        isAdmin: true,
      },
    });

    logger.info(`✨ Admin user successfully created with email: ${newAdmin.email}`);
  } catch (error) {
    logger.error('❌ Error during admin seeding:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
    logger.info('🔌 Database disconnected');
  }
}

main();
