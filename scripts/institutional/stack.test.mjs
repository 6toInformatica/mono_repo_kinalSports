import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const compose = readFileSync(
  join(root, "docker-compose.institutional.yml"),
  "utf8",
);
const gateway = readFileSync(
  join(root, "dockerfiles/nginx/institutional-gateway.conf"),
  "utf8",
);

const serviceBlock = (name) => {
  const start = compose.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, `falta el servicio ${name}`);
  const rest = compose.slice(start + 1);
  const next = rest.search(/\n {2}[a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
};

test("server-user reutiliza mongo de aplicación, redis y auth sin puerto en el host", () => {
  const block = serviceBlock("server-user");
  assert.match(block, /container_name: kinal_inst_server_user/);
  assert.match(block, /target: runtime/);
  assert.doesNotMatch(block, /\n {4}ports:/);
  assert.match(
    block,
    /URI_MONGODB: mongodb:\/\/\$\{MONGO_APP_USERNAME\}:\$\{MONGO_APP_PASSWORD\}@mongodb:27017\/\$\{MONGO_DB_NAME:-kinalSports\}\?authSource=\$\{MONGO_DB_NAME:-kinalSports\}/,
  );
  assert.doesNotMatch(block, /MONGO_INITDB_ROOT/);
  assert.match(block, /JWT_SECRET: \$\{JWT_SECRET\}/);
  assert.match(block, /JWT_ISSUER: \$\{JWT_ISSUER:-AuthService\}/);
  assert.match(block, /JWT_AUDIENCE: \$\{JWT_AUDIENCE:-AuthService\}/);
  assert.match(
    block,
    /AUTH_NODE_URL: \$\{AUTH_NODE_URL:-http:\/\/auth-node:3007\/api\/v1\}/,
  );
  assert.match(block, /INTERNAL_SERVICE_TOKEN: \$\{INTERNAL_SERVICE_TOKEN\}/);
  assert.match(block, /REDIS_URL: \$\{REDIS_URL:-redis:\/\/redis:6379\}/);
  assert.match(block, /ALLOWED_ORIGINS: \$\{ALLOWED_ORIGINS\}/);
  assert.match(
    block,
    /CLOUDINARY_TEAMS_FOLDER: \$\{CLOUDINARY_TEAMS_FOLDER:-kinal_sports\/teams\}/,
  );
  assert.doesNotMatch(block, /CLOUDINARY_FOLDER:/);
  assert.match(block, /kinalSportsUser\/v1\/health/);
  assert.match(compose, /inst_mongo_data:/);
  assert.match(compose, /inst_postgres18_data:/);
});

test("el gateway conserva auth y admin y reenvía el prefijo de server-user", () => {
  assert.match(gateway, /location \/api\/v1\/ \{/);
  assert.match(gateway, /set \$auth_upstream http:\/\/auth-node:3007;/);
  assert.match(gateway, /location \/kinalSportsAdmin\/v1\/ \{/);
  assert.match(gateway, /set \$admin_upstream http:\/\/server-admin:3009;/);
  assert.match(gateway, /location = \/api\/v1\/auth\/profile\/by-id \{/);
  assert.match(gateway, /location = \/api\/v1\/auth\/profile\/by-username \{/);

  const user = gateway.slice(gateway.indexOf("location /kinalSportsUser/v1/"));
  const userBlock = user.slice(0, user.indexOf("\n  }\n"));
  assert.match(userBlock, /set \$user_upstream http:\/\/server-user:3008;/);
  assert.match(userBlock, /client_max_body_size 15m;/);
  assert.match(userBlock, /proxy_pass \$user_upstream;/);
  assert.doesNotMatch(userBlock, /proxy_pass \$user_upstream\//);

  const gatewayService = serviceBlock("institutional-gateway");
  assert.match(gatewayService, /server-user:/);
  assert.match(
    gatewayService,
    /127\.0\.0\.1:\$\{INST_GATEWAY_PORT:-33001\}:8080/,
  );
});
