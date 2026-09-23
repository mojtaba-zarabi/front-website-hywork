// src/app/(main)/checkout/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { toPersianNumber, formatPrice } from '@/utils/numberUtils';
import { useToast } from '@/components/NotificationToast';

// ============================================
// ثابت‌های برنامه
// ============================================

/** روش‌های ارسال */
const SHIPPING_METHODS = {
  POST: 'post',
  COURIER: 'courier',
  PICKUP: 'pickup',
} as const;

/** روش‌های پرداخت */
const PAYMENT_METHODS = {
  ONLINE: 'online',
  CASH: 'cash',
} as const;

/** هزینه‌های ارسال */
const SHIPPING_COSTS: Record<string, number> = {
  [SHIPPING_METHODS.POST]: 50000,
  [SHIPPING_METHODS.COURIER]: 80000,
  [SHIPPING_METHODS.PICKUP]: 0,
};

/** الگوی شماره موبایل */
const PHONE_REGEX = /^09[0-9]{9}$/;

/** الگوی ایمیل */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// هوک‌های سفارشی - استاندارد React 19
// ============================================

/**
 * هوک تشخیص دستگاه موبایل با استفاده از useSyncExternalStore
 * این روش استاندارد React 19 برای اشتراک‌گذاری state با سیستم‌های خارجی است
 * 
 * @param query - کوئری مدیا برای تشخیص
 * @returns boolean - آیا دستگاه موبایل است یا خیر
 */
function useMediaQuery(query: string): boolean {
  // تابع اشتراک‌گذاری برای گوش دادن به تغییرات
  const subscribe = useCallback(
    (callback: () => void) => {
      // بررسی وجود window (برای جلوگیری از خطا در SSR)
      if (typeof window === 'undefined') {
        return () => {};
      }

      const media = window.matchMedia(query);
      
      // افزودن listener
      media.addEventListener('change', callback);
      
      // لاگ: ثبت اشتراک
      console.log('📱 اشتراک مدیا:', { query, matches: media.matches });

      // تابع پاک‌سازی
      return () => {
        media.removeEventListener('change', callback);
        console.log('🧹 لغو اشتراک مدیا:', query);
      };
    },
    [query]
  );

  // تابع دریافت مقدار فعلی
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  // تابع مقدار برای SSR
  const getServerSnapshot = useCallback(() => {
    return false; // مقدار پیش‌فرض در سرور
  }, []);

  // استفاده از useSyncExternalStore برای همگام‌سازی با سیستم خارجی
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================
// تعریف نوع‌های داده
// ============================================

/** آیتم سبد خرید */
interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

/** اطلاعات فرم */
interface FormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

/** گزینه‌های روش ارسال */
interface ShippingOption {
  id: string;
  label: string;
  price: number;
  desc: string;
  icon: React.ComponentType;
}

/** گزینه‌های روش پرداخت */
interface PaymentOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType;
}

// ============================================
// آیکون‌های SVG
// ============================================

const LightningFilledIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const HouseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const MotorcycleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 16a2 2 0 100-4 2 2 0 000 4zM20 16a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M4 14h12M17 8h3l3 4-3 2M9 8l3-3h3l3 4" />
    <path d="M6 14l-3-3h9l-3-3" />
  </svg>
);

// ============================================
// کامپوننت‌های زیرمجموعه
// ============================================

/**
 * کامپوننت گزینه روش ارسال
 */
const ShippingOptionCard = ({
  option,
  isSelected,
  onSelect,
}: {
  option: ShippingOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const Icon = option.icon;

  return (
    <div
      onClick={() => onSelect(option.id)}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors bg-bg-primary text-text-primary ${
        isSelected ? 'border-accent-color bg-bg-surface' : 'border-border-color hover:border-accent-color/50'
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(option.id);
        }
      }}
    >
      <div className="mb-3 text-text-primary inline-flex">
        <Icon />
      </div>
      <div className="text-sm sm:text-base font-semibold mb-1">{option.label}</div>
      <div className="text-sm font-bold text-orange-600 mb-1">
        {option.price === 0 ? 'رایگان' : formatPrice(option.price)}
      </div>
      <div className="text-[11px] text-text-muted">{option.desc}</div>
    </div>
  );
};

/**
 * کامپوننت گزینه روش پرداخت
 */
