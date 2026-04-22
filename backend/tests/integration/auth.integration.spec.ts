import request from 'supertest';
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { buildTestApp, clearFirestore } from './helpers';

describe('Auth endpoints (integration)', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('creates a new user and returns token (201)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'alice@example.com' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user.id).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.expiresIn).toBe('1h');
    });

    it('normalizes email before persisting', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: '  BOB@Example.COM  ' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('bob@example.com');
    });

    it('returns 409 when email already exists', async () => {
      await request(app).post('/api/v1/auth/register').send({ email: 'dup@example.com' });
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'dup@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when email has invalid format', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns user + token when email exists (200)', async () => {
      await request(app).post('/api/v1/auth/register').send({ email: 'carol@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'carol@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('carol@example.com');
      expect(res.body.token).toBeDefined();
    });

    it('returns 404 when email does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for invalid email format', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'bad' });
      expect(res.status).toBe(400);
    });
  });
});
