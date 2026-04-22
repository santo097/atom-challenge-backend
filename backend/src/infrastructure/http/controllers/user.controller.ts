import type { Request, Response } from 'express';
import type { CreateUserUseCase, FindUserByEmailUseCase } from '@application/use-cases/users';
import { asyncHandler } from './async-handler';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function userController(deps: {
  findUserByEmailUseCase: FindUserByEmailUseCase;
  createUserUseCase: CreateUserUseCase;
}) {
  return {
    findByEmail: asyncHandler(async (req: Request, res: Response) => {
      const email = req.params.email as string;
      const result = await deps.findUserByEmailUseCase.execute(email);
      res.status(200).json(result);
    }),

    create: asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body as { email: string };
      const result = await deps.createUserUseCase.execute(email);
      res.status(201).json(result);
    }),
  };
}
