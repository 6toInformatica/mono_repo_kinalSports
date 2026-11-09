/**
 * Errores de negocio tipados. Cada uno conoce su status HTTP, así la capa de interfaz
 * ya no tiene que deducirlo buscando palabras dentro del mensaje.
 */
export abstract class AppError extends Error {
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400: datos o estado que no permiten la operación */
export class BadRequestError extends AppError {
  readonly status = 400;
}

/** 401: credenciales o tokens inválidos o vencidos */
export class UnauthorizedError extends AppError {
  readonly status = 401;
}

/** 404: el recurso no existe */
export class NotFoundError extends AppError {
  readonly status = 404;
}

/** 409: conflicto con datos existentes */
export class ConflictError extends AppError {
  readonly status = 409;
}

/** 423: la cuenta está desactivada */
export class LockedError extends AppError {
  readonly status = 423;
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
