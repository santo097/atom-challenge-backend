import 'dotenv/config';
import type { Express } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret, defineString } from 'firebase-functions/params';
import { bootstrap } from '@infrastructure/config';

/**
 * Entry point de Firebase Cloud Functions.
 *
 * Gestión de configuración:
 *  - JWT_SECRET vive en Firebase Secret Manager.
 *    Se configura con: firebase functions:secrets:set JWT_SECRET
 *  - Variables públicas se declaran con defineString() con defaults
 *    seguros para producción. Se pueden sobrescribir al deploy con:
 *    firebase functions:config:set
 *
 * Ventaja sobre archivos .env.<projectId>: versionado en el código,
 * sin dependencia de cómo Firebase CLI parsea archivos en cada OS.
 */
const jwtSecret = defineSecret('JWT_SECRET');

// Variables públicas de producción — valores por defecto seguros.
// Se pueden sobrescribir en deploy con: firebase deploy --set-env-vars="..."
const jwtExpiresIn = defineString('JWT_EXPIRES_IN', { default: '1h' });
const corsOrigins = defineString('CORS_ORIGINS', {
  default: 'http://localhost:4200',
});

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  memory: '256MiB',
  timeoutSeconds: 60,
});

/**
 * Bootstrap memoizado — solo inicializa una vez por instancia.
 * Las env vars las leemos de los params (Cloud Functions las inyecta),
 * y las seteamos en process.env para que el loadEnv() las vea.
 */
let cachedApp: Express | undefined;
function getApp(): Express {
  if (!cachedApp) {
    // Inyectar las variables de los params a process.env ANTES del bootstrap,
    // para que loadEnv() (que lee process.env) las encuentre.
    process.env.NODE_ENV = 'production';
    process.env.JWT_EXPIRES_IN = jwtExpiresIn.value();
    process.env.CORS_ORIGINS = corsOrigins.value();
    // FIREBASE_PROJECT_ID lo resuelve automáticamente desde GCLOUD_PROJECT
    // (Cloud Functions lo inyecta). resolveProjectId() en env.ts lo maneja.

    cachedApp = bootstrap().app;
  }
  return cachedApp;
}

export const api = onRequest({ secrets: [jwtSecret] }, (req, res) => {
  getApp()(req, res);
});
