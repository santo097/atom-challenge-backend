/**
 * Extensiones del tipo Request de Express.
 *
 * Añadimos `user` (populado por el middleware `authenticate`) y
 * `requestId` (populado por el middleware `requestId`). Así los
 * controllers tienen tipado fuerte en vez de leer `(req as any).user`.
 *
 * Este archivo NO tiene `export {}` a propósito: es un ambient
 * declaration file que se aplica globalmente sin necesidad de importar.
 * TypeScript lo carga automáticamente vía `include` del tsconfig.
 */

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
    requestId?: string;
  }
}
