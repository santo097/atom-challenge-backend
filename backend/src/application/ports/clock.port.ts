/**
 * Puerto para obtener el tiempo actual.
 *
 * Abstraer `new Date()` nos permite testear con fechas fijas (útil
 * para verificar `createdAt` exactos sin flaky tests basados en timing).
 */
export interface Clock {
  now(): Date;
}
