# Client User - App Movil (Expo)

Aplicacion movil para usuarios finales de KinalSports. Permite explorar campos, reservar canchas, gestionar equipos, inscribirse en torneos y administrar el perfil personal.

## Descripcion

App React Native construida con Expo que consume:

- **auth-node** para registro, login, refresh de sesion y tokens JWT
- **server-user** para datos de negocio (campos, reservas, equipos, torneos, perfil)

## Tech Stack

- **Expo** ~55
- **React Native** 0.83
- **React** 19.2
- **React Navigation** (bottom tabs + native stack)
- **Zustand** (estado global + persistencia con SecureStore)
- **Axios** (clientes HTTP)
- **React Hook Form** (formularios)
- **expo-image-picker**, **expo-secure-store**

## Instalacion

```bash
# Desde la raiz del monorepo
pnpm install

# O solo este paquete
pnpm --filter client-user install
```

## Variables de Entorno

Copia el archivo de ejemplo y ajusta las URLs segun tu entorno:

```bash
cp .env.example .env
```

| Variable               | Requerida | Descripcion                             |
| ---------------------- | --------- | --------------------------------------- |
| `EXPO_PUBLIC_AUTH_URL` | Si        | URL base de auth-node (incluye `/auth`) |
| `EXPO_PUBLIC_USER_URL` | Si        | URL base de server-user                 |

Valores por defecto para desarrollo local:

```env
EXPO_PUBLIC_AUTH_URL=http://localhost:3007/api/v1/auth
EXPO_PUBLIC_USER_URL=http://localhost:3008/kinalSportsUser/v1
```

### Notas de conectividad

| Entorno                       | Auth URL tipica                     | User URL tipica                            |
| ----------------------------- | ----------------------------------- | ------------------------------------------ |
| Local (Expo en misma maquina) | `http://localhost:3007/api/v1/auth` | `http://localhost:3008/kinalSportsUser/v1` |
| Emulador Android              | `http://10.0.2.2:3007/api/v1/auth`  | `http://10.0.2.2:3008/kinalSportsUser/v1`  |
| Dispositivo fisico            | IP de tu PC en la red local         | IP de tu PC en la red local                |
| Docker Compose                | segun mapeo de puertos del host     | segun mapeo de puertos del host            |

El archivo `.env` no debe versionarse.

## Scripts

```bash
pnpm --filter client-user start    # Expo dev server (Metro)
pnpm --filter client-user android  # Abrir en emulador/dispositivo Android
pnpm --filter client-user ios      # Abrir en simulador iOS (macOS)
pnpm --filter client-user web      # Version web via Expo
pnpm --filter client-user lint     # ESLint
```

## Estructura

```
client-user/
├── App.jsx
├── app.json
├── src/
│   ├── features/
│   │   ├── auth/           # Login, registro
│   │   ├── fields/         # Listado, detalle, crear reserva
│   │   ├── teams/          # Equipos, mis equipos, crear, detalle
│   │   ├── tournaments/    # Torneos, mis torneos, detalle, inscripcion
│   │   ├── reservations/   # Historial de reservas
│   │   └── profile/        # Perfil, avatar, logout
│   ├── navigation/         # AppNavigator, AuthStack, MainTabs
│   └── shared/
│       ├── api/            # authClient, userClient, tokenRefresh
│       ├── components/
│       ├── constants/      # endpoints, theme
│       └── store/          # authStore (Zustand)
└── assets/
```

## Pantallas y navegacion

### Autenticacion (AuthStack)

| Pantalla       | Descripcion         |
| -------------- | ------------------- |
| LoginScreen    | Inicio de sesion    |
| RegisterScreen | Registro de usuario |

### Tabs principales (MainTabs)

| Tab          | Pantallas                                            |
| ------------ | ---------------------------------------------------- |
| Fields       | FieldsList, FieldDetail, CreateReservation           |
| Teams        | TeamsList, TeamDetail, MyTeams, CreateTeam           |
| Tournaments  | TournamentsList, TournamentDetail, MyTournaments     |
| Reservations | ReservationsList                                     |
| Profile      | ProfileScreen (editar perfil, avatar, cerrar sesion) |

La sesion JWT se refresca al volver a enfocar la app.

## Flujo de autenticacion

1. Login/registro contra `EXPO_PUBLIC_AUTH_URL` (`/login`, `/register`, `/refresh`)
2. Token JWT almacenado via Zustand + SecureStore
3. Peticiones a server-user con header `Authorization: Bearer <token>`
4. Perfil de usuario: `GET/PUT /users/profile` y avatar en server-user (proxy interno a auth-node)

## Dependencias con otros servicios

| Servicio    | Uso                                        |
| ----------- | ------------------------------------------ |
| auth-node   | Login, registro, refresh, logout           |
| server-user | Campos, reservas, equipos, torneos, perfil |

Ambos deben estar corriendo para funcionalidad completa. Ver [README raiz](../README.md) para puertos Docker.

## Docker

El servicio `client-user` esta definido en `docker-compose.yml` con puertos `8081`, `19000`, `19001`, `19002` para Metro y Expo DevTools.

## Autor

**Braulio Echeverria**

## Licencia

MIT
