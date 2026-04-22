import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '@domain/errors';

interface ValidateOptions {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Middleware que valida partes del request contra schemas zod.
 *
 * Al pasar, reemplaza el objeto del request con el resultado parseado
 * (coercions, defaults, transformaciones ya aplicadas). Así los
 * controllers trabajan con datos ya confiables y tipados.
 *
 * Si la validación falla, convertimos el ZodError en un ValidationError
 * de dominio con un mensaje agregado — el error handler se encarga del
 * 400 con formato consistente.
 */
export function validate(schemas: ValidateOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          throw toValidationError('body', parsed.error.issues);
        }
        req.body = parsed.data as unknown;
      }
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw toValidationError('params', parsed.error.issues);
        }
        // Express type on params is readonly Record; cast is safe here.
        Object.assign(req.params, parsed.data);
      }
      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw toValidationError('query', parsed.error.issues);
        }
        Object.assign(req.query, parsed.data);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

interface ZodIssueLike {
  path: Array<string | number>;
  message: string;
}

function toValidationError(source: string, issues: ZodIssueLike[]): ValidationError {
  const details = issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`).join('; ');
  return new ValidationError(`Invalid ${source}: ${details}`);
}
