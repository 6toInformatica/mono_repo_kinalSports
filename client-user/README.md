# Client User — Aplicación Móvil (React Native + Expo)

## 1. Propósito del Componente

`client-user` es la aplicación móvil multiplataforma (Android / iOS) para los usuarios finales de **KinalSports**, desarrollada con **React Native 0.88**, **Expo SDK 58**, **React Navigation 7** y **Zustand 5**.

Dentro de la arquitectura del proyecto, representa el canal de autoservicio para deportistas y capitanes de equipo, e ilustra las diferencias de seguridad y red entre un cliente móvil nativo (que resguarda credenciales en `expo-secure-store` y se autentica por cabecera `Authorization: Bearer`) y las aplicaciones web basadas en cookies `httpOnly`.

---

## 2. Responsabilidad dentro de KinalSports

- Permite a los jugadores registrarse, iniciar sesión, explorar el catálogo de canchas, consultar horarios disponibles por fecha, crear y cancelar reservaciones, crear equipos con logotipo, unirse o abandonar equipos, administrar integrantes, inscribir equipos en torneos y actualizar su fotografía de perfil.
- Consume directamente dos microservicios del monorepo:
  - **`auth-node` (`:3007`, `/api/v1/auth`):** Registro, inicio de sesión, renovación de tokens (`refresh`), cierre de sesión (`logout`) y recuperación de contraseña.
  - **`server-user` (`:3008`, `/kinalSportsUser/v1`):** Canchas, reservaciones, equipos, torneos y perfil de usuario.

---

## 3. Stack Tecnológico Verificado

| Categoría                          | Paquete / Versión (`package.json`)                                                                                         | Uso en la Aplicación                                                                 |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Framework Móvil**                | `expo` `~58.0.23`, `react-native` `0.88.1`, `react` `19.3.0`                                                               | Base multiplataforma y acceso a APIs nativas del dispositivo.                        |
| **Navegación**                     | `@react-navigation/native` `^7.5.1`, `@react-navigation/native-stack` `^7.21.0`, `@react-navigation/bottom-tabs` `^7.21.0` | Flujos de navegación autenticada (`MainTabs`) y pública (`AuthStack`).               |
| **Estado y Almacenamiento Seguro** | `zustand` `^5.0.16`, `expo-secure-store` `~58.0.2`                                                                         | Estado global de sesión respaldado en _Keychain_ (iOS) / _Keystore_ (Android).       |
| **Formularios y Multimedia**       | `react-hook-form` `^7.91.0`, `expo-image-picker` `^58.0.10`, `@react-native-community/datetimepicker` `9.2.1`              | Selección de fotografías de perfil/logos de equipo y selección de fechas de reserva. |
| **Cliente HTTP**                   | `axios` `^1.21.0`                                                                                                          | Instancias `authClient` y `userClient` con interceptores Bearer y rotación de token. |
| **Pruebas Unitarias**              | `jest` `^30.5.2`, `jest-expo` `~58.0.15`, `@testing-library/react-native` `^14.1.0`                                        | Pruebas unitarias de `authStore`, `tokenRefresh` y pantallas móviles.                |

---

## 4. Arquitectura Interna

El código fuente bajo `src/` se organiza en tres bloques principales:

1. **Navegación (`src/navigation/`):**
   - `AppNavigator.jsx`: Restaura la sesión desde `expo-secure-store` al iniciar la aplicación y conmuta automáticamente entre `AuthStack` (cuando no hay sesión) y `MainTabs` (cuando el usuario está autenticado).
   - `MainTabs.jsx`: Barra de navegación inferior con cinco pestañas principales (Canchas, Equipos, Torneos, Mis Reservas y Perfil) y sus respectivos _stacks_ de detalle.
2. **Módulos por Funcionalidad (`src/features/`):**
   - `auth/`: `LoginScreen` y `RegisterScreen`.
   - `fields/`: `FieldsList`, `FieldDetail` y `CreateReservation`.
   - `teams/`: `TeamsList`, `MyTeams`, `CreateTeam` y `TeamDetail` (gestión de miembros registrados por `username` y miembros invitados).
   - `tournaments/`: `TournamentsList`, `MyTournaments` y `TournamentDetail` (inscripción de equipos donde el usuario es capitán).
   - `reservations/`: `ReservationsList` (reservas activas, historial y cancelación).
   - `profile/`: `ProfileScreen` (datos del usuario, actualización de avatar y cierre de sesión).
3. **Capa Compartida (`src/shared/`):**
   - `store/authStore.js`: Persiste y recupera `accessToken`, `refreshToken` y datos del usuario utilizando `expo-secure-store`.
   - `api/tokenRefresh.js`: Intercepta respuestas `401` de `server-user`, ejecuta una única petición compartida a `POST /api/v1/auth/refresh` enviando el `refreshToken` en el cuerpo JSON, actualiza `expo-secure-store` y reintenta las peticiones pendientes.

---

## 5. Estructura Principal del Directorio

```text
client-user/
├── App.jsx                             # Punto de entrada de la aplicación Expo
├── index.js                            # Registro del componente raíz
├── app.json                            # Metadatos y configuración de Expo
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.jsx
│   │   ├── AuthStack.jsx
│   │   └── MainTabs.jsx
│   ├── features/
│   │   ├── auth/
│   │   ├── fields/
│   │   ├── teams/
│   │   ├── tournaments/
│   │   ├── reservations/
│   │   └── profile/
│   └── shared/
│       ├── api/                        # authClient, userClient y tokenRefresh
│       ├── components/
│       ├── constants/
│       ├── store/                      # authStore.js (Zustand + expo-secure-store)
│       └── utils/
├── .env.example
├── jest.config.js
└── package.json
```

