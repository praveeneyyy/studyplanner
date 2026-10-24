import { Router } from 'express';
import { QuizService } from '../services/quizService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { SubmitQuizAttemptSchema } from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

router.get('/quizzes/weak-topics', async (req, res, next) => {
  try {
    const weak = await QuizService.getWeakTopics(req.user.id);
    res.json({ success: true, data: weak });
  } catch (err) {
    next(err);
  }
});

router.get('/quizzes/:id', async (req, res, next) => {
  try {
    const quiz = await QuizService.getQuiz(req.params.id);
    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

router.post('/quizzes/attempts', validateBody(SubmitQuizAttemptSchema), async (req, res, next) => {
  try {
    const result = await QuizService.submitQuizAttempt(req.user.id, req.validatedBody);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
