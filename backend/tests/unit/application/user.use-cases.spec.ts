import { User } from '@domain/entities';
import { ConflictError, NotFoundError } from '@domain/errors';
import { CreateUserUseCase, FindUserByEmailUseCase } from '@application/use-cases/users';
import { FixedClock, SequentialIdGenerator } from '../helpers/fakes';
import { InMemoryUserRepository } from '../helpers/in-memory-user.repository';

describe('FindUserByEmailUseCase', () => {
  let repo: InMemoryUserRepository;
  let useCase: FindUserByEmailUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new FindUserByEmailUseCase(repo);
  });

  it('returns user when found', async () => {
    repo._seed([User.create({ id: 'u-1', email: 'a@b.com' })]);
    const result = await useCase.execute('a@b.com');
    expect(result.id).toBe('u-1');
    expect(result.email).toBe('a@b.com');
  });

  it('normalizes email before lookup', async () => {
    repo._seed([User.create({ id: 'u-1', email: 'a@b.com' })]);
    const result = await useCase.execute('  A@B.COM  ');
    expect(result.id).toBe('u-1');
  });

  it('throws NotFoundError when user does not exist', async () => {
    await expect(useCase.execute('nobody@nowhere.com')).rejects.toThrow(NotFoundError);
  });
});

describe('CreateUserUseCase', () => {
  const fixedDate = new Date('2025-06-01T12:00:00Z');

  let repo: InMemoryUserRepository;
  let clock: FixedClock;
  let ids: SequentialIdGenerator;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    clock = new FixedClock(fixedDate);
    ids = new SequentialIdGenerator('user');
    useCase = new CreateUserUseCase(repo, ids, clock);
  });

  it('creates a user with generated id and fixed clock', async () => {
    const result = await useCase.execute('new@example.com');
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('new@example.com');
    expect(result.createdAt).toBe(fixedDate.toISOString());
  });

  it('throws ConflictError when email exists', async () => {
    repo._seed([User.create({ id: 'u-1', email: 'existing@example.com' })]);
    await expect(useCase.execute('existing@example.com')).rejects.toThrow(ConflictError);
  });
});
