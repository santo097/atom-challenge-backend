import * as admin from 'firebase-admin';

/**
 * Inicializa Firebase Admin SDK una única vez.
 *
 * - En Cloud Functions, las credenciales se detectan automáticamente (ADC).
 * - En local, se usa `GOOGLE_APPLICATION_CREDENTIALS` apuntando al
 *   service-account.json.
 * - Si `FIRESTORE_EMULATOR_HOST` está definido, el SDK usa el emulador.
 *
 * Llamar a `initFirebase()` es idempotente — si ya está inicializado,
 * no lo reinicializa.
 */
export function initFirebase(projectId: string): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  return admin.initializeApp({
    projectId,
    // El SDK usa las ADC automáticamente vía GOOGLE_APPLICATION_CREDENTIALS
    // o la identidad del runtime de Cloud Functions.
  });
}

export function getFirestore(): admin.firestore.Firestore {
  return admin.firestore();
}
