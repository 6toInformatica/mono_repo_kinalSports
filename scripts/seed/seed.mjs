// Carga los datos de prueba en las bases del stack de Docker.
// Uso: pnpm db:seed   (requiere los contenedores levantados)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

const containers = {
  postgres: "pg-kinal-sports",
  mongo: "kinal_mongodb",
  serverAdmin: "kinal_server_admin",
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
  const count = docker([
    "exec",
    containers.postgres,
    "sh",
    "-c",
    'PGPASSWORD="$POSTGRES_PASSWORD" psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "select count(*) from users"',
  ]);
  console.log(`PostgreSQL: ${count} usuarios`);
};

const seedMongo = () => {
  const uri = docker([
    "exec",
    containers.serverAdmin,
    "printenv",
    "URI_MONGODB",
  ]);
  const database = uri.split("/").pop().split("?")[0];
  const script = readFileSync(join(here, "mongo.js"), "utf8");
  const output = docker(
    ["exec", "-i", containers.mongo, "mongosh", "--quiet", database],
    script,
  );
  const totals = output.split("\n").find((line) => line.includes("{")) ?? "";
  console.log(`MongoDB (${database}): ${totals.slice(totals.indexOf("{"))}`);
};

try {
  seedPostgres();
  seedMongo();
  console.log(
    "Datos de prueba cargados. Contraseña de todos los usuarios: Admin1234!",
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
