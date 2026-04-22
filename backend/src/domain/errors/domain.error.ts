/**
 * Clase base para errores del dominio.
 *
 * Todos los errores de negocio extienden de aquí. La capa HTTP
 * los traduce a códigos de estado mediante el error handler
 * centralizado (ver `infrastructure/http/middlewares/error-handler.ts`).
 *
 * Nunca exponemos stack traces ni mensajes internos al cliente —
 * solo el `code` y un `message` seguro para el usuario final.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Restaurar el prototype chain — necesario al extender Error en TS
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
