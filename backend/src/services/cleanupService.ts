import { prisma } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Periodic cleanup for expired tournaments.
 * Deletes tournaments whose startDate is in the past and notifies creators.
 */
export class CleanupService {
  private static intervalHandle: NodeJS.Timer | null = null;

  static start(intervalMs: number = Number(process.env.CLEANUP_INTERVAL_MS || 60_000)) {
    if (this.intervalHandle) return; // already running
    logger.info(`🔁 CleanupService starting. Interval=${intervalMs}ms`);
    // Run once immediately on startup
    this.cleanupExpiredTournaments().catch((e) => logger.error('Initial cleanup error:', e));
    // Schedule periodic runs
    this.intervalHandle = setInterval(async () => {
      try {
        await this.cleanupExpiredTournaments();
      } catch (e) {
        logger.error('CleanupService error:', e);
      }
    }, intervalMs);
  }

  static stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      logger.info('🔁 CleanupService stopped');
    }
  }

  static async cleanupExpiredTournaments() {
    const now = new Date();
    // Find tournaments that started in the past
    const expired = await prisma.tournament.findMany({
      where: { startDate: { lt: now } },
      select: {
        id: true,
        title: true,
        startDate: true,
        creatorId: true,
        teams: { select: { teamId: true } },
      },
      take: 100, // batch to avoid large deletes at once
    });

    if (expired.length === 0) return;

    logger.info(`🧹 Deleting ${expired.length} expired tournaments`);

    const { RealtimeService } = await import('./realtime');

    for (const t of expired) {
      try {
        // Delete tournament teams first to avoid FK issues
        if (t.teams.length > 0) {
          await prisma.tournamentTeam.deleteMany({ where: { tournamentId: t.id } });
        }
        await prisma.tournament.delete({ where: { id: t.id } });

        // Persist notification with clearer copy
        await (prisma as any).notification.create({
          data: {
            userId: t.creatorId,
            type: 'TOURNAMENT',
            title: 'Tournament removed',
            message: `The tournament "${t.title}" was automatically removed because its scheduled start time had already passed.`,
            data: { tournamentId: t.id, title: t.title, startDate: t.startDate },
          }
        });

        // Notify creator (real-time)
        RealtimeService.emitToUser(t.creatorId, 'tournament:deleted', {
          id: t.id,
          title: t.title,
          startDate: t.startDate,
          reason: 'Automatically removed (start time elapsed)'
        });

        logger.info(`🗑️ Deleted tournament ${t.id} (${t.title}) and notified ${t.creatorId}`);
      } catch (e) {
        logger.error(`Failed to delete expired tournament ${t.id}:`, e);
      }
    }
  }
}


