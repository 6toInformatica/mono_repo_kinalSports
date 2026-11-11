import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface KnownError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { path: string; message: string }>;
}

/**
 * Formato de errores de la API (el mismo de la versión Express):
 * { success: false, message, error?, errors? }.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  readonly #logger = new Logger('AdminServer');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();
    if (res.headersSent) return;

    // Ruta inexistente
    if (exception instanceof NotFoundException) {
      res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Endpoint no encontrado en Admin API',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      // Las respuestas propias ya traen el formato de la API
      if (typeof body === 'object' && 'success' in body) {
        res.status(exception.getStatus()).json(body);
        return;
      }
      // Excepciones de Nest (por ejemplo un JSON mal formado): mismo formato que antes
      const message =
        typeof body === 'object'
          ? (body as { message?: unknown }).message
          : body;
      res.status(exception.getStatus()).json({
        success: false,
        message: Array.isArray(message) ? message.join(', ') : String(message),
        error: 'CUSTOM_ERROR',
      });
      return;
    }

    const err = (exception ?? {}) as KnownError;
    this.#logger.error(
      `Error in Admin Server: ${err.message} (${req.method} ${req.path})`,
      err.stack
    );

    const send = (status: number, body: Record<string, unknown>) =>
      res.status(status).json({ success: false, ...body });

    if (err.name === 'ValidationError' && err.errors) {
      return send(400, {
        message: 'Error de validación',
        errors: Object.values(err.errors).map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    if (err.code === 11000 && err.keyValue) {
      return send(400, {
        message: `${Object.keys(err.keyValue)[0]} ya existe`,
        error: 'DUPLICATE_FIELD',
      });
    }
    if (err.name === 'CastError') {
      return send(400, {
        message: 'Formato de ID inválido',
        error: 'INVALID_ID',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return send(401, { message: 'Token inválido', error: 'INVALID_TOKEN' });
    }
    if (err.name === 'TokenExpiredError') {
      return send(401, { message: 'Token expirado', error: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'MulterError') {
      return send(400, { message: err.message, error: err.code });
    }
    if (err.statusCode) {
      return send(err.statusCode, {
        message: err.message,
        error: err.code || 'CUSTOM_ERROR',
      });
    }

    return send(500, {
      message: 'Error interno del servidor',
      error: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
      }),
    });
  }
}
