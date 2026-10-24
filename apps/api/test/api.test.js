import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('AI Smart Study Planner REST API Integration Tests', () => {
  let authToken = '';
  let testSubjectId = '';
  let testTopicId = '';
  let testSessionId = '';

  beforeAll(async () => {
    // Register unique test student
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test_${Date.now()}@university.edu`,
        password: 'Password123!',
        fullName: 'Test Engineer',
        academicLevel: 'Graduate'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    authToken = res.body.data.token;
  });

  it('GET /api/v1/health returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.product).toBe('AI Smart Study Planner');
  });

  it('GET /api/v1/auth/me returns current authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('Test Engineer');
  });

  it('POST /api/v1/subjects creates a new subject', async () => {
    const res = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Computer Networks',
        code: 'CS-401',
        colorToken: 'cs',
        priority: 4
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Computer Networks');
    testSubjectId = res.body.data.id;
  });

  it('POST /api/v1/subjects/:id/units creates a syllabus unit and topic', async () => {
    const unitRes = await request(app)
      .post(`/api/v1/subjects/${testSubjectId}/units`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Transport Layer & TCP Congestion Control',
        unitNumber: 1
      });

    expect(unitRes.status).toBe(201);
    const unitId = unitRes.body.data.id;

    const topicRes = await request(app)
      .post(`/api/v1/units/${unitId}/topics`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'TCP 3-Way Handshake & SYN Floods',
        estimatedMinutes: 45,
        difficulty: 3,
        importance: 5,
        confidence: 2
      });

    expect(topicRes.status).toBe(201);
    testTopicId = topicRes.body.data.id;
  });

  it('POST /api/v1/planner/preview generates a deterministic study plan', async () => {
    const res = await request(app)
      .post('/api/v1/planner/preview')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        dailyHoursLimit: 4,
        sessionDurationMinutes: 45,
        breakMinutes: 10
      });

    expect(res.status).toBe(200);
    expect(res.body.data.isFeasible).toBe(true);
    expect(res.body.data.sessions.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/planner/confirm commits study plan and sessions', async () => {
    const res = await request(app)
      .post('/api/v1/planner/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        dailyHoursLimit: 4,
        sessionDurationMinutes: 45,
        breakMinutes: 10
      });

    expect(res.status).toBe(201);
    expect(res.body.data.plan.sessions.length).toBeGreaterThan(0);
    testSessionId = res.body.data.plan.sessions[0].id;
  });

  it('POST /api/v1/sessions/:id/complete validates duration and awards XP', async () => {
    const res = await request(app)
      .post(`/api/v1/sessions/${testSessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        actualDurationMinutes: 45,
        reflectionScore: 4,
        notes: 'Thorough review of TCP flags and sequence numbering.'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.session.status).toBe('COMPLETED');
    expect(res.body.data.reward.xpAwarded).toBe(25);
  });

  it('POST /api/v1/revision/record-recall adjusts interval via SM-2 and awards XP', async () => {
    const res = await request(app)
      .post('/api/v1/revision/record-recall')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        topicId: testTopicId,
        recallRating: 3
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sm2Output.repetitionNumber).toBe(1);
    expect(res.body.data.reward.xpAwarded).toBe(15);
  });

  it('GET /api/v1/analytics/dashboard returns calculated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.completedTodayMinutes).toBeGreaterThanOrEqual(45);
    expect(res.body.data.subjectReadiness.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/planner/export/ics returns valid RFC 5545 iCalendar stream', async () => {
    const res = await request(app)
      .get('/api/v1/planner/export/ics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('VERSION:2.0');
    expect(res.text).toContain('PRODID:-//Smart Study Planner//Academic Schedule RFC5545//EN');
    expect(res.text).toContain('END:VCALENDAR');
  });
});
