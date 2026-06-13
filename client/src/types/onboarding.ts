import type { Step as JoyrideStep } from 'react-joyride';

export interface TourPageGroup {
  route: string;
  label: string;
  steps: JoyrideStep[];
}

export interface MobileSlide {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface OnboardingStore {
  isActive: boolean;
  currentGroupIndex: number;
  isNavigating: boolean;
  completed: Record<number, boolean>;
  startTour: () => void;
  nextGroup: () => void;
  completeTour: () => void;
  cancelTour: () => void;
  setNavigating: (v: boolean) => void;
  markCompleted: (userId: number) => void;
  isCompleted: (userId: number) => boolean;
  reset: (userId: number) => void;
}
