import type { Request, Response } from 'express';
import type { LoginUseCase, RegisterUseCase } from '@application/use-cases/auth';
import { asyncHandler } from './async-handler';

/**
 * Controllers de autenticación.
 *
 * Se exponen como objetos con closures de use cases para mantener la
 * inyección de dependencias limpia. El composition root crea estos
 * controllers pasándoles los casos de uso instanciados.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function authController(deps: {
  loginUseCase: LoginUseCase;
  registerUseCase: RegisterUseCase;
}) {
  return {
    login: asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body as { email: string };
      const result = await deps.loginUseCase.execute(email);
      res.status(200).json(result);
    }),

    register: asyncHandler(async (req: Request, res: Response) => {
      const { email } = req.body as { email: string };
      const result = await deps.registerUseCase.execute(email);
      res.status(201).json(result);
    }),
  };
}
