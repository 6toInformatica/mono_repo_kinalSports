-- Usuarios de prueba para desarrollo local (PostgreSQL, tablas de autenticación).
-- Todos usan la contraseña de prueba "Admin1234!" (hash Argon2id compatible con auth-service y auth-node).
-- Es idempotente: se puede ejecutar varias veces sin duplicar datos.
-- Requiere que los roles ADMIN_ROLE y USER_ROLE existan (los crean los servicios de auth al arrancar).

BEGIN;

CREATE TEMP TABLE seed_users (
  n text, id text, name text, surname text, username text, email text, phone text, role text
) ON COMMIT DROP;

INSERT INTO seed_users VALUES
  ('E2E', 'usr_E2eTestUser1', 'Prueba', 'E2E', 'PruebaE2E', 'prueba.e2e@ksports.local', '12345678', 'USER_ROLE'),
  ('01', 'usr_SeedUser0001', 'Carlos', 'Mendoza', 'carlos.mendoza', 'carlos.mendoza@kinalsports.test', '55510001', 'ADMIN_ROLE'),
  ('02', 'usr_SeedUser0002', 'Ana', 'Lopez', 'ana.lopez', 'ana.lopez@kinalsports.test', '55510002', 'USER_ROLE'),
  ('03', 'usr_SeedUser0003', 'Diego', 'Ramirez', 'diego.ramirez', 'diego.ramirez@kinalsports.test', '55510003', 'USER_ROLE'),
  ('04', 'usr_SeedUser0004', 'Sofia', 'Garcia', 'sofia.garcia', 'sofia.garcia@kinalsports.test', '55510004', 'USER_ROLE'),
  ('05', 'usr_SeedUser0005', 'Luis', 'Herrera', 'luis.herrera', 'luis.herrera@kinalsports.test', '55510005', 'USER_ROLE'),
  ('06', 'usr_SeedUser0006', 'Maria', 'Castillo', 'maria.castillo', 'maria.castillo@kinalsports.test', '55510006', 'USER_ROLE'),
  ('07', 'usr_SeedUser0007', 'Jose', 'Morales', 'jose.morales', 'jose.morales@kinalsports.test', '55510007', 'USER_ROLE'),
  ('08', 'usr_SeedUser0008', 'Lucia', 'Perez', 'lucia.perez', 'lucia.perez@kinalsports.test', '55510008', 'USER_ROLE');

INSERT INTO users (id, name, surname, username, email, password, status, created_at, updated_at)
SELECT id, name, surname, username, email,
       '$argon2id$v=19$m=102400,t=2,p=8$mRyXBHRdsRK7ocCjSYKYog==$y8anYun/rVdeO8OsC/baakbUrOFgFTXk3MgHSGiCCNY=',
       true, now(), now()
FROM seed_users
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, user_id, profile_picture, phone)
SELECT 'usr_SeedProf' || lpad(n, 4, '0'), id, '', phone FROM seed_users s
WHERE NOT EXISTS (SELECT 1 FROM user_profiles p WHERE p.user_id = s.id);

INSERT INTO user_emails (id, user_id, email_verified)
SELECT 'usr_SeedMail' || lpad(n, 4, '0'), id, true FROM seed_users s
WHERE NOT EXISTS (SELECT 1 FROM user_emails e WHERE e.user_id = s.id);

INSERT INTO user_password_resets (id, user_id)
SELECT 'usr_SeedRset' || lpad(n, 4, '0'), id FROM seed_users s
WHERE NOT EXISTS (SELECT 1 FROM user_password_resets pr WHERE pr.user_id = s.id);

INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
SELECT 'usr_SeedRole' || lpad(n, 4, '0'), s.id, r.id, now(), now()
FROM seed_users s
JOIN roles r ON r.name = s.role
WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = s.id);

COMMIT;
