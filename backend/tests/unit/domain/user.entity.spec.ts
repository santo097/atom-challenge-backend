import { User } from '@domain/entities';
import { ValidationError } from '@domain/errors';

describe('User entity', () => {
  const validParams = {
    id: 'user-123',
    email: 'alice@example.com',
  };

  describe('create', () => {
    it('creates a valid user', () => {
      const user = User.create(validParams);
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('alice@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('normalizes email (lowercase + trim)', () => {
      const user = User.create({ ...validParams, email: '  Alice@Example.COM  ' });
      expect(user.email).toBe('alice@example.com');
    });

    it('uses provided createdAt when given', () => {
      const fixed = new Date('2025-01-15T10:00:00Z');
      const user = User.create({ ...validParams, createdAt: fixed });
      expect(user.createdAt).toEqual(fixed);
    });

    it('rejects empty id', () => {
      expect(() => User.create({ ...validParams, id: '' })).toThrow(ValidationError);
      expect(() => User.create({ ...validParams, id: '   ' })).toThrow(ValidationError);
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        '',
        '   ',
        'not-an-email',
        'no@tld',
        '@no-local.com',
        'spaces in@email.com',
      ];
      for (const email of invalidEmails) {
        expect(() => User.create({ ...validParams, email })).toThrow(ValidationError);
      }
    });

    it('rejects emails that exceed max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'; // > 254
      expect(() => User.create({ ...validParams, email: longEmail })).toThrow(ValidationError);
    });

    it('rejects future createdAt', () => {
      const future = new Date(Date.now() + 60_000);
      expect(() => User.create({ ...validParams, createdAt: future })).toThrow(ValidationError);
    });
  });

  describe('fromPersistence', () => {
    it('hydrates without re-validating email format', () => {
      // Un email "raro" que ya está en DB debe poder hidratarse.
      // La invariante es que NO esté vacío, no que cumpla regex.
      const user = User.fromPersistence({
        id: 'id-1',
        email: 'legacy-format@ok',
        createdAt: new Date('2020-01-01'),
      });
      expect(user.email).toBe('legacy-format@ok');
    });

    it('rejects missing id', () => {
      expect(() =>
        User.fromPersistence({ id: '', email: 'a@b.com', createdAt: new Date() }),
      ).toThrow(ValidationError);
    });

    it('rejects missing email', () => {
      expect(() => User.fromPersistence({ id: 'x', email: '', createdAt: new Date() })).toThrow(
        ValidationError,
      );
    });
  });

  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(User.normalizeEmail('  USER@MAIL.COM ')).toBe('user@mail.com');
    });

    it('throws on non-string input', () => {
      expect(() => User.normalizeEmail(123 as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('toJSON', () => {
    it('returns a plain object with all fields', () => {
      const user = User.create(validParams);
      const json = user.toJSON();
      expect(json).toEqual({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      });
    });
  });
});
