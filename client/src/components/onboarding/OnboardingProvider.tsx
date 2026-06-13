import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { EventData } from 'react-joyride';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { adminTourGroups } from '../../onboarding/adminSteps';
import { salesTourGroups } from '../../onboarding/salesSteps';
import { adminMobileSlides, salesMobileSlides } from '../../onboarding/mobileSlides';
import { DesktopTour } from './DesktopTour';
import { MobileCarousel } from './MobileCarousel';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return mobile;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const user = useAuthStore(s => s.user);
  const {
    isActive, currentGroupIndex, isNavigating,
    startTour, nextGroup, completeTour, cancelTour,
    setNavigating, markCompleted, isCompleted,
  } = useOnboardingStore();

  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const transitioningRef = useRef(false);
  const groupIndexRef = useRef(currentGroupIndex);
  groupIndexRef.current = currentGroupIndex;

  const groups = user?.role === 'admin' ? adminTourGroups : salesTourGroups;
  const currentGroup = groups[currentGroupIndex];

  const currentSteps = currentGroup?.steps ?? [];
  const isOnCorrectPage = currentGroup && location.pathname === currentGroup.route;

  // ── On mount: start tour only if this user has never completed it ────────────
  useEffect(() => {
    if (!user || user.mustChangePin) return;
    if (isCompleted(user.id)) return;
    const timer = setTimeout(() => {
      setReady(true);
      startTour();
    }, 600);
    return () => clearTimeout(timer);
  }, [user?.id]); // only fires when the logged-in user changes

  // ── Navigate to first page group when the tour starts ─────────────────────────
  useEffect(() => {
    if (!isActive || isNavigating || ready) return;
    if (currentGroup && location.pathname !== currentGroup.route) {
      setNavigating(true);
      navigate(currentGroup.route);
    } else if (currentGroup && location.pathname === currentGroup.route) {
      setStepIndex(0);
      setReady(true);
    }
  }, [isActive, isNavigating, ready, currentGroup, location.pathname]);

  // ── Confirm arrival at navigated page ────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !isNavigating || !currentGroup) return;
    if (location.pathname !== currentGroup.route) return;

    const firstTarget = currentGroup.steps[0]?.target;
    if (!firstTarget) {
      transitioningRef.current = false;
      setNavigating(false);
      setStepIndex(0);
      setReady(true);
      return;
    }

    const targetSelector = firstTarget as string;
    if (document.querySelector(targetSelector)) {
      transitioningRef.current = false;
      setNavigating(false);
      setStepIndex(0);
      setReady(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(targetSelector)) {
        observer.disconnect();
        transitioningRef.current = false;
        setNavigating(false);
        setStepIndex(0);
        setReady(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location.pathname, isActive, isNavigating, currentGroup]);

  // ── Reset local state when the tour ends ──────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      setReady(false);
      setStepIndex(0);
    }
  }, [isActive]);

  // ── Joyride event handler ─────────────────────────────────────────────────────
  const handleEvent = useCallback((data: EventData) => {
    const { action, index, type } = data;

    if (type === 'step:after' && action === 'next') {
      const steps = groups[groupIndexRef.current]?.steps ?? [];
      if (index < steps.length - 1) {
        setStepIndex(i => i + 1);
      } else {
        if (groupIndexRef.current >= groups.length - 1) {
          if (user) markCompleted(user.id);
          completeTour();
        } else {
          transitioningRef.current = true;
          const nextRoute = groups[groupIndexRef.current + 1]?.route;
          if (nextRoute) {
            setNavigating(true);
            nextGroup();
            navigate(nextRoute);
          }
        }
      }
    }

    if (type === 'step:after' && action === 'prev') {
      setStepIndex(i => Math.max(0, i - 1));
    }

    if (action === 'skip' || action === 'close') {
      if (user) markCompleted(user.id);
      cancelTour();
    }

    if (type === 'tour:end' && action === 'complete' && !transitioningRef.current) {
      if (user) markCompleted(user.id);
      completeTour();
    }
  }, [groups, user]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { transitioningRef.current = false; };
  }, []);

  // ── Mobile: carousel dialog ───────────────────────────────────────────────────
  if (isMobile && isActive) {
    const mobileSlides = user?.role === 'admin' ? adminMobileSlides : salesMobileSlides;
    return (
      <>
        {children}
        <MobileCarousel
          open={isActive}
          slides={mobileSlides}
          onComplete={() => {
            if (user) markCompleted(user.id);
            completeTour();
          }}
          onSkip={() => {
            if (user) markCompleted(user.id);
            cancelTour();
          }}
        />
      </>
    );
  }

  // ── Desktop: only mount while tour is active (prevents stray beacon) ─────────
  const shouldRun = isActive && isOnCorrectPage && !isNavigating && ready;

  return (
    <>
      {children}
      {isActive && currentSteps.length > 0 && (
        <DesktopTour
          key={currentGroup.route}
          steps={currentSteps}
          run={shouldRun}
          stepIndex={stepIndex}
          onEvent={handleEvent}
        />
      )}
    </>
  );
}