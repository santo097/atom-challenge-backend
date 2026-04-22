import { Task } from '@domain/entities';
import { ForbiddenError, NotFoundError } from '@domain/errors';
import {
  CreateTaskUseCase,
  DeleteTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@application/use-cases/tasks';
import { FixedClock, SequentialIdGenerator } from '../helpers/fakes';
import { InMemoryTaskRepository } from '../helpers/in-memory-task.repository';

describe('ListTasksUseCase', () => {
  let repo: InMemoryTaskRepository;
  let useCase: ListTasksUseCase;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    useCase = new ListTasksUseCase(repo);
  });

  it('returns only the tasks of the requested user', async () => {
    const t1 = Task.create({ id: 't1', userId: 'u1', title: 'A' });
    const t2 = Task.create({ id: 't2', userId: 'u2', title: 'B' });
    repo._seed([t1, t2]);

    const result = await useCase.execute({ userId: 'u1' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('t1');
  });

  it('returns tasks ordered by createdAt DESC', async () => {
    const older = Task.create({
      id: 't-old',
      userId: 'u1',
      title: 'Old',
      createdAt: new Date('2025-01-01'),
    });
    const newer = Task.create({
      id: 't-new',
      userId: 'u1',
      title: 'New',
      createdAt: new Date('2025-06-01'),
    });
    repo._seed([older, newer]);

    const result = await useCase.execute({ userId: 'u1' });
    expect(result.map((t) => t.id)).toEqual(['t-new', 't-old']);
  });

  it('filters by completed=true', async () => {
    const pending = Task.create({ id: 'p', userId: 'u1', title: 'P' });
    const completed = Task.create({ id: 'c', userId: 'u1', title: 'C' }).toggleCompleted();
    repo._seed([pending, completed]);

    const result = await useCase.execute({ userId: 'u1', completed: true });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('c');
  });

  it('filters by completed=false', async () => {
    const pending = Task.create({ id: 'p', userId: 'u1', title: 'P' });
    const completed = Task.create({ id: 'c', userId: 'u1', title: 'C' }).toggleCompleted();
    repo._seed([pending, completed]);

    const result = await useCase.execute({ userId: 'u1', completed: false });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('p');
  });

  it('returns empty array when user has no tasks', async () => {
    const result = await useCase.execute({ userId: 'ghost' });
    expect(result).toEqual([]);
  });
});

describe('CreateTaskUseCase', () => {
  const fixedDate = new Date('2025-06-01T12:00:00Z');

  let repo: InMemoryTaskRepository;
  let clock: FixedClock;
  let ids: SequentialIdGenerator;
  let useCase: CreateTaskUseCase;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    clock = new FixedClock(fixedDate);
    ids = new SequentialIdGenerator('task');
    useCase = new CreateTaskUseCase(repo, ids, clock);
  });

  it('creates a task with generated id and fixed clock', async () => {
    const result = await useCase.execute({
      userId: 'u1',
      title: 'Buy milk',
      description: 'From the store',
    });

    expect(result.id).toBe('task-1');
    expect(result.title).toBe('Buy milk');
    expect(result.description).toBe('From the store');
    expect(result.completed).toBe(false);
    expect(result.createdAt).toBe(fixedDate.toISOString());
    expect(result.updatedAt).toBe(fixedDate.toISOString());
  });

  it('defaults description to empty string when omitted', async () => {
    const result = await useCase.execute({ userId: 'u1', title: 'Ok' });
    expect(result.description).toBe('');
  });

  it('propagates validation errors from the entity', async () => {
    await expect(useCase.execute({ userId: 'u1', title: '   ' })).rejects.toThrow();
  });
});

describe('UpdateTaskUseCase', () => {
  const fixedDate = new Date('2025-06-01T12:00:00Z');
  const laterDate = new Date('2025-06-02T12:00:00Z');

  let repo: InMemoryTaskRepository;
  let clock: FixedClock;
  let useCase: UpdateTaskUseCase;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    clock = new FixedClock(laterDate);
    useCase = new UpdateTaskUseCase(repo, clock);
  });

  it('updates title, description, and completed', async () => {
    const task = Task.create({
      id: 't1',
      userId: 'u1',
      title: 'Old',
      description: 'Old desc',
      createdAt: fixedDate,
    });
    repo._seed([task]);

    const result = await useCase.execute({
      id: 't1',
      userId: 'u1',
      title: 'New',
      description: 'New desc',
      completed: true,
    });

    expect(result.title).toBe('New');
    expect(result.description).toBe('New desc');
    expect(result.completed).toBe(true);
    expect(result.updatedAt).toBe(laterDate.toISOString());
    expect(result.createdAt).toBe(fixedDate.toISOString());
  });

  it('supports partial updates (only completed)', async () => {
    const task = Task.create({ id: 't1', userId: 'u1', title: 'Keep me' });
    repo._seed([task]);

    const result = await useCase.execute({ id: 't1', userId: 'u1', completed: true });

    expect(result.title).toBe('Keep me');
    expect(result.completed).toBe(true);
  });

  it('throws NotFoundError when task does not exist', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: 'u1', title: 'X' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('throws ForbiddenError when task belongs to another user', async () => {
    repo._seed([Task.create({ id: 't1', userId: 'other-user', title: 'X' })]);
    await expect(useCase.execute({ id: 't1', userId: 'u1', title: 'Hacked' })).rejects.toThrow(
      ForbiddenError,
    );
  });

  it('skips DB write when no effective change', async () => {
    const task = Task.create({ id: 't1', userId: 'u1', title: 'Same' });
    repo._seed([task]);

    // Espía el método update
    const updateSpy = jest.spyOn(repo, 'update');

    const result = await useCase.execute({ id: 't1', userId: 'u1', title: 'Same' });

    expect(updateSpy).not.toHaveBeenCalled();
    expect(result.title).toBe('Same');
  });
});

describe('DeleteTaskUseCase', () => {
  let repo: InMemoryTaskRepository;
  let useCase: DeleteTaskUseCase;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    useCase = new DeleteTaskUseCase(repo);
  });

  it('deletes a task owned by the user', async () => {
    repo._seed([Task.create({ id: 't1', userId: 'u1', title: 'Bye' })]);

    await useCase.execute({ id: 't1', userId: 'u1' });

    expect(await repo.findById('t1')).toBeNull();
  });

  it('throws NotFoundError when task does not exist', async () => {
    await expect(useCase.execute({ id: 'ghost', userId: 'u1' })).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when task belongs to another user', async () => {
    repo._seed([Task.create({ id: 't1', userId: 'other-user', title: 'X' })]);
    await expect(useCase.execute({ id: 't1', userId: 'u1' })).rejects.toThrow(ForbiddenError);
  });
});
