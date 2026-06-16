'use strict';

import { getUserById } from '../src/auth/auth.service.js';
import { formatUserDisplayName } from './user-format.js';

const buildUserSummary = (profile, userId) => ({
  id: userId,
  name: profile?.name ?? profile?.Name ?? '',
  surname: profile?.surname ?? profile?.Surname ?? '',
  displayName: formatUserDisplayName(profile),
  username: profile?.username ?? profile?.Username ?? '',
  email: profile?.email ?? profile?.Email ?? '',
  phone: profile?.phone ?? profile?.Phone ?? '',
  profilePicture: profile?.profilePicture ?? profile?.ProfilePicture ?? '',
});

export const enrichReservation = async (reservation) => {
  const reservationData = reservation?.toObject
    ? reservation.toObject()
    : { ...reservation };

  if (!reservationData.userId) {
    return reservationData;
  }

  let profile = null;
  try {
    profile = await getUserById(reservationData.userId);
  } catch (_) {
    return reservationData;
  }

  if (!profile) {
    return reservationData;
  }

  const user = buildUserSummary(profile, reservationData.userId);

  return {
    ...reservationData,
    userName: user.displayName,
    userEmail: user.email,
    user,
  };
};

export const enrichReservations = async (reservations) => {
  const list = reservations.map((reservation) =>
    reservation?.toObject ? reservation.toObject() : { ...reservation }
  );

  const uniqueUserIds = [
    ...new Set(list.map((reservation) => reservation.userId).filter(Boolean)),
  ];

  const userCache = new Map();

  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const profile = await getUserById(userId);
        if (profile) {
          userCache.set(String(userId), profile);
        }
      } catch (_) {}
    })
  );

  return list.map((reservation) => {
    const profile = userCache.get(String(reservation.userId));
    if (!profile) {
      return reservation;
    }

    const user = buildUserSummary(profile, reservation.userId);

    return {
      ...reservation,
      userName: user.displayName,
      userEmail: user.email,
      user,
    };
  });
};
