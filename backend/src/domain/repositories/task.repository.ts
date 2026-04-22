import type { Task } from '../entities';

/**
 * Filtros aplicables al listar tareas.
 * `completed` undefined = todas; true = completadas; false = pendientes.
 */
export interface TaskFilters {
  readonly completed?: boolean;
}

/**
 * Puerto (interfaz) del repositorio de tareas.
 *
 * Todas las operaciones están scoped por `userId` — el dominio no
 * permite operar sobre tareas sin decir a quién pertenecen. Esto evita
 * bugs de autorización por olvido.
 */
export interface TaskRepository {
  /**
   * Lista las tareas de un usuario, ordenadas por `createdAt` descendente
   * (las más recientes primero — así las ve el usuario al hacer scroll).
   *
   * @param userId dueño de las tareas
   * @param filters filtros opcionales (por ahora solo `completed`)
   */
  findAllByUser(userId: string, filters?: TaskFilters): Promise<Task[]>;

  /**
   * Busca una tarea por id. Devuelve `null` si no existe.
   * El chequeo de ownership lo hace el caso de uso llamando a
   * `task.belongsTo(userId)`.
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Persiste una nueva tarea.
   */
  save(task: Task): Promise<Task>;

  /**
   * Actualiza una tarea existente.
   * @throws NotFoundError si no existe una tarea con ese id
   */
  update(task: Task): Promise<Task>;

  /**
   * Elimina una tarea por id. Idempotente: no falla si no existe.
   */
  delete(id: string): Promise<void>;
}
