// src/app/(auth)/login/page.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { useToast } from '@/components/NotificationToast';

// ============================================
// ثابت‌های برنامه
// ============================================

/** آدرس پایه API */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** مسیرهای API */
const API_ENDPOINTS = {
  REQUEST_OTP: '/auth/request-otp',
} as const;

/** الگوی شماره موبایل ایران */
const PHONE_REGEX = /^09[0-9]{9}$/;

/** زمان تاخیر برای هدایت (میلی‌ثانیه) */
const REDIRECT_DELAY = 500;

// ============================================
// توابع کمکی
// ============================================

/**
 * نرمال‌سازی شماره موبایل
 * 
 * تبدیل فرمت‌های مختلف به فرمت استاندارد ۰۹۱۲۳۴۵۶۷۸۹
 * 
 * @param input - شماره موبایل ورودی
 * @returns شماره موبایل نرمال‌سازی شده
 * @throws {Error} اگر شماره موبایل معتبر نباشد
 */
function normalizePhoneNumber(input: string): string {
  // حذف فاصله‌ها و کاراکترهای اضافی
  let phone = input.trim().replace(/\s/g, '');
  
  // اگر با 9 شروع شد، 0 را اضافه کن (مثال: 9123456789 -> 09123456789)
  if (phone.startsWith('9')) {
    phone = '0' + phone;
  }
  
  // اگر با +98 شروع شد، تبدیل کن (مثال: +989123456789 -> 09123456789)
  if (phone.startsWith('+98')) {
    phone = '0' + phone.substring(3);
  }
  
  // اگر با 0098 شروع شد، تبدیل کن
  if (phone.startsWith('0098')) {
    phone = '0' + phone.substring(4);
  }
  
  // اعتبارسنجی نهایی
  if (!PHONE_REGEX.test(phone)) {
    throw new Error('شماره موبایل معتبر نیست (مثال: 09123456789)');
  }
  
  return phone;
}

/**
 * ارسال درخواست OTP به سرور
 */
