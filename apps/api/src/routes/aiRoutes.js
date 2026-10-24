import { Router } from 'express';
import { AIService } from '../services/aiService.js';
import { HuggingFaceAIService } from '../services/huggingfaceAiService.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AIStreamRequestSchema } from '@ai-study/shared-schemas';

const router = Router();
router.use(requireAuth);

/**
 * A. AI Chat Endpoint using Hugging Face Qwen3
 * POST /ai/chat or POST /api/ai/chat
 */
router.post(['/ai/chat', '/chat'], async (req, res, next) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: { message: 'Message is required and cannot be empty.' }
      });
    }

    if (message.length > 6000) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message exceeds the maximum limit of 6,000 characters.' }
      });
    }

    const result = await HuggingFaceAIService.chat({
      message,
      history
    });

    res.json({
      success: true,
      answer: result.answer,
      model: result.model,
      provider: result.provider,
      notice: result.notice
    });
  } catch (err) {
    next(err);
  }
});

/**
 * B. Study-Plan Generation Draft Endpoint using Qwen3 + Deterministic Validation
 * POST /ai/study-plan/draft or POST /api/ai/study-plan/draft
 */
router.post(['/ai/study-plan/draft', '/study-plan/draft'], async (req, res, next) => {
  try {
    const { prompt, constraints, history } = req.body || {};
    const effectivePrompt = prompt || 'Create a comprehensive study plan for my enrolled courses and upcoming examinations.';

    const result = await HuggingFaceAIService.generateStudyPlanDraft({
      userId: req.user.id,
      prompt: effectivePrompt,
      constraints: constraints || {},
      history: history || []
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * C. Code Explanation & Debugging Endpoint
 * POST /ai/explain-code
 */
router.post('/ai/explain-code', async (req, res, next) => {
  try {
    const { code, language, error } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: { message: 'Code is required.' } });
    }

    const result = await HuggingFaceAIService.explainCode({ code, language, error });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * D. Practice Questions Generator Endpoint
 * POST /ai/practice-questions
 */
router.post('/ai/practice-questions', async (req, res, next) => {
  try {
    const { topicTitle, subjectName, difficulty, count } = req.body || {};
    if (!topicTitle) {
      return res.status(400).json({ success: false, error: { message: 'topicTitle is required.' } });
    }

    const result = await HuggingFaceAIService.generatePracticeQuestions({
      topicTitle,
      subjectName,
      difficulty,
      count
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * E. Revision Notes Generator Endpoint
 * POST /ai/revision-notes
 */
router.post('/ai/revision-notes', async (req, res, next) => {
  try {
    const { topicTitle, subjectName, material } = req.body || {};
    if (!topicTitle) {
      return res.status(400).json({ success: false, error: { message: 'topicTitle is required.' } });
    }

    const result = await HuggingFaceAIService.createRevisionNotes({
      topicTitle,
      subjectName,
      material
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * F. Flashcards Generator Endpoint
 * POST /ai/generate-flashcards
 */
router.post('/ai/generate-flashcards', async (req, res, next) => {
  try {
    const { topicId, topicTitle } = req.body || {};
    if (topicId) {
      const cards = await AIService.generateFlashcardsForTopic(req.user.id, topicId);
      return res.status(201).json({ success: true, data: cards });
    }
    const result = await HuggingFaceAIService.generateFlashcards({ topicTitle: topicTitle || 'Core Topic' });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * G. Next Steps Academic Recommendations Endpoint
 * POST /ai/next-steps
 */
router.post('/ai/next-steps', async (req, res, next) => {
  try {
    const result = await HuggingFaceAIService.recommendNextSteps({ userId: req.user.id });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/ai/conversations', async (req, res, next) => {
  try {
    const list = await AIService.listConversations(req.user.id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.get('/ai/conversations/:id', async (req, res, next) => {
  try {
    const conv = await AIService.getConversation(req.user.id, req.params.id);
    res.json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
});

router.post('/ai/conversations', async (req, res, next) => {
  try {
    const conv = await AIService.createConversation(req.user.id, req.body);
    res.status(201).json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
});

/**
 * Server-Sent Events (SSE) AI Streaming endpoint
 */
router.post('/ai/stream', validateBody(AIStreamRequestSchema), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const { conversationId, prompt, formatType, topicId } = req.validatedBody;

  try {
    // If Hugging Face is configured, stream via HuggingFaceAIService
    const stream = HuggingFaceAIService.isConfigured()
      ? HuggingFaceAIService.streamChat({ message: prompt })
      : AIService.streamResponse({
          conversationId,
          prompt,
          formatType,
          topicId,
          userId: req.user.id
        });

    for await (const chunk of stream) {
      res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write(`event: done\ndata: ${JSON.stringify({ finished: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    res.end();
  }
});

router.post('/ai/generate-notes', async (req, res, next) => {
  try {
    const { topicId } = req.body;
    const note = await AIService.generateTopicNotes(req.user.id, topicId);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

router.post('/ai/generate-quiz', async (req, res, next) => {
  try {
    const { topicId } = req.body;
    const quiz = await AIService.generateQuizForTopic(topicId);
    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

router.post('/ai/generate-flashcards', async (req, res, next) => {
  try {
    const { topicId } = req.body;
    const cards = await AIService.generateFlashcardsForTopic(req.user.id, topicId);
    res.status(201).json({ success: true, data: cards });
  } catch (err) {
    next(err);
  }
});

export default router;
