import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: () => !!get().token,

            login: async (email, password) => {
                const { data } = await api.post('/auth/login', { email, password });
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                set({ token: data.token, user: data.user });
                return data;
            },

            register: async (email, password, name) => {
                const { data } = await api.post('/auth/register', { email, password, name });
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                set({ token: data.token, user: data.user });
                return data;
            },

            logout: () => {
                delete api.defaults.headers.common['Authorization'];
                set({ token: null, user: null });
            },

            initAuth: () => {
                const { token } = get();
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            }
        }),
        {
            name: 'diabetes-auth',
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
);
