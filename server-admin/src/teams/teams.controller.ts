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
import { TeamUpdateGuard } from './team-update.guard.js';
import {
  changeManagerRules,
  createTeamRules,
  removeNamedMemberRules,
  updateTeamRules,
} from './team.rules.js';
import { TeamService, type ListTeamsQuery } from './team.service.js';

type RequestBody = Record<string, unknown>;

const notFound = () =>
  new HttpException({ success: false, message: 'Equipo no encontrado' }, 404);

@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamService) {}

  // Consultas: frontend (JWT) o server-user (token interno)
  @Get()
  @UseGuards(AuthOrInternalGuard)
  async list(@Query() query: ListTeamsQuery) {
    try {
      const { teams, pagination } = await this.teams.list(query);
      return { success: true, data: teams, pagination };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener los equipos'));
    }
  }

  @Get(':id')
  @UseGuards(AuthOrInternalGuard)
  async getById(@Param('id', new ObjectIdPipe()) id: string) {
    let team;
    try {
      team = await this.teams.findById(id);
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener el Equipo'));
    }
    if (!team) throw notFound();
    return { success: true, data: team };
  }

  // Equipo oficial: solo admin. Se autoriza antes de recibir el logo
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ImageUpload('logo'), ValidateRequest(createTeamRules))
  async create(
    @Body() body: RequestBody,
    @UploadedFile() logo?: UploadedImage
  ) {
    try {
      const team = await this.teams.create(body, logo);
      return {
        success: true,
        message: 'Equipo creado correctamente',
        data: team,
      };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al crear el equipo'), 400);
    }
  }

  // Admin, o el capitán de su propio equipo
  @Put(':id')
  @UseGuards(JwtAuthGuard, TeamUpdateGuard)
  @UseInterceptors(ImageUpload('logo'), ValidateRequest(updateTeamRules))
  async update(
    @Param('id') id: string,
    @Body() body: RequestBody,
    @UploadedFile() logo?: UploadedImage
  ) {
    let team;
    try {
      team = await this.teams.update(id, body, logo);
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al actualizar el equipo'),
        400
      );
    }
    if (!team) throw notFound();
    return {
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: team,
    };
  }

  @Put(':id/activate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  activate(@Param('id', new ObjectIdPipe()) id: string) {
    return this.#setActive(id, true);
  }

  @Put(':id/deactivate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  deactivate(@Param('id', new ObjectIdPipe()) id: string) {
    return this.#setActive(id, false);
  }

  @Put(':id/manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ValidateRequest(changeManagerRules))
  async changeManager(@Param('id') id: string, @Body() body: RequestBody) {
    let team;
    try {
      team = await this.teams.changeManager(id, String(body.managerId));
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al actualizar el manager del equipo'),
        400
      );
    }
    if (!team) throw notFound();
    return {
      success: true,
      message: 'Manager del equipo actualizado exitosamente',
      data: team,
    };
  }

  @Post(':id/named-members')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  async addNamedMember(
    @Param('id', new ObjectIdPipe()) id: string,
    @Body() body: RequestBody | undefined
  ) {
    const name = body?.name;
    if (typeof name !== 'string' || !name.trim()) {
      throw new HttpException(
        { success: false, message: 'El nombre del miembro es requerido' },
        400
      );
    }

    let team;
    try {
      team = await this.teams.addNamedMember(id, name);
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al agregar miembro al roster'),
        400
      );
    }
    if (!team) throw notFound();
    return { success: true, message: 'Miembro agregado al roster', data: team };
  }

  @Delete(':id/named-members/:memberId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ValidateRequest(removeNamedMemberRules))
  async removeNamedMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string
  ) {
    let team;
    try {
      team = await this.teams.removeNamedMember(id, memberId);
    } catch (error) {
      throw toHttpError(
        error,
        (e) => ({
          message: e.message || 'Error al eliminar miembro del roster',
        }),
        400
      );
    }
    if (!team) throw notFound();
    return {
      success: true,
      message: 'Miembro eliminado del roster',
      data: team,
    };
  }

  async #setActive(id: string, isActive: boolean) {
    let team;
    try {
      team = await this.teams.setActive(id, isActive);
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al cambiar el estado del equipo')
      );
    }
    if (!team) throw notFound();
    const action = isActive ? 'activado' : 'desactivado';
    return {
      success: true,
      message: `Equipo ${action} exitosamente`,
      data: team,
    };
  }
}
