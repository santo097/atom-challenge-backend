import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wrapper que convierte promesas rechazadas en llamadas a next(err).
 *
 * Express 4 no propaga errores async por defecto — sin este wrapper
 * una promesa rechazada queda como "unhandled rejection" y el cliente
 * recibe un timeout. Con esto podemos escribir controllers `async`
 * limpios sin try/catch.
 *
 * Express 5 lo soporta nativamente; cuando migremos, se puede quitar.
 */
export function asyncHandler<R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as R, res, next)).catch(next);
  };
}
