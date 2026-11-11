'use strict';

/**
 * Errores de negocio tipados. Los servicios los lanzan con su status HTTP y los
 * controladores responden con él, sin buscar palabras dentro del mensaje.
 */
export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {object} [details] campos extra que se agregan a la respuesta
   */
  constructor(message, status, details = undefined) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message, details) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message, details) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(message, 409, details);
  }
}

export const isAppError = (error) => error instanceof AppError;

/**
 * Respuesta de error de un controlador:
 * - error de negocio → su status con { success: false, message, ...details }
 * - cualquier otro → `fallbackStatus` con el cuerpo que arma `fallbackBody`
 */
export const sendError = (
  res,
  error,
  { fallbackStatus = 500, fallbackBody, log } = {}
) => {
  if (isAppError(error)) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      ...error.details,
    });
  }

  if (log) console.error(log, error);
  return res
    .status(fallbackStatus)
    .json(fallbackBody ? fallbackBody(error) : { success: false });
};
