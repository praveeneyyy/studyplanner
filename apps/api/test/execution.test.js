import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { parseDiagnostics } from '../src/services/codeExecutionService.js';

describe('Student Code Execution & Diagnostics Engine', () => {
  it('GET /api/v1/execution/runtimes returns supported language runtimes', async () => {
    const res = await request(app).get('/api/v1/execution/runtimes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.runtimes)).toBe(true);
    expect(res.body.runtimes.some((r) => r.id === 'python')).toBe(true);
    expect(res.body.runtimes.some((r) => r.id === 'javascript')).toBe(true);
    expect(res.body.runtimes.some((r) => r.id === 'sql')).toBe(true);
  });

  it('POST /api/v1/execution/run executes JavaScript and captures stdout', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'javascript',
        code: 'const nums = [1, 2, 3]; console.log(nums.reduce((a, b) => a + b, 0));'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exitCode).toBe(0);
    expect(res.body.stdout).toBe('6');
    expect(res.body.durationMs).toBeGreaterThan(0);
    expect(res.body.diagnostic).toBeNull();
  });

  it('POST /api/v1/execution/run executes Python and captures stdout', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'python',
        code: 'items = [x * 2 for x in range(4)]\nprint(items)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exitCode).toBe(0);
    expect(res.body.stdout).toBe('[0, 2, 4, 6]');
    expect(res.body.diagnostic).toBeNull();
  });

  it('POST /api/v1/execution/run parses and formats JSON in-memory', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'json',
        code: '{"name": "IDE", "active": true}'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stdout).toContain('Valid JSON syntax');
  });

  it('POST /api/v1/execution/run executes SQL query playground', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'sql',
        code: 'SELECT 1 + 1 AS result;'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stdout).toContain('Query executed successfully');
  });

  it('POST /api/v1/execution/run correctly extracts diagnostics from JavaScript ReferenceError', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'javascript',
        code: 'const x = 10;\nconsole.log(undefinedVariable + x);'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.exitCode).not.toBe(0);
    expect(res.body.diagnostic).not.toBeNull();
    expect(res.body.diagnostic.category).toBe('ReferenceError');
    expect(res.body.diagnostic.line).toBe(2);
    expect(res.body.diagnostic.explanation).toContain('accessing a variable before declaring it');
    expect(res.body.diagnostic.likelyCause).toBeTruthy();
    expect(res.body.diagnostic.suggestedFix).toBeTruthy();
  });

  it('POST /api/v1/execution/run correctly extracts diagnostics from Python ZeroDivisionError', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'python',
        code: 'val = 100\ndiv = 0\nresult = val / div\nprint(result)'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.exitCode).not.toBe(0);
    expect(res.body.diagnostic).not.toBeNull();
    expect(res.body.diagnostic.category).toBe('ZeroDivisionError');
    expect(res.body.diagnostic.line).toBe(3);
    expect(res.body.diagnostic.explanation).toContain('division by zero');
  });

  it('POST /api/v1/execution/run executes Java with custom class name (e.g. HelloWorld)', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({
        language: 'java',
        code: 'class HelloWorld { public static void main(String[] args) { System.out.println("Hello, World!"); } }'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exitCode).toBe(0);
    expect(res.body.stdout.trim()).toBe('Hello, World!');
    expect(res.body.diagnostic).toBeNull();
  });

  it('POST /api/v1/execution/run rejects invalid payloads with 400', async () => {
    const res = await request(app)
      .post('/api/v1/execution/run')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
