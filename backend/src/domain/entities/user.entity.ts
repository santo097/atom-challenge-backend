import { ValidationError } from '../errors';

/**
 * Propiedades crudas para reconstruir un User desde persistencia.
 */
export interface UserProps {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

/**
 * Entidad User.
 *
 * Invariantes:
 *  - `email` debe tener formato válido y longitud razonable
 *  - `id` no puede estar vacío
 *  - `createdAt` no puede estar en el futuro
 *
 * Diseño:
 *  - Inmutable: todos los campos son `readonly`. Para cambios se crea una
 *    nueva instancia.
 *  - Factoría `create` para nuevos usuarios (genera `createdAt`).
 *  - Factoría `fromPersistence` para hidratar desde Firestore sin re-ejecutar
 *    validaciones de formato (confiamos en los datos ya persistidos) pero
 *    sí los invariantes estructurales.
 */
export class User {
  // Regex pragmática — suficiente para el challenge. En producción conviene
  // usar una librería dedicada o validación por envío de email.
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly EMAIL_MAX_LENGTH = 254; // RFC 5321

  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly createdAt: Date,
  ) {}

  /**
   * Crea un nuevo User validando todas las invariantes.
   * Se usa para registros nuevos.
   */
  static create(params: { id: string; email: string; createdAt?: Date }): User {
    const id = params.id?.trim();
    if (!id) {
      throw new ValidationError('User id cannot be empty');
    }

    const email = User.normalizeEmail(params.email);
    User.assertValidEmail(email);

    const createdAt = params.createdAt ?? new Date();
    if (createdAt.getTime() > Date.now() + 1000) {
      // Margen de 1s para clock skew
      throw new ValidationError('createdAt cannot be in the future');
    }

    return new User(id, email, createdAt);
  }

  /**
   * Hidrata un User desde datos persistidos.
   * No re-valida formato del email (confiamos en los datos escritos por
   * nosotros mismos) pero sí la estructura.
   */
  static fromPersistence(props: UserProps): User {
    if (!props.id) {
      throw new ValidationError('Persisted user is missing id');
    }
    if (!props.email) {
      throw new ValidationError('Persisted user is missing email');
    }
    return new User(props.id, props.email, props.createdAt);
  }

  /**
   * Normaliza el email: trim + lowercase.
   * Exponemos esto como utilidad pública porque los repositorios lo
   * necesitan para búsquedas consistentes.
   */
  static normalizeEmail(email: string): string {
    if (typeof email !== 'string') {
      throw new ValidationError('Email must be a string');
    }
    return email.trim().toLowerCase();
  }

  private static assertValidEmail(email: string): void {
    if (email.length === 0) {
      throw new ValidationError('Email cannot be empty');
    }
    if (email.length > User.EMAIL_MAX_LENGTH) {
      throw new ValidationError(`Email exceeds max length of ${User.EMAIL_MAX_LENGTH}`);
    }
    if (!User.EMAIL_REGEX.test(email)) {
      throw new ValidationError('Email format is invalid');
    }
  }

  /**
   * Serializa la entidad a un objeto plano para persistencia o respuesta.
   */
  toJSON(): UserProps {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt,
    };
  }
}
