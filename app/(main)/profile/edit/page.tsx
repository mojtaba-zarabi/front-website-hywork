'use client';

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Modal from '@/components/Modal';
import { useToast } from '@/components/NotificationToast';
import { UserContext } from '@/contexts/UserContext';

// ==================== DYNAMIC IMPORTS ====================
const PersianCalendar = dynamic(
  () => import('@/components/PersianCalendar'),
  { ssr: false, loading: () => <div className="p-4 text-center text-text-secondary">در حال بارگذاری تقویم...</div> }
);

const MapComponent = dynamic(
  () => import('@/components/MapComponent'),
  { ssr: false, loading: () => <div className="h-[250px] flex items-center justify-center bg-bg-surface rounded-xl text-text-secondary">در حال بارگذاری نقشه...</div> }
);

// ==================== ICONS ====================
const UploadIcon = () => (
  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ==================== HOOKS ====================
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};

// ==================== VALIDATION FUNCTIONS ====================
const usernameValidation = {
  pattern: /^[a-zA-Z0-9._]+$/,
  minLength: 3,
  maxLength: 30,
  noStartEndDot: /^[^.].*[^.]$/,
  noStartUnderscore: /^[^_]/,
  noSpaces: /^\S*$/,
  noConsecutiveDots: /^(?!.*\.\.).*$/,
  noConsecutiveUnderscores: /^(?!.*__).*$/,
  
  reservedUsernames: [
    'admin', 'administrator', 'root', 'superuser',
    'moderator', 'support', 'help', 'info',
    'system', 'test', 'user', 'login',
    'signup', 'register', 'profile', 'settings'
  ],
  
  validate(username: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const trimmed = username.trim();
    
    if (!trimmed) {
      errors.push('نام کاربری نمی‌تواند خالی باشد');
      return { valid: false, errors };
    }
    
    if (trimmed.length < this.minLength) {
      errors.push(`نام کاربری باید حداقل ${this.minLength} کاراکتر باشد`);
    }
    if (trimmed.length > this.maxLength) {
      errors.push(`نام کاربری باید حداکثر ${this.maxLength} کاراکتر باشد`);
    }
    
    if (!this.pattern.test(trimmed)) {
      errors.push('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، زیرخط (_) و نقطه (.) باشد');
    }
    
    if (!this.noSpaces.test(trimmed)) {
      errors.push('نام کاربری نمی‌تواند شامل فاصله باشد');
    }
    
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
      errors.push('نام کاربری نمی‌تواند با نقطه شروع یا خاتمه یابد');
    }
    
    if (!this.noConsecutiveDots.test(trimmed)) {
      errors.push('نام کاربری نمی‌تواند شامل نقطه‌های پشت سر هم باشد');
    }
    
    if (!this.noConsecutiveUnderscores.test(trimmed)) {
      errors.push('نام کاربری نمی‌تواند شامل زیرخط‌های پشت سر هم باشد');
    }
    
    if (this.reservedUsernames.includes(trimmed.toLowerCase())) {
      errors.push('این نام کاربری قابل استفاده نیست');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// ==================== TYPES ====================
interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  birthDate?: string;
  gender?: string;
  bio?: string;
  addresses?: string[];
  avatar?: string;
  location?: { lat: number; lng: number };
}

// ==================== MAIN COMPONENT ====================
export default function EditProfilePage() {
  const { user, setUser, loading: isLoading } = useContext(UserContext);
  const router = useRouter();
  const isMobile = useMobileDetect();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error, warning, info } = useToast();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [usernameErrors, setUsernameErrors] = useState<string[]>([]);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  
  // ✅ تغییر: فقط یک فیلد name (نام کامل)
  const [formData, setFormData] = useState({
    name: '',        // ← فقط یک فیلد برای نام کامل
    username: '',
    email: '',
    birthDate: '',
    gender: '',
    bio: '',
    addresses: [] as string[],
    avatar: '',
  });
  
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBirthDate, setSelectedBirthDate] = useState<Date | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // ==================== AUTH CHECK ====================
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      warning('لطفاً ابتدا وارد حساب کاربری خود شوید');
      router.replace('/login');
    }
  }, [user, isLoading, router, warning]);

  // ==================== INIT FORM ====================
  useEffect(() => {
    if (user && !isInitialized) {
      // ✅ فقط name رو مستقیم می‌گیریم (نام کامل)
      setFormData({
        name: user.name || '',  // ← فقط name
        username: user.username || '',
        email: user.email || '',
        birthDate: user.birthDate || '',
        gender: user.gender || '',
        bio: user.bio || '',
        addresses: user.addresses || [],
        avatar: user.avatar || '',
      });
      
      setAvatarPreview(user.avatar || '');
      setSelectedLocation(typeof user.location === 'object' ? user.location : null);
      setSelectedBirthDate(user.birthDate ? new Date(user.birthDate) : null);
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // ==================== HANDLERS ====================
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'username') {
      const result = usernameValidation.validate(value);
      setUsernameErrors(result.errors);
      setIsUsernameValid(result.valid);
    }
  }, []);

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      warning('حجم فایل باید کمتر از ۲ مگابایت باشد');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      error('لطفاً فقط فایل تصویری انتخاب کنید');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      handleInputChange('avatar', result);
      success('آواتار با موفقیت آپلود شد');
    };
    reader.onerror = () => error('خطا در آپلود آواتار');
    reader.readAsDataURL(file);
  }, [handleInputChange, success, error, warning]);

  const handleAddAddress = useCallback(() => {
    if (newAddress.trim() === '') {
      warning('لطفاً آدرس را وارد کنید');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, newAddress.trim()]
    }));
    setNewAddress('');
    success('آدرس با موفقیت اضافه شد');
  }, [newAddress, success, warning]);

  const handleRemoveAddress = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
    success('آدرس با موفقیت حذف شد');
  }, [success]);

  const handleLocationSelect = useCallback((latlng: { lat: number; lng: number }) => {
    setSelectedLocation(latlng);
    success('موقعیت مکانی با موفقیت انتخاب شد');
  }, [success]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedBirthDate(date);
    handleInputChange('birthDate', date.toISOString().split('T')[0]);
    setIsCalendarOpen(false);
    success('تاریخ تولد با موفقیت ثبت شد');
  }, [handleInputChange, success]);

  const clearBirthDate = useCallback(() => {
    setSelectedBirthDate(null);
    handleInputChange('birthDate', '');
    info('تاریخ تولد حذف شد');
  }, [handleInputChange, info]);

  // ==================== VALIDATION ====================
  const validateForm = useCallback(() => {
    const errors: string[] = [];
    
    // ✅ نام کامل اختیاری است - فقط اگر وارد شده باشد اعتبارسنجی می‌شود
    if (formData.name && formData.name.length > 100) {
      errors.push('نام کامل نباید بیشتر از ۱۰۰ کاراکتر باشد');
    }
    
    // اعتبارسنجی نام کاربری (اجباری)
    if (!formData.username.trim()) {
      errors.push('نام کاربری خود را وارد کنید');
    } else {
      const result = usernameValidation.validate(formData.username);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }
    
    // اعتبارسنجی ایمیل (اجباری)
    if (!formData.email.trim()) {
      errors.push('ایمیل خود را وارد کنید');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('ایمیل معتبر وارد کنید');
      }
    }
    
    if (errors.length > 0) {
      error(errors[0]);
      return false;
    }
    
    return true;
  }, [formData, error]);

  // ==================== SUBMIT ====================
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (isSubmitting || !user) return;

    const usernameCheck = usernameValidation.validate(formData.username);
    if (!usernameCheck.valid) {
      error(usernameCheck.errors[0]);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ✅ فقط name رو ارسال می‌کنیم (بدون lastName)
      const updatedUser = {
        ...user,
        name: formData.name.trim() || '',  // ← فقط name (اختیاری)
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        birthDate: formData.birthDate || '',
        gender: formData.gender || '',
        bio: formData.bio || '',
        addresses: formData.addresses,
        avatar: formData.avatar || user?.avatar || '',
        location: selectedLocation || user?.location || null,
      };
      
      if (setUser) {
        await setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        success('پروفایل شما با موفقیت به‌روزرسانی شد!');
        
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        throw new Error('setUser is not available');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      error('خطایی رخ داده است. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, selectedLocation, setUser, validateForm, isSubmitting, success, error, router]);

  const handleCancel = useCallback(() => {
    if (window.confirm('آیا از انصراف مطمئن هستید؟ تغییرات ذخیره نخواهد شد.')) {
      router.push('/profile');
    }
  }, [router]);

  const formatPersianDate = useCallback((date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // ==================== LOADING ====================
  if (isLoading || !isInitialized) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="min-h-[calc(100vh-70px)] bg-bg-primary p-5 md:p-10">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-10 h-10 border-3 border-border-color border-t-accent-color rounded-full animate-spin" />
            <p className="text-text-muted text-sm">در حال بارگذاری اطلاعات کاربری...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  // ==================== RENDER ====================
  return (
    <>
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      <div className="min-h-[calc(100vh-70px)] bg-bg-primary overflow-x-hidden p-5 md:p-10 md:mb-0 mb-[70px] rtl">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-10 max-w-[1000px] mx-auto bg-bg-secondary rounded-3xl p-8 md:p-6 sm:p-4 border border-border-color shadow-[0_4px_20px_var(--color-shadow)]">
          
          {/* Avatar Column */}
          <div className="flex-1 min-w-[280px] md:min-w-[200px]">
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className="aspect-square max-w-[280px] md:max-w-[200px] sm:max-w-[150px] mx-auto border-2 border-dashed border-border-color rounded-full flex flex-col items-center justify-center cursor-pointer bg-bg-surface overflow-hidden transition-all duration-300 hover:border-accent-color hover:bg-bg-secondary hover:scale-[1.02]"
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="آواتار"
                  width={280}
                  height={280}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <>
                  <UploadIcon />
                  <p className="mt-3 text-sm font-medium text-text-muted sm:text-xs sm:mt-2">آپلود آواتار</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Info Column */}
          <div className="flex-1">
            {/* ✅ Name Field - فقط یک فیلد و اختیاری */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">
                نام کامل
                <span className="text-text-muted text-xs mr-1">(اختیاری)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-border-color rounded-2xl text-sm outline-none transition-all bg-bg-primary text-text-primary text-right rtl focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl"
                placeholder="نام و نام خانوادگی خود را وارد کنید (اختیاری)"
                disabled={isSubmitting}
                maxLength={100}
              />
              <p className="mt-1 text-xs text-text-muted text-right">
                حداکثر ۱۰۰ کاراکتر
              </p>
            </div>

            {/* Username with Validation */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">نام کاربری *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-4 py-3 border rounded-2xl text-sm outline-none transition-all bg-bg-primary text-text-primary text-right rtl focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl ${
                  formData.username && !isUsernameValid 
                    ? 'border-red-500 focus:border-red-500' 
                    : formData.username && isUsernameValid 
                    ? 'border-green-500 focus:border-green-500' 
                    : 'border-border-color focus:border-accent-color'
                }`}
                disabled={isSubmitting}
                required
                dir="ltr"
                placeholder="example_user"
              />
              
              {/* Username Validation Messages */}
              {formData.username && usernameErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {usernameErrors.map((err, idx) => (
                    <p key={idx} className="text-red-500 text-xs flex items-center gap-1.5">
                      <span>⚠️</span> {err}
                    </p>
                  ))}
                </div>
              )}
              
              {formData.username && isUsernameValid && (
                <p className="mt-2 text-green-500 text-xs flex items-center gap-1.5">
                  <span>✅</span> نام کاربری معتبر است
                </p>
              )}
              
              <p className="mt-1.5 text-text-muted text-xs">
                فقط حروف انگلیسی، اعداد، زیرخط (_) و نقطه (.) - حداقل ۳ و حداکثر ۳۰ کاراکتر
              </p>
            </div>

            {/* Email */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">ایمیل *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-border-color rounded-2xl text-sm outline-none transition-all bg-bg-primary text-text-primary text-right rtl focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl"
                disabled={isSubmitting}
                required
                dir="ltr"
              />
            </div>

            {/* Birth Date */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">تاریخ تولد</label>
              <div className="flex gap-2.5 items-center">
                <input
                  type="text"
                  value={selectedBirthDate ? formatPersianDate(selectedBirthDate) : ''}
                  placeholder="انتخاب تاریخ تولد"
                  readOnly
                  onClick={() => !isSubmitting && setIsCalendarOpen(true)}
                  className="flex-1 px-4 py-3 border border-border-color rounded-2xl text-sm outline-none transition-all bg-bg-primary text-text-primary text-right rtl cursor-pointer focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-bg-surface border border-border-color rounded-2xl cursor-pointer transition-all text-text-primary hover:bg-bg-hover hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5"
                >
                  <CalendarIcon />
                </button>
              </div>
              {formData.birthDate && (
                <button
                  type="button"
                  onClick={clearBirthDate}
                  disabled={isSubmitting}
                  className="mt-2 px-3 py-1.5 bg-red-500/15 border-none rounded-xl text-red-500 text-xs cursor-pointer transition-all hover:bg-red-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  حذف تاریخ
                </button>
              )}
            </div>

            {/* Gender */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">جنسیت</label>
              <div className="flex gap-6 items-center flex-wrap justify-start sm:gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-text-primary sm:text-xs">
                  <input
                    type="radio"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={isSubmitting}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  />
                  مرد
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-text-primary sm:text-xs">
                  <input
                    type="radio"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={isSubmitting}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  />
                  زن
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer text-text-primary sm:text-xs">
                  <input
                    type="radio"
                    value="other"
                    checked={formData.gender === 'other'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={isSubmitting}
                    className="cursor-pointer disabled:cursor-not-allowed"
                  />
                  سایر
                </label>
              </div>
            </div>

            {/* Addresses */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">آدرس‌ها</label>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                disabled={isSubmitting}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-bg-surface border border-border-color rounded-2xl cursor-pointer text-text-primary transition-all hover:bg-bg-hover hover:border-accent-color hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed justify-start sm:px-3.5 sm:py-2.5"
              >
                <LocationIcon />
                <span>مدیریت آدرس‌ها</span>
              </button>
              {formData.addresses.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {formData.addresses.map((addr, idx) => (
                    <div key={idx} className="px-3 py-2 bg-bg-surface rounded-xl text-sm text-text-primary border border-border-color break-words text-right sm:text-xs sm:px-2.5 sm:py-1.5">
                      {addr}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mb-5 sm:mb-4">
              <label className="block mb-2 font-semibold text-text-primary text-sm sm:text-xs sm:mb-1.5 text-right">بیوگرافی</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder="درباره خودتان بنویسید..."
                className="w-full px-4 py-3 border border-border-color rounded-2xl text-sm outline-none resize-y font-sans text-right rtl bg-bg-primary text-text-primary transition-all focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl"
                disabled={isSubmitting}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mt-6 sm:flex-col sm:gap-3">
              <button
                type="submit"
                disabled={isSubmitting || (!!formData.username && !isUsernameValid)}
                className="flex-1 bg-accent-color text-white border-none px-4 py-3 rounded-[40px] text-base font-semibold cursor-pointer transition-all hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(187,134,252,0.3)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none sm:px-3.5 sm:py-2.5 sm:text-sm"
              >
                {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 bg-bg-surface text-text-primary border border-border-color px-4 py-3 rounded-[40px] text-base font-semibold cursor-pointer transition-all hover:bg-bg-hover hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed sm:px-3.5 sm:py-2.5 sm:text-sm"
              >
                انصراف
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        maxWidth={isMobile ? '90%' : '550px'}
      >
        <div className="p-5 rtl sm:p-4">
          <h3 className="text-lg font-semibold mb-4 text-center text-text-primary sm:text-base sm:mb-3">مدیریت آدرس‌ها</h3>
          
          <div className="w-full h-[250px] rounded-xl overflow-hidden mb-4 border border-border-color sm:h-[200px]">
            <MapComponent
              key={isAddressModalOpen ? 'open' : 'closed'}
              center={
                selectedLocation
                  ? [selectedLocation.lat, selectedLocation.lng]
                  : [35.6892, 51.3890]
              }
              zoom={12}
              onLocationSelect={handleLocationSelect}
            />
          </div>
          
          <div className="flex gap-2.5 mb-4">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="آدرس خود را وارد کنید..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddAddress()}
              className="flex-1 px-4 py-3 border border-border-color rounded-2xl text-sm outline-none transition-all bg-bg-primary text-text-primary text-right rtl focus:border-accent-color focus:shadow-[0_0_0_3px_rgba(187,134,252,0.2)] sm:px-3.5 sm:py-2.5 sm:text-xs sm:rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddAddress}
              className="w-[46px] h-[46px] bg-accent-color text-white border-none rounded-2xl cursor-pointer flex items-center justify-center transition-all hover:bg-accent-hover hover:scale-105 sm:w-[42px] sm:h-[42px]"
            >
              <PlusIcon />
            </button>
          </div>
          
          <div className="max-h-[250px] overflow-y-auto mb-4">
            {formData.addresses.length === 0 ? (
              <p className="text-center text-text-muted py-5 sm:py-4 sm:text-sm">هیچ آدرسی ثبت نشده است</p>
            ) : (
              formData.addresses.map((addr, idx) => (
                <div key={idx} className="flex justify-between items-center px-3 py-2.5 bg-bg-surface rounded-xl mb-2 break-words gap-2 text-right text-text-primary border border-border-color sm:px-2.5 sm:py-2 sm:text-sm">
                  <span>{addr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(idx)}
                    className="bg-none border-none cursor-pointer text-red-500 flex items-center flex-shrink-0 transition-all hover:text-red-600 hover:scale-110"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border-color">
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="px-6 py-2.5 bg-bg-surface border-none rounded-[40px] text-sm cursor-pointer text-text-primary transition-all hover:bg-bg-hover hover:-translate-y-px sm:px-5 sm:py-2 sm:text-xs"
            >
              بستن
            </button>
          </div>
        </div>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        noPadding
        size="sm"
      >
        <PersianCalendar
          onSelect={handleDateSelect}
          onClose={() => setIsCalendarOpen(false)}
          initialDate={selectedBirthDate || new Date()}
        />
      </Modal>
    </>
  );
}