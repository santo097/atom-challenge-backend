import request from 'supertest';
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { buildTestApp, clearFirestore } from './helpers';

describe('Users endpoints (integration)', () => {
  let app: Express;
  let db: Firestore;

  beforeAll(() => {
    const built = buildTestApp();
    app = built.app;
    db = built.db;
  });

  beforeEach(async () => {
    await clearFirestore(db);
  });

  describe('GET /api/v1/users/:email', () => {
    it('returns user when found (200)', async () => {
      await request(app).post('/api/v1/auth/register').send({ email: 'found@example.com' });

      const res = await request(app).get('/api/v1/users/found@example.com');

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('found@example.com');
      expect(res.body.id).toBeDefined();
    });

    it('returns 404 when user does not exist', async () => {
      const res = await request(app).get('/api/v1/users/missing@example.com');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 when email path param is malformed', async () => {
      const res = await request(app).get('/api/v1/users/not-an-email');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/users', () => {
    it('creates a user (201)', async () => {
      const res = await request(app).post('/api/v1/users').send({ email: 'created@example.com' });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('created@example.com');
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it('returns 409 when user already exists', async () => {
      await request(app).post('/api/v1/users').send({ email: 'twice@example.com' });
      const res = await request(app).post('/api/v1/users').send({ email: 'twice@example.com' });

      expect(res.status).toBe(409);
    });

    it('returns 400 when body has extra unknown fields', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .send({ email: 'x@x.com', name: 'forbidden-extra-field' });
      expect(res.status).toBe(400);
    });
  });
});
