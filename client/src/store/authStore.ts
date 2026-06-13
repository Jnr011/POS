import { create } from 'zustand';
import { User } from '../types';
import { activityLogger } from '../db/activityLogger';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

let initialUser: User | null = null;
try {
  const stored = localStorage.getItem('authUser');
  if (stored) initialUser = JSON.parse(stored);
} catch {
  localStorage.removeItem('authUser');
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,

  login: (user: User) => {
    localStorage.setItem('authUser', JSON.stringify(user));
    activityLogger.setUser(user.id, user.name);
    activityLogger.log('login', `${user.name} logged in as ${user.role}`);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    try {
      const stored = localStorage.getItem('authUser');
      if (stored) {
        const user = JSON.parse(stored) as User;
        activityLogger.log('logout', `${user.name} logged out`);
      }
    } catch {}
    activityLogger.clearUser();
    localStorage.removeItem('authUser');
    set({ user: null, isAuthenticated: false });
  },
}));
