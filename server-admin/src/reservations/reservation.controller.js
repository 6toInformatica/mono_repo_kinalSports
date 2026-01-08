import Reservation from './reservation.model.js';

// Obtener todas las reservas con paginación y filtros
export const getReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, fieldId, date, userId } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (fieldId) filter.fieldId = fieldId;
    if (userId) filter.userId = userId;

    // Filtro por fecha (día completo)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      filter.startTime = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const reservations = await Reservation.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startTime: -1 })
      .populate('fieldId', 'fieldName fieldType location pricePerHour');

    const total = await Reservation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reservas',
      error: error.message,
    });
  }
};

// Obtener reserva por ID
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const reservation = await Reservation.findById(id).populate(
      'fieldId',
      'fieldName fieldType location pricePerHour capacity'
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    // Solo admin o el dueño de la reserva pueden verla
    if (userRole !== 'ADMIN_ROLE' && reservation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta reserva',
        error: 'FORBIDDEN',
      });
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la reserva',
      error: error.message,
    });
  }
};

// Confirmar reserva
export const confirmReservation = async (req, res) => {
  try {
    const adminId = req.user?.id || 'admin';
    const reservation = req.reservation;

    if (!reservation) {
      return res.status(500).json({
        success: false,
        message: 'Reserva no fue cargada por middleware',
      });
    }

    if (reservation.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `No se puede confirmar una reserva con estado: ${reservation.status}`,
      });
    }

    reservation.status = 'CONFIRMED';
    reservation.confirmation = {
      confirmedAt: new Date(),
      confirmedBy: adminId,
    };
    reservation.lastModifiedBy = adminId;

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reserva confirmada exitosamente',
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al confirmar la reserva',
      error: error.message,
    });
  }
};

// Cancelar reserva
export const cancelReservation = async (req, res) => {
  try {
    const adminId = req.user?.id || 'admin';
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una reserva con estado: ${reservation.status}`,
      });
    }

    reservation.status = 'CANCELLED';
    reservation.lastModifiedBy = adminId;

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la reserva',
      error: error.message,
    });
  }
};
