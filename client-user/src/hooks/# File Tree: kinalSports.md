# File Tree: kinalSports

**Generated:** 24/3/2026, 10:49:13
**Root Path:** `/home/brau-dev/Documentos/kinalSports`

```
├── .github
│   └── copilot-instructions.md
├── .husky
│   ├── _
│   │   ├── .gitignore
│   │   ├── applypatch-msg
│   │   ├── commit-msg
│   │   ├── h
│   │   ├── husky.sh
│   │   ├── post-applypatch
│   │   ├── post-checkout
│   │   ├── post-commit
│   │   ├── post-merge
│   │   ├── post-rewrite
│   │   ├── pre-applypatch
│   │   ├── pre-auto-gc
│   │   ├── pre-commit
│   │   ├── pre-merge-commit
│   │   ├── pre-push
│   │   ├── pre-rebase
│   │   └── prepare-commit-msg
│   ├── commit-msg
│   └── pre-commit
├── authentication-service
│   ├── auth-node
│   │   ├── configs
│   │   │   ├── app.js
│   │   │   ├── config.js
│   │   │   ├── cors-configuration.js
│   │   │   ├── db.js
│   │   │   └── helmet-configuration.js
│   │   ├── helpers
│   │   │   ├── auth-operations.js
│   │   │   ├── cloudinary-service.js
│   │   │   ├── email-service.js
│   │   │   ├── file-upload.js
│   │   │   ├── file-validator.js
│   │   │   ├── generate-jwt.js
│   │   │   ├── profile-operations.js
│   │   │   ├── role-constants.js
│   │   │   ├── role-db.js
│   │   │   ├── role-seed.js
│   │   │   ├── user-db.js
│   │   │   └── uuid-generator.js
│   │   ├── middlewares
│   │   │   ├── request-limit.js
│   │   │   ├── server-genericError-handler.js
│   │   │   ├── validate-JWT.js
│   │   │   └── validation.js
│   │   ├── src
│   │   │   ├── auth
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   └── role.model.js
│   │   │   └── users
│   │   │       ├── user.controller.js
│   │   │       ├── user.model.js
│   │   │       └── user.routes.js
│   │   ├── utils
│   │   │   ├── auth-helpers.js
│   │   │   ├── password-utils.js
│   │   │   └── user-helpers.js
│   │   ├── .eslintrc.json
│   │   ├── .prettierrc.json
│   │   ├── README.md
│   │   ├── eslint.config.js
│   │   ├── index.js
│   │   ├── package-lock.json
│   │   └── package.json
│   └── auth-service
│       ├── src
│       │   ├── AuthService.Api
│       │   │   ├── Controllers
│       │   │   │   ├── AuthController.cs
│       │   │   │   ├── HealthController.cs
│       │   │   │   └── UsersController.cs
│       │   │   ├── Extensions
│       │   │   │   ├── AuthenticationExtensions.cs
│       │   │   │   ├── RateLimitingExtensions.cs
│       │   │   │   ├── SecurityExtensions.cs
│       │   │   │   └── ServiceCollectionExtensions.cs
│       │   │   ├── Middlewares
│       │   │   │   └── GlobalExceptionMiddleware.cs
│       │   │   ├── ModelBinders
│       │   │   │   └── FileDataModelBinder.cs
│       │   │   ├── Models
│       │   │   │   ├── ErrorResponse.cs
│       │   │   │   └── FormFileAdapter.cs
│       │   │   ├── Properties
│       │   │   │   └── launchSettings.json
│       │   │   ├── keys
│       │   │   │   ├── key-62d4ac07-6043-4e47-94e2-ef9fcdf85138.xml
│       │   │   │   └── key-e567a597-05a0-420e-89d4-ac74c67bb002.xml
│       │   │   ├── logs
│       │   │   │   ├── auth-service-20251117.txt
│       │   │   │   ├── auth-service-20251118.txt
│       │   │   │   ├── auth-service-20251119.txt
│       │   │   │   ├── auth-service-20251120.txt
│       │   │   │   ├── auth-service-20260106.txt
│       │   │   │   ├── auth-service-20260107.txt
│       │   │   │   ├── auth-service-20260108.txt
│       │   │   │   ├── auth-service-20260109.txt
│       │   │   │   ├── auth-service-20260204.txt
│       │   │   │   ├── auth-service-20260323.txt
│       │   │   │   └── auth-service-20260324.txt
│       │   │   ├── src
│       │   │   ├── AuthService.Api.csproj
│       │   │   ├── AuthService.Api.http
│       │   │   ├── AuthService.Api.sln
│       │   │   ├── Program.cs
│       │   │   ├── appsettings.Development.json
│       │   │   └── appsettings.json
│       │   ├── AuthService.Application
│       │   │   ├── DTOs
│       │   │   │   ├── Email
│       │   │   │   │   ├── EmailResponseDto.cs
│       │   │   │   │   ├── ForgotPasswordDto.cs
│       │   │   │   │   ├── ResendVerificationDto.cs
│       │   │   │   │   ├── ResetPasswordDto.cs
│       │   │   │   │   └── VerifyEmailDto.cs
│       │   │   │   ├── AuthResponseDto.cs
│       │   │   │   ├── GetProfileByIdDto.cs
│       │   │   │   ├── LoginDto.cs
│       │   │   │   ├── RegisterDto.cs
│       │   │   │   ├── RegisterResponseDto.cs
│       │   │   │   ├── UpdateUserRoleDto.cs
│       │   │   │   ├── UserDetailsDto.cs
│       │   │   │   └── UserResponseDto.cs
│       │   │   ├── Exceptions
│       │   │   │   ├── BusinessException.cs
│       │   │   │   └── ErrorCodes.cs
│       │   │   ├── Extensions
│       │   │   │   └── LoggerExtensions.cs
│       │   │   ├── Interfaces
│       │   │   │   ├── IAuthService.cs
│       │   │   │   ├── ICloudinaryService.cs
│       │   │   │   ├── IEmailService.cs
│       │   │   │   ├── IFileData.cs
│       │   │   │   ├── IJwtTokenService.cs
│       │   │   │   ├── IPasswordHashService.cs
│       │   │   │   └── IUserManagementService.cs
│       │   │   ├── Services
│       │   │   │   ├── AuthService.cs
│       │   │   │   ├── CloudinaryService.cs
│       │   │   │   ├── EmailService.cs
│       │   │   │   ├── JwtTokenService.cs
│       │   │   │   ├── PasswordHashService.cs
│       │   │   │   ├── TokenGeneratorService.cs
│       │   │   │   ├── UserManagementService.cs
│       │   │   │   └── UuidGenerator.cs
│       │   │   ├── Validators
│       │   │   │   └── FileValidator.cs
│       │   │   └── AuthService.Application.csproj
│       │   ├── AuthService.Domain
│       │   │   ├── Constants
│       │   │   │   └── RoleConstants.cs
│       │   │   ├── Entities
│       │   │   │   ├── Role.cs
│       │   │   │   ├── User.cs
│       │   │   │   ├── UserEmail.cs
│       │   │   │   ├── UserPasswordReset.cs
│       │   │   │   ├── UserProfile.cs
│       │   │   │   └── UserRole.cs
│       │   │   ├── Enums
│       │   │   │   └── UserRole.cs
│       │   │   ├── Interfaces
│       │   │   │   ├── IRoleRepository.cs
│       │   │   │   └── IUserRepository.cs
│       │   │   └── AuthService.Domain.csproj
│       │   └── AuthService.Persistence
│       │       ├── Data
│       │       │   ├── ApplicationDbContext.cs
│       │       │   └── DataSeeder.cs
│       │       ├── Migrations
│       │       │   ├── 20260318200511_InitialUsers.Designer.cs
│       │       │   ├── 20260318200511_InitialUsers.cs
│       │       │   └── ApplicationDbContextModelSnapshot.cs
│       │       ├── Repositories
│       │       │   ├── RoleRepository.cs
│       │       │   └── UserRepository.cs
│       │       └── AuthService.Persistence.csproj
│       ├── .editorconfig
│       ├── AuthService.sln
│       ├── Directory.Build.props
│       ├── FLUJO_RECREACION_PASO_A_PASO.md
│       ├── GUIA_RAPIDA.md
│       ├── README.md
│       ├── global.json
│       ├── package-lock.json
│       └── package.json
├── client-admin
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── app
│   │   │   ├── layouts
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── router
│   │   │   │   ├── AppRoutes.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── RoleGuard.jsx
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── assets
│   │   │   └── img
│   │   │       ├── avatarDefault-1749508519496.png
│   │   │       └── kinal_sports.png
│   │   ├── features
│   │   │   ├── auth
│   │   │   │   ├── components
│   │   │   │   │   ├── ConfirmModal.jsx
│   │   │   │   │   ├── ForgotPasswordForm.jsx
│   │   │   │   │   ├── LoginForm.jsx
│   │   │   │   │   ├── Modal.jsx
│   │   │   │   │   ├── RegisterForm.jsx
│   │   │   │   │   ├── ResetPasswordReset.jsx
│   │   │   │   │   └── Spinner.jsx
│   │   │   │   ├── hooks
│   │   │   │   │   ├── useRegister.jsx
│   │   │   │   │   └── useVerifyEmail.jsx
│   │   │   │   ├── pages
│   │   │   │   │   ├── AuthPage.jsx
│   │   │   │   │   ├── ResetPasswordPage.jsx
│   │   │   │   │   ├── UnauthorizedPage.jsx
│   │   │   │   │   └── VerifyEmailPage.jsx
│   │   │   │   └── store
│   │   │   │       ├── authStore.js
│   │   │   │       └── uiStore.js
│   │   │   ├── userAdmin
│   │   │   │   ├── components
│   │   │   │   │   ├── FieldModal.jsx
│   │   │   │   │   ├── Fields.jsx
│   │   │   │   │   ├── Reservations.jsx
│   │   │   │   │   ├── TeamModal.jsx
│   │   │   │   │   ├── Teams.jsx
│   │   │   │   │   ├── TournamentModal.jsx
│   │   │   │   │   ├── Tournaments.jsx
│   │   │   │   │   └── UserComboBox.jsx
│   │   │   │   ├── hooks
│   │   │   │   │   ├── useSaveField.jsx
│   │   │   │   │   ├── useSaveTeam.jsx
│   │   │   │   │   └── useSaveTournament.jsx
│   │   │   │   └── store
│   │   │   │       ├── adminStore.js
│   │   │   │       ├── teamStore.js
│   │   │   │       └── tournamentStore.js
│   │   │   └── userManagement
│   │   │       ├── components
│   │   │       │   └── Settings.jsx
│   │   │       └── store
│   │   │           └── userAdminStore.js
│   │   ├── service
│   │   │   ├── api.js
│   │   │   └── index.js
│   │   ├── shared
│   │   │   ├── components
│   │   │   │   ├── layout
│   │   │   │   │   ├── DashboardContainer.jsx
│   │   │   │   │   ├── Navbar.jsx
│   │   │   │   │   └── Sidebar.jsx
│   │   │   │   └── ui
│   │   │   │       └── AvatarUser.jsx
│   │   │   ├── hooks
│   │   │   └── utils
│   │   │       └── formatters.js
│   │   ├── store
│   │   │   └── adminStore.js
│   │   └── styles
│   │       └── index.css
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── vite.config.js
├── client-user
│   ├── .expo
│   │   ├── README.md
│   │   └── devices.json
│   ├── assets
│   │   ├── android-icon-background.png
│   │   ├── android-icon-foreground.png
│   │   ├── android-icon-monochrome.png
│   │   ├── avatarDefault-1749508519496.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   ├── kinal_sports.png
│   │   └── splash-icon.png
│   ├── src
│   │   ├── api
│   │   │   ├── authClient.js
│   │   │   └── userClient.js
│   │   ├── components
│   │   │   ├── common
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Common.jsx
│   │   │   │   └── Input.jsx
│   │   │   └── ui
│   │   ├── constants
│   │   │   ├── endpoints.js
│   │   │   └── theme.js
│   │   ├── hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useFields.js
│   │   │   ├── useReservations.js
│   │   │   ├── useTeams.js
│   │   │   └── useTournaments.js
│   │   ├── navigation
│   │   │   ├── AppNavigator.jsx
│   │   │   ├── AuthStack.jsx
│   │   │   └── MainTabs.jsx
│   │   ├── screens
│   │   │   ├── auth
│   │   │   │   ├── LoginScreen.jsx
│   │   │   │   └── RegisterScreen.jsx
│   │   │   ├── fields
│   │   │   │   ├── FieldDetailScreen.jsx
│   │   │   │   └── FieldsScreen.jsx
│   │   │   ├── profile
│   │   │   │   └── ProfileScreen.jsx
│   │   │   ├── reservations
│   │   │   │   ├── CreateReservationScreen.jsx
│   │   │   │   └── ReservationsScreen.jsx
│   │   │   ├── teams
│   │   │   │   ├── CreateTeamScreen.jsx
│   │   │   │   ├── MyTeamsScreen.jsx
│   │   │   │   ├── TeamDetailScreen.jsx
│   │   │   │   └── TeamsScreen.jsx
│   │   │   └── tournaments
│   │   │       ├── MyTournamentsScreen.jsx
│   │   │       ├── TournamentDetailScreen.jsx
│   │   │       └── TournamentsScreen.jsx
│   │   └── store
│   │       └── authStore.js
│   ├── .gitignore
│   ├── App.jsx
│   ├── app.json
│   ├── index.js
│   ├── metro.config.js
│   └── package.json
├── server-admin
│   ├── configs
│   │   ├── app.js
│   │   ├── cors-configuration.js
│   │   ├── db.js
│   │   └── helmet-configuration.js
│   ├── helpers
│   ├── middlewares
│   │   ├── check-validators.js
│   │   ├── delete-file-on-error.js
│   │   ├── field-validators.js
│   │   ├── file-uploader.js
│   │   ├── handle-errors.js
│   │   ├── request-limit.js
│   │   ├── reservation-conflict.js
│   │   ├── reservation-time-validation.js
│   │   ├── reservation-validators.js
│   │   ├── team-validators.js
│   │   ├── tournament-validators.js
│   │   ├── validate-JWT.js
│   │   ├── validate-internal-token.js
│   │   └── validate-role.js
│   ├── src
│   │   ├── fields
│   │   │   ├── field.controller.js
│   │   │   ├── field.model.js
│   │   │   ├── field.routes.js
│   │   │   └── field.service.js
│   │   ├── reservations
│   │   │   ├── reservation.controller.js
│   │   │   ├── reservation.model.js
│   │   │   ├── reservation.routes.js
│   │   │   └── reservation.service.js
│   │   ├── teams
│   │   │   ├── team.controller.js
│   │   │   ├── team.model.js
│   │   │   ├── team.routes.js
│   │   │   └── team.service.js
│   │   └── tournaments
│   │       ├── tournaments.controller.js
│   │       ├── tournaments.model.js
│   │       ├── tournaments.routes.js
│   │       └── tournaments.service.js
│   ├── utils
│   ├── .prettierrc.json
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.js
│   ├── package.json
│   └── pnpm-lock.yaml
├── server-user
│   ├── configs
│   │   ├── app.js
│   │   ├── cors-configuration.js
│   │   ├── db.js
│   │   └── helmet-configuration.js
│   ├── helpers
│   │   └── validation-helpers.js
│   ├── middlewares
│   │   ├── auth.middleware.js
│   │   ├── delete-file-on-error.js
│   │   ├── file-uploader.js
│   │   ├── handle-errors.js
│   │   ├── rate-limit-user.js
│   │   ├── request-limit.js
│   │   ├── reservation-conflict.js
│   │   ├── reservation-validators.js
│   │   └── validate-JWT.js
│   ├── src
│   │   ├── fields
│   │   │   ├── field.controller.js
│   │   │   ├── field.model.js
│   │   │   ├── field.routes.js
│   │   │   └── field.service.js
│   │   ├── reservations
│   │   │   ├── reservation.controller.js
│   │   │   ├── reservation.model.js
│   │   │   ├── reservation.routes.js
│   │   │   └── reservation.service.js
│   │   ├── teams
│   │   │   ├── team.controller.js
│   │   │   ├── team.model.js
│   │   │   ├── team.routes.js
│   │   │   └── team.service.js
│   │   ├── tournaments
│   │   │   ├── tournament.controller.js
│   │   │   ├── tournament.model.js
│   │   │   ├── tournament.routes.js
│   │   │   └── tournament.service.js
│   │   └── users
│   │       ├── user.controller.js
│   │       ├── user.model.js
│   │       ├── user.routes.js
│   │       └── user.service.js
│   ├── utils
│   │   ├── adminClient.js
│   │   └── validation-utils.js
│   ├── .prettierrc.json
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.js
│   ├── package.json
│   └── pnpm-lock.yaml
├── .gitignore
├── README.md
├── commitlint.config.cjs
├── eslint.config.js
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

---

_Generated by FileTree Pro Extension_
