import type { Clock } from '@application/ports';

/**
 * Implementación productiva de Clock usando el reloj del sistema.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
