import { ConflictError } from '@domain/errors';
import { User } from '@domain/entities';
import type { UserRepository } from '@domain/repositories';
import type { Clock, IdGenerator, TokenService } from '@application/ports';
import type { AuthResponse } from '@application/dtos';
import { toUserResponse } from '@application/dtos';

/**
 * Caso de uso: register.
 *
 * Flujo del PDF: "Si se crea el usuario debe navegar directamente a la
 * página principal". Para que el frontend pueda hacer eso sin un segundo
 * request, devolvemos el token directamente al registrar.
 *
 * Reglas:
 *  - Si el email ya existe → ConflictError (409)
 *  - Crea el usuario, firma JWT, devuelve ambos
 */
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly tokenExpiresIn: string,
  ) {}

  async execute(email: string): Promise<AuthResponse> {
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
    const token = this.tokenService.sign({ sub: saved.id, email: saved.email });

    return {
      user: toUserResponse(saved),
      token,
      expiresIn: this.tokenExpiresIn,
    };
  }
}
