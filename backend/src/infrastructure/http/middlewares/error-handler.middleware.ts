import type { NextFunction, Request, Response } from 'express';
import { DomainError } from '@domain/errors/domain.error';
import type { Logger } from '@shared/utils/logger';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

/**
 * Error handler centralizado.
 *
 * Reglas:
 *  1. Si es un DomainError → usar su `code` y `statusCode`, y su mensaje
 *     (diseñado para ser seguro de exponer).
 *  2. Cualquier otro error → 500 genérico con mensaje neutro; los detalles
 *     van al log, NO al cliente.
 *
 * Siempre responde JSON con shape estable `{ error: { code, message } }`
 * para que el frontend pueda parsear sin ambigüedad.
 */
export function errorHandler(logger: Logger) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.requestId;

    if (err instanceof DomainError) {
      // Errores esperados de negocio — warn, no error.
      logger.warn('Domain error', {
        requestId,
        code: err.code,
        message: err.message,
        path: req.path,
      });
      const body: ErrorBody = {
        error: {
          code: err.code,
          message: err.message,
          ...(requestId ? { requestId } : {}),
        },
      };
      res.status(err.statusCode).json(body);
      return;
    }

    // Error inesperado — log completo con stack, respuesta opaca al cliente.
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Unhandled error', {
      requestId,
      message: error.message,
      stack: error.stack,
      path: req.path,
    });
    const body: ErrorBody = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(requestId ? { requestId } : {}),
      },
    };
    res.status(500).json(body);
  };
}
