import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/analytics/dashboard', async (req, res, next) => {
  try {
    const metrics = await AnalyticsService.getDashboardMetrics(req.user.id);
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

export default router;
