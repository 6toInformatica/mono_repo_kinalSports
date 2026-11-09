export const ADMIN_ROLE = 'ADMIN_ROLE';
export const USER_ROLE = 'USER_ROLE';
export const ALLOWED_ROLES: readonly string[] = [ADMIN_ROLE, USER_ROLE];

/** Nombre de rol en mayúsculas si es uno de los permitidos; si no, null */
export const normalizeRole = (roleName: unknown) => {
  const normalized = (typeof roleName === 'string' ? roleName : '')
    .trim()
    .toUpperCase();
  return ALLOWED_ROLES.includes(normalized) ? normalized : null;
};

export const isAdmin = (roles: readonly string[]) => roles.includes(ADMIN_ROLE);
