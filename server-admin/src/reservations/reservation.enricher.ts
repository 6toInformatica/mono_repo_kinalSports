import { Injectable } from '@nestjs/common';
import type { Document } from 'mongoose';
import {
  AuthClientService,
  type AuthUserProfile,
} from '../integrations/auth-client.service.js';

type ReservationLike = Document | Record<string, unknown>;

const toPlain = (reservation: ReservationLike) =>
  (reservation instanceof Object && 'toObject' in reservation
    ? (reservation as Document).toObject()
    : { ...reservation }) as Record<string, unknown> & { userId?: string };

/** Nombre visible: nombre completo, si no username, si no el id */
const displayName = (user: AuthUserProfile) => {
  const fullName =
    `${user.name ?? user.Name ?? ''} ${user.surname ?? user.Surname ?? ''}`.trim();
  return (
    fullName || user.username || user.Username || user.id || user.Id || null
  );
};

const userSummary = (profile: AuthUserProfile, userId: string) => ({
  id: userId,
  name: profile.name ?? profile.Name ?? '',
  surname: profile.surname ?? profile.Surname ?? '',
  displayName: displayName(profile),
  username: profile.username ?? profile.Username ?? '',
  email: profile.email ?? profile.Email ?? '',
  phone: profile.phone ?? profile.Phone ?? '',
  profilePicture: profile.profilePicture ?? profile.ProfilePicture ?? '',
});

/**
 * Agrega a cada reserva los datos de su usuario (nombre, email...) desde el servicio
 * de auth. Si el perfil no se puede obtener, la reserva se devuelve sin ellos.
 */
@Injectable()
export class ReservationEnricher {
  constructor(private readonly auth: AuthClientService) {}

  #withUser(
    reservation: ReturnType<typeof toPlain>,
    profile: AuthUserProfile | null | undefined
  ) {
    if (!profile || !reservation.userId) return reservation;
    const user = userSummary(profile, reservation.userId);
    return {
      ...reservation,
      userName: user.displayName,
      userEmail: user.email,
      user,
    };
  }

  async #safeProfile(userId: string) {
    try {
      return await this.auth.getUserById(userId);
    } catch {
      return null;
    }
  }

  async enrichOne(reservation: ReservationLike) {
    const data = toPlain(reservation);
    if (!data.userId) return data;
    return this.#withUser(data, await this.#safeProfile(data.userId));
  }

  /** Una consulta por usuario distinto */
  async enrichMany(reservations: ReservationLike[]) {
    const list = reservations.map(toPlain);
    const userIds = [
      ...new Set(list.map((r) => r.userId).filter(Boolean)),
    ] as string[];
    const profiles = new Map(
      await Promise.all(
        userIds.map(async (id) => [id, await this.#safeProfile(id)] as const)
      )
    );
    return list.map((r) => this.#withUser(r, profiles.get(String(r.userId))));
  }
}
