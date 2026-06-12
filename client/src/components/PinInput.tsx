import React, { useRef, useImperativeHandle, useCallback } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  reveal?: boolean;
  id?: string;
  autoFocus?: boolean;
}

export const PinInput = React.forwardRef<HTMLInputElement, PinInputProps>(
  ({ value, onChange, length = 5, disabled, reveal, id, autoFocus }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const hiddenRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => hiddenRef.current!);

    const focusIndex = useCallback((index: number) => {
      const next = inputRefs.current[index];
      if (next) next.focus();
    }, []);

    const handleChange = (index: number, char: string) => {
      if (char && !/^\d$/.test(char)) return;
      const digits = value.split('');
      digits[index] = char;
      const newVal = digits.join('');
      onChange(newVal);
      if (char && index < length - 1) {
        focusIndex(index + 1);
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (value[index]) {
          handleChange(index, '');
        } else if (index > 0) {
          focusIndex(index - 1);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        focusIndex(index - 1);
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        focusIndex(index + 1);
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (text) {
        onChange(text);
        focusIndex(Math.min(text.length, length - 1));
      }
    };

    return (
      <div className="flex gap-2 justify-center" id={id}>
        <input ref={hiddenRef} tabIndex={-1} className="sr-only" aria-hidden />
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] || '';
          return (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type={reveal ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              autoFocus={autoFocus && i === 0}
              autoComplete="off"
              className={`size-11 text-center text-lg font-mono font-bold rounded-lg border transition-colors ${
                digit
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-input bg-background text-foreground'
              } focus:border-ring focus:ring-1 focus:ring-ring outline-none disabled:opacity-50`}
            />
          );
        })}
      </div>
    );
  }
);

PinInput.displayName = 'PinInput';
