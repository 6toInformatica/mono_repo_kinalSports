import { create } from 'zustand';
import {
  getFields as getFieldsRequest,
  createField as createFieldRequest,
  updateField as _updateFieldRequest,
  deleteField as _deleteFieldRequest,
  getAllReservations as getAllReservationsRequest,
  confirmReservation as confirmReservationRequest,
  cancelReservation as cancelReservationRequest,
} from '../../../shared/api';
import { isAuthError } from '../../../shared/api/sessionRefresh.js';

export const useFieldsStore = create((set, get) => ({
  fields: [],
  reservations: [],
  loading: false,
  error: null,

  getFields: async () => {
    try {
      set({ loading: true, error: null });

      const response = await getFieldsRequest();

      set({
        fields: response.data.data,
        loading: false,
      });
    } catch (error) {
      if (isAuthError(error)) {
        set({ fields: [], loading: false, error: null });
        return;
      }
      set({
        error: error.response?.data?.message || 'Error al obtener canchas',
        loading: false,
      });
    }
  },

  createField: async (formData) => {
    try {
      set({ loading: true, error: null });

      const response = await createFieldRequest(formData);

      set({
        fields: [response.data.data, ...get().fields],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al crear campo',
      });
    }
  },

  updateField: async (id, formData) => {
    try {
      set({ loading: true, error: null });
      const response = await _updateFieldRequest(id, formData);
      set({
        fields: get().fields.map((field) => (field._id === id ? response.data.data : field)),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al actualizar campo',
      });
      throw error;
    }
  },

  deleteField: async (id) => {
    try {
      set({ loading: true, error: null });
      await _deleteFieldRequest(id);
      set({
        fields: get().fields.filter((field) => field._id !== id),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.response?.data?.message || 'Error al desactivar campo',
      });
      throw error;
    }
  },

  getAllReservations: async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        set({ loading: true, error: null });
      }

      const response = await getAllReservationsRequest({ page: 1, limit: 100 });
      let reservations = response.data.data ?? [];
      const pagination = response.data.pagination;

      if (pagination?.totalPages > 1) {
        for (let page = 2; page <= pagination.totalPages; page += 1) {
          const nextPage = await getAllReservationsRequest({ page, limit: 100 });
          reservations = [...reservations, ...(nextPage.data.data ?? [])];
        }
      }

      set({
        reservations,
        loading: false,
      });
    } catch (error) {
      if (isAuthError(error)) {
        set({ reservations: [], loading: false, error: null });
        throw error;
      }
      set({
        error: error.response?.data?.message || 'Error al obtener reservaciones',
        loading: false,
      });
      throw error;
    }
  },

  confirmReservation: async (id) => {
    try {
      set({ error: null });
      await confirmReservationRequest(id);
      await get().getAllReservations({ silent: true });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al confirmar reservación',
        loading: false,
      });
      throw error;
    }
  },

  cancelReservation: async (id) => {
    try {
      set({ error: null });
      await cancelReservationRequest(id);
      await get().getAllReservations({ silent: true });
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Error al cancelar reservación',
        loading: false,
      });
      throw error;
    }
  },
}));
