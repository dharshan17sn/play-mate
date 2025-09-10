import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// List notifications for current user
router.get('/', authenticateToken as any, async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.user_id as string;
  const notifications = await (prisma as any).notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ success: true, data: notifications });
});

// Mark notifications as read
router.put('/read', authenticateToken as any, async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.user_id as string;
  await (prisma as any).notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  res.json({ success: true });
});

export default router;


