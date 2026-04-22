import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp } from './helpers';

describe('Health and 404 (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = buildTestApp().app;
  });

  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.env).toBe('test');
  });

  it('unknown routes return 404 with ROUTE_NOT_FOUND code', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('response includes x-request-id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('response echoes client-provided x-request-id', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'my-correlation-123');
    expect(res.headers['x-request-id']).toBe('my-correlation-123');
  });
});
