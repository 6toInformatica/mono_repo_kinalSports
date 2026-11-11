'use strict';

import Tournament from './tournament.model.js';

export const tournamentRepository = {
  findActive() {
    return Tournament.find({ isActive: true });
  },

  findById(id) {
    return Tournament.findById(id);
  },

  findActiveByTeams(teamIds) {
    return Tournament.find({ teams: { $in: teamIds }, isActive: true });
  },

  /** Copia local de un torneo de server-admin (se usa como caché) */
  async create(data) {
    const tournament = new Tournament(data);
    await tournament.save();
    return tournament;
  },

  async save(tournament) {
    await tournament.save();
    return tournament;
  },
};
