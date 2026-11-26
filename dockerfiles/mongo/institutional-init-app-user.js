// Primer arranque de MongoDB institucional.
// El entrypoint oficial crea el usuario root y luego ejecuta este script
// con el control de acceso todavía desactivado. En arranques posteriores
// no vuelve a ejecutarse: el volumen ya está inicializado.
//
// El usuario de aplicación solo tiene readWrite sobre la base de la app.
// `db` lo inyecta mongosh al ejecutar este archivo.

/* global db */

const appUser = process.env.MONGO_APP_USERNAME;
const appPassword = process.env.MONGO_APP_PASSWORD;
const appDbName = process.env.MONGO_INITDB_DATABASE;
const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME;

if (!appUser || !appPassword || !appDbName) {
  throw new Error(
    "MONGO_APP_USERNAME, MONGO_APP_PASSWORD y MONGO_INITDB_DATABASE son obligatorios",
  );
}

if (appDbName === "admin" || appDbName === "local" || appDbName === "config") {
  throw new Error("MONGO_INITDB_DATABASE no puede ser admin, local ni config");
}

if (rootUser && appUser === rootUser) {
  throw new Error("MONGO_APP_USERNAME debe ser distinto del usuario root");
}

db.getSiblingDB(appDbName).createUser({
  user: appUser,
  pwd: appPassword,
  roles: [{ role: "readWrite", db: appDbName }],
});
