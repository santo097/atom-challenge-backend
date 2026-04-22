/**
 * DTOs de la capa de aplicación para tareas.
 *
 * Separamos la forma "dominio" (entidades) de la forma "transporte"
 * (DTOs). Esto nos da libertad para cambiar uno sin romper el otro:
 *  - Podemos renombrar un campo interno sin cambiar la API pública.
 *  - Podemos añadir lógica a la entidad sin exponerla al cliente.
 */

export interface CreateTaskCommand {
  readonly userId: string;
  readonly title: string;
  readonly description?: string;
}

export interface UpdateTaskCommand {
  readonly id: string;
  readonly userId: string;
  readonly title?: string;
  readonly description?: string;
  readonly completed?: boolean;
}

export interface DeleteTaskCommand {
  readonly id: string;
  readonly userId: string;
}

export interface ListTasksQuery {
  readonly userId: string;
  readonly completed?: boolean;
}

export interface TaskResponse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly completed: boolean;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}
