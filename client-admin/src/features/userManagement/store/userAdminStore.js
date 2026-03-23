import { create } from "zustand";
import { getAllUsers, changeUserRole } from "../../../service";

export const useUserStore = create((set) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
        try {
            set({ loading: true, error: null });

            const { data } = await getAllUsers();
            console.log("Fetched users:", data);
            set({
                users: data.users || data,
                loading: false,
            });

        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Error al obtener usuarios";

            set({
                error: message,
                loading: false,
            });
        }
    },

    changeRole: async (userId, roleName) => {
        try {
            set({ loading: true, error: null });

            const { data } = await changeUserRole(userId, roleName);

            set((state) => ({
                users: state.users.map((u) =>
                    u.id === userId ? data : u
                ),
                loading: false,
            }));

        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Error al cambiar rol";

            set({
                error: message,
                loading: false,
            });
        }
    },

    clearUsers: () => set({ users: [] }),
}));