// src/components/LoginForm.tsx
'use client';

import { useState, FormEvent } from 'react';

// ==================== TYPES ====================
interface LoginFormData {
  identifier: string;
}

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
}

export default function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError('لطفاً شماره تلفن یا ایمیل را وارد کنید');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);
    const isPhone = /^09[0-9]{9}$/.test(trimmedIdentifier);

    if (!isEmail && !isPhone) {
      setError('لطفاً یک ایمیل معتبر یا شماره تلفن همراه معتبر وارد کنید');
      return;
    }

    try {
      await onSubmit({ identifier: trimmedIdentifier });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال کد');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form 
        onSubmit={handleSubmit} 
        className="bg-bg-card shadow-[0_4px_20px_var(--color-shadow)] rounded-2xl px-6 sm:px-8 pt-6 pb-8 border border-border-color"
        dir="rtl"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-text-primary">
          ورود به حساب کاربری
        </h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-text-secondary text-sm font-medium mb-2">
            شماره تلفن یا ایمیل
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 border border-border-color rounded-xl text-sm outline-none transition-all bg-bg-primary text-text-primary font-sans focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="09123456789 یا example@email.com"
            disabled={isLoading}
            dir="ltr"
          />
          <p className="text-xs text-text-muted mt-1.5 text-right">
            کد تایید ۶ رقمی به شماره یا ایمیل شما ارسال خواهد شد
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !identifier.trim()}
          className="w-full bg-accent-color text-white border-none px-4 py-3 rounded-xl text-sm sm:text-base font-semibold cursor-pointer transition-all hover:bg-accent-hover hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              در حال ارسال کد...
            </span>
          ) : (
            'دریافت کد تایید'
          )}
        </button>
      </form>
    </div>
  );
}