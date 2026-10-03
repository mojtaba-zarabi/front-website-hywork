// src/app/(auth)/verify/page.tsx
'use client';

import { Suspense, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import VerifyForm from '@/components/VerifyForm';
import { UserContext } from '@/contexts/UserContext';
import { useToast } from '@/components/NotificationToast';

// ============================================
// ثابت‌های برنامه
// ============================================
const VERIFICATION_CODE_LENGTH = 6; // طول کد تایید
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================
// تعریف نوع‌های داده
// ============================================
interface VerifyResponse {
  user?: {
    id: number;
    phone: string;
    username?: string; // اختیاری
    firstName?: string;
    lastName?: string;
    avatar?: string;
    city?: string;
    isVerified?: boolean;
  };
  message?: string;
}

// ============================================
// هوک‌های سفارشی (Custom Hooks)
// ============================================

/**
 * هوک دریافت شماره تلفن از پارامترهای URL یا حافظه موقت مرورگر
 * 
 * اولویت: پارامتر URL > حافظه موقت > رشته خالی
 */
function usePhoneNumber() {
  const searchParams = useSearchParams();
  const phoneFromUrl = searchParams.get('phone'); // دریافت از آدرس
  const phoneFromSession = sessionStorage.getItem('phoneNumber'); // دریافت از حافظه موقت
  
  return phoneFromUrl || phoneFromSession || '';
}

/**
 * تابع کمکی برای ارسال درخواست به سرور
 */
async function apiRequest<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  // ارسال درخواست به سرور
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // ارسال کوکی‌ها
  });

  const result = await response.json();

  // اگر پاسخ موفقیت‌آمیز نبود، خطا پرتاب کن
  if (!response.ok) {
    throw new Error(result.message || 'عملیات با شکست مواجه شد');
  }

  return result;
}

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه تایید کد - مدیریت فرآیند تایید OTP
 * 
 * روند کار:
 * 1. دریافت شماره تلفن از آدرس یا حافظه موقت مرورگر
 * 2. کاربر کد ۶ رقمی را وارد می‌کند
 * 3. تایید کد با سرور
 * 4. در صورت موفقیت: بروزرسانی اطلاعات کاربر و انتقال به داشبورد
 * 5. در صورت شکست: نمایش پیام خطا
 * 6. امکان ارسال مجدد کد
 */
// useSearchParams نیاز به Suspense دارد تا صفحه در build پیش‌رندر شود
export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}

