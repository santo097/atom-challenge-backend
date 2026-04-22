import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '@application/ports';

/**
 * Implementación productiva de IdGenerator usando crypto.randomUUID.
 *
 * UUIDs v4 son suficientes aquí: son lo bastante únicos para no colisionar
 * y no revelan orden/ritmo de creación (a diferencia de un autoincrement).
 */
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
