import type { Firestore } from 'firebase-admin/firestore';
import type { AppEnv } from './env';
import type { Logger } from '@shared/utils/logger';

import {
  CreateTaskUseCase,
  DeleteTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@application/use-cases/tasks';
import { CreateUserUseCase, FindUserByEmailUseCase } from '@application/use-cases/users';
import { LoginUseCase, RegisterUseCase } from '@application/use-cases/auth';

import {
  FirestoreTaskRepository,
  FirestoreUserRepository,
} from '@infrastructure/persistence/firestore';
import { JwtTokenService, SystemClock, UuidIdGenerator } from '@infrastructure/security';

import { authController, taskController, userController } from '@infrastructure/http/controllers';

/**
 * Composition root del backend.
 *
 * Aquí — y SOLO aquí — hacemos `new` de cada implementación concreta
 * y conectamos todo por constructor. El resto del código trabaja con
 * interfaces (`UserRepository`, `TokenService`, etc.).
 *
 * Esto es inyección de dependencias "manual". No usamos un framework
 * como tsyringe o InversifyJS porque el grafo es pequeño, todo se
 * arma aquí de un vistazo, y añadir una librería más no justifica el
 * costo de dependencia.
 *
 * El container retornado expone EXACTAMENTE lo que las rutas necesitan —
 * ni más, ni menos.
 */
export interface Container {
  env: AppEnv;
  logger: Logger;
  tokenService: JwtTokenService;
  controllers: {
    auth: ReturnType<typeof authController>;
    user: ReturnType<typeof userController>;
    task: ReturnType<typeof taskController>;
  };
}

export function buildContainer(deps: { env: AppEnv; db: Firestore; logger: Logger }): Container {
  const { env, db, logger } = deps;

  // Puertos de infraestructura
  const tokenService = new JwtTokenService(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const clock = new SystemClock();
  const idGenerator = new UuidIdGenerator();

  // Repositorios
  const userRepository = new FirestoreUserRepository(db);
  const taskRepository = new FirestoreTaskRepository(db);

  // Use cases
  const loginUseCase = new LoginUseCase(userRepository, tokenService, env.JWT_EXPIRES_IN);
  const registerUseCase = new RegisterUseCase(
    userRepository,
    tokenService,
    idGenerator,
    clock,
    env.JWT_EXPIRES_IN,
  );
  const findUserByEmailUseCase = new FindUserByEmailUseCase(userRepository);
  const createUserUseCase = new CreateUserUseCase(userRepository, idGenerator, clock);
  const listTasksUseCase = new ListTasksUseCase(taskRepository);
  const createTaskUseCase = new CreateTaskUseCase(taskRepository, idGenerator, clock);
  const updateTaskUseCase = new UpdateTaskUseCase(taskRepository, clock);
  const deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);

  // Controllers
  const auth = authController({ loginUseCase, registerUseCase });
  const user = userController({ findUserByEmailUseCase, createUserUseCase });
  const task = taskController({
    listTasksUseCase,
    createTaskUseCase,
    updateTaskUseCase,
    deleteTaskUseCase,
  });

  return {
    env,
    logger,
    tokenService,
    controllers: { auth, user, task },
  };
}