async function requestOTP(phoneNumber: string): Promise<void> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.REQUEST_OTP}`;
  
  console.log('📡 ارسال درخواست OTP:', {
    url,
    phone: phoneNumber,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ phone: phoneNumber }),
  });

  // خواندن پاسخ به صورت text برای جلوگیری از خطای parsing
  const text = await response.text();
  let result;
  
  try {
    result = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('❌ خطا در parsing پاسخ:', parseError);
    console.error('📄 محتوای پاسخ:', text);
    throw new Error('پاسخ نامعتبر از سرور دریافت شد');
  }

  // بررسی موفقیت درخواست
  if (!response.ok) {
    const errorMessage = result.message || `خطای سرور: ${response.status}`;
    console.error('❌ خطای سرور:', {
      status: response.status,
      message: errorMessage,
      result,
    });
    throw new Error(errorMessage);
  }

  console.log('✅ درخواست OTP با موفقیت ارسال شد:', {
    phone: phoneNumber,
    status: response.status,
  });
}

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه ورود - مدیریت ارسال OTP
 * 
 * روند کار:
 * 1. کاربر شماره موبایل را وارد می‌کند
 * 2. نرمال‌سازی و اعتبارسنجی شماره
 * 3. ارسال درخواست OTP به سرور
 * 4. در صورت موفقیت: ذخیره شماره و هدایت به صفحه تایید
 * 5. در صورت شکست: نمایش پیام خطا
 * 
 * نکته: این صفحه به UserContext نیازی ندارد چون اطلاعات کاربر
 * فقط بعد از تایید OTP در صفحه Verify مشخص می‌شود
 */
export default function LoginPage() {
  // ============================================
  // هوک‌های ری‌اکت
  // ============================================
  const router = useRouter();
  const { success, error } = useToast();
  
  // ============================================
  // وضعیت‌های کامپوننت
  // ============================================
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // رفرنس‌ها (Refs)
  // ============================================
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // افکت‌ها (Effects)
  // ============================================

  /**
   * پاک‌سازی تایمرها هنگام unmount
   */
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        console.log('🧹 تایمر هدایت پاک‌سازی شد');
      }
    };
  }, []);

  // ============================================
  // مدیریت رویدادها
  // ============================================

  /**
   * مدیریت ورود کاربر
   * 
   * @param data - اطلاعات فرم شامل شناسه (شماره موبایل)
   */
  const handleLogin = useCallback(async (data: { identifier: string }) => {
    // لاگ: شروع فرآیند ورود
    console.log('🔑 شروع فرآیند ورود:', {
      hasIdentifier: !!data.identifier,
      timestamp: new Date().toISOString(),
    });

    // ============================================
    // مرحله 1: اعتبارسنجی ورودی
    // ============================================
    if (!data.identifier || data.identifier.trim() === '') {
      console.warn('⚠️ شماره موبایل وارد نشده است');
      error('لطفاً شماره موبایل را وارد کنید');
      return;
    }

    // ============================================
    // مرحله 2: نرمال‌سازی شماره
    // ============================================
    let phoneNumber: string;
    try {
      phoneNumber = normalizePhoneNumber(data.identifier);
      console.log('📱 شماره نرمال‌سازی شده:', phoneNumber);
    } catch (normalizeError) {
      const message = normalizeError instanceof Error ? normalizeError.message : 'شماره موبایل نامعتبر';
      console.error('❌ خطا در نرمال‌سازی شماره:', normalizeError);
      error(message);
      return;
    }

    // ============================================
    // مرحله 3: ارسال درخواست به سرور
    // ============================================
    setIsLoading(true);

    try {
      // ارسال درخواست OTP
      await requestOTP(phoneNumber);

      // ============================================
      // مرحله 4: ذخیره اطلاعات و هدایت
      // ============================================
      
      // ذخیره شماره تلفن برای صفحه تایید
      sessionStorage.setItem('phoneNumber', phoneNumber);
      console.log('💾 شماره در sessionStorage ذخیره شد');
      
      // نمایش پیام موفقیت
      success('کد تایید به شماره شما ارسال شد');
      console.log('✅ کد تایید با موفقیت ارسال شد');
      
      // پاک‌سازی تایمر قبلی اگر وجود دارد
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      // هدایت به صفحه تایید با کمی تاخیر
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
        console.log('🚀 هدایت به صفحه تایید:', phoneNumber);
      }, REDIRECT_DELAY);

    } catch (err) {
      // ============================================
      // مرحله 5: مدیریت خطا
      // ============================================
      
      console.error('❌ خطا در فرآیند ورود:', err);
      
      // تشخیص نوع خطا و نمایش پیام مناسب
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        error('❌ اتصال به سرور برقرار نشد. لطفاً مطمئن شوید بک‌اند در حال اجراست.');
      } else if (err instanceof Error) {
        // نمایش پیام خطای خاص از سرور
        error(err.message);
      } else {
        // خطای ناشناخته
        error('خطا در ارسال کد تایید. لطفاً مجدداً تلاش کنید.');
      }
    } finally {
      // ============================================
      // مرحله 6: پایان عملیات
      // ============================================
      setIsLoading(false);
      console.log('🏁 فرآیند ورود به پایان رسید');
    }
  }, [router, success, error]);

  // ============================================
  // رندر کردن
  // ============================================

  console.log('🖥️ رندر صفحه ورود:', {
    isLoading,
    timestamp: new Date().toISOString(),
  });

  return (
    <main 
      className="min-h-screen flex items-center justify-center bg-bg-primary p-4"
      role="main"
      aria-label="صفحه ورود"
    >
      <div className="w-full max-w-md">
        <LoginForm 
          onSubmit={handleLogin} 
          isLoading={isLoading} 
        />
      </div>
    </main>
  );
}

// ============================================
// تنظیمات خروجی
// ============================================

/** جلوگیری از کش استاتیک Next.js */
export const dynamic = 'force-dynamic';