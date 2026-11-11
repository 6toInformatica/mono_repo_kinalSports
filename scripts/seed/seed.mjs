// Carga los datos iniciales en las bases del stack de Docker.
// Uso: pnpm db:seed    (requiere los contenedores levantados)
//      pnpm db:reset   (borra todos los datos y vuelve a cargarlos)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const containers = {
  postgres: "pg-kinal-sports",
  mongo: "kinal_mongodb",
  serverAdmin: "kinal_server_admin",
  authService: "kinal_auth_service",
};

const docker = (args, input) => {
  const result = spawnSync("docker", args, { input, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `docker ${args.slice(0, 3).join(" ")} falló:\n${result.stderr || result.stdout}`,
    );
  }
  return result.stdout.trim();
};

const psql = (command) =>
  docker([
    "exec",
    containers.postgres,
    "sh",
    "-c",
    `PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "${command}"`,
  ]);

const mongoDatabase = () => {
  const uri = docker([
    "exec",
    containers.serverAdmin,
    "printenv",
    "URI_MONGODB",
  ]);
  return uri.split("/").pop().split("?")[0];
};

/**
 * Borra todos los usuarios (los roles se conservan) y los documentos de MongoDB.
 * Luego reinicia auth-service, que crea el usuario "admin" cuando no hay usuarios.
 */
const reset = async () => {
  psql("TRUNCATE users, refresh_tokens CASCADE");
  docker([
    "exec",
    containers.mongo,
    "mongosh",
    "--quiet",
    mongoDatabase(),
    "--eval",
    'db.getCollectionNames().filter((c) => !c.startsWith("system.")).forEach((c) => db[c].deleteMany({}))',
  ]);
  docker(["restart", containers.authService]);

  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(3000);
    const health = docker([
      "inspect",
      "-f",
      "{{.State.Health.Status}}",
      containers.authService,
    ]);
    if (
      health === "healthy" &&
      psql("select count(*) from users where username = 'admin'") === "1"
    ) {
      console.log("Bases limpias; auth-service recreó el usuario admin");
      return;
    }
  }
  throw new Error("auth-service no recreó el usuario admin a tiempo");
};

const seedPostgres = () => {
  const sql = readFileSync(join(here, "users.sql"), "utf8");
  docker(
    [
      "exec",
      "-i",
      containers.postgres,
      "sh",
      "-c",
      'PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"',
    ],
    sql,
  );
  console.log(`PostgreSQL: ${psql("select count(*) from users")} usuarios`);
};

const seedMongo = () => {
  const database = mongoDatabase();
  const script = readFileSync(join(here, "mongo.js"), "utf8");
  const output = docker(
    ["exec", "-i", containers.mongo, "mongosh", "--quiet", database],
    script,
  );
  const totals = output.split("\n").find((line) => line.includes("{")) ?? "";
  console.log(`MongoDB (${database}): ${totals.slice(totals.indexOf("{"))}`);
};

try {
  if (process.argv.includes("--reset")) await reset();
  seedPostgres();
  seedMongo();
  console.log(
    "Datos cargados. Contraseña de desarrollo de todos los usuarios: Admin1234!",
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
