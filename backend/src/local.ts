import 'dotenv/config';
import { bootstrap } from '@infrastructure/config';

/**
 * Servidor de desarrollo local.
 *
 * Ejecutar con: npm run dev
 * Escucha en PORT (default 3000).
 *
 * Esto NO se despliega a Cloud Functions — solo se usa en local para
 * no depender del emulador de Firebase mientras se desarrolla.
 */

const { app, container } = bootstrap();
const port = container.env.PORT;

app.listen(port, () => {
  container.logger.info(`Backend listening on http://localhost:${port}`, {
    env: container.env.NODE_ENV,
    cors: container.env.CORS_ORIGINS,
  });
});
