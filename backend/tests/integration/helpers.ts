import type { Express } from 'express';
import type { Firestore } from 'firebase-admin/firestore';
import { buildContainer } from '@infrastructure/config';
import { loadEnv, resolveProjectId } from '@infrastructure/config/env';
import { createApp } from '@infrastructure/http/app';
import { getFirestore, initFirebase } from '@infrastructure/persistence/firestore';
import { createLogger } from '@shared/utils/logger';

/**
 * Construye la app para tests de integración y devuelve también
 * una handle al Firestore (emulado) para limpiar datos entre tests.
 */
export function buildTestApp(): { app: Express; db: Firestore } {
  const env = loadEnv();
  const logger = createLogger('test');
  initFirebase(resolveProjectId(env));
  const db = getFirestore();
  const container = buildContainer({ env, db, logger });
  const app = createApp(container);
  return { app, db };
}

/**
 * Limpia TODAS las colecciones conocidas de la base emulada.
 * Llamar en beforeEach para garantizar aislamiento entre tests.
 */
export async function clearFirestore(db: Firestore): Promise<void> {
  const collections = ['users', 'tasks'];
  await Promise.all(
    collections.map(async (name) => {
      const snapshot = await db.collection(name).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      if (snapshot.size > 0) await batch.commit();
    }),
  );
}
