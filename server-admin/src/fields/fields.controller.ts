import {
  Body,
  Controller,
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
import { createFieldRules, updateFieldRules } from './field.rules.js';
import { FieldService, type ListFieldsQuery } from './field.service.js';

const notFound = () =>
  new HttpException({ success: false, message: 'Campo no encontrado' }, 404);

@Controller('fields')
export class FieldsController {
  constructor(private readonly fields: FieldService) {}

  // Consultas: frontend (JWT) o server-user (token interno)
  @Get()
  @UseGuards(AuthOrInternalGuard)
  async list(@Query() query: ListFieldsQuery) {
    try {
      const { fields, pagination } = await this.fields.list(query);
      return { success: true, data: fields, pagination };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener los campos'));
    }
  }

  @Get(':id')
  @UseGuards(AuthOrInternalGuard)
  async getById(@Param('id', new ObjectIdPipe()) id: string) {
    let field;
    try {
      field = await this.fields.findById(id);
    } catch (error) {
      throw toHttpError(error, withDetail('Error al obtener el campo'));
    }
    if (!field) throw notFound();
    return { success: true, data: field };
  }

  // Escritura: solo admin. Se autoriza antes de recibir la imagen
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ImageUpload('image'), ValidateRequest(createFieldRules))
  async create(
    @Body() body: Record<string, unknown>,
    @UploadedFile() image?: UploadedImage
  ) {
    try {
      const field = await this.fields.create(body, image);
      return {
        success: true,
        message: 'Campo creado exitosamente',
        data: field,
      };
    } catch (error) {
      throw toHttpError(error, withDetail('Error al crear el campo'), 400);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ADMIN_ROLE)
  @UseInterceptors(ImageUpload('image'), ValidateRequest(updateFieldRules))
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() image?: UploadedImage
  ) {
    let field;
    try {
      field = await this.fields.update(id, body, image);
    } catch (error) {
      throw toHttpError(error, withDetail('Error al actualizar el campo'), 400);
    }
    if (!field) throw notFound();
    return {
      success: true,
      message: 'Campo actualizado exitosamente',
      data: field,
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

  async #setActive(id: string, isActive: boolean) {
    let field;
    try {
      field = await this.fields.setActive(id, isActive);
    } catch (error) {
      throw toHttpError(
        error,
        withDetail('Error al cambiar el estado del campo')
      );
    }
    if (!field) throw notFound();
    const action = isActive ? 'activado' : 'desactivado';
    return {
      success: true,
      message: `Campo ${action} exitosamente`,
      data: field,
    };
  }
}
