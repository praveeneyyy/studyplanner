import { Router } from 'express';
import { RewardService } from '../services/rewardService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/rewards/summary', async (req, res, next) => {
  try {
    const summary = await RewardService.getSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

router.get('/rewards/achievements', async (req, res, next) => {
  try {
    const achievements = await RewardService.listAchievements(req.user.id);
    res.json({ success: true, data: achievements });
  } catch (err) {
    next(err);
  }
});

router.get('/rewards/ledger', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const ledger = await RewardService.getLedger(req.user.id, { page, limit });
    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
});

export default router;
