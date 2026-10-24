import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('AI Context-Aware Study Plan Builder Integration Tests', () => {
  let authToken = '';
  let subjectId = '';
  let unitId = '';
  let topicId = '';
  let generatedDraft = null;

  beforeAll(async () => {
    // 1. Register test user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `plan_student_${Date.now()}@university.edu`,
        password: 'Password123!',
        fullName: 'Plan Builder Tester',
        academicLevel: 'Undergraduate'
      });
    expect(regRes.status).toBe(201);
    authToken = regRes.body.data.token;

    // 2. Create subject
    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Data Structures and Algorithms',
        code: 'CS-201',
        colorToken: 'cs',
        priority: 5
      });
    expect(subjRes.status).toBe(201);
    subjectId = subjRes.body.data.id;

    // 3. Create unit
    const unitRes = await request(app)
      .post(`/api/v1/subjects/${subjectId}/units`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Graph Algorithms & Trees',
        unitNumber: 1,
        description: 'Core graph traversal algorithms'
      });
    expect(unitRes.status).toBe(201);
    unitId = unitRes.body.data.id;

    // 4. Create topic
    const topicRes = await request(app)
      .post(`/api/v1/units/${unitId}/topics`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: "Dijkstra's Shortest Path Algorithm",
        estimatedMinutes: 45,
        difficulty: 4,
        importance: 5,
        confidence: 1
      });
    expect(topicRes.status).toBe(201);
    topicId = topicRes.body.data.id;

    // 5. Create examination
    const examDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    const examRes = await request(app)
      .post('/api/v1/examinations')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId,
        title: 'DSA Midterm Examination',
        examDate: examDate.toISOString(),
        weightagePercent: 40,
        targetScorePercent: 90
      });
    expect(examRes.status).toBe(201);
  });

  it('GET /api/v1/planner/context returns complete student academic context', async () => {
    const res = await request(app)
      .get('/api/v1/planner/context')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subjects.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.allTopics.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.examinations.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.weakTopics.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.preferences).toBeDefined();
  });

  it('POST /api/v1/planner/ai-draft parses natural language and builds deterministic draft schedule', async () => {
    const prompt = 'I have five subjects and my semester examinations start in three weeks. I can study for three hours on weekdays and five hours on weekends. I struggle with Data Structures and Algorithms. Prioritize the difficult units, schedule daily revision, and leave the last two days for mock tests and final revision.';

    const res = await request(app)
      .post('/api/v1/planner/ai-draft')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ prompt });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.draft).toBeDefined();

    const draft = res.body.data.draft;
    generatedDraft = draft;

    expect(draft.durationDays).toBe(21);
    expect(draft.weekdayHours).toBe(3);
    expect(draft.weekendHours).toBe(5);
    expect(draft.mockTestDays).toBe(2);
    expect(draft.sessions.length).toBeGreaterThan(0);
    expect(draft.dailyAgenda.length).toBe(21);
    expect(draft.subjectBreakdown.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.message).toContain('Data Structures and Algorithms');
  });

  it('POST /api/v1/planner/adjust-draft can make schedule lighter', async () => {
    expect(generatedDraft).not.toBeNull();

    const res = await request(app)
      .post('/api/v1/planner/adjust-draft')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        draft: generatedDraft,
        action: 'LIGHTER'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.draft.weekdayHours).toBeLessThan(generatedDraft.weekdayHours);
  });

  it('POST /api/v1/planner/confirm-ai-draft persists plan and sessions transactionally', async () => {
    expect(generatedDraft).not.toBeNull();

    const res = await request(app)
      .post('/api/v1/planner/confirm-ai-draft')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ draft: generatedDraft });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.planId).toBeDefined();
    expect(res.body.data.totalSessions).toBe(generatedDraft.sessions.length);
    expect(res.body.data.reward).toBeDefined();
    expect(res.body.data.reward.xpAwarded).toBe(30);

    // Verify session retrieval
    const sessRes = await request(app)
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(sessRes.status).toBe(200);
    expect(sessRes.body.data.length).toBe(generatedDraft.sessions.length);
  });
});
