import { useEffect, useState } from "react";
import { useFieldsStore } from "../../../store/adminStore.js";
import { Spinner } from "../../auth/components/Spinner.jsx";
import { FieldModal } from "./FieldModal.jsx";
import { useUIStore } from "../../auth/store/uiStore.js";

export function Fields() {
    const { fields, loading, error, getFields, deleteField } = useFieldsStore();
    const [openModal, setOpenModal] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const { openConfirm } = useUIStore();

    useEffect(() => {
        getFields();
    }, []);

    if (loading) return <Spinner />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">
                    Gestión de Canchas
                </h1>

                <button
                    className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
                    onClick={() => {
                        setSelectedField(null);
                        setOpenModal(true);
                    }}
                >
                    + Agregar Campo
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fields.map((field) => (
                    <div
                        key={field._id}
                        className="bg-white shadow rounded-xl p-5"
                    >
                        <img
                            src={field.photo}
                            alt={field.fieldName}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                        />

                        <h2 className="text-xl font-semibold text-gray-700">
                            {field.fieldName}
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Tipo: {field.capacity.replace("_", " ")}
                        </p>

                        <p className="text-gray-500">
                            Precio por hora: Q{field.pricePerHour}
                        </p>

                        <div className="flex gap-3 mt-4">
                            <button
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                onClick={() => {
                                    setSelectedField(field);
                                    setOpenModal(true);
                                }}
                            >
                                Editar
                            </button>

                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                onClick={() => {
                                    openConfirm({
                                        title: "Eliminar campo",
                                        message: `¿Está seguro que desea eliminar ${field.fieldName}?`,
                                        onConfirm: () => deleteField(field._id)
                                    });

                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <FieldModal
                isOpen={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setSelectedField(null);
                }}
                field={selectedField}
            />

        </div>
    );
}
