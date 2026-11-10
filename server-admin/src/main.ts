import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { helmetConfiguration } from '../legacy/configs/helmet-configuration.js';
import { requestLimit } from '../legacy/middlewares/request-limit.js';
import { createLegacyRouter } from '../legacy/router.js';
import { AppModule } from './app.module.js';
import { allowedOrigins, type Env } from './config/env.validation.js';

const BASE_PATH = 'kinalSportsAdmin/v1';

async function bootstrap() {
  // El cuerpo lo parsean las rutas (10 MB, como antes); Nest no lo hace a nivel global
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

  app.setGlobalPrefix(BASE_PATH);
  // Rutas de la versión Express, todavía no migradas a módulos de Nest
  app.use(`/${BASE_PATH}`, createLegacyRouter());

  app.enableShutdownHooks();

  // Nest responde el 404 solo dentro del prefijo; fuera de él se mantiene el mismo JSON
  await app.init();
  app.use((_req: Request, res: Response) =>
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado en Admin API',
    })
  );

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
