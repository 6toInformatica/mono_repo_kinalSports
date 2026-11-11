'use strict';

import Team from './team.model.js';

export const teamRepository = {
  findActive() {
    return Team.find({ isActive: true });
  },

  findById(id) {
    return Team.findById(id);
  },

  /** Solo el capitán (para autorizar acciones sobre el equipo) */
  findManager(id) {
    return Team.findById(id).select('managerId');
  },

  /** Equipos activos donde el usuario es miembro o capitán */
  findActiveByMember(userId) {
    return Team.find({
      isActive: true,
      $or: [{ members: userId }, { managerId: userId }],
    });
  },

  /** Ids de los equipos donde el usuario es miembro */
  async findIdsByMember(userId) {
    const teams = await Team.find({ members: userId }).select('_id');
    return teams.map((team) => team._id);
  },

  async create(data) {
    const team = new Team(data);
    await team.save();
    return team;
  },

  async save(team) {
    await team.save();
    return team;
  },
};
