import type { TaskRepository } from '@domain/repositories';
import type { ListTasksQuery, TaskResponse } from '@application/dtos';
import { toTaskResponse } from '@application/dtos';

/**
 * Caso de uso: listar todas las tareas del usuario autenticado.
 *
 * El repositorio las devuelve ya ordenadas por `createdAt` DESC.
 * Filtro opcional por `completed` (true = completadas, false = pendientes,
 * undefined = todas) — cubre el extra de "filtros" que acordamos.
 */
export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(query: ListTasksQuery): Promise<TaskResponse[]> {
    const tasks = await this.taskRepository.findAllByUser(query.userId, {
      completed: query.completed,
    });
    return tasks.map(toTaskResponse);
  }
}
