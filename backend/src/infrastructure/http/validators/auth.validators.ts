import { z } from 'zod';

/**
 * Schema de email compartido — permitimos un máximo amplio pero
 * validamos formato con el refinamiento de zod. La normalización
 * (lowercase/trim) la hace la entidad User en el dominio, así que
 * aquí solo validamos estructura.
 */
const emailSchema = z
  .string({ required_error: 'email is required', invalid_type_error: 'email must be a string' })
  .trim()
  .min(1, 'email cannot be empty')
  .max(254, 'email is too long')
  .email('email has an invalid format');

export const loginBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const registerBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const userEmailParamSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const createUserBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type UserEmailParam = z.infer<typeof userEmailParamSchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
