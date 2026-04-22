import { Task } from '@domain/entities';
import type { TaskRepository } from '@domain/repositories';
import type { Clock, IdGenerator } from '@application/ports';
import type { CreateTaskCommand, TaskResponse } from '@application/dtos';
import { toTaskResponse } from '@application/dtos';

/**
 * Caso de uso: crear una nueva tarea para el usuario autenticado.
 *
 * El `userId` viene del token JWT, NO del body. Esto evita que un
 * usuario pueda crear tareas a nombre de otro.
 */
export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(command: CreateTaskCommand): Promise<TaskResponse> {
    const task = Task.create({
      id: this.idGenerator.generate(),
      userId: command.userId,
      title: command.title,
      description: command.description,
      createdAt: this.clock.now(),
    });

    const saved = await this.taskRepository.save(task);
    return toTaskResponse(saved);
  }
}