function VerifyPageContent() {
  // ============================================
  // هوک‌های ری‌اکت
  // ============================================
  const router = useRouter(); // برای هدایت کاربر
  const { setUser } = useContext(UserContext); // برای ذخیره اطلاعات کاربر
  const { success, error } = useToast(); // برای نمایش پیام‌ها
  
  // ============================================
  // وضعیت‌های کامپوننت
  // ============================================
  const phoneNumber = usePhoneNumber(); // شماره تلفن کاربر
  const [isLoading, setIsLoading] = useState(false); // وضعیت بارگذاری تایید
  const [isResending, setIsResending] = useState(false); // وضعیت بارگذاری ارسال مجدد
  
  // ============================================
  // رفرنس‌ها (Refs)
  // ============================================
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // برای مدیریت تایم‌اوت هدایت
  const isMounted = useRef(false); // وضعیت نصب کامپوننت بدون ایجاد رندر اضافی

  // ============================================
  // افکت‌ها (Effects)
  // ============================================

  /**
   * افکت نصب کامپوننت
   * اعتبارسنجی شماره تلفن و هدایت در صورت عدم وجود
   */
  useEffect(() => {
    // ثبت وضعیت نصب بدون ایجاد رندر اضافی
    isMounted.current = true;
    
    // لاگ: کامپوننت با شماره تلفن مشخص بارگذاری شد
    console.log('[صفحه تایید] بارگذاری با شماره:', phoneNumber);

    // بررسی وجود شماره تلفن
    if (!phoneNumber) {
      console.warn('[صفحه تایید] شماره تلفن یافت نشد، هدایت به صفحه ورود');
      error('شماره تلفن یافت نشد');
      router.push('/login');
      return;
    }

    // پاک‌سازی: حذف تایم‌اوت‌های باقی‌مانده
    return () => {
      isMounted.current = false;
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [phoneNumber, router, error]);

  // ============================================
  // مدیریت رویدادها
  // ============================================

  /**
   * تایید کد OTP
   * 
   * @param code - کد ۶ رقمی تایید
   */
  const handleVerify = useCallback(async (code: string) => {
    // اعتبارسنجی: بررسی طول کد
    if (!code || code.length !== VERIFICATION_CODE_LENGTH) {
      console.warn('[صفحه تایید] طول کد نامعتبر:', code.length);
      error(`کد تایید باید ${VERIFICATION_CODE_LENGTH} رقم باشد`);
      return;
    }

    // لاگ: تلاش برای تایید
    console.log('[صفحه تایید] در حال تایید برای شماره:', phoneNumber);

    setIsLoading(true);

    try {
      // درخواست به سرور برای تایید کد
      const result = await apiRequest<VerifyResponse>('/auth/verify-otp', {
        phone: phoneNumber,
        code: code.trim(),
      });

      // لاگ: تایید موفقیت‌آمیز
      console.log('[صفحه تایید] تایید موفق برای شماره:', phoneNumber);

      // بروزرسانی: اطلاعات کاربر و حافظه محلی
      if (result.user) {
        // ایجاد آبجکت کاربر با تمام فیلدهای موجود
        const userData = {
          id: result.user.id,
          phone: result.user.phone,
          // اگر فیلدهای اختیاری وجود دارند، آنها را هم اضافه کن
          ...(result.user.username && { username: result.user.username }),
          ...(result.user.firstName && { firstName: result.user.firstName }),
          ...(result.user.lastName && { lastName: result.user.lastName }),
          ...(result.user.avatar && { avatar: result.user.avatar }),
          ...(result.user.city && { city: result.user.city }),
          ...(result.user.isVerified !== undefined && { isVerified: result.user.isVerified }),
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[صفحه تایید] اطلاعات کاربر بروزرسانی شد:', userData);
      }

      // پاک‌سازی: حذف اطلاعات موقت
      sessionStorage.removeItem('phoneNumber');
      console.log('[صفحه تایید] حافظه موقت پاک شد');

      // نمایش پیام موفقیت
      success('ورود با موفقیت انجام شد');

      // هدایت به داشبورد با کمی تاخیر
      redirectTimeoutRef.current = setTimeout(() => {
        router.push('/dashboard');
      }, 500);

    } catch (err) {
      // مدیریت خطا
      const errorMessage = err instanceof Error ? err.message : 'خطا در تایید کد';
      console.error('[صفحه تایید] خطا در تایید:', err);
      error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, setUser, success, error, router]);

  /**
   * ارسال مجدد کد تایید
   */
  const handleResend = useCallback(async () => {
    // لاگ: تلاش برای ارسال مجدد
    console.log('[صفحه تایید] درخواست ارسال مجدد کد برای:', phoneNumber);

    setIsResending(true);

    try {
      // درخواست به سرور برای ارسال کد جدید
      await apiRequest('/auth/request-otp', { phone: phoneNumber });

      // لاگ: ارسال مجدد موفق
      console.log('[صفحه تایید] کد مجدداً ارسال شد');

      // نمایش پیام موفقیت
      success('کد تایید مجدداً به شماره شما ارسال شد');

    } catch (err) {
      // مدیریت خطا
      const errorMessage = err instanceof Error ? err.message : 'خطا در ارسال مجدد کد';
      console.error('[صفحه تایید] خطا در ارسال مجدد:', err);
      error(errorMessage);
    } finally {
      setIsResending(false);
    }
  }, [phoneNumber, success, error]);

  // ============================================
  // رندر کردن
  // ============================================

  // اگر شماره تلفن وجود نداشته باشد، چیزی نمایش نده
  if (!phoneNumber) {
    console.log('[صفحه تایید] رندر نمی‌شود - شماره تلفن وجود ندارد');
    return null;
  }

  // رندر: نمایش فرم تایید
  console.log('[صفحه تایید] نمایش فرم تایید');
  return (
    <main 
      className="min-h-screen flex items-center justify-center bg-bg-primary p-4"
      role="main"
      aria-label="صفحه تایید کد"
    >
      <div className="w-full max-w-md">
        <VerifyForm
          identifier={phoneNumber} // شماره تلفن برای نمایش
          onVerify={handleVerify} // تابع تایید کد
          onResend={handleResend} // تابع ارسال مجدد
          isLoading={isLoading} // وضعیت بارگذاری
          isResending={isResending} // وضعیت ارسال مجدد
        />
      </div>
    </main>
  );
}

// ============================================
// تنظیمات خروجی
// ============================================
export const dynamic = 'force-dynamic'; // جلوگیری از کش استاتیک