/**
 * Logger estructurado minimalista.
 *
 * Decisión: evitamos dependencias (Winston, Pino) para mantener el
 * bundle pequeño en Cloud Functions. Si más adelante necesitamos
 * transports, sampling o correlation IDs complejos, migramos a Pino.
 *
 * Formato:
 *  - Production/test  → JSON por línea (ideal para Cloud Logging)
 *  - Development      → texto con timestamp (legible en terminal)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

class ConsoleLogger implements Logger {
  constructor(
    private readonly pretty: boolean,
    private readonly bindings: Record<string, unknown> = {},
  ) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }
  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }
  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger(this.pretty, { ...this.bindings, ...bindings });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = {
      level,
      time: new Date().toISOString(),
      message,
      ...this.bindings,
      ...meta,
    };
    const line = this.pretty
      ? `[${entry.time}] ${level.toUpperCase().padEnd(5)} ${message}${
          Object.keys(this.bindings).length || meta
            ? ' ' + JSON.stringify({ ...this.bindings, ...meta })
            : ''
        }`
      : JSON.stringify(entry);

    // eslint-disable-next-line no-console
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    fn(line);
  }
}

export function createLogger(env: 'development' | 'production' | 'test'): Logger {
  return new ConsoleLogger(env === 'development');
}
