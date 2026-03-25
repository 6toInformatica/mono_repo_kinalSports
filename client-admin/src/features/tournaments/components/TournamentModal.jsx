import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSaveTournament } from "../hooks/useSaveTournament";
import { useTournamentsStore } from "../store/tournamentStore";
import { Spinner } from "../../auth/components/Spinner.jsx";
import { formatDateForInput } from "../../../shared/utils/formatters.js";
import { showSuccess, showError } from "../../../shared/utils/toast.js";

export const TournamentModal = ({ isOpen, onClose, tournament }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const { saveTournament } = useSaveTournament();
  const loading = useTournamentsStore((state) => state.loading);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (tournament) {
        reset({
          tournamentsName: tournament.tournamentsName,
          category: tournament.category,
          startDate: tournament.startDate
            ? formatDateForInput(tournament.startDate)
            : "",
          endDate: tournament.endDate
            ? formatDateForInput(tournament.endDate)
            : "",
          description: tournament.description,
        });
        setPreview(tournament.logo || null);
      } else {
        reset({
          tournamentsName: "",
          category: "",
          startDate: "",
          endDate: "",
          description: "",
          logo: null,
        });
        setPreview(null);
      }
    }
  }, [isOpen, tournament, reset]);

  useEffect(() => {
    // Use subscription pattern to avoid memoization issues
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((value, { name }) => {
      if (name === "logo" && value.logo && value.logo.length > 0) {
        setPreview(URL.createObjectURL(value.logo[0]));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data) => {
    try {
      await saveTournament(data, tournament?._id);
      showSuccess(
        tournament
          ? "Torneo actualizado correctamente"
          : "Torneo creado correctamente",
      );
      reset();
      setPreview(null);
      onClose();
    } catch {
      showError("Error al guardar el torneo");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-3 sm:px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 sm:p-5 text-white sticky top-0 z-10">
          <h2 className="text-xl sm:text-2xl font-bold">
            {tournament ? "Editar Torneo" : "Nuevo Torneo"}
          </h2>
          <p className="text-xs sm:text-sm opacity-80">
            Completa la información del torneo
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 sm:p-6 space-y-5 overflow-y-auto"
        >
          {/* PREVIEW LOGO */}
          <div className="flex justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-gray-100 border flex items-center justify-center overflow-hidden shadow-inner">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm">
                  Sin logo
                </span>
              )}
            </div>
          </div>

          {/* INPUTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Nombre del torneo
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-sm
                                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="Ej. Copa Primavera 2026"
                {...register("tournamentsName", {
                  required: "El nombre es obligatorio",
                  minLength: {
                    value: 3,
                    message: "Debe tener al menos 3 caracteres",
                  },
                })}
              />
              {errors.tournamentsName && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.tournamentsName.message}
                </p>
              )}
            </div>

            {/* Categoría */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Categoría
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-sm
                                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                {...register("category", {
                  required: "La categoría es obligatoria",
                })}
              >
                <option value="">Seleccione una categoría</option>
                <option value="FUTBOL_5">Fútbol 5</option>
                <option value="FUTBOL_7">Fútbol 7</option>
                <option value="FUTBOL_11">Fútbol 11</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Fechas */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Fecha de inicio
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-sm
                                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                {...register("startDate", {
                  required: "La fecha de inicio es obligatoria",
                })}
              />
              {errors.startDate && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Fecha de fin
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-sm
                                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                {...register("endDate", {
                  required: "La fecha de fin es obligatoria",
                })}
              />
              {errors.endDate && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 bg-gray-50 shadow-sm
                                focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                placeholder="Detalles del torneo..."
                {...register("description", {
                  required: "La descripción es obligatoria",
                })}
              />
              {errors.description && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Logo */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Logo del torneo
              </label>
              <input
                type="file"
                className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50
                                hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition cursor-pointer"
                accept="image/*"
                {...register("logo")}
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                reset();
                setPreview(null);
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow"
            >
              {loading ? (
                <Spinner small />
              ) : tournament ? (
                "Guardar cambios"
              ) : (
                "Crear torneo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
