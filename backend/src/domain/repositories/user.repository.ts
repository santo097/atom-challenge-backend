import type { User } from '../entities';

/**
 * Puerto (interfaz) del repositorio de usuarios.
 *
 * El dominio define qué necesita; la infraestructura decide cómo
 * implementarlo (Firestore, Postgres, memoria, etc.).
 *
 * Los casos de uso dependen SOLO de esta interfaz, nunca de una
 * implementación concreta. Esto permite:
 *  - Testear casos de uso con un mock/stub in-memory
 *  - Cambiar de Firestore a otra DB sin tocar lógica de negocio
 */
export interface UserRepository {
  /**
   * Busca un usuario por email (normalizado).
   * @returns el User si existe, o `null` si no.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Busca un usuario por id.
   * @returns el User si existe, o `null` si no.
   */
  findById(id: string): Promise<User | null>;

  /**
   * Persiste un nuevo usuario.
   * @throws ConflictError si ya existe un usuario con ese email
   */
  save(user: User): Promise<User>;
}
