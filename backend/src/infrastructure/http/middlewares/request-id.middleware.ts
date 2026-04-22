import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware que asigna un requestId único a cada petición.
 * Respeta un `X-Request-Id` enviado por el cliente (útil cuando el
 * frontend correlaciona sus logs con los del backend).
 */
export function requestId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.header('x-request-id');
    const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
  };
}
