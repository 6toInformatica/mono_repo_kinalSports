/** Usuario de la petición: el del JWT o el servicio interno (x-internal-token) */
export interface AuthenticatedUser {
  id: string;
  role: string;
  jti?: string;
  iat?: number;
}

export const ADMIN_ROLE = 'ADMIN_ROLE';
export const USER_ROLE = 'USER_ROLE';

/** Identidad asignada a las llamadas entre servicios con el token interno */
export const INTERNAL_SERVICE_USER: AuthenticatedUser = {
  id: 'SYSTEM_USER',
  role: 'INTERNAL_SERVICE',
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Lo asignan JwtAuthGuard y AuthOrInternalGuard */
      user?: AuthenticatedUser;
    }
  }
}
