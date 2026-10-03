// src/app/profile/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '@/components/NotificationToast';
import { fetchUserByUsername } from '@/services/postService';

// ============================================
// ثابت‌های برنامه
// ============================================

/** آدرس پایه API */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** مسیرهای API */
const API_ENDPOINTS = {
  GET_PROFILE: '/users/profile',
} as const;

/** وضعیت‌های بارگذاری */
const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

/** زمان تاخیر برای هدایت (میلی‌ثانیه) */
const REDIRECT_DELAY = 2000;

// ============================================
// تعریف نوع‌های داده
// ============================================

/** نوع داده پروفایل کاربر */
interface UserProfile {
  id: number | string;
  username: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  bio?: string;
  city?: string;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  joinedAt?: string;
  website?: string;
  email?: string;
  skills?: string[];
  experiences?: Experience[];
  education?: Education[];
  socialLinks?: SocialLinks;
}

/** نوع داده تجربه کاری */
interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

/** نوع داده تحصیلات */
interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
}

/** نوع داده لینک‌های اجتماعی */
interface SocialLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  telegram?: string;
}

/** پاسخ API برای دریافت پروفایل */
interface ProfileResponse {
  success: boolean;
  data?: UserProfile;
  message?: string;
}

// ============================================
// توابع کمکی
// ============================================

/**
 * دریافت پروفایل کاربر از سرور
 * 
 * @param username - نام کاربری
 * @param signal - AbortSignal برای لغو درخواست
 * @returns پروفایل کاربر
 * @throws {Error} اگر دریافت پروفایل با خطا مواجه شود
 */
async function fetchUserProfile(username: string, signal?: AbortSignal): Promise<UserProfile> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.GET_PROFILE}/${username}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await response.text();
    let result: ProfileResponse;
    
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { success: false };
    }

    if (response.ok && result.success && result.data) {
      return result.data;
    }
  } catch (fetchErr) {
    console.warn('⚠️ بک‌اند در دسترس نیست، استفاده از داده‌های محلی:', fetchErr);
  }

  // در صورت در دسترس نبودن بک‌اند، از داده‌های محلی استفاده می‌شود
  const localUser = fetchUserByUsername(username);
  if (localUser) {
    return {
      id: localUser.id,
      username: localUser.username,
      phone: localUser.email || '',
      fullName: localUser.name,
      avatar: localUser.avatar,
      bio: localUser.bio,
      isVerified: true,
      followersCount: 120,
      followingCount: 85,
      postsCount: 2,
      joinedAt: localUser.createdAt,
    };
  }

  throw new Error('پروفایل کاربر یافت نشد');
}

/**
 * ایجاد نام کامل از نام و نام خانوادگی
 */
function getFullName(firstName?: string, lastName?: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  return '';
}

/**
 * فرمت تاریخ به صورت فارسی
 */
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

// ============================================
// کامپوننت‌های زیرمجموعه
// ============================================

/**
 * کامپوننت نمایش وضعیت بارگذاری
 */
function LoadingProfile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-400">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-text-secondary">در حال بارگذاری پروفایل...</p>
    </div>
  );
}

/**
 * کامپوننت نمایش خطا
 */
function ErrorProfile({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-400">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">خطا در بارگذاری پروفایل</h2>
      <p className="text-text-secondary mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
      >
        تلاش مجدد
      </button>
    </div>
  );
}

/**
 * کامپوننت نمایش پروفایل
 */
