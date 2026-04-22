import { NotFoundError } from '@domain/errors';
import { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';
import type { UserResponse } from '@application/dtos';
import { toUserResponse } from '@application/dtos';

/**
 * Caso de uso: buscar usuario por email.
 *
 * Cubre el endpoint explícito del PDF: "Busca el usuario si ha sido creado".
 * Devuelve el usuario si existe. Lanza NotFoundError si no.
 *
 * Esta operación NO es autenticada — el frontend la usa antes del login
 * para decidir si mostrar el diálogo de "crear usuario".
 */
export class FindUserByEmailUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(email: string): Promise<UserResponse> {
    const normalized = User.normalizeEmail(email);
    const user = await this.userRepository.findByEmail(normalized);
    if (!user) {
      throw new NotFoundError(`User with email ${normalized} not found`);
    }
    return toUserResponse(user);
  }
}
