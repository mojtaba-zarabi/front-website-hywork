// src/components/OtpInput.tsx
'use client';

import { useRef, useEffect, KeyboardEvent, ChangeEvent, ClipboardEvent, forwardRef, useImperativeHandle } from 'react';

interface OtpInputProps {
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
}

export interface OtpInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(({ 
  value, 
  onChange, 
  onComplete, 
  disabled = false,
  error = false,
  length = 6
}, ref) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getValueArray = (): string[] => {
    if (Array.isArray(value)) {
      return value.length === length ? value : Array(length).fill('');
    }
    const str = value || '';
    const arr = str.split('').slice(0, length);
    while (arr.length < length) {
      arr.push('');
    }
    return arr;
  };

  const normalizedValue = getValueArray();

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRefs.current[0] && !disabled) {
        inputRefs.current[0].focus();
      }
    },
    clear: () => {
      onChange(Array(length).fill(''));
    },
    getValue: () => {
      return normalizedValue.join('');
    }
  }));

  useEffect(() => {
    // فوکوس روی اولین input خالی
    if (!disabled) {
      const firstEmptyIndex = normalizedValue.findIndex(d => d === '');
      const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 100);
    }
  }, [disabled]);

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (!/^\d*$/.test(newValue)) return;

    const newOtp = [...normalizedValue];
    newOtp[index] = newValue.slice(-1);
    
    onChange(newOtp);

    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const isComplete = newOtp.every((digit) => digit !== '');
    if (isComplete && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !normalizedValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } 
    else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } 
    else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    
    if (!pastedData) return;

    const newOtp = [...normalizedValue];
    for (let i = 0; i < Math.min(pastedData.length, length); i++) {
      newOtp[i] = pastedData[i];
    }
    
    onChange(newOtp);

    const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
    if (lastFilledIndex < length - 1 && !disabled) {
      inputRefs.current[lastFilledIndex + 1]?.focus();
    }

    const isComplete = newOtp.every((digit) => digit !== '');
    if (isComplete && onComplete) {
      onComplete(newOtp.join(''));
    }
  };

  const handleContainerClick = () => {
    if (!disabled) {
      const firstEmptyIndex = normalizedValue.findIndex(d => d === '');
      const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div 
      className="flex gap-2 sm:gap-3 justify-center my-4" 
      dir="ltr"
      onClick={handleContainerClick}
      style={{ cursor: disabled ? 'default' : 'text' }}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={normalizedValue[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          dir="ltr"
          className={`
            w-12 h-14 sm:w-14 sm:h-16 
            text-center text-xl sm:text-2xl font-bold 
            border-2 rounded-xl outline-none transition-all
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          `}
          style={{ 
            direction: 'ltr',
            textAlign: 'center',
          }}
          autoComplete="one-time-code"
          aria-label={`رقم ${index + 1} از ${length}`}
        />
      ))}
    </div>
  );
});

OtpInput.displayName = 'OtpInput';

export default OtpInput;