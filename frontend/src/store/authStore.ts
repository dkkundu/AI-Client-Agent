import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isChecking: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API = 'http://localhost:3001';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isChecking: true,

      checkAuth: async () => {
        const { token } = get();
        if (!token) { set({ isChecking: false }); return; }
        try {
          const res = await fetch(`${API}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, isChecking: false });
          } else {
            set({ user: null, token: null, isChecking: false });
          }
        } catch {
          set({ isChecking: false });
        }
      },

      login: async (email, password) => {
        try {
          const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) return data.error ?? 'Login failed.';
          set({ user: data.user, token: data.token });
          return null;
        } catch {
          return 'Could not reach the server.';
        }
      },

      register: async (name, email, password) => {
        try {
          const res = await fetch(`${API}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
          });
          const data = await res.json();
          if (!res.ok) return data.error ?? 'Registration failed.';
          set({ user: data.user, token: data.token });
          return null;
        } catch {
          return 'Could not reach the server.';
        }
      },

      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'llm-client-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
