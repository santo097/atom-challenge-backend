import { ConflictError } from '@domain/errors';
import { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';
import type { Clock, IdGenerator } from '@application/ports';
import type { UserResponse } from '@application/dtos';
import { toUserResponse } from '@application/dtos';

/**
 * Caso de uso: crear usuario.
 *
 * Cubre el endpoint explícito del PDF: "Agrega un nuevo usuario".
 *
 * Reglas:
 *  - Si el email ya existe → ConflictError (409)
 *  - Si no, crea el usuario y lo devuelve
 *
 * NO emite token — eso es responsabilidad del caso de uso de auth.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(email: string): Promise<UserResponse> {
    const normalized = User.normalizeEmail(email);
    const existing = await this.userRepository.findByEmail(normalized);
    if (existing) {
      throw new ConflictError(`User with email ${normalized} already exists`);
    }

    const user = User.create({
      id: this.idGenerator.generate(),
      email: normalized,
      createdAt: this.clock.now(),
    });

    const saved = await this.userRepository.save(user);
    return toUserResponse(saved);
  }
}
