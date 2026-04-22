import { UnauthorizedError } from '@domain/errors';
import type { Clock, IdGenerator, TokenPayload, TokenService } from '@application/ports';

/**
 * Clock fijo — siempre devuelve la misma fecha. Útil para verificar
 * createdAt/updatedAt exactos sin flaky tests.
 */
export class FixedClock implements Clock {
  constructor(private date: Date) {}
  now(): Date {
    return this.date;
  }
  advance(ms: number): void {
    this.date = new Date(this.date.getTime() + ms);
  }
  setTo(date: Date): void {
    this.date = date;
  }
}

/**
 * IdGenerator secuencial — genera ids predecibles: id-1, id-2, id-3...
 */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;
  constructor(private readonly prefix = 'id') {}
  generate(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
  reset(): void {
    this.counter = 0;
  }
}

/**
 * TokenService falso que firma y verifica usando un Map interno.
 * No firma JWT real; simplemente asocia un string opaco al payload.
 */
export class FakeTokenService implements TokenService {
  private readonly tokens = new Map<string, TokenPayload>();
  private counter = 0;

  sign(payload: TokenPayload): string {
    this.counter += 1;
    const token = `fake-token-${this.counter}`;
    this.tokens.set(token, payload);
    return token;
  }

  verify(token: string): TokenPayload {
    const payload = this.tokens.get(token);
    if (!payload) throw new UnauthorizedError('Invalid token');
    return payload;
  }
}
