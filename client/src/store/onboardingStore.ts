import { create } from 'zustand';
import type { OnboardingStore } from '../types/onboarding';

function loadCompleted(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem('onboarding_completed');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCompleted(completed: Record<number, boolean>) {
  localStorage.setItem('onboarding_completed', JSON.stringify(completed));
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  isActive: false,
  currentGroupIndex: 0,
  isNavigating: false,
  completed: loadCompleted(),

  startTour: () => set({ isActive: true, currentGroupIndex: 0, isNavigating: false }),

  nextGroup: () => set(s => ({ currentGroupIndex: s.currentGroupIndex + 1 })),

  completeTour: () => set({ isActive: false, currentGroupIndex: 0, isNavigating: false }),

  cancelTour: () => set({ isActive: false, currentGroupIndex: 0, isNavigating: false }),

  setNavigating: (v: boolean) => set({ isNavigating: v }),

  markCompleted: (userId: number) => {
    const completed = { ...get().completed, [userId]: true };
    saveCompleted(completed);
    set({ completed });
  },

  isCompleted: (userId: number) => {
    return !!get().completed[userId];
  },

  reset: (userId: number) => {
    const completed = { ...get().completed };
    delete completed[userId];
    saveCompleted(completed);
    set({ completed });
  },
}));
