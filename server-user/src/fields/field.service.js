'use strict';

import { fieldRepository } from './field.repository.js';

/** Campos con paginación (por defecto solo los activos) */
export const listFields = async ({ page = 1, limit = 10, isActive = true }) => {
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const { items, total } = await fieldRepository.findPage(
    { isActive },
    { skip: (pageNumber - 1) * limitNumber, limit: limitNumber }
  );

  return {
    fields: items,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalRecords: total,
      limit: limitNumber,
    },
  };
};

/** Campo por id, o null si no existe */
export const getField = (id) => fieldRepository.findById(id);

/** true si la cancha existe y está activa (se puede reservar) */
export const isFieldAvailable = async (id) => {
  const field = await fieldRepository.findAvailability(id);
  return Boolean(field?.isActive);
};
