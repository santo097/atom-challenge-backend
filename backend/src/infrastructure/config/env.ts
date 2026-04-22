import { z } from 'zod';

/**
 * Schema de las variables de entorno requeridas.
 *
 * Validamos al arrancar la app — si falta una variable crítica, fallamos
 * rápido con un mensaje claro en lugar de descubrirlo al primer request.
 *
 * Notas de robustez:
 *  - Todos los strings se hacen `.trim()` automáticamente. Esto evita
 *    bugs silenciosos cuando un `.env` tiene espacios accidentales al
 *    final de una línea (ej. `JWT_SECRET=xxx  ` produce tokens que no
 *    validan en otros entornos).
 *  - Rechazamos valores placeholder del `.env.example` para obligar al
 *    desarrollador a configurarlos.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  JWT_SECRET: z
    .string()
    .trim()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .refine(
      (val) => !val.startsWith('cambia-este-valor'),
      'JWT_SECRET is still the placeholder from .env.example — generate a real one',
    ),
  JWT_EXPIRES_IN: z.string().trim().default('1h'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:4200')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  FIREBASE_PROJECT_ID: z
    .string()
    .trim()
    .min(1, 'FIREBASE_PROJECT_ID is required')
    .refine(
      (val) => val !== 'tu-proyecto-firebase',
      'FIREBASE_PROJECT_ID is still the placeholder — use your real Firebase project id',
    )
    .optional(),
  GCLOUD_PROJECT: z.string().trim().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().trim().optional(),
  FIRESTORE_EMULATOR_HOST: z.string().trim().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Resuelve el projectId efectivo.
 * En local se usa FIREBASE_PROJECT_ID del .env.
 * En Cloud Functions se inyecta GCLOUD_PROJECT automáticamente.
 */
export function resolveProjectId(env: AppEnv): string {
  const projectId = env.FIREBASE_PROJECT_ID ?? env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new Error(
      'No Firebase project id available. Set FIREBASE_PROJECT_ID in .env (local) or ensure GCLOUD_PROJECT is set (Cloud Functions).',
    );
  }
  return projectId;
}

/**
 * Carga y valida el entorno. Se llama una sola vez al arrancar.
 * Si algo falla, el proceso termina con código 1 y un mensaje claro.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    // eslint-disable-next-line no-console
    console.error(`❌ Invalid environment configuration:\n${issues}`);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
