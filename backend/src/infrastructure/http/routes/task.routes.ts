import { Router } from 'express';
import type { TokenService } from '@application/ports';
import type { taskController } from '../controllers';
import { authenticate, validate } from '../middlewares';
import {
  createTaskBodySchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskBodySchema,
} from '../validators/task.validators';

/**
 * Rutas /tasks — TODAS protegidas con authenticate.
 *
 * El middleware authenticate va al inicio del router para que ninguna
 * ruta de tasks sea accesible sin un JWT válido. Es más seguro
 * aplicarlo a nivel router que recordar ponerlo en cada ruta.
 */
export function buildTaskRouter(
  controller: ReturnType<typeof taskController>,
  tokenService: TokenService,
): Router {
  const router = Router();

  // Todas las rutas siguientes requieren JWT válido
  router.use(authenticate(tokenService));

  router.get('/', validate({ query: listTasksQuerySchema }), controller.list);
  router.post('/', validate({ body: createTaskBodySchema }), controller.create);
  router.put(
    '/:id',
    validate({ params: taskIdParamSchema, body: updateTaskBodySchema }),
    controller.update,
  );
  router.delete('/:id', validate({ params: taskIdParamSchema }), controller.remove);

  return router;
}
