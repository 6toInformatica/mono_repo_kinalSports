import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module.js';
import { allowedOrigins, type Env } from './config/env.validation.js';
import {
  helmetConfiguration,
  notFoundFallback,
  requestLimit,
} from './config/http.config.js';

const BASE_PATH = 'kinalSportsAdmin/v1';

async function bootstrap() {
  // El cuerpo se parsea después del rate limit, con el límite de 10 MB de antes
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService<Env, true>);

  // Detrás de un proxy (un salto), para que req.ip sea la IP real del cliente
  app.set('trust proxy', 1);

  // CORS solo para los orígenes del panel admin; la app móvil no envía Origin
  app.enableCors({
    origin: allowedOrigins(
      config.get('ADMIN_ALLOWED_ORIGINS', { infer: true })
    ),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  app.use(helmet(helmetConfiguration));
  app.use(requestLimit);
  app.use(morgan('dev'));
  app.useBodyParser('urlencoded', { extended: false, limit: '10mb' });
  app.useBodyParser('json', { limit: '10mb' });

  app.setGlobalPrefix(BASE_PATH);

  app.enableShutdownHooks();

  // Nest responde el 404 solo dentro del prefijo; fuera de él se mantiene el mismo JSON
  await app.init();
  app.use(notFoundFallback);

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(
    `KinalSports Admin Server running on port ${port}. Health check: http://localhost:${port}/${BASE_PATH}/health`,
    'Bootstrap'
  );
}

bootstrap().catch((error: unknown) => {
  console.error(`Error starting Admin Server: ${(error as Error).message}`);
  process.exit(1);
});
