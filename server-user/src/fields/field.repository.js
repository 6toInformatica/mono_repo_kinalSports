'use strict';

import Field from './field.model.js';

export const fieldRepository = {
  /** Página de campos más recientes primero, con el total para la paginación */
  async findPage(filter, { skip, limit }) {
    const [items, total] = await Promise.all([
      Field.find(filter).limit(limit).skip(skip).sort({ createdAt: -1 }),
      Field.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return Field.findById(id);
  },

  /** Solo el estado de disponibilidad (para validar reservas) */
  findAvailability(id) {
    return Field.findById(id).select('isActive');
  },
};
