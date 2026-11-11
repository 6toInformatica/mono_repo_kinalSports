import {
  type ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';

/** Respuesta de validación igual a la de express-validator: errores por campo */
export const validationError = (errors: { field: string; message: string }[]) =>
  new HttpException(
    { success: false, message: 'Errores de validación', errors },
    HttpStatus.BAD_REQUEST
  );

/** ObjectId de 24 caracteres hex (lo mismo que acepta isMongoId) */
export const isObjectIdString = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-fA-F]{24}$/.test(value) &&
  isValidObjectId(value) &&
  Types.ObjectId.isValid(value);

/** Valida un parámetro de ruta como ObjectId de MongoDB */
@Injectable()
export class ObjectIdPipe implements PipeTransform<string, string> {
  constructor(
    private readonly message = 'ID debe ser un ObjectId válido de MongoDB'
  ) {}

  transform(value: string, metadata: ArgumentMetadata) {
    if (!isObjectIdString(value)) {
      throw validationError([
        { field: metadata.data ?? 'id', message: this.message },
      ]);
    }
    return value;
  }
}
