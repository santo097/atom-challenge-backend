import type { Request, Response } from 'express';

/**
 * Handler catch-all para rutas no definidas. Devuelve 404 en formato
 * consistente con el resto de errores de la API.
 */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      ...(req.requestId ? { requestId: req.requestId } : {}),
    },
  });
}
