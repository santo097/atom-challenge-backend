import { ValidationError } from '../errors';

/**
 * Propiedades crudas para reconstruir una Task desde persistencia.
 */
export interface TaskProps {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Entidad Task.
 *
 * Representa una tarea pendiente/completada de un usuario.
 *
 * Invariantes:
 *  - `title`: 1..120 caracteres, no solo whitespace
 *  - `description`: 0..1000 caracteres
 *  - `userId`: no vacío (toda tarea pertenece a un usuario)
 *  - `createdAt` <= `updatedAt`
 *
 * Diseño:
 *  - Inmutable. Los cambios (rename, toggle, edit) devuelven nuevas
 *    instancias. Esto hace los casos de uso más fáciles de razonar y
 *    testear: sin efectos laterales.
 *  - `belongsTo(userId)` encapsula la regla de ownership para que los
 *    casos de uso no hagan comparaciones sueltas de IDs.
 */
export class Task {
  static readonly TITLE_MIN_LENGTH = 1;
  static readonly TITLE_MAX_LENGTH = 120;
  static readonly DESCRIPTION_MAX_LENGTH = 1000;

  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly completed: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Crea una nueva Task. Se usa al recibir un POST /tasks.
   * `completed` empieza siempre en false. `createdAt` y `updatedAt`
   * son el mismo instante.
   */
  static create(params: {
    id: string;
    userId: string;
    title: string;
    description?: string;
    createdAt?: Date;
  }): Task {
    const id = params.id?.trim();
    if (!id) {
      throw new ValidationError('Task id cannot be empty');
    }

    const userId = params.userId?.trim();
    if (!userId) {
      throw new ValidationError('Task must belong to a user');
    }

    const title = Task.assertValidTitle(params.title);
    const description = Task.assertValidDescription(params.description ?? '');
    const now = params.createdAt ?? new Date();

    return new Task(id, userId, title, description, false, now, now);
  }

  /**
   * Hidrata una Task desde Firestore. No re-valida formato, solo
   * estructura. La validación de formato ya se hizo al crearla.
   */
  static fromPersistence(props: TaskProps): Task {
    if (!props.id) throw new ValidationError('Persisted task is missing id');
    if (!props.userId) throw new ValidationError('Persisted task is missing userId');
    if (props.createdAt.getTime() > props.updatedAt.getTime()) {
      throw new ValidationError('Persisted task has createdAt after updatedAt');
    }
    return new Task(
      props.id,
      props.userId,
      props.title,
      props.description,
      props.completed,
      props.createdAt,
      props.updatedAt,
    );
  }

  /**
   * Indica si esta tarea pertenece al usuario dado.
   * Regla encapsulada para que los casos de uso no comparen IDs
   * directamente (evita bugs si cambia la forma de identificar usuarios).
   */
  belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Devuelve una nueva Task con el estado `completed` invertido.
   * Actualiza `updatedAt` al instante actual.
   */
  toggleCompleted(now: Date = new Date()): Task {
    return new Task(
      this.id,
      this.userId,
      this.title,
      this.description,
      !this.completed,
      this.createdAt,
      now,
    );
  }

  /**
   * Devuelve una nueva Task con los campos editables actualizados.
   * Permite editar solo los campos que lleguen definidos (PATCH semántico).
   */
  edit(
    changes: { title?: string; description?: string; completed?: boolean },
    now: Date = new Date(),
  ): Task {
    const newTitle =
      changes.title !== undefined ? Task.assertValidTitle(changes.title) : this.title;
    const newDescription =
      changes.description !== undefined
        ? Task.assertValidDescription(changes.description)
        : this.description;
    const newCompleted = changes.completed !== undefined ? changes.completed : this.completed;

    // Micro-optimización: si no cambia nada, no creamos instancia nueva
    if (
      newTitle === this.title &&
      newDescription === this.description &&
      newCompleted === this.completed
    ) {
      return this;
    }

    return new Task(
      this.id,
      this.userId,
      newTitle,
      newDescription,
      newCompleted,
      this.createdAt,
      now,
    );
  }

  private static assertValidTitle(title: unknown): string {
    if (typeof title !== 'string') {
      throw new ValidationError('Title must be a string');
    }
    const trimmed = title.trim();
    if (trimmed.length < Task.TITLE_MIN_LENGTH) {
      throw new ValidationError('Title cannot be empty');
    }
    if (trimmed.length > Task.TITLE_MAX_LENGTH) {
      throw new ValidationError(`Title exceeds max length of ${Task.TITLE_MAX_LENGTH}`);
    }
    return trimmed;
  }

  private static assertValidDescription(description: unknown): string {
    if (typeof description !== 'string') {
      throw new ValidationError('Description must be a string');
    }
    if (description.length > Task.DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError(`Description exceeds max length of ${Task.DESCRIPTION_MAX_LENGTH}`);
    }
    return description;
  }

  toJSON(): TaskProps {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
