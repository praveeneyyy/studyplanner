import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend Quick Logon & Guest Authentication Tests', () => {
  it('POST /api/v1/auth/quick-login signs in Swetha without frontend sending password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/quick-login')
      .send({ scholar: 'swetha' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullName).toBe('Swetha');
    expect(res.body.data.user.email).toBe('swetha@university.edu');
    expect(res.body.data.token).toBeDefined();

    // Verify session retrieval using issued token
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.fullName).toBe('Swetha');
  });

  it('POST /api/v1/auth/quick-login signs in Prathima without frontend sending password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/quick-login')
      .send({ scholar: 'prathima' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullName).toBe('Prathima');
    expect(res.body.data.user.email).toBe('prathima@university.edu');
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/v1/auth/quick-login rejects unrecognized scholar keys', async () => {
    const res = await request(app)
      .post('/api/v1/auth/quick-login')
      .send({ scholar: 'unknown_scholar' });

    expect(res.status).toBe(400);
  });

  it('POST /api/v1/auth/guest authenticates guest scholar immediately', async () => {
    const res = await request(app)
      .post('/api/v1/auth/guest')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.fullName).toBe('Guest Scholar');
    expect(res.body.data.user.email).toBe('guest@university.edu');
    expect(res.body.data.token).toBeDefined();

    // Verify session retrieval
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.fullName).toBe('Guest Scholar');
  });
});
