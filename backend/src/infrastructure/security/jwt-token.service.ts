import jwt, { JsonWebTokenError, TokenExpiredError, type SignOptions } from 'jsonwebtoken';
import { UnauthorizedError } from '@domain/errors';
import type { TokenPayload, TokenService } from '@application/ports';

/**
 * Implementación JWT del TokenService.
 *
 * Firma y verifica tokens HS256 con una clave secreta compartida.
 * El payload solo contiene lo mínimo (sub + email). Para este challenge
 * HS256 es suficiente; en producción multi-servicio conviene RS256.
 */
export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {
    if (!secret || secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters');
    }
  }

  sign(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
      algorithm: 'HS256',
    };
    return jwt.sign({ sub: payload.sub, email: payload.email }, this.secret, options);
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Invalid token payload');
      }
      const payload = decoded;
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new UnauthorizedError('Invalid token payload');
      }
      return { sub: payload.sub, email: payload.email };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  }
}
