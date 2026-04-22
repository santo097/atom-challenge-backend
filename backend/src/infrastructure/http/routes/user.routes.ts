import { Router } from 'express';
import type { userController } from '../controllers';
import { validate } from '../middlewares';
import { createUserBodySchema, userEmailParamSchema } from '../validators/auth.validators';

/**
 * Rutas /users del PDF:
 *   - GET  /users/:email    → busca si existe
 *   - POST /users           → crea nuevo
 *
 * Ambas son públicas (no requieren JWT) porque se usan en el flujo de
 * login/registro, antes de que el usuario tenga token.
 */
export function buildUserRouter(controller: ReturnType<typeof userController>): Router {
  const router = Router();

  router.get('/:email', validate({ params: userEmailParamSchema }), controller.findByEmail);
  router.post('/', validate({ body: createUserBodySchema }), controller.create);

  return router;
}
