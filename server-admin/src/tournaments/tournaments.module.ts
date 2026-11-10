import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TOURNAMENT_MODEL,
  TournamentSchema,
} from './schemas/tournament.schema.js';
import { TournamentService } from './tournament.service.js';
import { TournamentsController } from './tournaments.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TOURNAMENT_MODEL, schema: TournamentSchema },
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentService],
})
export class TournamentsModule {}
