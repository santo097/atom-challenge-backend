import { Task } from '@domain/entities';
import { ValidationError } from '@domain/errors';

describe('Task entity', () => {
  const baseParams = {
    id: 'task-1',
    userId: 'user-1',
    title: 'Buy milk',
    description: 'From the store around the corner',
  };

  describe('create', () => {
    it('creates a valid task with default completed=false', () => {
      const task = Task.create(baseParams);
      expect(task.id).toBe('task-1');
      expect(task.userId).toBe('user-1');
      expect(task.title).toBe('Buy milk');
      expect(task.description).toBe('From the store around the corner');
      expect(task.completed).toBe(false);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toEqual(task.createdAt);
    });

    it('trims whitespace from title', () => {
      const task = Task.create({ ...baseParams, title: '  Go for a run  ' });
      expect(task.title).toBe('Go for a run');
    });

    it('defaults description to empty string when omitted', () => {
      const task = Task.create({ id: 'x', userId: 'u', title: 'Ok' });
      expect(task.description).toBe('');
    });

    it('rejects empty id', () => {
      expect(() => Task.create({ ...baseParams, id: '' })).toThrow(ValidationError);
    });

    it('rejects missing userId', () => {
      expect(() => Task.create({ ...baseParams, userId: '' })).toThrow(ValidationError);
    });

    it('rejects empty/whitespace-only title', () => {
      expect(() => Task.create({ ...baseParams, title: '' })).toThrow(ValidationError);
      expect(() => Task.create({ ...baseParams, title: '   ' })).toThrow(ValidationError);
    });

    it('rejects title exceeding max length', () => {
      const longTitle = 'a'.repeat(Task.TITLE_MAX_LENGTH + 1);
      expect(() => Task.create({ ...baseParams, title: longTitle })).toThrow(ValidationError);
    });

    it('rejects description exceeding max length', () => {
      const longDesc = 'a'.repeat(Task.DESCRIPTION_MAX_LENGTH + 1);
      expect(() => Task.create({ ...baseParams, description: longDesc })).toThrow(ValidationError);
    });

    it('rejects non-string title', () => {
      expect(() => Task.create({ ...baseParams, title: 123 as unknown as string })).toThrow(
        ValidationError,
      );
    });
  });

  describe('belongsTo', () => {
    it('returns true for the owning user', () => {
      const task = Task.create(baseParams);
      expect(task.belongsTo('user-1')).toBe(true);
    });

    it('returns false for any other user', () => {
      const task = Task.create(baseParams);
      expect(task.belongsTo('user-2')).toBe(false);
      expect(task.belongsTo('')).toBe(false);
    });
  });

  describe('toggleCompleted', () => {
    it('flips completed from false to true', () => {
      const task = Task.create(baseParams);
      const toggled = task.toggleCompleted();
      expect(toggled.completed).toBe(true);
      expect(task.completed).toBe(false); // original sin mutar (inmutabilidad)
    });

    it('flips completed from true to false', () => {
      const task = Task.create(baseParams).toggleCompleted();
      const untoggled = task.toggleCompleted();
      expect(untoggled.completed).toBe(false);
    });

    it('updates updatedAt but keeps createdAt', () => {
      const created = new Date('2025-01-01T00:00:00Z');
      const later = new Date('2025-01-02T00:00:00Z');
      const task = Task.create({ ...baseParams, createdAt: created });
      const toggled = task.toggleCompleted(later);
      expect(toggled.createdAt).toEqual(created);
      expect(toggled.updatedAt).toEqual(later);
    });

    it('preserves id, userId, title and description', () => {
      const task = Task.create(baseParams);
      const toggled = task.toggleCompleted();
      expect(toggled.id).toBe(task.id);
      expect(toggled.userId).toBe(task.userId);
      expect(toggled.title).toBe(task.title);
      expect(toggled.description).toBe(task.description);
    });
  });

  describe('edit', () => {
    it('updates only the title when only title is provided', () => {
      const task = Task.create(baseParams);
      const edited = task.edit({ title: 'New title' });
      expect(edited.title).toBe('New title');
      expect(edited.description).toBe(task.description);
      expect(edited.completed).toBe(task.completed);
    });

    it('updates only the description', () => {
      const task = Task.create(baseParams);
      const edited = task.edit({ description: 'New description' });
      expect(edited.description).toBe('New description');
      expect(edited.title).toBe(task.title);
    });

    it('updates only the completed flag', () => {
      const task = Task.create(baseParams);
      const edited = task.edit({ completed: true });
      expect(edited.completed).toBe(true);
    });

    it('updates multiple fields at once', () => {
      const task = Task.create(baseParams);
      const edited = task.edit({ title: 'T2', description: 'D2', completed: true });
      expect(edited.title).toBe('T2');
      expect(edited.description).toBe('D2');
      expect(edited.completed).toBe(true);
    });

    it('returns the same instance when no changes are effective', () => {
      const task = Task.create(baseParams);
      const edited = task.edit({ title: task.title, description: task.description });
      expect(edited).toBe(task);
    });

    it('rejects invalid title on edit', () => {
      const task = Task.create(baseParams);
      expect(() => task.edit({ title: '' })).toThrow(ValidationError);
    });

    it('rejects invalid description on edit', () => {
      const task = Task.create(baseParams);
      const tooLong = 'a'.repeat(Task.DESCRIPTION_MAX_LENGTH + 1);
      expect(() => task.edit({ description: tooLong })).toThrow(ValidationError);
    });

    it('updates updatedAt when there are effective changes', () => {
      const created = new Date('2025-01-01T00:00:00Z');
      const later = new Date('2025-01-02T00:00:00Z');
      const task = Task.create({ ...baseParams, createdAt: created });
      const edited = task.edit({ title: 'Changed' }, later);
      expect(edited.updatedAt).toEqual(later);
      expect(edited.createdAt).toEqual(created);
    });
  });

  describe('fromPersistence', () => {
    it('hydrates a task with all fields', () => {
      const props = {
        id: 'p-1',
        userId: 'u-1',
        title: 'Persisted',
        description: 'From DB',
        completed: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };
      const task = Task.fromPersistence(props);
      expect(task.toJSON()).toEqual(props);
    });

    it('rejects missing id', () => {
      expect(() =>
        Task.fromPersistence({
          id: '',
          userId: 'u',
          title: 't',
          description: '',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).toThrow(ValidationError);
    });

    it('rejects missing userId', () => {
      expect(() =>
        Task.fromPersistence({
          id: 'x',
          userId: '',
          title: 't',
          description: '',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).toThrow(ValidationError);
    });

    it('rejects createdAt after updatedAt', () => {
      expect(() =>
        Task.fromPersistence({
          id: 'x',
          userId: 'u',
          title: 't',
          description: '',
          completed: false,
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-01'),
        }),
      ).toThrow(ValidationError);
    });
  });
});
