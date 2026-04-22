import { DomainError } from './domain.error';

/**
 * Error de validación de una invariante de dominio.
 * Ejemplo: email con formato inválido, título de tarea vacío.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

/**
 * Recurso solicitado no existe.
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

/**
 * Intento de crear un recurso que ya existe (ej. email duplicado).
 */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
}

/**
 * Intento de operar sobre un recurso ajeno (task de otro usuario).
 * No exponemos la diferencia entre "no existe" y "no autorizado"
 * para evitar enumeración de recursos.
 */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;
}

/**
 * Token inválido, expirado o ausente.
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
}
