import type { Request, Response } from 'express';
import { UnauthorizedError } from '@domain/errors';
import type {
  CreateTaskUseCase,
  DeleteTaskUseCase,
  ListTasksUseCase,
  UpdateTaskUseCase,
} from '@application/use-cases/tasks';
import { asyncHandler } from './async-handler';

/**
 * Helper: extrae el userId del request autenticado.
 * Si el middleware authenticate no corrió, falla con 401.
 */
function requireUser(req: Request): { id: string; email: string } {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function taskController(deps: {
  listTasksUseCase: ListTasksUseCase;
  createTaskUseCase: CreateTaskUseCase;
  updateTaskUseCase: UpdateTaskUseCase;
  deleteTaskUseCase: DeleteTaskUseCase;
}) {
  return {
    list: asyncHandler(async (req: Request, res: Response) => {
      const user = requireUser(req);
      const { completed } = req.query as { completed?: boolean };
      const result = await deps.listTasksUseCase.execute({
        userId: user.id,
        completed,
      });
      res.status(200).json(result);
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const user = requireUser(req);
      const { title, description } = req.body as { title: string; description?: string };
      const result = await deps.createTaskUseCase.execute({
        userId: user.id,
        title,
        description,
      });
      res.status(201).json(result);
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
      const user = requireUser(req);
      const id = req.params.id as string;
      const body = req.body as { title?: string; description?: string; completed?: boolean };
      const result = await deps.updateTaskUseCase.execute({
        id,
        userId: user.id,
        title: body.title,
        description: body.description,
        completed: body.completed,
      });
      res.status(200).json(result);
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
      const user = requireUser(req);
      const id = req.params.id as string;
      await deps.deleteTaskUseCase.execute({ id, userId: user.id });
      res.status(204).send();
    }),
  };
}
