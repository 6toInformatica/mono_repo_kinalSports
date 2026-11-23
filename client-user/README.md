# Client User — Aplicacion Movil (React Native + Expo)

Aplicacion movil multiplataforma (Android / iOS) para los usuarios finales de KinalSports construida con **React Native 0.88**, **Expo SDK 58**, **React Navigation 7** y **Zustand 5**.

---

## 1. Rol en la Arquitectura

- Permite a los deportistas y capitanes de equipo **registrarse, iniciar sesion, explorar canchas disponibles, reservar horarios, crear y unirse a equipos, administrar miembros, inscribirse en torneos y actualizar su foto de perfil**.
- Consume directamente `auth-node` (puerto `3007`) para autenticacion y `server-user` (puerto `3008`) para todas las operaciones de negocio.

---

## 2. Stack Tecnologico

- **Framework Movil:** Expo `~58.0`, React Native `0.88.1`, React `19.3`
- **Navegacion y Estado:** `@react-navigation/native` 7 (Native Stack + Bottom Tabs), Zustand 5
- **Almacenamiento Seguro:** `expo-secure-store` (Keychain en iOS / Keystore cifrado en Android)
- **Formularios y Multimedia:** React Hook Form 7, `expo-image-picker`, `@react-native-community/datetimepicker`
- **Pruebas:** Jest 30 + `jest-expo` + `@testing-library/react-native`

---

## 3. Estructura del Proyecto

```
client-user/
├── App.jsx                         # Punto de entrada y restauracion de sesion
├── app.json                        # Configuracion de Expo
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.jsx        # Conmutador entre AuthStack y MainTabs segun sesion
│   │   ├── AuthStack.jsx           # Pantallas de Login y Registro
│   │   └── MainTabs.jsx            # Navegacion inferior (Canchas, Equipos, Torneos, Reservas, Perfil)
│   ├── features/
│   │   ├── auth/                   # LoginScreen y RegisterScreen
│   │   ├── fields/                 # Listado de canchas, detalle y creacion de reservaciones
│   │   ├── teams/                  # Exploracion, mis equipos, creacion, detalle y gestion de miembros
│   │   ├── tournaments/            # Listado de torneos, detalle e inscripcion de equipo
│   │   ├── reservations/           # Mis reservaciones activas, historial y cancelacion
│   │   └── profile/                # Vista de perfil, cambio de avatar y cierre de sesion
│   └── shared/
│       ├── api/                    # Clientes Axios (authClient, userClient) y tokenRefresh
│       ├── components/             # Botones, tarjetas, inputs y modales reutilizables
│       ├── constants/              # Endpoints y paleta de colores
│       ├── store/                  # authStore (Zustand conectado a expo-secure-store)
│       └── utils/                  # Formateo de fechas, monedas e imagenes
├── .env.example
└── package.json
```

---

## 4. Instalacion y Puesta en Marcha

### Opcion A: Desde la raiz del monorepo

```bash
pnpm install
cp client-user/.env.example client-user/.env
pnpm --filter client-user start
```

### Opcion B: Como paquete individual

```bash
cd client-user
pnpm install
cp .env.example .env
pnpm start
```

---

## 5. Variables de Entorno (`.env`)

Copia `.env.example` a `.env` y ajusta la IP segun donde ejecutes la app:

```env
EXPO_PUBLIC_AUTH_URL=http://10.0.2.2:3007/api/v1/auth
EXPO_PUBLIC_USER_URL=http://10.0.2.2:3008/kinalSportsUser/v1
```

| Entorno de Prueba                         | `EXPO_PUBLIC_AUTH_URL`                      | `EXPO_PUBLIC_USER_URL`                             |
| :---------------------------------------- | :------------------------------------------ | :------------------------------------------------- |
| **Emulador Android** (`10.0.2.2` = host)  | `http://10.0.2.2:3007/api/v1/auth`          | `http://10.0.2.2:3008/kinalSportsUser/v1`          |
| **Simulador iOS / Misma Maquina**         | `http://localhost:3007/api/v1/auth`         | `http://localhost:3008/kinalSportsUser/v1`         |
| **Dispositivo Fisico (Expo Go en Wi-Fi)** | `http://<IP_LAN_DE_TU_PC>:3007/api/v1/auth` | `http://<IP_LAN_DE_TU_PC>:3008/kinalSportsUser/v1` |

---

## 6. Scripts Disponibles

```bash
pnpm --filter client-user start         # Inicia Metro Bundler
pnpm --filter client-user android       # Abre en emulador/dispositivo Android
pnpm --filter client-user ios           # Abre en simulador iOS
pnpm --filter client-user web           # Inicia version web de Expo
pnpm --filter client-user test          # Ejecuta las 21 pruebas unitarias con Jest
pnpm --filter client-user lint          # Ejecuta ESLint
```

---

## 7. Seguridad de Sesion: `expo-secure-store` (Movil) vs Cookies `httpOnly` (Web)

> **Nota pedagogica para clase:**
>
> - En los paneles **Web** (`client-admin` y `client-admin-next`), los tokens se manejan mediante **cookies `httpOnly`** porque `window.localStorage` es vulnerable a ataques XSS en el navegador.
> - En una aplicacion **Movil Nativa** (`client-user`), no existe DOM web ni el mismo modelo de cookies de navegador: el estandar de seguridad movil consiste en recibir el `accessToken` y `refreshToken` y resguardarlos en el almacenamiento nativo cifrado del sistema operativo (**Keychain en iOS** y **EncryptedSharedPreferences / Keystore en Android**) mediante **`expo-secure-store`**.

1. Al iniciar sesion (`POST /api/v1/auth/login`), `authStore` guarda los tokens en `expo-secure-store`.
2. Cada peticion a `server-user` incluye `Authorization: Bearer <accessToken>`.
3. Si el `accessToken` vence (`401`), `tokenRefresh.js` renueva la sesion con `POST /api/v1/auth/refresh` usando una unica promesa compartida para todas las peticiones simultaneas.

---

## 8. Pantallas Principales

| Modulo            | Pantallas                                              | Funcionalidades Clave                                                                  |
| :---------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Autenticacion** | `LoginScreen`, `RegisterScreen`                        | Inicio de sesion y registro con validacion de formularios.                             |
| **Canchas**       | `FieldsList`, `FieldDetail`, `CreateReservation`       | Exploracion de canchas, consulta de disponibilidad por fecha y reserva de 1 a 3 horas. |
| **Equipos**       | `TeamsList`, `MyTeams`, `CreateTeam`, `TeamDetail`     | Creacion de equipo con logo, unirse/salir y gestion de miembros por el capitan.        |
| **Torneos**       | `TournamentsList`, `MyTournaments`, `TournamentDetail` | Consulta de torneos activos e inscripcion de equipos de la misma categoria.            |
| **Reservas**      | `ReservationsList`                                     | Consulta de reservas activas, historial y cancelacion antes de la hora de inicio.      |
| **Perfil**        | `ProfileScreen`                                        | Visualizacion de datos, subida de foto de perfil/avatar y cierre de sesion.            |

---

## 9. Integracion con Otros Servicios

| Servicio      | Relacion                                                                         |
| :------------ | :------------------------------------------------------------------------------- |
| `auth-node`   | Registro, login, renovacion de tokens (`refresh`) y cierre de sesion (`logout`). |
| `server-user` | Catalogo de canchas, reservaciones, equipos, torneos y actualizacion de avatar.  |