---

## 6. Requisitos

- **Node.js:** `>= 22.13.0`
- **pnpm:** `>= 10`
- **Entorno de ejecución móvil:** Emulador Android (Android Studio), Simulador iOS (Xcode en macOS) o dispositivo físico con la aplicación **Expo Go** en la misma red local.
- **Backends activos:** `auth-node` (`:3007`) y `server-user` (`:3008`).

---

## 7. Configuración de Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp client-user/.env.example client-user/.env
```

La dirección IP debe configurarse según el dispositivo desde el cual se ejecute la aplicación:

| Escenario de Ejecución                                     | `EXPO_PUBLIC_AUTH_URL`                      | `EXPO_PUBLIC_USER_URL`                             | Explicación Técnica                                                                                          |
| :--------------------------------------------------------- | :------------------------------------------ | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Emulador Android** (valor por defecto en `.env.example`) | `http://10.0.2.2:3007/api/v1/auth`          | `http://10.0.2.2:3008/kinalSportsUser/v1`          | En el emulador de Android, `10.0.2.2` es el alias de red que apunta al `localhost` de la máquina anfitriona. |
| **Simulador iOS / Expo Web**                               | `http://localhost:3007/api/v1/auth`         | `http://localhost:3008/kinalSportsUser/v1`         | Comparte la interfaz de loopback del host.                                                                   |
| **Dispositivo Físico (Expo Go por Wi-Fi)**                 | `http://<IP_LAN_DEL_HOST>:3007/api/v1/auth` | `http://<IP_LAN_DEL_HOST>:3008/kinalSportsUser/v1` | Usar la dirección IPv4 local de la computadora (por ejemplo, `192.168.1.50`).                                |

---

## 8. Ejecución Local

### Desde la raíz del monorepo

```bash
pnpm --filter client-user start
```

### Desde el directorio del paquete

```bash
cd client-user
pnpm install
pnpm start
```

### Scripts disponibles en `package.json`

- `pnpm start`: Inicia el servidor de desarrollo de Metro Bundler.
- `pnpm android`: Inicia Metro y abre la aplicación en el emulador o dispositivo Android conectado.
- `pnpm ios`: Inicia Metro y abre la aplicación en el simulador de iOS.
- `pnpm web`: Inicia la vista web de Expo.
- `pnpm lint`: Ejecuta ESLint.
- `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`: Ejecuta las pruebas unitarias con Jest.

---

## 9. Integraciones

| Servicio      | Prefijo Base          | Operaciones Consumidas                                                                                         |
| :------------ | :-------------------- | :------------------------------------------------------------------------------------------------------------- |
| `auth-node`   | `/api/v1/auth`        | `POST /login`, `POST /register`, `POST /refresh`, `POST /logout`, `POST /forgot-password`.                     |
| `server-user` | `/kinalSportsUser/v1` | `/fields`, `/reservations/*`, `/teams/*`, `/tournaments/*`, `/users/profile`, `/users/profile/picture/avatar`. |

---

## 10. Pruebas

La suite de pruebas unitarias se ejecuta con **Jest 30**, `jest-expo` y `@testing-library/react-native`:

```bash
pnpm --filter client-user test
```

Cubre el almacenamiento seguro de credenciales en `authStore`, la rotación de tokens en `tokenRefresh` y el renderizado y validación de las pantallas principales.

---

## 11. Build, Uso en Docker y Limitaciones Relevantes

### 11.1 Contenedor de Desarrollo en Docker

- El archivo `dockerfiles/Dockerfile.client-user` levanta un contenedor de desarrollo sobre `node:26-slim` que expone los puertos `8081` y `19000-19002` ejecutando `expo start --host lan --port 8081` (incluido en `docker-compose.yml`).
- En `docker-compose.prod.yml` no se incluye `client-user`, ya que en producción una aplicación móvil React Native se distribuye como binario nativo (`.apk` / `.aab` en Android o `.ipa` en iOS) generado mediante **EAS Build** o compilación nativa, no como un servidor web contenedorizado.

### 11.2 Limitaciones y Consideraciones Operativas

- **Enrutamiento de red según emulador o dispositivo físico:** El valor por defecto `10.0.2.2` funciona exclusivamente dentro del emulador de Android Studio; para iOS Simulator debe cambiarse a `localhost` y para dispositivos físicos con Expo Go debe emplearse la dirección IP LAN de la máquina anfitriona.
- **Compatibilidad de `expo-secure-store`:** El almacenamiento cifrado nativo opera en dispositivos iOS y Android; si se ejecuta la vista web (`pnpm web`), `expo-secure-store` no dispone del llavero nativo del sistema operativo.

---

## 12. Documentación Relacionada

- [README Principal del Monorepo](../README.md)
- [Arquitectura Detallada del Sistema](../docs/ARCHITECTURE.md)
- [Server User — API de negocio consumida](../server-user/README.md)
- [Auth Node — Servicio de autenticación consumido](../authentication-service/auth-node/README.md)
