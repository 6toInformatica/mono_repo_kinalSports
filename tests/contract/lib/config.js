// URLs de los servicios bajo prueba. Se pueden sobrescribir por variable de entorno.
const env = (name, fallback) => process.env[name] || fallback;

export const urls = {
  authNode: env("CONTRACT_AUTH_NODE_URL", "http://localhost:3007/api/v1"),
  authService: env("CONTRACT_AUTH_SERVICE_URL", "http://localhost:5156/api/v1"),
  authServiceRoot: env("CONTRACT_AUTH_SERVICE_ROOT", "http://localhost:5156"),
  admin: env("CONTRACT_ADMIN_URL", "http://localhost:3009/kinalSportsAdmin/v1"),
  user: env("CONTRACT_USER_URL", "http://localhost:3008/kinalSportsUser/v1"),
  mailpit: env("CONTRACT_MAILPIT_URL", "http://localhost:8025"),
};

// Usuarios creados por scripts/seed (todos con la misma contraseña de prueba)
export const PASSWORD = "Admin1234!";
export const users = {
  admin: "admin",
  user: "luis.garcia",
  manager: "andrea.morales",
  other: "valeria.lopez",
};
export const seededUserIds = {
  manager: "usr_SeedUser0002",
  other: "usr_SeedUser0008",
};
