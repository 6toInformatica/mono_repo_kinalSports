import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { toHttpError, withDetail } from '../common/http-errors.js';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe.js';
import { AuthOrInternalGuard } from '../common/security/auth-or-internal.guard.js';
import { ADMIN_ROLE } from '../common/security/authenticated-user.js';
import { JwtAuthGuard } from '../common/security/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../common/security/roles.js';
import {
  ImageUpload,
  type UploadedImage,
} from '../common/upload/image-upload.interceptor.js';
import { ValidateRequest } from '../common/validation/validate-request.interceptor.js';
import {
  TOURNAMENT_ID_MESSAGE,
  createTournamentRules,
  updateTournamentRules,
} from './tournament.rules.js';
import {
  TournamentService,
  type ListTournamentsQuery,
} from './tournament.service.js';

type RequestBody = Record<string, unknown>;

const tournamentId = () => new ObjectIdPipe(TOURNAMENT_ID_MESSAGE);
const notFound = () =>
  new HttpException({ success: false, message: 'Torneo no encontrado' }, 404);

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournaments: TournamentService) {}

  // Consultas: frontend (JWT) o server-user (token interno)
  @Get()
  @UseGuards(AuthOrInternalGuard)
  async list(@Query() query: ListTournamentsQuery) {
    try {
      const { tournaments, pagination } = await this.tournaments.list(query);
      return { success: true, data: tournaments, pagination };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener los torneos'));
    }
  }

  @Get(':id')
  @UseGuards(AuthOrInternalGuard)
  async getById(@Param('id', tournamentId()) id: string) {
    let tournament;
    try {
      tournament = await this.tournaments.findById(id);
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener el torneo'));
    }
    if (!tournament) throw notFound();
    return { success: true, data: tournament };
  }

  // Escritura: solo admin. Se autoriza antes de recibir el logo
  @Post()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ImageUpload('logo'), ValidateRequest(createTournamentRules))
  async create(
    @Body() body: RequestBody,
    @UploadedFile() logo?: UploadedImage
  ) {
    try {
      return { success: true, data: await this.tournaments.create(body, logo) };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al crear el torneo'));
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ImageUpload('logo'), ValidateRequest(updateTournamentRules))
  async update(
    @Param('id') id: string,
    @Body() body: RequestBody,
    @UploadedFile() logo?: UploadedImage
  ) {
    let tournament;
    try {
      tournament = await this.tournaments.update(id, body, logo);
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al actualizar el torneo'),
        400
      );
    }
    if (!tournament) throw notFound();
    return { success: true, data: tournament };
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  activate(@Param('id', tournamentId()) id: string) {
    return this.#setActive(id, true);
  }

  @Put(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  deactivate(@Param('id', tournamentId()) id: string) {
    return this.#setActive(id, false);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  async delete(@Param('id', tournamentId()) id: string) {
    let tournament;
    try {
      tournament = await this.tournaments.delete(id);
    } catch (error) {
      throw toHttpError(error, withDetail('Error al eliminar el torneo'));
    }
    if (!tournament) throw notFound();
    return {
      success: true,
      message: 'Torneo eliminado exitosamente',
      data: tournament,
    };
  }

  async #setActive(id: string, isActive: boolean) {
    let tournament;
    try {
      tournament = await this.tournaments.setActive(id, isActive);
    } catch (error) {
      // El mensaje empieza en minúscula, igual que en la versión anterior
      throw toHttpError(
        error,
        withDetail('error al cambiar el estado del torneo')
      );
    }
    if (!tournament) throw notFound();
    const action = isActive ? 'activado' : 'desactivado';
    return {
      success: true,
      message: `Torneo ${action} exitosamente`,
      data: tournament,
    };
  }
}
