/**
 * Payload que se firma/verifica en el token.
 * Mantenemos solo lo mínimo necesario para identificar al usuario —
 * nada de permisos ni roles (no aplica a este challenge).
 */
export interface TokenPayload {
  readonly sub: string; // user id
  readonly email: string;
}

/**
 * Puerto para firmar y verificar tokens de autenticación.
 *
 * El dominio no sabe nada de JWT — solo pide "dame un token para este
 * usuario" o "verifica este token". La implementación concreta usa
 * `jsonwebtoken`, pero podríamos cambiar a Paseto sin tocar casos de uso.
 */
export interface TokenService {
  /**
   * Firma un token con el payload dado.
   * @returns el token como string listo para enviar al cliente
   */
  sign(payload: TokenPayload): string;

  /**
   * Verifica un token y devuelve su payload.
   * @throws UnauthorizedError si el token es inválido o expiró
   */
  verify(token: string): TokenPayload;
}
