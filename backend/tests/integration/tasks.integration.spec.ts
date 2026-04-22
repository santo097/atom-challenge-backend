import request from 'supertest';
import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { buildTestApp, clearFirestore } from './helpers';

describe('Tasks endpoints (integration)', () => {
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

  /**
   * Helper: registra un usuario y devuelve su token + id.
   * Cada test que necesite autenticación lo llama al inicio.
   */
  async function registerUser(email: string): Promise<{ token: string; userId: string }> {
    const res = await request(app).post('/api/v1/auth/register').send({ email });
    return { token: res.body.token, userId: res.body.user.id };
  }

  describe('Authentication guard', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await request(app).get('/api/v1/tasks');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', 'NotBearer something');
      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', 'Bearer not-a-real-jwt');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('creates a task (201)', async () => {
      const { token } = await registerUser('creator@example.com');

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Buy milk', description: 'Semi-skimmed' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Buy milk');
      expect(res.body.description).toBe('Semi-skimmed');
      expect(res.body.completed).toBe(false);
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeDefined();
    });

    it('accepts task without description', async () => {
      const { token } = await registerUser('nodesc@example.com');

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Minimal' });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('');
    });

    it('returns 400 when title is empty', async () => {
      const { token } = await registerUser('empty@example.com');

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '   ' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('returns only tasks of the authenticated user, ordered by createdAt desc', async () => {
      const { token: tokenA } = await registerUser('a@example.com');
      const { token: tokenB } = await registerUser('b@example.com');

      // A crea 2, B crea 1
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'A-first' });
      // esperar un poco para que el timestamp cambie perceptiblemente
      await new Promise((r) => setTimeout(r, 10));
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'A-second' });
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'B-only' });

      const res = await request(app).get('/api/v1/tasks').set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('A-second'); // más reciente primero
      expect(res.body[1].title).toBe('A-first');
    });

    it('filters by completed=true', async () => {
      const { token } = await registerUser('filter@example.com');

      const t1 = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Pending' });
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Done' });

      // marcar la 1ª como completada
      await request(app)
        .put(`/api/v1/tasks/${t1.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });

      const completedRes = await request(app)
        .get('/api/v1/tasks?completed=true')
        .set('Authorization', `Bearer ${token}`);
      expect(completedRes.status).toBe(200);
      expect(completedRes.body).toHaveLength(1);
      expect(completedRes.body[0].title).toBe('Pending');
      expect(completedRes.body[0].completed).toBe(true);

      const pendingRes = await request(app)
        .get('/api/v1/tasks?completed=false')
        .set('Authorization', `Bearer ${token}`);
      expect(pendingRes.body).toHaveLength(1);
      expect(pendingRes.body[0].title).toBe('Done');
    });

    it('returns 400 for invalid completed value', async () => {
      const { token } = await registerUser('badq@example.com');
      const res = await request(app)
        .get('/api/v1/tasks?completed=maybe')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('updates title, description and completed (200)', async () => {
      const { token } = await registerUser('upd@example.com');
      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Old', description: 'Old desc' });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New', description: 'New desc', completed: true });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New');
      expect(res.body.description).toBe('New desc');
      expect(res.body.completed).toBe(true);
      expect(res.body.createdAt).toBe(created.body.createdAt);
      expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(created.body.updatedAt).getTime(),
      );
    });

    it('supports partial updates (only completed)', async () => {
      const { token } = await registerUser('toggle@example.com');
      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Keep me' });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Keep me');
      expect(res.body.completed).toBe(true);
    });

    it('returns 404 when task does not exist', async () => {
      const { token } = await registerUser('ghost@example.com');
      const res = await request(app)
        .put('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'X' });

      expect(res.status).toBe(404);
    });

    it('returns 403 when task belongs to another user', async () => {
      const { token: tokenA } = await registerUser('owner@example.com');
      const { token: tokenB } = await registerUser('intruder@example.com');

      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Mine' });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 400 when body is empty', async () => {
      const { token } = await registerUser('empty-body@example.com');
      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'T' });

      const res = await request(app)
        .put(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('deletes a task (204)', async () => {
      const { token } = await registerUser('del@example.com');
      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Delete me' });

      const res = await request(app)
        .delete(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const listRes = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.body).toHaveLength(0);
    });

    it('returns 404 when task does not exist', async () => {
      const { token } = await registerUser('delghost@example.com');
      const res = await request(app)
        .delete('/api/v1/tasks/does-not-exist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('returns 403 when deleting a task of another user', async () => {
      const { token: tokenA } = await registerUser('del-owner@example.com');
      const { token: tokenB } = await registerUser('del-intruder@example.com');

      const created = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: 'Mine' });

      const res = await request(app)
        .delete(`/api/v1/tasks/${created.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });
});
