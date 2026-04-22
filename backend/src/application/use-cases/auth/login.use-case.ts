import { NotFoundError } from '@domain/errors';
import { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';
import type { TokenService } from '@application/ports';
import type { AuthResponse } from '@application/dtos';
import { toUserResponse } from '@application/dtos';

/**
 * Caso de uso: login.
 *
 * El PDF describe un flujo passwordless: el usuario ingresa su email;
 * si existe se loguea, si no se muestra un diálogo de creación.
 *
 * Este caso de uso cubre el "si existe": busca al usuario, emite JWT.
 * Si no existe, lanza NotFoundError para que el frontend sepa que debe
 * ofrecer crear el usuario (flujo de Register).
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly tokenExpiresIn: string,
  ) {}

  async execute(email: string): Promise<AuthResponse> {
    const normalized = User.normalizeEmail(email);
    const user = await this.userRepository.findByEmail(normalized);
    if (!user) {
      throw new NotFoundError(`User with email ${normalized} not found`);
    }

    const token = this.tokenService.sign({ sub: user.id, email: user.email });

    return {
      user: toUserResponse(user),
      token,
      expiresIn: this.tokenExpiresIn,
    };
  }
}
