import { create } from 'zustand';
import { User } from '../types';
import { activityLogger } from '../db/activityLogger';

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
    activityLogger.setUser(user.id, user.name);
    activityLogger.log('login', `${user.name} logged in as ${user.role}`);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    const user = JSON.parse(localStorage.getItem('authUser') || 'null') as User | null;
    if (user) {
      activityLogger.log('logout', `${user.name} logged out`);
    }
    activityLogger.clearUser();
    localStorage.removeItem('authUser');
    set({ user: null, isAuthenticated: false });
  },
}));
