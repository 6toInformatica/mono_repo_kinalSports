import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFieldsStore } from "../../../store/adminStore";
import { Spinner } from "../../auth/components/Spinner.jsx";
import { useSaveField } from "../hooks/useSaveField";

export function FieldModal({ isOpen, onClose, field }) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const { saveField } = useSaveField();
    const loading = useFieldsStore((state) => state.loading);

    useEffect(() => {
        if (isOpen) {
            if (field) {
                reset({
                    fieldName: field.fieldName,
                    fieldType: field.fieldType,
                    capacity: field.capacity,
                    pricePerHour: field.pricePerHour,
                    description: field.description,
                });
            } else {
                reset({
                    fieldName: "",
                    fieldType: "",
                    capacity: "",
                    pricePerHour: "",
                    description: "",
                    photo: null
                });
            }
        }
    }, [isOpen]);


    const onSubmit = async (data) => {
        await saveField(data, field?._id);
        reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[450px]">
                <h2 className="text-xl font-semibold mb-4">
                    {field ? "Editar Campo" : "Agregar Campo Deportivo"}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <input
                            className="w-full border p-2 rounded"
                            placeholder="Nombre del campo"
                            {...register("fieldName", {
                                required: "El nombre es obligatorio",
                                minLength: {
                                    value: 3,
                                    message: "Debe tener al menos 3 caracteres",
                                },
                            })}
                        />
                        {errors.fieldName && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.fieldName.message}
                            </p>
                        )}
                    </div>

                    {/* Tipo */}
                    <div>
                        <select
                            className="w-full border p-2 rounded"
                            {...register("fieldType", { required: "El tipo es obligatorio" })}
                        >
                            <option value="">Seleccione un tipo</option>
                            <option value="SINTETICA">Sintética</option>
                            <option value="CONCRETO">Concreto</option>
                            <option value="CONCRETO">Natural</option>
                        </select>
                        {errors.fieldType && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.fieldType.message}
                            </p>
                        )}
                    </div>

                    {/* Capacidad */}
                    <div>
                        <select
                            className="w-full border p-2 rounded"
                            {...register("capacity", {
                                required: "La capacidad es obligatoria",
                            })}
                        >
                            <option value="">Seleccione capacidad</option>
                            <option value="FUTBOL_5">Fútbol 5</option>
                            <option value="FUTBOL_7">Fútbol 7</option>
                            <option value="FUTBOL_11">Fútbol 11</option>
                        </select>
                        {errors.capacity && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.capacity.message}
                            </p>
                        )}
                    </div>

                    {/* Precio */}
                    <div>
                        <input
                            type="number"
                            className="w-full border p-2 rounded"
                            placeholder="Precio por hora"
                            {...register("pricePerHour", {
                                required: "El precio es obligatorio",
                                min: { value: 1, message: "Debe ser mayor a 0" },
                            })}
                        />
                        {errors.pricePerHour && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.pricePerHour.message}
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <textarea
                            className="w-full border p-2 rounded"
                            placeholder="Descripción"
                            {...register("description", {
                                required: "La descripción es obligatoria",
                            })}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Imagen */}
                    <div>
                        <input
                            type="file"
                            className="w-full"
                            accept="image/*"
                            {...register("photo")}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            {loading ? <Spinner small /> : field ? "Guardar cambios" : "Añadir"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}