function ProfileDisplay({ profile }: { profile: UserProfile }) {
  const fullName = getFullName(profile.firstName, profile.lastName);
  const joinedDate = formatDate(profile.joinedAt);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* هدر پروفایل */}
      <div className="bg-bg-secondary rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* آواتار - استفاده از next/image */}
          <div className="shrink-0">
            {profile.avatar ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary">
                <Image
                  src={profile.avatar}
                  alt={fullName || profile.username}
                  fill
                  className="object-cover"
                  sizes="96px"
                  priority
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl text-primary">
                {fullName ? fullName.charAt(0) : profile.username.charAt(0)}
              </div>
            )}
          </div>

          {/* اطلاعات اصلی */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              {fullName || profile.username}
            </h1>
            <p className="text-text-secondary">@{profile.username}</p>
            
            {profile.bio && (
              <p className="mt-2 text-text-primary">{profile.bio}</p>
            )}

            {/* آمار */}
            <div className="flex gap-6 mt-4">
              <div>
                <span className="font-bold text-text-primary">{profile.postsCount || 0}</span>
                <span className="text-text-secondary mr-1">پست</span>
              </div>
              <div>
                <span className="font-bold text-text-primary">{profile.followersCount || 0}</span>
                <span className="text-text-secondary mr-1">دنبال‌کننده</span>
              </div>
              <div>
                <span className="font-bold text-text-primary">{profile.followingCount || 0}</span>
                <span className="text-text-secondary mr-1">دنبال‌شونده</span>
              </div>
            </div>

            {/* تاریخ عضویت */}
            {joinedDate && (
              <p className="text-sm text-text-secondary mt-2">
                عضو از {joinedDate}
              </p>
            )}

            {/* وضعیت تایید */}
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <span>✅</span>
                تایید شده
              </span>
            )}
          </div>
        </div>
      </div>

      {/* اطلاعات تکمیلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* شهر */}
        {profile.city && (
          <div className="bg-bg-secondary rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-text-primary mb-1">📍 شهر</h3>
            <p className="text-text-secondary">{profile.city}</p>
          </div>
        )}

        {/* وبسایت */}
        {profile.website && (
          <div className="bg-bg-secondary rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-text-primary mb-1">🌐 وبسایت</h3>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {profile.website}
            </a>
          </div>
        )}

        {/* ایمیل */}
        {profile.email && (
          <div className="bg-bg-secondary rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-text-primary mb-1">✉️ ایمیل</h3>
            <p className="text-text-secondary">{profile.email}</p>
          </div>
        )}

        {/* مهارت‌ها */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-bg-secondary rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-text-primary mb-2">🛠️ مهارت‌ها</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* تجربیات کاری */}
      {profile.experiences && profile.experiences.length > 0 && (
        <div className="mt-6 bg-bg-secondary rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">💼 تجربیات کاری</h2>
          <div className="space-y-4">
            {profile.experiences.map((exp) => (
              <div key={exp.id} className="border-b border-bg-border last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-text-primary">{exp.title}</h3>
                <p className="text-text-secondary">{exp.company}</p>
                <p className="text-sm text-text-secondary">
                  {formatDate(exp.startDate)} - {exp.current ? 'اکنون' : formatDate(exp.endDate)}
                </p>
                {exp.description && (
                  <p className="mt-2 text-text-primary">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تحصیلات */}
      {profile.education && profile.education.length > 0 && (
        <div className="mt-6 bg-bg-secondary rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">🎓 تحصیلات</h2>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div key={edu.id} className="border-b border-bg-border last:border-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-text-primary">{edu.degree}</h3>
                <p className="text-text-secondary">{edu.field}</p>
                <p className="text-text-secondary">{edu.institution}</p>
                <p className="text-sm text-text-secondary">
                  {formatDate(edu.startDate)} - {edu.current ? 'اکنون' : formatDate(edu.endDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* لینک‌های اجتماعی */}
      {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
        <div className="mt-6 bg-bg-secondary rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">🔗 شبکه‌های اجتماعی</h2>
          <div className="flex flex-wrap gap-4">
            {profile.socialLinks.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn
              </a>
            )}
            {profile.socialLinks.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:underline"
              >
                GitHub
              </a>
            )}
            {profile.socialLinks.twitter && (
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Twitter
              </a>
            )}
            {profile.socialLinks.instagram && (
              <a
                href={profile.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:underline"
              >
                Instagram
              </a>
            )}
            {profile.socialLinks.telegram && (
              <a
                href={profile.socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Telegram
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه پروفایل کاربر
 * 
 * روند کار:
 * 1. دریافت نام کاربری از پارامترهای URL
 * 2. دریافت اطلاعات پروفایل از سرور
 * 3. نمایش پروفایل با تمام جزئیات
 * 4. مدیریت حالت‌های بارگذاری و خطا
 * 5. امکان تلاش مجدد در صورت خطا
 * 
 * نکته: این صفحه از UserContext استفاده نمی‌کند چون پروفایل
 * عمومی است و نیاز به اطلاعات کاربر لاگین شده ندارد
 */
export default function ProfilePage() {
  // ============================================
  // هوک‌های ری‌اکت
  // ============================================
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { error: showError } = useToast();

  // ============================================
  // وضعیت‌های کامپوننت
  // ============================================
  const rawParam = params?.username;
  const usernameParam = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const username = (usernameParam ? decodeURIComponent(String(usernameParam)) : null) || searchParams.get('user') || searchParams.get('username');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingState, setLoadingState] = useState<string>(LOADING_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ============================================
  // رفرنس‌ها (Refs)
  // ============================================
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // توابع
  // ============================================

  /**
   * بارگذاری پروفایل از سرور - فقط داده را برمی‌گرداند
   */
  const loadProfile = useCallback(async (targetUsername: string): Promise<UserProfile> => {
    console.log('🔄 شروع بارگذاری پروفایل:', {
      username: targetUsername,
      timestamp: new Date().toISOString(),
    });

    // ایجاد AbortController جدید
    abortControllerRef.current = new AbortController();
    
    try {
      const profileData = await fetchUserProfile(targetUsername, abortControllerRef.current.signal);
      
      console.log('✅ پروفایل بارگذاری شد:', {
        username: targetUsername,
        hasData: !!profileData,
        timestamp: new Date().toISOString(),
      });

      return profileData;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * تلاش مجدد برای بارگذاری
   */
  const handleRetry = useCallback(() => {
    if (username) {
      console.log('🔄 تلاش مجدد برای بارگذاری پروفایل:', username);
      
      // لغو درخواست قبلی اگر وجود دارد
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // بازنشانی وضعیت‌ها
      setProfile(null);
      setLoadingState(LOADING_STATES.IDLE);
      setErrorMessage('');
    }
  }, [username]);

  // ============================================
  // افکت‌ها
  // ============================================

  /**
   * پاک‌سازی تایمرها و درخواست‌ها هنگام unmount
   */
  useEffect(() => {
    return () => {
      // پاک‌سازی تایمر
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        console.log('🧹 تایمر هدایت پاک‌سازی شد');
      }
      
      // لغو درخواست در حال اجرا
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('🧹 درخواست API لغو شد');
      }
    };
  }, []);

  /**
   * بارگذاری پروفایل هنگام تغییر نام کاربری
   * با استفاده از الگوی استاندارد React برای fetch
   */
  useEffect(() => {
    // لاگ: تغییر پارامترها
    console.log('🔍 بررسی پارامترهای URL:', {
      username,
      allParams: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString(),
    });

    // اگر نام کاربری وجود نداشته باشد
    if (!username) {
      console.warn('⚠️ نام کاربری در URL یافت نشد');
      
      // نمایش پیام خطا با Toast
      showError('نام کاربری مشخص نشده است');
      
      // پاک‌سازی تایمر قبلی
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      
      // هدایت به صفحه اصلی بعد از تاخیر
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/');
        console.log('🚀 هدایت به صفحه اصلی به دلیل عدم وجود نام کاربری');
      }, REDIRECT_DELAY);
      
      return;
    }

    // متغیر برای جلوگیری از به‌روزرسانی پس از unmount
    let isMounted = true;

    // تابع async برای بارگذاری داده
    const fetchData = async () => {
      try {
        // تغییر وضعیت به بارگذاری
        if (isMounted) {
          setLoadingState(LOADING_STATES.LOADING);
          setErrorMessage('');
        }

        // دریافت داده
        const profileData = await loadProfile(username);

        // به‌روزرسانی فقط اگر کامپوننت هنوز mounted است
        if (isMounted) {
          setProfile(profileData);
          setLoadingState(LOADING_STATES.SUCCESS);
        }

      } catch (error) {
        // مدیریت خطا - فقط اگر خطا از Abort نباشد
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('⏹️ درخواست لغو شد:', username);
          return;
        }

        console.error('❌ خطا در بارگذاری پروفایل:', error);
        
        const message = error instanceof Error ? error.message : 'خطا در بارگذاری پروفایل';
        
        if (isMounted) {
          setErrorMessage(message);
          setLoadingState(LOADING_STATES.ERROR);
          showError(message);
        }
      }
    };

    // اجرای تابع
    fetchData();

    // تابع پاک‌سازی
    return () => {
      isMounted = false;
      
      // لغو درخواست در حال اجرا
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        console.log('🧹 درخواست API هنگام unmount لغو شد');
      }
    };
  }, [username, loadProfile,searchParams, router, showError]);

  // ============================================
  // رندر کردن
  // ============================================

  // لاگ: وضعیت رندر
  console.log('🖥️ رندر صفحه پروفایل:', {
    username,
    loadingState,
    hasProfile: !!profile,
    timestamp: new Date().toISOString(),
  });

  // اگر در حال بارگذاری است
  if (loadingState === LOADING_STATES.IDLE || loadingState === LOADING_STATES.LOADING) {
    return <LoadingProfile />;
  }

  // اگر خطا رخ داده است
  if (loadingState === LOADING_STATES.ERROR) {
    return <ErrorProfile message={errorMessage} onRetry={handleRetry} />;
  }

  // اگر پروفایل وجود ندارد
  if (!profile) {
    return <ErrorProfile message="پروفایل یافت نشد" onRetry={handleRetry} />;
  }

  // نمایش پروفایل
  return (
    <main 
      className="min-h-screen bg-bg-primary py-8"
      role="main"
      aria-label="صفحه پروفایل"
    >
      <ProfileDisplay profile={profile} />
    </main>
  );
}

// ============================================
// تنظیمات خروجی
// ============================================

/** جلوگیری از کش استاتیک Next.js */
export const dynamic = 'force-dynamic';