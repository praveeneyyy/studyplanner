import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { HuggingFaceAIService } from '../src/services/huggingfaceAiService.js';

describe('Hugging Face Qwen3 AI Integration Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `qwen_student_${Date.now()}@university.edu`,
        password: 'Password123!',
        fullName: 'Qwen Test Student',
        academicLevel: 'Undergraduate'
      });
    expect(regRes.status).toBe(201);
    authToken = regRes.body.data.token;
  });

  describe('Model & Service Configuration', () => {
    it('uses Qwen/Qwen3-4B-Instruct-2507 as the primary model ID', () => {
      const modelId = HuggingFaceAIService.getModelId();
      expect(modelId).toBe('Qwen/Qwen3-4B-Instruct-2507');
    });

    it('safely sanitizes conversation history', () => {
      const dirtyHistory = [
        { role: 'system', content: 'hack' },
        { role: 'user', content: 'hello' },
        { role: 'admin', content: 'bypass' },
        { role: 'assistant', content: 'hi' },
        null,
        { invalid: true }
      ];
      const clean = HuggingFaceAIService.sanitizeHistory(dirtyHistory);
      expect(clean.length).toBe(2);
      expect(clean[0].role).toBe('user');
      expect(clean[1].role).toBe('assistant');
    });
  });

  describe('POST /api/v1/ai/chat & /api/ai/chat', () => {
    it('rejects empty messages with 400', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('required');
    });

    it('rejects oversized input exceeding character limits with 400', async () => {
      const longMessage = 'A'.repeat(6500);
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: longMessage });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('exceeds');
    });

    it('successfully processes academic chat prompt and returns structured answer', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Explain binary search with an example.',
          history: []
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer.length).toBeGreaterThan(20);
      expect(res.body.model).toBe('Qwen/Qwen3-4B-Instruct-2507');
      expect(res.body.provider).toBeDefined();
    });

    it('supports alias endpoint /api/ai/chat', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is virtual memory and paging?',
          history: []
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.answer).toContain('Paging');
      expect(res.body.model).toBe('Qwen/Qwen3-4B-Instruct-2507');
    });
  });

  describe('POST /api/v1/ai/study-plan/draft & /api/ai/study-plan/draft', () => {
    it('generates a validated deterministic study plan draft via Qwen3 service', async () => {
      const res = await request(app)
        .post('/api/v1/ai/study-plan/draft')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Prepare a 14-day study plan with 3h on weekdays and 4h on weekends.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toBeDefined();
      expect(res.body.data.draft.isFeasible).toBe(true);
      expect(res.body.data.draft.dailyAgenda.length).toBeGreaterThan(0);
    });

    it('supports alias endpoint /api/ai/study-plan/draft', async () => {
      const res = await request(app)
        .post('/api/ai/study-plan/draft')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Create a 7-day sprint.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toBeDefined();
    });
  });

  describe('Supplementary AI Educational Endpoints', () => {
    it('POST /api/v1/ai/explain-code returns structured bug analysis', async () => {
      const res = await request(app)
        .post('/api/v1/ai/explain-code')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'def divide(a, b):\n    return a / b',
          language: 'python',
          error: 'ZeroDivisionError: division by zero'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();
    });

    it('POST /api/v1/ai/practice-questions returns assessment questions', async () => {
      const res = await request(app)
        .post('/api/v1/ai/practice-questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          topicTitle: 'Dijkstra Algorithm',
          subjectName: 'Algorithms',
          difficulty: 4,
          count: 3
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();
    });

    it('POST /api/v1/ai/next-steps returns personalized recommendations', async () => {
      const res = await request(app)
        .post('/api/v1/ai/next-steps')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toBeDefined();
    });
  });
});
