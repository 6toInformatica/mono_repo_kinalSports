import { useUIStore } from "../store/uiStore";

export const Modal = () => {
    const { modal, closeModal } = useUIStore();

    if (!modal.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 text-center shadow-lg">
                <h2 className="text-xl font-bold mb-2">{modal.title}</h2>
                <p className="mb-4">{modal.message}</p>

                <button
                    type="button"
                    onClick={closeModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};
