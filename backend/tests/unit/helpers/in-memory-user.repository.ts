import type { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';

/**
 * Implementación in-memory del UserRepository para tests.
 *
 * Exponemos métodos utilitarios (`_seed`, `_clear`) con prefijo underscore
 * para diferenciarlos de la interfaz pública — son "escape hatches" para
 * los tests, no para uso productivo.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async save(user: User): Promise<User> {
    this.store.set(user.id, user);
    return user;
  }

  _seed(users: User[]): void {
    for (const u of users) this.store.set(u.id, u);
  }

  _clear(): void {
    this.store.clear();
  }

  _size(): number {
    return this.store.size;
  }
}
