import { User } from '@domain/entities';
import { ConflictError } from '@domain/errors';
import { RegisterUseCase } from '@application/use-cases/auth';
import { FakeTokenService, FixedClock, SequentialIdGenerator } from '../helpers/fakes';
import { InMemoryUserRepository } from '../helpers/in-memory-user.repository';

describe('RegisterUseCase', () => {
  const fixedDate = new Date('2025-06-01T12:00:00Z');

  let repo: InMemoryUserRepository;
  let tokens: FakeTokenService;
  let clock: FixedClock;
  let ids: SequentialIdGenerator;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    tokens = new FakeTokenService();
    clock = new FixedClock(fixedDate);
    ids = new SequentialIdGenerator('user');
    useCase = new RegisterUseCase(repo, tokens, ids, clock, '1h');
  });

  it('creates a new user and returns token', async () => {
    const result = await useCase.execute('new@example.com');

    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('new@example.com');
    expect(result.user.createdAt).toBe(fixedDate.toISOString());
    expect(result.token).toBeDefined();
    expect(tokens.verify(result.token).sub).toBe('user-1');
  });

  it('persists the user in the repository', async () => {
    await useCase.execute('new@example.com');
    expect(repo._size()).toBe(1);
    const found = await repo.findByEmail('new@example.com');
    expect(found).not.toBeNull();
  });

  it('normalizes email before persisting', async () => {
    const result = await useCase.execute('  MIXED@Case.com  ');
    expect(result.user.email).toBe('mixed@case.com');
  });

  it('throws ConflictError when email already exists', async () => {
    repo._seed([User.create({ id: 'u-1', email: 'existing@example.com' })]);
    await expect(useCase.execute('existing@example.com')).rejects.toThrow(ConflictError);
  });

  it('conflict check is case-insensitive', async () => {
    repo._seed([User.create({ id: 'u-1', email: 'existing@example.com' })]);
    await expect(useCase.execute('EXISTING@EXAMPLE.COM')).rejects.toThrow(ConflictError);
  });
});
