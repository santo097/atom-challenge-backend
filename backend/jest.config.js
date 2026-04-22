/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/tests/unit'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/local.ts',
    '!src/infrastructure/config/**',
    // La capa HTTP (controllers, middlewares, rutas, validators, app.ts)
    // se cubre con tests de integración, no unitarios. Su coverage real
    // se ve en `npm run test:integration`.
    '!src/infrastructure/http/**',
    // Adaptadores Firestore: requieren emulador real, se cubren en integración.
    '!src/infrastructure/persistence/**',
    // Adaptadores triviales (JWT wrap, clock, uuid): ya cubiertos
    // indirectamente en integración. Evitamos tests boilerplate.
    '!src/infrastructure/security/**',
    // Logger: utilidad de escritura a consola, sin lógica de negocio.
    '!src/shared/utils/logger.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  clearMocks: true,
  verbose: true,
};
