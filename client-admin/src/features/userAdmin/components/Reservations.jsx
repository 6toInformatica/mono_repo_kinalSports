import { useEffect } from "react";
import { useUIStore } from "../../auth/store/uiStore.js";
import { useFieldsStore } from "../../../store/adminStore";
import { formatDate, formatTime } from "../../../shared/utils/formatters";
import { Spinner } from "../../auth/components/Spinner.jsx";

export function Reservations() {
    const { reservations, loading, error, getAllReservations, confirmReservation } = useFieldsStore();
    const openConfirm = useUIStore((state) => state.openConfirm);

    useEffect(() => {
        getAllReservations();
    }, []);

    if (loading) return <Spinner />;

    return (
        <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">
                Reservaciones Pendientes
            </h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="space-y-4">
                {reservations.map((reservation) => (
                    <div
                        key={reservation._id}
                        className="bg-white shadow rounded-xl p-5 flex justify-between items-center"
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700">
                                Usuario: {reservation.userId}
                            </h2>

                            <p className="text-gray-500">
                                Cancha: {reservation.fieldId.fieldName}
                            </p>

                            <p className="text-gray-500">
                                Fecha: {formatDate(reservation.startTime)}
                            </p>

                            <p className="text-gray-500">
                                Hora: {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                            </p>

                            <p className="text-gray-600 mt-1">
                                Estado:{" "}
                                <span className="font-semibold">
                                    {reservation.status}
                                </span>
                            </p>
                        </div>

                        <button
                            disabled={reservation.status === "CONFIRMED"}
                            onClick={() =>
                                reservation.status !== "CONFIRMED" &&
                                openConfirm({
                                    title: "Confirmar Reserva",
                                    message: "¿Estás seguro de confirmar esta reserva?",
                                    onConfirm: async () => {
                                        await confirmReservation(reservation._id);
                                    },
                                })
                            }
                            className={
                                `px-4 py-2 rounded-lg text-white 
                                ${reservation.status === "CONFIRMED"
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"}`
                            }
                        >
                            {reservation.status === "CONFIRMED" ? "Confirmada" : "Confirmar"}
                        </button>

                    </div>
                ))}
            </div>
        </div>
    );
}
