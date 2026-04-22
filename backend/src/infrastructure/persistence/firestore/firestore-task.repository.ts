import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { Task } from '@domain/entities';
import { NotFoundError } from '@domain/errors';
import type { TaskFilters, TaskRepository } from '@domain/repositories';

interface TaskDoc {
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Adaptador Firestore del TaskRepository.
 *
 * Colección: `tasks`
 *
 * Queries:
 *  - findAllByUser: where(userId) + orderBy(createdAt desc) → requiere el
 *    índice compuesto declarado en `firestore.indexes.json`.
 *  - findById: get por id directo.
 *
 * Nota: si aplicamos filtro por `completed`, Firestore requiere un índice
 * compuesto adicional (userId + completed + createdAt). En lugar de
 * añadir más índices, filtramos `completed` en memoria — es aceptable
 * para un TODO app donde un usuario típico tiene decenas, no miles, de
 * tareas. Si el volumen crece, se agrega el índice y se mueve el filtro
 * al query.
 */
export class FirestoreTaskRepository implements TaskRepository {
  private static readonly COLLECTION = 'tasks';

  constructor(private readonly db: Firestore) {}

  async findAllByUser(userId: string, filters?: TaskFilters): Promise<Task[]> {
    const snapshot = await this.db
      .collection(FirestoreTaskRepository.COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const tasks = snapshot.docs.map((doc) => this.hydrate(doc.id, doc.data() as TaskDoc));

    if (filters?.completed === undefined) {
      return tasks;
    }
    return tasks.filter((t) => t.completed === filters.completed);
  }

  async findById(id: string): Promise<Task | null> {
    const doc = await this.db.collection(FirestoreTaskRepository.COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return this.hydrate(doc.id, doc.data() as TaskDoc);
  }

  async save(task: Task): Promise<Task> {
    const data: TaskDoc = this.toDoc(task);
    await this.db.collection(FirestoreTaskRepository.COLLECTION).doc(task.id).set(data);
    return task;
  }

  async update(task: Task): Promise<Task> {
    const ref = this.db.collection(FirestoreTaskRepository.COLLECTION).doc(task.id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundError(`Task ${task.id} not found`);
    }
    await ref.set(this.toDoc(task));
    return task;
  }

  async delete(id: string): Promise<void> {
    // Idempotente: no falla si no existe (contrato del puerto).
    await this.db.collection(FirestoreTaskRepository.COLLECTION).doc(id).delete();
  }

  private hydrate(id: string, data: TaskDoc): Task {
    return Task.fromPersistence({
      id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      completed: data.completed,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    });
  }

  private toDoc(task: Task): TaskDoc {
    return {
      userId: task.userId,
      title: task.title,
      description: task.description,
      completed: task.completed,
      createdAt: Timestamp.fromDate(task.createdAt),
      updatedAt: Timestamp.fromDate(task.updatedAt),
    };
  }
}
