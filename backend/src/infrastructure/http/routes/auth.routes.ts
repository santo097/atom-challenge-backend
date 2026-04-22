import { Router } from 'express';
import type { authController } from '../controllers';
import { validate } from '../middlewares';
import { loginBodySchema, registerBodySchema } from '../validators/auth.validators';

export function buildAuthRouter(controller: ReturnType<typeof authController>): Router {
  const router = Router();

  router.post('/login', validate({ body: loginBodySchema }), controller.login);
  router.post('/register', validate({ body: registerBodySchema }), controller.register);

  return router;
}
