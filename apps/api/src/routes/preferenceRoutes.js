import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { UpdatePreferencesSchema } from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

router.get('/preferences', async (req, res, next) => {
  try {
    let prefs = await prisma.userPreference.findUnique({
      where: { userId: req.user.id }
    });

    if (!prefs) {
      prefs = await prisma.userPreference.create({
        data: { userId: req.user.id }
      });
    }

    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', validateBody(UpdatePreferencesSchema), async (req, res, next) => {
  try {
    const updated = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      create: { ...req.validatedBody, userId: req.user.id },
      update: req.validatedBody
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/preferences/clear-workspace', async (req, res, next) => {
  try {
    const userId = req.user.id;
    await prisma.rewardLedgerEntry.deleteMany({ where: { userId } });
    await prisma.userStreak.deleteMany({ where: { userId } });
    await prisma.weeklyGoal.deleteMany({ where: { userId } });
    await prisma.userAchievement.deleteMany({ where: { userId } });
    await prisma.notificationRecord.deleteMany({ where: { userId } });
    await prisma.aIUsageRecord.deleteMany({ where: { userId } });
    await prisma.aIConversation.deleteMany({ where: { userId } });
    await prisma.quizAttempt.deleteMany({ where: { userId } });
    await prisma.studySession.deleteMany({ where: { studyPlan: { userId } } });
    await prisma.studyPlan.deleteMany({ where: { userId } });
    await prisma.note.deleteMany({ where: { userId } });
    await prisma.flashcard.deleteMany({ where: { userId } });
    await prisma.subject.deleteMany({ where: { userId } });

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: 0,
        currentLevel: 1
      }
    });

    res.json({ success: true, message: 'All workspace examples, plans, subjects, and tasks cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;
