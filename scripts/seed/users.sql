-- Usuarios iniciales de Kinal Sports (PostgreSQL, tablas de autenticación).
-- Contraseña de desarrollo para todos: "Admin1234!" (hash Argon2id compatible con auth-service y auth-node).
-- Es idempotente: se puede ejecutar varias veces sin duplicar datos.
-- Requiere que los roles ADMIN_ROLE y USER_ROLE existan (los crean los servicios de auth al arrancar).
-- El usuario "admin" lo crea auth-service al arrancar con la base vacía.

BEGIN;

CREATE TEMP TABLE seed_users (
  n text, id text, name text, surname text, username text, email text, phone text, role text
) ON COMMIT DROP;

INSERT INTO seed_users VALUES
  ('01', 'usr_SeedUser0001', 'Roberto', 'Juárez', 'roberto.juarez', 'roberto.juarez@kinalsports.gt', '55231478', 'ADMIN_ROLE'),
  ('02', 'usr_SeedUser0002', 'Andrea', 'Morales', 'andrea.morales', 'andrea.morales@kinalsports.gt', '42178935', 'USER_ROLE'),
  ('03', 'usr_SeedUser0003', 'José', 'Pérez', 'jose.perez', 'jose.perez@kinalsports.gt', '31846250', 'USER_ROLE'),
  ('04', 'usr_SeedUser0004', 'Daniela', 'Rodríguez', 'daniela.rodriguez', 'daniela.rodriguez@kinalsports.gt', '58402716', 'USER_ROLE'),
  ('05', 'usr_SeedUser0005', 'Fernando', 'Castillo', 'fernando.castillo', 'fernando.castillo@kinalsports.gt', '47715382', 'USER_ROLE'),
  ('06', 'usr_SeedUser0006', 'Gabriela', 'Méndez', 'gabriela.mendez', 'gabriela.mendez@kinalsports.gt', '33029467', 'USER_ROLE'),
  ('07', 'usr_SeedUser0007', 'Javier', 'Ramírez', 'javier.ramirez', 'javier.ramirez@kinalsports.gt', '50963184', 'USER_ROLE'),
  ('08', 'usr_SeedUser0008', 'Valeria', 'López', 'valeria.lopez', 'valeria.lopez@kinalsports.gt', '45287103', 'USER_ROLE'),
  ('09', 'usr_SeedUser0009', 'Diego', 'Hernández', 'diego.hernandez', 'diego.hernandez@kinalsports.gt', '36514829', 'USER_ROLE'),
  ('10', 'usr_SeedUser0010', 'Mariana', 'Ortiz', 'mariana.ortiz', 'mariana.ortiz@kinalsports.gt', '59870241', 'USER_ROLE'),
  ('11', 'usr_SeedUser0011', 'Luis', 'García', 'luis.garcia', 'luis.garcia@kinalsports.gt', '41392657', 'USER_ROLE'),
  ('12', 'usr_SeedUser0012', 'Alejandra', 'Cifuentes', 'alejandra.cifuentes', 'alejandra.cifuentes@kinalsports.gt', '32658014', 'USER_ROLE');

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
