import { NotFoundError } from '@domain/errors';
import type { Task } from '@domain/entities';
import type { TaskFilters, TaskRepository } from '@domain/repositories';

export class InMemoryTaskRepository implements TaskRepository {
  private readonly store = new Map<string, Task>();

  async findAllByUser(userId: string, filters?: TaskFilters): Promise<Task[]> {
    const all = Array.from(this.store.values())
      .filter((t) => t.belongsTo(userId))
      .filter((t) => {
        if (filters?.completed === undefined) return true;
        return t.completed === filters.completed;
      });
    // Ordenar por createdAt DESC (mismos contratos que Firestore)
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all;
  }

  async findById(id: string): Promise<Task | null> {
    return this.store.get(id) ?? null;
  }

  async save(task: Task): Promise<Task> {
    this.store.set(task.id, task);
    return task;
  }

  async update(task: Task): Promise<Task> {
    if (!this.store.has(task.id)) {
      throw new NotFoundError(`Task ${task.id} not found`);
    }
    this.store.set(task.id, task);
    return task;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  _seed(tasks: Task[]): void {
    for (const t of tasks) this.store.set(t.id, t);
  }

  _clear(): void {
    this.store.clear();
  }
}