const PaymentOptionCard = ({
  option,
  isSelected,
  onSelect,
}: {
  option: PaymentOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const Icon = option.icon;

  return (
    <div
      onClick={() => onSelect(option.id)}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-colors bg-bg-primary text-text-primary ${
        isSelected ? 'border-accent-color bg-bg-surface' : 'border-border-color hover:border-accent-color/50'
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(option.id);
        }
      }}
    >
      <div className="mb-3 text-text-primary inline-flex">
        <Icon />
      </div>
      <div className="text-sm sm:text-base font-semibold mb-1">{option.label}</div>
      <div className="text-[11px] text-text-muted">{option.desc}</div>
    </div>
  );
};

/**
 * کامپوننت خلاصه سبد خرید
 */
const OrderSummary = ({
  cartItems,
  totalPrice,
  shippingMethod,
  getTotalWithShipping,
}: {
  cartItems: CartItem[];
  totalPrice: number;
  shippingMethod: string;
  getTotalWithShipping: () => number;
}) => {
  return (
    <div className="bg-bg-secondary rounded-2xl p-4 sm:p-6 border border-border-color shadow-[0_1px_3px_var(--color-shadow)] sticky top-25">
      <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">
        خلاصه سبد خرید
      </h3>

      {/* لیست آیتم‌ها */}
      <div className="max-h-75 overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-3 border-b border-border-color last:border-b-0"
          >
            <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0 bg-bg-surface">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {item.title}
              </div>
              <div className="text-[11px] text-text-muted">
                تعداد: {toPersianNumber(item.quantity)}
              </div>
            </div>
            <div className="text-sm font-bold text-orange-600 whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-border-color my-3" />

      {/* جزئیات قیمت */}
      <div className="flex justify-between text-sm text-text-secondary mb-2">
        <span>قیمت کالاها</span>
        <span>{formatPrice(totalPrice)} تومان</span>
      </div>
      <div className="flex justify-between text-sm text-text-secondary mb-2">
        <span>هزینه ارسال</span>
        <span>
          {shippingMethod ? formatPrice(SHIPPING_COSTS[shippingMethod] || 0) : 'انتخاب نشده'} تومان
        </span>
      </div>

      <div className="h-px bg-border-color my-3" />

      {/* جمع کل */}
      <div className="flex justify-between text-base sm:text-lg font-bold text-text-primary">
        <span>قابل پرداخت</span>
        <span>{formatPrice(getTotalWithShipping())} تومان</span>
      </div>
    </div>
  );
};

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه تکمیل سفارش
 * 
 * روند کار:
 * 1. نمایش اطلاعات سبد خرید
 * 2. دریافت اطلاعات شخصی کاربر
 * 3. انتخاب روش ارسال
 * 4. انتخاب روش پرداخت
 * 5. اعتبارسنجی و ثبت سفارش
 * 6. هدایت به صفحه موفقیت
 */
