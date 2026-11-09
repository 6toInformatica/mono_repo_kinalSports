/**
 * Puente tipado hacia la lógica existente en JavaScript (helpers/ y utils/).
 *
 * Fase 2.1: la capa HTTP ya es Fastify + TypeScript, pero la lógica de negocio y el
 * acceso a datos siguen siendo los mismos módulos de antes. Este archivo concentra
 * los tipos de esa frontera; en las fases 2.2 y 2.3 se reemplaza por Prisma y por
 * los casos de uso de cada módulo.
 */
import * as authOperations from '../../helpers/auth-operations.js';
import * as profileOperations from '../../helpers/profile-operations.js';
import * as jwtHelpers from '../../helpers/generate-jwt.js';
import * as refreshTokens from '../../helpers/refresh-token.js';
import * as roleDb from '../../helpers/role-db.js';
import * as userDb from '../../helpers/user-db.js';
import { seedRoles as seedRolesJs } from '../../helpers/role-seed.js';
import { buildUserResponse as buildUserResponseJs } from '../../utils/user-helpers.js';
import { RefreshToken as RefreshTokenModel } from '../auth/refreshToken.model.js';
import { User as UserModel } from '../users/user.model.js';
import {
  sequelize,
  dbConnection,
  closeDatabase as closeDatabaseJs,
} from '../../configs/db.js';

export interface LegacyRole {
  Name: string;
}

export interface LegacyUser {
  Id: string;
  Name: string;
  Email: string;
  Status: boolean;
  UserRoles?: { Role?: LegacyRole | null }[];
}

export interface LegacyRefreshToken {
  UserId: string;
  FamilyId: string;
  ExpiresAt: Date;
  RevokedAt: Date | null;
  save(): Promise<unknown>;
}

export type UserResponse = Record<string, unknown>;

export interface RegisterInput {
  [field: string]: unknown;
  profilePicture: string | null;
}

/** Resultado de los flujos de correo (EmailResponseDto de .NET) */
export interface EmailFlowResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

type Async<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

// --- Base de datos ---
export const connectDatabase = dbConnection as Async<[], void>;
export const closeDatabase = closeDatabaseJs as Async<[], void>;
export const seedRoles = seedRolesJs as Async<[], void>;

// --- Autenticación ---
export const registerUser = authOperations.registerUserHelper as Async<
  [RegisterInput],
  unknown
>;
export const loginUser = authOperations.loginUserHelper as Async<
  [string, string],
  unknown
>;
export const verifyEmail = authOperations.verifyEmailHelper as Async<
  [string],
  unknown
>;
export const resendVerificationEmail =
  authOperations.resendVerificationEmailHelper as Async<
    [string],
    EmailFlowResult
  >;
export const forgotPassword = authOperations.forgotPasswordHelper as Async<
  [string],
  EmailFlowResult
>;
export const resetPassword = authOperations.resetPasswordHelper as Async<
  [string, string],
  unknown
>;

// --- Perfil ---
export const getUserProfile = profileOperations.getUserProfileHelper as Async<
  [string],
  UserResponse
>;
export const getUserProfileByUsername =
  profileOperations.getUserProfileByUsernameHelper as Async<
    [string],
    UserResponse
  >;
export const updateProfilePicture =
  profileOperations.updateProfilePictureHelper as Async<
    [string, string],
    UserResponse
  >;

// --- Tokens ---
export const verifyJwt = jwtHelpers.verifyJWT as Async<
  [string],
  { sub: string }
>;
export const generateJwt = jwtHelpers.generateJWT as Async<
  [string, Record<string, unknown>, { expiresIn?: string }],
  string
>;
export const hashToken = refreshTokens.hashToken as (token: string) => string;
export const saveRefreshToken = refreshTokens.saveRefreshToken as Async<
  [string, string?],
  { raw: string; familyId: string }
>;

export const findRefreshTokenByHash = (tokenHash: string) =>
  RefreshTokenModel.findOne({
    where: { TokenHash: tokenHash },
  }) as Promise<LegacyRefreshToken | null>;

export const revokeRefreshTokenFamily = async (familyId: string) => {
  await RefreshTokenModel.update(
    { RevokedAt: new Date() },
    { where: { FamilyId: familyId } }
  );
};

export const findUserStatus = (userId: string) =>
  UserModel.findByPk(userId, {
    attributes: ['Id', 'Status'],
  }) as Promise<Pick<LegacyUser, 'Id' | 'Status'> | null>;

// --- Usuarios y roles ---
export const findUserById = userDb.findUserById as unknown as Async<
  [string],
  LegacyUser | null
>;
export const getUserRoleNames = roleDb.getUserRoleNames as Async<
  [string],
  string[]
>;
export const getUsersByRole = roleDb.getUsersByRole as unknown as Async<
  [string],
  LegacyUser[]
>;
export const setUserSingleRole = (user: LegacyUser, roleName: string) =>
  roleDb.setUserSingleRole(user, roleName, sequelize) as Promise<{
    updatedUser: LegacyUser;
    roleName: string;
  }>;

export const buildUserResponse = buildUserResponseJs as (
  user: LegacyUser
) => UserResponse;
