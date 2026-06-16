'use strict';

import { getUserById } from '../src/auth/auth.service.js';
import { formatUserDisplayName } from './user-format.js';

export const enrichTeamDetails = async (team) => {
  const teamData = team.toObject ? team.toObject() : { ...team };

  const managerProfile = await getUserById(teamData.managerId);
  if (managerProfile) {
    teamData.managerName = formatUserDisplayName(managerProfile);
  }

  const memberProfiles = await Promise.all(
    (teamData.members ?? []).map(async (memberId) => {
      const profile = await getUserById(memberId);
      const username = profile?.username ?? profile?.Username ?? null;
      const displayName =
        formatUserDisplayName(profile) ?? username ?? 'Miembro';

      return {
        userId: memberId,
        displayName,
        username,
        isCaptain: String(memberId) === String(teamData.managerId),
      };
    })
  );

  teamData.memberProfiles = memberProfiles;
  return teamData;
};
