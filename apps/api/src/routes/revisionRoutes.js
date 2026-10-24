import { Router } from 'express';
import { RevisionService } from '../services/revisionService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { RecordRecallRequestSchema } from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

router.get('/revision/queue', async (req, res, next) => {
  try {
    const queue = await RevisionService.getRevisionQueue(req.user.id);
    res.json({ success: true, data: queue });
  } catch (err) {
    next(err);
  }
});

router.post('/revision/record-recall', validateBody(RecordRecallRequestSchema), async (req, res, next) => {
  try {
    const result = await RevisionService.recordRecall(req.user.id, req.validatedBody);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
