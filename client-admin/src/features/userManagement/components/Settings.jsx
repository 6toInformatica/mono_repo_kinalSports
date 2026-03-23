import { useEffect } from "react";
import { useUserStore } from "../store/userAdminStore";
import { useUIStore } from "../../auth/store/uiStore.js";
import { useAuthStore } from "../../auth/store/authStore";

export const Settings = () => {
    const { users, loading, error, fetchUsers, changeRole } = useUserStore();
    const { openConfirm } = useUIStore();
    const { user: currentUser } = useAuthStore(); // 🔥 usuario logueado

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleChangeRole = (user) => {
        const newRole =
            user.role === "ADMIN_ROLE" ? "USER_ROLE" : "ADMIN_ROLE";

        openConfirm({
            title: "Cambiar Rol",
            message: `¿Seguro que deseas cambiar el rol de ${user.username} a ${newRole}?`,
            onConfirm: async () => {
                await changeRole(user.id, newRole);
            },
        });
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                Gestión de Usuarios
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {!loading && !error && (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left px-6 py-3">Usuario</th>
                                <th className="text-left px-6 py-3">Email</th>
                                <th className="text-left px-6 py-3">Rol</th>
                                <th className="text-right px-6 py-3">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => {
                                const isCurrentUser = currentUser?.id === user.id;

                                return (
                                    <tr
                                        key={user.id}
                                        className="border-t hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <img
                                                src={user.profilePicture}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <span className="font-medium text-gray-800">
                                                {user.username}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-gray-600">
                                            {user.email}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 text-xs rounded-full font-medium ${user.role === "ADMIN_ROLE"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-gray-100 text-gray-700"
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleChangeRole(user)}
                                                disabled={loading || isCurrentUser}
                                                className={`px-4 py-2 rounded-lg text-xs font-medium transition text-white ${isCurrentUser
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {isCurrentUser
                                                    ? "No permitido"
                                                    : user.role === "ADMIN_ROLE"
                                                        ? "Make User"
                                                        : "Make Admin"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};