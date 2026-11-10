'use strict';

import { sendError } from '../shared/errors.js';
import { getField, listFields } from './field.service.js';

export const getFields = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive = true } = req.query;
    const { fields, pagination } = await listFields({ page, limit, isActive });
    return res.status(200).json({ success: true, data: fields, pagination });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en getFields controller:',
      fallbackBody: (e) => ({
        success: false,
        message: 'Error al obtener los campos deportivos',
        error: e.message,
      }),
    });
  }
};

export const getFieldById = async (req, res) => {
  try {
    const field = await getField(req.params.id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Campo deportivo no encontrado',
      });
    }
    return res.status(200).json({ success: true, data: field });
  } catch (error) {
    return sendError(res, error, {
      log: 'Error en getFieldById controller:',
      fallbackBody: (e) => ({
        success: false,
        message: 'Error al obtener el detalle del campo deportivo',
        error: e.message,
      }),
    });
  }
};
