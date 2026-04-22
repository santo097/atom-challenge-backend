import { z } from 'zod';
import { Task } from '@domain/entities';

/**
 * Validadores zod para los endpoints de tasks.
 *
 * Los límites (TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH) se importan
 * de la entidad para mantener una única fuente de verdad — si cambia
 * la invariante de dominio, los validadores se actualizan solos.
 */

const titleSchema = z
  .string({ required_error: 'title is required', invalid_type_error: 'title must be a string' })
  .trim()
  .min(1, 'title cannot be empty')
  .max(Task.TITLE_MAX_LENGTH, `title cannot exceed ${Task.TITLE_MAX_LENGTH} chars`);

const descriptionSchema = z
  .string({ invalid_type_error: 'description must be a string' })
  .max(
    Task.DESCRIPTION_MAX_LENGTH,
    `description cannot exceed ${Task.DESCRIPTION_MAX_LENGTH} chars`,
  );

export const createTaskBodySchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema.optional(),
  })
  .strict();

export const updateTaskBodySchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine(
    (val) =>
      val.title !== undefined || val.description !== undefined || val.completed !== undefined,
    { message: 'At least one field (title, description, completed) must be provided' },
  );

export const taskIdParamSchema = z
  .object({
    id: z.string().trim().min(1, 'id is required'),
  })
  .strict();

/**
 * Query params para GET /tasks.
 * `completed` llega como string ("true"/"false") en query — lo
 * convertimos a boolean o lo dejamos undefined si no viene.
 */
export const listTasksQuerySchema = z
  .object({
    completed: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === undefined ? undefined : val === 'true')),
  })
  .strict();

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
