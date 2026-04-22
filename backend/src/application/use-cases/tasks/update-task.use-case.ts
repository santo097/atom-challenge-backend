import { ForbiddenError, NotFoundError } from '@domain/errors';
import type { TaskRepository } from '@domain/repositories';
import type { Clock } from '@application/ports';
import type { TaskResponse, UpdateTaskCommand } from '@application/dtos';
import { toTaskResponse } from '@application/dtos';

/**
 * Caso de uso: actualizar una tarea existente.
 *
 * Cubre tanto edición (título/descripción) como toggle de completado,
 * porque la entidad Task.edit() ya soporta cambios parciales.
 *
 * Seguridad — ownership check:
 *  1. Si la tarea no existe → NotFoundError (404)
 *  2. Si existe pero no pertenece al usuario → ForbiddenError (403)
 *
 * Devolvemos 403 (no 404) cuando la tarea existe pero es de otro, porque
 * eso refleja la semántica real. Si preferimos no revelar existencia a
 * terceros, podríamos devolver 404 en ambos casos — decisión de diseño
 * que para un TODO app es aceptable como 403.
 */
export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<TaskResponse> {
    const existing = await this.taskRepository.findById(command.id);
    if (!existing) {
      throw new NotFoundError(`Task ${command.id} not found`);
    }
    if (!existing.belongsTo(command.userId)) {
      throw new ForbiddenError('Cannot modify a task that belongs to another user');
    }

    const updated = existing.edit(
      {
        title: command.title,
        description: command.description,
        completed: command.completed,
      },
      this.clock.now(),
    );

    // Si edit() no detectó cambios, devolvemos la misma instancia sin
    // pegarle a la DB (optimización).
    if (updated === existing) {
      return toTaskResponse(existing);
    }

    const saved = await this.taskRepository.update(updated);
    return toTaskResponse(saved);
  }
}
