import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TEAM_MODEL, TeamSchema } from './schemas/team.schema.js';
import { TeamUpdateGuard } from './team-update.guard.js';
import { TeamService } from './team.service.js';
import { TeamsController } from './teams.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TEAM_MODEL, schema: TeamSchema }]),
  ],
  controllers: [TeamsController],
  providers: [TeamService, TeamUpdateGuard],
})
export class TeamsModule {}
