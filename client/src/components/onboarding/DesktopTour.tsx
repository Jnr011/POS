import { Joyride } from 'react-joyride';
import type { EventData, Step } from 'react-joyride';

interface DesktopTourProps {
  steps: Step[];
  run: boolean;
  stepIndex: number;
  onEvent: (data: EventData) => void;
}

export function DesktopTour({ steps, run, stepIndex, onEvent }: DesktopTourProps) {
  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={onEvent}
      options={{
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        primaryColor: '#2563eb',
        textColor: '#0f172a',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        scrollOffset: 100,
        scrollDuration: 500,
        spotlightPadding: 8,
        overlayClickAction: false,
        zIndex: 1000,
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip tour',
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltip: {
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '16px 20px 12px',
          fontSize: 13,
          lineHeight: 1.5,
          backgroundColor: '#ffffff',
        },
        tooltipTitle: {
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 6,
          color: '#0f172a',
        },
        tooltipContent: {
          padding: '4px 0 8px',
        },
        tooltipFooter: {
          marginTop: 8,
          padding: '8px 0 0',
        },
        buttonPrimary: {
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 14px',
          border: 0,
          cursor: 'pointer',
        },
        buttonBack: {
          color: '#64748b',
          backgroundColor: 'transparent',
          fontSize: 12,
          fontWeight: 500,
          marginRight: 4,
          border: 0,
          cursor: 'pointer',
          padding: 8,
        },
        buttonSkip: {
          color: '#64748b',
          backgroundColor: 'transparent',
          fontSize: 12,
          fontWeight: 500,
          border: 0,
          cursor: 'pointer',
          padding: 8,
        },
        buttonClose: {
          color: '#64748b',
          backgroundColor: 'transparent',
          border: 0,
          cursor: 'pointer',
          padding: 8,
        },
        beaconInner: {
          backgroundColor: '#2563eb',
        },
        beaconOuter: {
          border: '2px solid #2563eb',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    />
  );
}