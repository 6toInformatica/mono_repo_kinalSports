import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FIELD_MODEL, FieldSchema } from '../fields/schemas/field.schema.js';
import { ReservationEnricher } from './reservation.enricher.js';
import { ReservationRepository } from './reservation.repository.js';
import { ReservationService } from './reservation.service.js';
import { ReservationsController } from './reservations.controller.js';
import {
  RESERVATION_MODEL,
  ReservationSchema,
} from './schemas/reservation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RESERVATION_MODEL, schema: ReservationSchema },
      // Para incluir los datos de la cancha en cada reserva
      { name: FIELD_MODEL, schema: FieldSchema },
    ]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationRepository, ReservationService, ReservationEnricher],
})
export class ReservationsModule {}
