// components/VerifyForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import OtpInput, { OtpInputRef } from '@/components/OtpInput';

interface VerifyFormProps {
  identifier: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  isResending: boolean;
}

export default function VerifyForm({
  identifier,
  onVerify,
  onResend,
  isLoading,
  isResending,
}: VerifyFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRef = useRef<OtpInputRef>(null);

  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleComplete = async (code: string) => {
    setError(false);
    await onVerify(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpRef.current?.getValue() || otp.join('');
    
    if (code.length === 6) {
      setError(false);
      await onVerify(code);
    } else {
      setError(true);
    }
  };

  const handleResendClick = async () => {
    if (canResend) {
      await onResend();
      setTimer(60);
      setCanResend(false);
      setError(false);
      otpRef.current?.clear();
      otpRef.current?.focus();
    }
  };

  const formatIdentifier = (value: string) => {
    if (value.includes('@')) {
      return value;
    }
    if (value.length > 4) {
      return `***${value.slice(-4)}`;
    }
    return value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">تایید کد</h1>
        <p className="mt-2 text-sm text-text-secondary">
          کد ۶ رقمی ارسال شده به{' '}
          <span dir="ltr" className="font-medium text-text-primary">
            {formatIdentifier(identifier)}
          </span>{' '}
          را وارد کنید
        </p>
      </div>

      <OtpInput
        ref={otpRef}
        value={otp}
        onChange={(value) => setOtp(Array.isArray(value) ? value : value.split(''))}
        onComplete={handleComplete}
        disabled={isLoading}
        error={error}
        length={6}
      />

      {error && (
        <p className="text-center text-sm text-red-500">
          کد وارد شده صحیح نیست. لطفاً دوباره تلاش کنید.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || otp.some(d => d === '')}
        className="w-full rounded-lg bg-primary px-4 py-3 text-white font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            در حال بررسی...
          </span>
        ) : (
          'تایید کد'
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendClick}
          disabled={!canResend || isResending}
          className={`text-sm transition-colors ${
            canResend && !isResending
              ? 'text-primary hover:text-primary-dark cursor-pointer'
              : 'text-text-secondary cursor-not-allowed'
          }`}
        >
          {isResending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              در حال ارسال...
            </span>
          ) : canResend ? (
            'ارسال مجدد کد'
          ) : (
            `ارسال مجدد کد پس از ${timer} ثانیه`
          )}
        </button>
      </div>
    </form>
  );
}