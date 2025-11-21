import Reservation from '../reservations/reservation.model.js';

// Crear reservación (POST /)
export const createReservation = async (req, res) => {
  try {
    const { fieldId, startTime, endTime } = req.body;
    const userId = req.user.id;

    // El middleware de conflicto ya habrá verificado disponibilidad.
    const reservation = new Reservation({
      userId,
      fieldId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'PENDING',
      lastModifiedBy: userId,
    });

    await reservation.save();

    return res.status(201).json({
      success: true,
      message: 'Reserva creada correctamente',
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al crear la reservación',
      error: error.message,
    });
  }
};

// Cancelar reservación (PUT /:id/cancel)
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reservation = await Reservation.findOne({ _id: id, userId });
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una reserva con estado ${reservation.status}`,
      });
    }

    reservation.status = 'CANCELLED';
    reservation.lastModifiedBy = userId;
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: 'Reserva cancelada correctamente',
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cancelar la reservación',
      error: error.message,
    });
  }
};
