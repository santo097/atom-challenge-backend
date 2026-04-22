import type { Express } from 'express';
import { loadEnv, resolveProjectId } from './env';
import { buildContainer, type Container } from './container';
import { getFirestore, initFirebase } from '@infrastructure/persistence/firestore';
import { createApp } from '@infrastructure/http/app';
import { createLogger } from '@shared/utils/logger';

/**
 * Bootstrap: construye la app Express lista para servir.
 *
 * Se usa desde dos lugares:
 *  - `index.ts`  → dentro de Cloud Functions (`onRequest(app)`)
 *  - `local.ts`  → servidor local con `listen()`
 *
 * Centralizar aquí evita duplicar la secuencia de init en cada entry.
 */
export function bootstrap(): { app: Express; container: Container } {
  const env = loadEnv();
  const logger = createLogger(env.NODE_ENV);

  initFirebase(resolveProjectId(env));
  const db = getFirestore();

  const container = buildContainer({ env, db, logger });
  const app = createApp(container);

  return { app, container };
}
