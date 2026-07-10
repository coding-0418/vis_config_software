import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// Mock credentials — replace with Electron IPC auth call
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: { id: '1', username: 'admin', role: 'admin', displayName: 'Administrator' },
  },
  operator: {
    password: 'op123',
    user: { id: '2', username: 'operator', role: 'operator', displayName: 'Line Operator' },
  },
  engineer: {
    password: 'eng123',
    user: { id: '3', username: 'engineer', role: 'engineer', displayName: 'Vision Engineer' },
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        // Simulate network / IPC latency
        await new Promise((r) => setTimeout(r, 800));

        // TODO: Replace with Electron IPC call: window.electronAPI.auth.login(credentials)
        const record = MOCK_USERS[credentials.username.toLowerCase()];
        if (record && record.password === credentials.password) {
          const user = { ...record.user, lastLogin: new Date().toISOString() };
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            rememberMe: credentials.rememberMe,
          });
          return true;
        }

        set({ isLoading: false, error: 'Invalid username or password.' });
        return false;
      },

      logout: () => {
        // TODO: Electron IPC: window.electronAPI.auth.logout()
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mvs-auth',
      // Only persist user and rememberMe — never persist raw credentials
      partialize: (s) =>
        s.rememberMe ? { user: s.user, isAuthenticated: s.isAuthenticated, rememberMe: true } : { rememberMe: false },
    },
  ),
);
