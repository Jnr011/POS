import { create } from 'zustand';
import { User } from '../types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const stored = localStorage.getItem('authUser');

export const useAuthStore = create<AuthStore>((set) => ({
  user: stored ? JSON.parse(stored) : null,
  isAuthenticated: !!stored,

  login: (user: User) => {
    localStorage.setItem('authUser', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('authUser');
    set({ user: null, isAuthenticated: false });
  },
}));
