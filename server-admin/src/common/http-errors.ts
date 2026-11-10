import { HttpException, HttpStatus } from '@nestjs/common';
import { isAppError } from './errors.js';

/**
 * Convierte un error en la respuesta HTTP del controlador:
 * - error de negocio → su status con { success: false, message, ...details }
 * - cualquier otro → `fallbackStatus` con el cuerpo que arma `fallbackBody`
 */
export const toHttpError = (
  error: unknown,
  fallbackBody: (error: Error) => Record<string, unknown>,
  fallbackStatus = HttpStatus.INTERNAL_SERVER_ERROR
) => {
  if (error instanceof HttpException) return error;
  if (isAppError(error)) {
    return new HttpException(
      { success: false, message: error.message, ...error.details },
      error.status
    );
  }
  return new HttpException(
    { success: false, ...fallbackBody(error as Error) },
    fallbackStatus
  );
};

/** Cuerpo de error habitual: mensaje fijo y el detalle técnico en `error` */
export const withDetail = (message: string) => (error: Error) => ({
  message,
  error: error.message,
});
