import { config } from './config/env.ts';
import { buildApp } from './app.ts';
import {
  closeDatabase,
  connectDatabase,
} from './infrastructure/database/prisma.ts';
import { roleRepository } from './modules/roles/infrastructure/role.repository.ts';

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const start = async () => {
  await connectDatabase();
  // Datos esenciales (roles)
  await roleRepository.seedRoles();

  const app = await buildApp(config);
  app.addHook('onClose', async () => closeDatabase());

  // Apagado ordenado: deja de aceptar peticiones, termina las activas y cierra la base
  let closing = false;
  const shutdown = (signal: string) => {
    if (closing) return;
    closing = true;
    app.log.info(`Received ${signal}. Shutting down...`);
    app
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        app.log.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      });
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2'] as const) {
    process.once(signal, () => shutdown(signal));
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(
    `KinalSports Auth Server running. Health check: http://localhost:${config.port}${config.basePath}/health`
  );
};

start().catch((error: unknown) => {
  console.error(`Error starting Auth Server: ${(error as Error).message}`);
  process.exit(1);
});
