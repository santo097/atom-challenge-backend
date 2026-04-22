// Nota: las extensiones globales de Express.Request (req.user, req.requestId)
// viven en `src/shared/types/express.d.ts` y TypeScript las carga vía
// `include` del tsconfig.json — no necesitamos importarlas aquí.
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Container } from '@infrastructure/config/container';
import { buildAuthRouter, buildTaskRouter, buildUserRouter } from './routes';
import { errorHandler, notFound, requestId } from './middlewares';

/**
 * Factory de la aplicación Express.
 *
 * Construye la app sin arrancar servidor — devolver la instancia
 * permite reutilizarla tanto en Cloud Functions (`onRequest(app)`)
 * como en supertest (tests de integración) sin modificar el código.
 *
 * Orden de middlewares:
 *  1. Helmet                → headers de seguridad
 *  2. CORS                  → whitelist de orígenes
 *  3. JSON parser           → body limitado a 100KB (defensa DoS)
 *  4. requestId             → trazabilidad
 *  5. Rutas                 → /health, /api/v1/*
 *  6. notFound              → 404 consistente para rutas desconocidas
 *  7. errorHandler          → traduce errores a JSON con código
 *
 * El orden importa: errorHandler debe ir SIEMPRE al final, después
 * de rutas y notFound.
 */
export function createApp(container: Container): Express {
  const app = express();

  // --- Seguridad ---
  app.use(helmet());

  // --- CORS con whitelist ---
  // Si el origin no está en la lista, cors() llama a next(err) y el
  // request se rechaza con 500 — aceptable para la SPA que solo tiene
  // un origen permitido por ambiente.
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permite requests sin origin (curl, health checks, Postman)
        if (!origin) return callback(null, true);
        if (container.env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: false, // JWT va en Authorization header, no cookies
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  // --- Parsers ---
  app.use(express.json({ limit: '100kb' }));

  // --- Trazabilidad ---
  app.use(requestId());

  // --- Health check (sin versionado, simple para monitoreo) ---
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: container.env.NODE_ENV,
    });
  });

  // --- API v1 ---
  const v1 = express.Router();
  v1.use('/auth', buildAuthRouter(container.controllers.auth));
  v1.use('/users', buildUserRouter(container.controllers.user));
  v1.use('/tasks', buildTaskRouter(container.controllers.task, container.tokenService));

  app.use('/api/v1', v1);

  // --- 404 y error handler (siempre al final) ---
  app.use(notFound);
  app.use(errorHandler(container.logger));

  return app;
}
