/**
 * Setup global de los tests de integración.
 *
 * Se ejecuta UNA vez antes de todo el suite. Configura:
 *  - FIRESTORE_EMULATOR_HOST para que el Admin SDK apunte al emulador
 *  - Variables JWT mínimas para que loadEnv no falle
 *  - PROJECT_ID de testing
 *
 * Requiere que el emulador esté corriendo en localhost:8080
 * (ver `npm run emulator` y `npm run test:integration`).
 */

process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'atom-challenge-test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'integration-test-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:4200';

// Silenciar logs durante los tests para no ensuciar la salida
// (los controllers llaman a logger.warn/error ante errores esperados).
jest.spyOn(console, 'info').mockImplementation(() => undefined);
jest.spyOn(console, 'warn').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);
