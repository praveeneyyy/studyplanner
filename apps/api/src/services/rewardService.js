import { prisma } from '../db/prisma.js';
import { calculateLevelFromXP, calculateUpdatedStreak } from '@ai-study/domain';

export class RewardService {
  /**
   * Processes a verified reward transaction through the immutable ledger.
   * Enforces hardware-level idempotency to prevent duplicate reward exploits.
   */
  static async processRewardEvent({ userId, eventType, sourceEventId, xp, description }) {
    // 1. Check if already processed (Idempotency check)
    const existing = await prisma.rewardLedgerEntry.findFirst({
      where: {
        userId,
        eventType,
        sourceEventId: String(sourceEventId)
      }
    });

    if (existing) {
      // Return previous outcome without duplicate reward
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const levelInfo = calculateLevelFromXP(user.totalXP);
      return {
        isDuplicate: true,
        xpAwarded: 0,
        totalXP: user.totalXP,
        levelInfo
      };
    }

    // 2. Commit transaction
    const entry = await prisma.rewardLedgerEntry.create({
      data: {
        userId,
        eventType,
        sourceEventId: String(sourceEventId),
        xpAwarded: xp,
        description
      }
    });

    // 3. Increment User totalXP
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: { increment: xp }
      },
      include: { preferences: true }
    });

    const levelInfo = calculateLevelFromXP(updatedUser.totalXP);
    let levelUp = false;

    if (levelInfo.level > updatedUser.currentLevel) {
      levelUp = true;
      await prisma.user.update({
        where: { id: userId },
        data: { currentLevel: levelInfo.level }
      });
    }

    // 4. Update Timezone-Aware Daily Streak
    const timezone = updatedUser.preferences?.timezone || 'UTC';
    const streakResult = await RewardService._recordStreakActivity(userId, timezone);

    // 5. Evaluate Achievements
    const unlockedAchievements = await RewardService._checkAchievements(userId, updatedUser);

    return {
      isDuplicate: false,
      xpAwarded: xp,
      totalXP: updatedUser.totalXP,
      levelInfo,
      levelUp,
      streak: streakResult,
      unlockedAchievements
    };
  }

  static async getSummary(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        achievements: { include: { achievement: true } },
        streaks: { orderBy: { dateString: 'desc' }, take: 1 }
      }
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const levelInfo = calculateLevelFromXP(user.totalXP);
    const latestStreak = user.streaks[0];

    // Compute active streak count
    const streakCount = latestStreak ? latestStreak.sessionsCompleted : 0;

    return {
      totalXP: user.totalXP,
      currentLevel: levelInfo.level,
      levelTitle: levelInfo.title,
      minXP: levelInfo.minXP,
      nextLevelXP: levelInfo.nextLevelXP,
      progressPercent: levelInfo.progressPercent,
      currentStreak: streakCount,
      unlockedAchievementsCount: user.achievements.length
    };
  }

  static async listAchievements(userId) {
    const all = await prisma.achievementDefinition.findMany();
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });

    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    return all.map((ach) => ({
      ...ach,
      isUnlocked: unlockedIds.has(ach.id),
      unlockedAt: unlocked.find((u) => u.achievementId === ach.id)?.unlockedAt || null
    }));
  }

  static async getLedger(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      prisma.rewardLedgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.rewardLedgerEntry.count({ where: { userId } })
    ]);

    return { entries, total, page, totalPages: Math.ceil(total / limit) };
  }

  // Internal helper for localized streaks
  static async _recordStreakActivity(userId, timezone) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    const existingStreak = await prisma.userStreak.findUnique({
      where: {
        userId_dateString: {
          userId,
          dateString: dateStr
        }
      }
    });

    if (existingStreak) {
      await prisma.userStreak.update({
        where: { id: existingStreak.id },
        data: {
          sessionsCompleted: { increment: 1 },
          qualifyingMinutes: { increment: 25 }
        }
      });
      return { currentStreak: existingStreak.sessionsCompleted + 1, date: dateStr };
    }

    const newRecord = await prisma.userStreak.create({
      data: {
        userId,
        dateString: dateStr,
        qualifyingMinutes: 25,
        sessionsCompleted: 1
      }
    });

    return { currentStreak: 1, date: dateStr };
  }

  // Internal helper for achievements
  static async _checkAchievements(userId, user) {
    const unlocked = [];

    // Check: First study session
    const sessionCount = await prisma.studySession.count({
      where: { studyPlan: { userId }, status: 'COMPLETED' }
    });

    if (sessionCount >= 1) {
      const ach = await RewardService._grantAchievement(userId, 'ach_first_session');
      if (ach) unlocked.push(ach);
    }

    if (sessionCount >= 10) {
      const ach = await RewardService._grantAchievement(userId, 'ach_deep_focus');
      if (ach) unlocked.push(ach);
    }

    return unlocked;
  }

  static async _grantAchievement(userId, achievementId) {
    const exists = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } }
    });

    if (exists) return null;

    const def = await prisma.achievementDefinition.findUnique({ where: { id: achievementId } });
    if (!def) return null;

    return prisma.userAchievement.create({
      data: {
        userId,
        achievementId
      },
      include: { achievement: true }
    });
  }
}