export default function CheckoutPage() {
  // ============================================
  // هوک‌های ری‌اکت
  // ============================================
  const router = useRouter();
  const { success, error } = useToast();
  
  // استفاده از useMediaQuery با استاندارد React 19
  const isMobile = useMediaQuery('(max-width: 767px)');

  // ============================================
  // وضعیت‌های کامپوننت
  // ============================================

  // داده‌های نمونه - در آینده از Context یا API دریافت می‌شود
  const [cartItems] = useState<CartItem[]>([
    {
      id: 1,
      title: 'هدفون بی‌سیم سونی',
      price: 3250000,
      quantity: 1,
      image: '/images/posts/1.jpg',
    },
    {
      id: 2,
      title: 'بلیت دورهمی آنلاین',
      price: 89000,
      quantity: 2,
      image: '/images/posts/2.jpg',
    },
  ]);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    city: '',
  });

  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ============================================
  // محاسبات
  // ============================================

  /** محاسبه مجموع قیمت */
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  /** محاسبه مجموع با هزینه ارسال */
  const getTotalWithShipping = useCallback(() => {
    return totalPrice + (SHIPPING_COSTS[shippingMethod] || 0);
  }, [totalPrice, shippingMethod]);

  // ============================================
  // گزینه‌های روش ارسال
  // ============================================
  const shippingOptions: ShippingOption[] = useMemo(() => [
    {
      id: SHIPPING_METHODS.POST,
      label: 'پست پیشتاز',
      price: SHIPPING_COSTS[SHIPPING_METHODS.POST],
      desc: 'زمان تحویل ۲ تا ۵ روز کاری',
      icon: LightningFilledIcon,
    },
    {
      id: SHIPPING_METHODS.COURIER,
      label: 'پیک موتوری',
      price: SHIPPING_COSTS[SHIPPING_METHODS.COURIER],
      desc: 'زمان تحویل ۱ روز کاری',
      icon: MotorcycleIcon,
    },
    {
      id: SHIPPING_METHODS.PICKUP,
      label: 'تحویل حضوری',
      price: SHIPPING_COSTS[SHIPPING_METHODS.PICKUP],
      desc: 'تهران، شعبه مرکزی',
      icon: BuildingIcon,
    },
  ], []);

  /** گزینه‌های روش پرداخت */
  const paymentOptions: PaymentOption[] = useMemo(() => [
    {
      id: PAYMENT_METHODS.ONLINE,
      label: 'پرداخت آنلاین',
      desc: 'اتصال به درگاه بانکی',
      icon: CreditCardIcon,
    },
    {
      id: PAYMENT_METHODS.CASH,
      label: 'پرداخت در محل',
      desc: 'پرداخت هنگام تحویل',
      icon: HouseIcon,
    },
  ], []);

  // ============================================
  // توابع
  // ============================================

  /**
   * مدیریت تغییرات فرم
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    console.log('📝 تغییر فیلد فرم:', { name, value });

    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // پاک کردن خطای مربوط به فیلد
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  /**
   * انتخاب روش ارسال
   */
  const handleShippingSelect = useCallback((method: string) => {
    console.log('🚚 انتخاب روش ارسال:', { method });
    setShippingMethod(shippingMethod === method ? '' : method);
  }, [shippingMethod]);

  /**
   * انتخاب روش پرداخت
   */
  const handlePaymentSelect = useCallback((method: string) => {
    console.log('💳 انتخاب روش پرداخت:', { method });
    setPaymentMethod(paymentMethod === method ? '' : method);
  }, [paymentMethod]);

  /**
   * اعتبارسنجی فرم
   */
  const validate = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // اعتبارسنجی نام
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'نام و نام خانوادگی الزامی است';
    }

    // اعتبارسنجی شماره تماس
    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تماس الزامی است';
    } else if (!PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'شماره تماس معتبر نیست (مثال: 09123456789)';
    }

    // اعتبارسنجی آدرس
    if (!formData.address.trim()) {
      newErrors.address = 'آدرس الزامی است';
    }

    // اعتبارسنجی ایمیل (اختیاری)
    if (formData.email && !EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر نیست';
    }

    console.log('✅ نتیجه اعتبارسنجی:', {
      hasErrors: Object.keys(newErrors).length > 0,
      errors: newErrors,
    });

    return newErrors;
  }, [formData]);

  /**
   * ثبت سفارش
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('📋 شروع ثبت سفارش');

    // اعتبارسنجی
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      error('لطفاً اطلاعات را کامل کنید');
      return;
    }

    // بررسی انتخاب روش ارسال
    if (!shippingMethod) {
      error('لطفاً روش ارسال را انتخاب کنید');
      return;
    }

    // بررسی انتخاب روش پرداخت
    if (!paymentMethod) {
      error('لطفاً روش پرداخت را انتخاب کنید');
      return;
    }

    setIsSubmitting(true);

    try {
      // شبیه‌سازی ارسال به سرور
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const orderNumber = Math.floor(100000 + Math.random() * 900000);
      const orderTotal = getTotalWithShipping();

      // لاگ اطلاعات سفارش
      console.log('✅ سفارش ثبت شد:', {
        orderNumber,
        total: orderTotal,
        customer: {
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
        },
        address: {
          city: formData.city,
          address: formData.address,
          postalCode: formData.postalCode,
        },
        shippingMethod,
        paymentMethod,
        items: cartItems,
        subtotal: totalPrice,
        shippingCost: SHIPPING_COSTS[shippingMethod] || 0,
      });

      success('سفارش شما با موفقیت ثبت شد');

      // هدایت به صفحه موفقیت
      router.push(`/order-success?order=${orderNumber}&total=${orderTotal}`);

    } catch (err) {
      console.error('❌ خطا در ثبت سفارش:', err);
      error('خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید.');
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, shippingMethod, paymentMethod, getTotalWithShipping, formData, cartItems, totalPrice, router, success, error]);

  // ============================================
  // رندر
  // ============================================

  // اگر سبد خرید خالی است
  if (cartItems.length === 0) {
    console.warn('⚠️ سبد خرید خالی است');

    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="min-h-[calc(100vh-70px)] bg-bg-primary text-center py-12 sm:py-16 md:py-20 px-4 md:ms-65">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-4">
            سبد خرید شما خالی است
          </h2>
          <button
            onClick={() => {
              console.log('🔙 بازگشت به فروشگاه');
              router.push('/');
            }}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-accent-color text-white border-none rounded-[40px] cursor-pointer transition-colors hover:bg-accent-hover text-sm sm:text-base"
          >
            بازگشت به فروشگاه
          </button>
        </div>
      </>
    );
  }

  // لاگ رندر
  console.log('🖥️ رندر صفحه تکمیل سفارش:', {
    isMobile,
    cartItemsCount: cartItems.length,
    totalPrice,
    shippingMethod,
    paymentMethod,
    isSubmitting,
    timestamp: new Date().toISOString(),
  });

  return (
    <>
      {/* نوار کناری و ناوبری موبایل */}
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      {/* محتوای اصلی */}
      <div className="min-h-[calc(100vh-70px)] bg-bg-primary p-4 sm:p-6 md:p-8 mb-20 md:pb-8">
        {/* هدر */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-2">
            تکمیل سفارش
          </h1>
          <p className="text-sm sm:text-base text-text-muted">
            اطلاعات خود را کامل کنید
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 max-w-300 mx-auto">
          {/* بخش فرم */}
          <div className="flex-2">
            <form onSubmit={handleSubmit}>
              {/* اطلاعات شخصی */}
              <div className="bg-bg-secondary rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border-color shadow-[0_1px_3px_var(--color-shadow)]">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4 sm:mb-5 pb-3 border-b border-border-color">
                  اطلاعات شخصی
                </h3>

                <div className="flex flex-col md:flex-row gap-4 md:gap-5 mb-4 md:mb-5">
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans ${
                        errors.fullName ? 'border-red-500' : 'border-border-color focus:border-accent-color'
                      }`}
                      placeholder="مثال: علی محمدی"
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && (
                      <span className="text-red-500 text-[11px] mt-1 block" role="alert">
                        {errors.fullName}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      شماره تماس *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans ${
                        errors.phone ? 'border-red-500' : 'border-border-color focus:border-accent-color'
                      }`}
                      placeholder="09123456789"
                      aria-invalid={!!errors.phone}
                    />
                    {errors.phone && (
                      <span className="text-red-500 text-[11px] mt-1 block" role="alert">
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-5 mb-4 md:mb-5">
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      ایمیل (اختیاری)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans ${
                        errors.email ? 'border-red-500' : 'border-border-color focus:border-accent-color'
                      }`}
                      placeholder="example@site.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                      <span className="text-red-500 text-[11px] mt-1 block" role="alert">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      کد پستی (اختیاری)
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border-color rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans focus:border-accent-color"
                      placeholder="۱۲۳۴۵۶۷۸۹۰"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-5">
                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      استان / شهر
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border-color rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans focus:border-accent-color"
                      placeholder="تهران"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block mb-2 font-medium text-text-secondary text-xs sm:text-sm">
                      آدرس دقیق *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-colors bg-bg-primary text-text-primary font-sans ${
                        errors.address ? 'border-red-500' : 'border-border-color focus:border-accent-color'
                      }`}
                      placeholder="خیابان، کوچه، پلاک..."
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && (
                      <span className="text-red-500 text-[11px] mt-1 block" role="alert">
                        {errors.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* روش ارسال */}
              <div className="bg-bg-secondary rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border-color shadow-[0_1px_3px_var(--color-shadow)]">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4 sm:mb-5 pb-3 border-b border-border-color">
                  روش ارسال
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {shippingOptions.map((option) => (
                    <ShippingOptionCard
                      key={option.id}
                      option={option}
                      isSelected={shippingMethod === option.id}
                      onSelect={handleShippingSelect}
                    />
                  ))}
                </div>
              </div>

              {/* روش پرداخت */}
              <div className="bg-bg-secondary rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-border-color shadow-[0_1px_3px_var(--color-shadow)]">
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4 sm:mb-5 pb-3 border-b border-border-color">
                  روش پرداخت
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {paymentOptions.map((option) => (
                    <PaymentOptionCard
                      key={option.id}
                      option={option}
                      isSelected={paymentMethod === option.id}
                      onSelect={handlePaymentSelect}
                    />
                  ))}
                </div>
              </div>

              {/* دکمه ثبت سفارش */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent-color text-white border-none px-4 py-3.5 rounded-[40px] text-sm sm:text-base font-semibold cursor-pointer transition-all hover:bg-accent-hover hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {isSubmitting ? 'در حال ثبت سفارش...' : 'ثبت سفارش و پرداخت'}
              </button>
            </form>
          </div>

          {/* بخش خلاصه سفارش */}
          <div className="flex-1">
            <OrderSummary
              cartItems={cartItems}
              totalPrice={totalPrice}
              shippingMethod={shippingMethod}
              getTotalWithShipping={getTotalWithShipping}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// تنظیمات خروجی
// ============================================

/** جلوگیری از کش استاتیک Next.js */
export const dynamic = 'force-dynamic';