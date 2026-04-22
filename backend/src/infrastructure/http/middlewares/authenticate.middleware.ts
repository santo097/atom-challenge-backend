import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '@domain/errors';
import type { TokenService } from '@application/ports';

/**
 * Middleware de autenticación.
 *
 * Lee el header `Authorization: Bearer <token>`, verifica el JWT y
 * popula `req.user`. Si falta o es inválido, delega al error handler
 * con UnauthorizedError (401).
 *
 * Se inyecta el TokenService por constructor para poder mockearlo
 * en tests — es la misma razón por la que los casos de uso también
 * reciben sus dependencias así.
 */
export function authenticate(tokenService: TokenService) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.header('authorization');
      if (!header || !header.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header');
      }
      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        throw new UnauthorizedError('Empty bearer token');
      }
      const payload = tokenService.verify(token);
      req.user = { id: payload.sub, email: payload.email };
      next();
    } catch (error) {
      next(error);
    }
  };
}
