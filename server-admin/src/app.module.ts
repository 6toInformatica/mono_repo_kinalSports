import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { SecurityModule } from './common/security/security.module.js';
import { type Env, validateEnv } from './config/env.validation.js';
import { FieldsModule } from './fields/fields.module.js';
import { HealthController } from './health/health.controller.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { TournamentsModule } from './tournaments/tournaments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        uri: config.get('URI_MONGODB', { infer: true }),
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      }),
    }),
    SecurityModule,
    IntegrationsModule,
    FieldsModule,
    TeamsModule,
    TournamentsModule,
    ReservationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
