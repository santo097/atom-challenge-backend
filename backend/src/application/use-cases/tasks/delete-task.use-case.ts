import { ForbiddenError, NotFoundError } from '@domain/errors';
import type { TaskRepository } from '@domain/repositories';
import type { DeleteTaskCommand } from '@application/dtos';

/**
 * Caso de uso: eliminar una tarea existente.
 *
 * Seguridad: igual que UpdateTaskUseCase — verificamos ownership antes
 * de eliminar para que un usuario no pueda borrar tareas ajenas.
 */
export class DeleteTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
    const existing = await this.taskRepository.findById(command.id);
    if (!existing) {
      throw new NotFoundError(`Task ${command.id} not found`);
    }
    if (!existing.belongsTo(command.userId)) {
      throw new ForbiddenError('Cannot delete a task that belongs to another user');
    }
    await this.taskRepository.delete(command.id);
  }
}
