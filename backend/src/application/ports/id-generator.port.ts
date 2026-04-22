/**
 * Puerto para la generación de identificadores únicos.
 *
 * Está en `application/ports` porque es una necesidad de los casos de
 * uso (no del dominio puro). La implementación por defecto usará
 * `crypto.randomUUID()`, pero en tests inyectaremos una implementación
 * determinista para assertions precisas.
 */
export interface IdGenerator {
  generate(): string;
}
