// components/NotificationToast.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

// ==================== Types ====================
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => number;
  removeToast: (id: number) => void;
  success: (message: string, duration?: number) => number;
  error: (message: string, duration?: number) => number;
  warning: (message: string, duration?: number) => number;
  info: (message: string, duration?: number) => number;
  clearAll: () => void;
  toasts: Toast[];
}

interface ToastProviderProps {
  children: ReactNode;
}

// ==================== Context ====================
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// ==================== Toast Provider ====================
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  // تغییر به 10 ثانیه (10000 میلی‌ثانیه)
  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 10000) => {
    const id = Date.now() + Math.random();
    const newToast: Toast = {
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (duration && duration !== Infinity) {
      const timeoutId = setTimeout(() => {
        removeToast(id);
      }, duration);
      timeoutsRef.current[id] = timeoutId;
    }

    return id;
  }, [removeToast]);

  // همه توابع با 10 ثانیه پیش‌فرض
  const success = useCallback((message: string, duration: number = 10000) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message: string, duration: number = 10000) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration: number = 10000) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message: string, duration: number = 10000) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const clearAll = useCallback(() => {
    Object.keys(timeoutsRef.current).forEach((id) => {
      clearTimeout(timeoutsRef.current[Number(id)]);
    });
    timeoutsRef.current = {};
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      Object.keys(timeoutsRef.current).forEach((id) => {
        clearTimeout(timeoutsRef.current[Number(id)]);
      });
    };
  }, []);

  const value: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
    toasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// ==================== Toast Container ====================
interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-5 right-5 left-auto z-9999 flex flex-col gap-3 pointer-events-none md:bottom-5 md:right-5 md:left-auto max-[768px]:bottom-20 max-[768px]:right-4 max-[768px]:left-4">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// ==================== Toast Item ====================
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // مدیریت زمان با پشتیبانی از توقف در هاور
  const elapsedRef = useRef(0); // مقدار زمان سپری‌شده تا لحظه‌ی آخرین توقف (ms)
  const lastTickRef = useRef<number | null>(null); // زمان شروع تیک جاری (در افکت مقداردهی می‌شود، نه در رندر)
  const isPausedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    setIsExiting((prevExiting) => {
      if (prevExiting) return prevExiting;
      setTimeout(() => {
        onClose();
      }, 300);
      return true;
    });
  }, [onClose]);

  const scheduleClose = useCallback((remainingMs: number) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      handleClose();
    }, remainingMs);
  }, [handleClose]);

  useEffect(() => {
    if (!toast.duration || toast.duration === Infinity) return;

    lastTickRef.current = Date.now();
    scheduleClose(toast.duration);

    const tick = () => {
      if (!isPausedRef.current && lastTickRef.current !== null) {
        const now = Date.now();
        elapsedRef.current += now - lastTickRef.current;
        lastTickRef.current = now;

        const remaining = Math.max(0, 100 - (elapsedRef.current / toast.duration) * 100);
        setProgress(remaining);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [toast.duration, scheduleClose]);

  const handleMouseEnter = () => {
    if (!toast.duration || toast.duration === Infinity) return;
    isPausedRef.current = true;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleMouseLeave = () => {
    if (!toast.duration || toast.duration === Infinity) return;
    isPausedRef.current = false;
    lastTickRef.current = Date.now();
    const remaining = Math.max(0, toast.duration - elapsedRef.current);
    scheduleClose(remaining);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeLinecap="round"/>
            <path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" stroke="currentColor"/>
            <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor"/>
            <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor"/>
          </svg>
        );
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'border-emerald-500';
      case 'error': return 'border-red-500';
      case 'warning': return 'border-amber-500';
      default: return 'border-blue-500';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div 
      className={`min-w-75 max-w-100 bg-white dark:bg-(--color-bg-card) rounded-xl shadow-lg pointer-events-auto overflow-hidden rtl relative max-[768px]:min-w-auto max-[768px]:max-w-full max-[768px]:w-full border-r-4 ${getBorderColor()} ${
        isExiting ? 'animate-[slideOutRight_0.3s_ease-in-out_forwards]' : 'animate-[slideInRight_0.3s_ease-in-out_forwards]'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 p-3.5 px-4">
        <div className="shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 text-sm font-medium leading-relaxed text-[#1e293b] dark:text-text-primary">
          {toast.message}
        </div>
        <button 
          className="shrink-0 bg-transparent border-none cursor-pointer p-1 rounded-md flex items-center justify-center transition-all duration-200 text-[#94a3b8] hover:bg-bg-surface dark:hover:bg-bg-surface hover:text-[#475569] dark:hover:text-text-secondary"
          onClick={handleClose}
          aria-label="بستن اعلان"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor"/>
          </svg>
        </button>
      </div>
      
      {/* Progress Bar - نازک‌تر و نشان‌دهنده‌ی کاهش زمان، با توقف در هاور */}
      {toast.duration && toast.duration !== Infinity && (
        <div className="h-0.75 bg-black/10 dark:bg-white/10 overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()}`}
            style={{ 
              width: `${Math.max(0, progress)}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ==================== استایل‌های گلوبال ====================
export const ToastStyles = () => (
  <style>{`
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `}</style>
);

export default ToastProvider;