import type { Task, User } from '@domain/entities';
import type { TaskResponse } from './task.dto';
import type { UserResponse } from './auth.dto';

/**
 * Convierte una Task de dominio en su representación de transporte.
 * Las fechas se serializan como ISO 8601 para que el cliente pueda
 * parsearlas con `new Date(iso)` directamente.
 */
export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
