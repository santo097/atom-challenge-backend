import { User } from '@domain/entities';
import { NotFoundError } from '@domain/errors';
import { LoginUseCase } from '@application/use-cases/auth';
import { FakeTokenService } from '../helpers/fakes';
import { InMemoryUserRepository } from '../helpers/in-memory-user.repository';

describe('LoginUseCase', () => {
  let repo: InMemoryUserRepository;
  let tokens: FakeTokenService;
  let useCase: LoginUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    tokens = new FakeTokenService();
    useCase = new LoginUseCase(repo, tokens, '1h');
  });

  it('returns user + token when email exists', async () => {
    const user = User.create({ id: 'u-1', email: 'alice@example.com' });
    repo._seed([user]);

    const result = await useCase.execute('alice@example.com');

    expect(result.user.email).toBe('alice@example.com');
    expect(result.user.id).toBe('u-1');
    expect(result.token).toMatch(/^fake-token-/);
    expect(result.expiresIn).toBe('1h');
  });

  it('normalizes email before lookup', async () => {
    const user = User.create({ id: 'u-1', email: 'alice@example.com' });
    repo._seed([user]);

    const result = await useCase.execute('  ALICE@EXAMPLE.COM  ');

    expect(result.user.id).toBe('u-1');
  });

  it('throws NotFoundError when email does not exist', async () => {
    await expect(useCase.execute('nobody@example.com')).rejects.toThrow(NotFoundError);
  });

  it('token payload contains user id and email', async () => {
    const user = User.create({ id: 'u-1', email: 'alice@example.com' });
    repo._seed([user]);

    const result = await useCase.execute('alice@example.com');
    const payload = tokens.verify(result.token);

    expect(payload).toEqual({ sub: 'u-1', email: 'alice@example.com' });
  });
});
