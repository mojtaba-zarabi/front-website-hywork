// src/app/(main)/dashboard/page.tsx
'use client';

import { useCallback, useMemo, useSyncExternalStore,useState  } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { toPersianNumber } from '@/utils/numberUtils';
import { useToast } from '@/components/NotificationToast';

// ============================================
// هوک تشخیص Media Query - React 19 استاندارد
// ============================================

/**
 * هوک تشخیص Media Query با استفاده از useSyncExternalStore
 * این روش استاندارد React 19 برای اشتراک‌گذاری state با سیستم‌های خارجی است
 * 
 * مزایا:
 * - بدون setState در useEffect (رفع خطای ESLint)
 * - بدون رندر اضافی
 * - سازگار با SSR و Hydration
 * - عملکرد بهینه
 * 
 * @param query - کوئری مدیا (مثال: '(max-width: 767px)')
 * @returns boolean - آیا کوئری مطابقت دارد یا خیر
 */
const useMediaQuery = (query: string): boolean => {
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
};

// ============================================
// ثابت‌های برنامه
// ============================================

/** تب‌های داشبورد */
const TABS = {
  OVERVIEW: 'overview',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  WALLET: 'wallet',
} as const;

/** نوع تب‌ها */
type TabType = typeof TABS[keyof typeof TABS];

/** داده‌های نمودار فروش */
const SALES_DATA = [
  { month: 'فروردین', فروش: 4000, خرید: 2400 },
  { month: 'اردیبهشت', فروش: 3000, خرید: 1398 },
  { month: 'خرداد', فروش: 5000, خرید: 3800 },
  { month: 'تیر', فروش: 4780, خرید: 3908 },
  { month: 'مرداد', فروش: 5890, خرید: 4800 },
  { month: 'شهریور', فروش: 6390, خرید: 5800 },
];

// ============================================
// آیکون‌های SVG
// ============================================

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const ShoppingCartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const WalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="18" cy="15" r="1" />
  </svg>
);

const CurrencyCoinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M8 10h8" />
  </svg>
);

const HandbagIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6l-2 14h16l-2-14H6z" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const LayerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ============================================
// تعریف نوع‌های داده
// ============================================

/** داده‌های کاربر */
interface UserData {
  name: string;
  email: string;
  balance: number;
}

/** اطلاعات کارت آماری */
interface StatCardData {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change?: number;
  color: string;
}

/** اطلاعات سفارش */
interface Order {
  id: number;
  product: string;
  price: number;
  status: string;
  date: string;
}

// ============================================
// کامپوننت‌های زیرمجموعه
// ============================================

/**
 * کامپوننت کارت آمار
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  color = '#3b82f6' 
}: StatCardData) => {
  const persianChange = change !== undefined ? toPersianNumber(Math.abs(change).toString()) : '';

  return (
    <div 
      className="bg-bg-card rounded-2xl p-5 flex items-center gap-4 border border-border-color transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_var(--color-shadow)]"
      role="statistic"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ color }}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm text-text-muted m-0 mb-1">{title}</h3>
        <p className="text-xl font-bold text-text-primary m-0 wrap-break-word sm:text-lg">{value}</p>
        {change !== undefined && (
          <span className={`text-xs font-medium inline-block mt-1 ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change > 0 ? '↑' : '↓'} %{persianChange}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * کامپوننت دکمه تب
 */
const TabButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-4 py-2.5 bg-transparent border-none rounded-xl text-sm font-medium text-text-muted cursor-pointer transition-all duration-200 whitespace-nowrap sm:px-3 sm:py-2 sm:text-[11px] sm:gap-1 ${
        isActive ? 'bg-bg-surface text-text-primary' : 'hover:bg-bg-surface/50'
      }`}
      role="tab"
      aria-selected={isActive}
      aria-label={label}
    >
      <span className="inline-flex items-center justify-center">
        <Icon className="w-5.5 h-5.5" />
      </span>
      <span className="text-xs sm:text-[10px]">{label}</span>
    </button>
  );
};

/**
 * کامپوننت کارت سفارش
 */
const OrderCard = ({ order }: { order: Order }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تحویل شده':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'در حال ارسال':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  return (
    <div className="bg-bg-card rounded-xl p-4 flex justify-between items-center flex-wrap gap-4 border border-border-color sm:flex-col sm:text-center">
      <div className="flex-1">
        <h4 className="text-base font-semibold text-text-primary m-0 mb-1">
          {order.product}
        </h4>
        <p className="text-xs text-text-muted mb-1">{order.date}</p>
        <p className="text-sm font-semibold text-accent-color">
          {toPersianNumber(order.price.toLocaleString('en-US'))} تومان
        </p>
      </div>
      <div className="text-center sm:w-full">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
        <button className="block mt-2 mx-auto px-4 py-1.5 bg-bg-secondary border-none rounded-lg text-xs cursor-pointer text-text-primary transition-colors hover:bg-border-color">
          جزئیات
        </button>
      </div>
    </div>
  );
};

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه داشبورد کاربر
 * 
 * روند کار:
 * 1. نمایش آمار کلی (فروش، خرید، سفارشات، امتیاز)
 * 2. نمایش نمودار فروش و خرید
 * 3. مدیریت محصولات
 * 4. مدیریت سفارشات
 * 5. مدیریت کیف پول
 */
export default function DashboardPage() {
  // ============================================
  // هوک‌های ری‌اکت
  // ============================================
  const { success } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // ============================================
  // وضعیت‌های کامپوننت
  // ============================================
  const [activeTab, setActiveTab] = useState<TabType>(TABS.OVERVIEW);
  const [userData] = useState<UserData>({
    name: 'علی محمدی',
    email: 'ali@example.com',
    balance: 2500000,
  });

  // ============================================
  // داده‌های ثابت
  // ============================================

  /** لیست تب‌ها */
  const tabs = useMemo(() => [
    { id: TABS.OVERVIEW, label: 'نمای کلی', icon: ChartIcon },
    { id: TABS.PRODUCTS, label: 'محصولات من', icon: LeafIcon },
    { id: TABS.ORDERS, label: 'سفارشات من', icon: ShoppingCartIcon },
    { id: TABS.WALLET, label: 'کیف پول', icon: WalletIcon },
  ], []);

  /** لیست سفارشات نمونه */
  const orders: Order[] = useMemo(() => [
    {
      id: 1,
      product: 'هدفون بی‌سیم سونی',
      price: 1250000,
      status: 'در حال پردازش',
      date: '۱۴۰۳/۰۲/۱۵',
    },
    {
      id: 2,
      product: 'کتاب آموزش React',
      price: 185000,
      status: 'تحویل شده',
      date: '۱۴۰۳/۰۲/۱۰',
    },
    {
      id: 3,
      product: 'کیف چرمی اصل',
      price: 890000,
      status: 'در حال ارسال',
      date: '۱۴۰۳/۰۲/۰۵',
    },
  ], []);

  // ============================================
  // توابع
  // ============================================

  /**
   * فرمت مقدار محور Y برای نمودار
   */
  const formatYAxis = useCallback((value: number): string => {
    return toPersianNumber(value);
  }, []);

  /**
   * فرمت مقدار Tooltip برای نمودار
   */
  const formatTooltip = useCallback((value: ValueType | undefined): string => {
    if (value == null) return '';
    if (typeof value === 'number') return toPersianNumber(value);
    return String(value);
  }, []);

  /**
   * تغییر تب فعال
   */
  const handleTabChange = useCallback((tabId: TabType) => {
    console.log('🔄 تغییر تب:', { tabId, timestamp: new Date().toISOString() });
    setActiveTab(tabId);
  }, []);

  /**
   * افزودن محصول جدید
   */
  const handleAddProduct = useCallback(() => {
    console.log('➕ افزودن محصول جدید');
    success('در حال انتقال به صفحه ایجاد پست...');
    // هدایت به صفحه ایجاد پست
    // router.push('/create-post');
  }, [success]);

  /**
   * افزایش موجودی کیف پول
   */
  const handleIncreaseBalance = useCallback(() => {
    console.log('💰 افزایش موجودی کیف پول');
    success('در حال انتقال به صفحه پرداخت...');
    // هدایت به صفحه پرداخت
    // router.push('/checkout');
  }, [success]);

  /**
   * برداشت از کیف پول
   */
  const handleWithdrawBalance = useCallback(() => {
    console.log('💰 برداشت از کیف پول');
    success('در حال انتقال به صفحه برداشت...');
    // هدایت به صفحه برداشت
    // router.push('/withdraw');
  }, [success]);

  // ============================================
  // لاگ‌های رندر
  // ============================================

  console.log('🖥️ رندر صفحه داشبورد:', {
    activeTab,
    isMobile,
    userName: userData.name,
    balance: userData.balance,
    timestamp: new Date().toISOString(),
  });

  // ============================================
  // رندر تب‌ها
  // ============================================

  /**
   * رندر تب نمای کلی
   */
  const renderOverview = useCallback(() => {
    console.log('📊 رندر تب نمای کلی');

    return (
      <>
        {/* کارت‌های آمار */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
          <StatCard
            title="کل فروش"
            value="۱۲,۵۰۰,۰۰۰ تومان"
            icon={CurrencyCoinIcon}
            change={12.5}
            color="#3b82f6"
          />
          <StatCard
            title="کل خرید"
            value="۳,۲۰۰,۰۰۰ تومان"
            icon={HandbagIcon}
            change={-5.2}
            color="#8b5cf6"
          />
          <StatCard
            title="سفارشات فعال"
            value="۸"
            icon={LayerIcon}
            change={2}
            color="#f59e0b"
          />
          <StatCard
            title="میانگین امتیاز کاربران"
            value="۴.۸"
            icon={StarIcon}
            change={0.3}
            color="#10b981"
          />
        </div>

        {/* نمودار */}
        <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-bg-card rounded-2xl p-4 sm:p-5 border border-border-color">
            <h3 className="text-base font-semibold text-text-primary mb-4 sm:mb-5 sm:text-sm">
              نمودار فروش و خرید
            </h3>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
              <LineChart data={SALES_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: isMobile ? 10 : 12 }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-color)',
                    color: 'var(--color-text-primary)',
                  }}
                  formatter={formatTooltip}
                />
                <Legend
                  wrapperStyle={{
                    color: 'var(--color-text-primary)',
                    fontSize: isMobile ? 10 : 12,
                  }}
                />
                <Line type="monotone" dataKey="فروش" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="خرید" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  }, [isMobile, formatYAxis, formatTooltip]);

  /**
   * رندر تب محصولات
   */
  const renderProducts = useCallback(() => {
    console.log('📦 رندر تب محصولات');

    return (
      <div>
        <div className="flex justify-between items-center mb-4 sm:mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-text-primary m-0 sm:text-lg">محصولات من</h2>
          <button
            onClick={handleAddProduct}
            className="px-4 py-2.5 bg-bg-surface text-text-primary border-none rounded-lg cursor-pointer text-sm transition-colors hover:bg-border-color sm:px-3 sm:py-2 sm:text-xs"
          >
            + افزودن محصول جدید
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-bg-card rounded-2xl overflow-hidden border border-border-color transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_var(--color-shadow)]"
            >
              <div className="w-full h-37.5 bg-bg-secondary flex items-center justify-center">
                <span className="text-5xl">📷</span>
              </div>
              <div className="p-4">
                <h4 className="text-base font-semibold text-text-primary m-0 mb-2">
                  محصول نمونه {i}
                </h4>
                <p className="text-lg font-bold text-accent-color mb-2">۱,۲۵۰,۰۰۰ تومان</p>
                <div className="flex justify-between text-xs text-text-muted mb-3 flex-wrap gap-2">
                  <span>📊 فروش: ۲۳ عدد</span>
                  <span>⭐ ۴.۸ (۱۲ نظر)</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-bg-secondary border-none rounded-lg text-xs cursor-pointer text-text-primary transition-colors hover:bg-border-color sm:py-1.5">
                    ویرایش
                  </button>
                  <button className="flex-1 px-3 py-2 bg-bg-surface border-none rounded-lg text-xs cursor-pointer text-text-primary transition-colors hover:bg-accent-color hover:text-white sm:py-1.5">
                    آمار
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [handleAddProduct]);

  /**
   * رندر تب سفارشات
   */
  const renderOrders = useCallback(() => {
    console.log('📋 رندر تب سفارشات');

    return (
      <div>
        <h2 className="text-xl font-bold text-text-primary m-0 mb-4 sm:mb-5 sm:text-lg">
          سفارشات من
        </h2>
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    );
  }, [orders]);

  /**
   * رندر تب کیف پول
   */
  const renderWallet = useCallback(() => {
    console.log('💰 رندر تب کیف پول');

    return (
      <div>
        <h2 className="text-xl font-bold text-text-primary m-0 mb-4 sm:mb-5 sm:text-lg">
          کیف پول من
        </h2>
        <div className="bg-linear-to-br from-[#1e293b] to-text-primary rounded-2xl p-6 sm:p-8 text-white">
          <div className="text-center mb-6">
            <p className="text-sm opacity-90 mb-2">موجودی فعلی</p>
            <p className="text-3xl font-bold sm:text-2xl">
              {toPersianNumber(userData.balance.toLocaleString('en-US'))} تومان
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap sm:flex-col">
            <button
              onClick={handleIncreaseBalance}
              className="px-6 py-2.5 bg-white border-none rounded-lg text-[#1e293b] font-semibold cursor-pointer transition-transform active:scale-95 sm:w-full"
            >
              افزایش موجودی
            </button>
            <button
              onClick={handleWithdrawBalance}
              className="px-6 py-2.5 bg-white/20 border border-white/30 rounded-lg text-white font-semibold cursor-pointer transition-colors hover:bg-white/30 sm:w-full"
            >
              برداشت وجه
            </button>
          </div>
        </div>
      </div>
    );
  }, [userData.balance, handleIncreaseBalance, handleWithdrawBalance]);

  // ============================================
  // رندر اصلی
  // ============================================

  return (
    <>
      {/* سایدبار در همه صفحات به جز موبایل */}
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      {/* کانتینر اصلی */}
      <div className={`
        min-h-screen bg-bg-primary overflow-x-hidden transition-all duration-300
        ${!isMobile ? 'mr-18' : 'mr-0'}
      `}>
        <div className="max-w-[2000px] mx-auto w-full">
          {/* هدر داشبورد */}
          <div className="flex justify-between items-center bg-bg-secondary border-b border-border-color flex-wrap gap-4 px-4 py-4 sm:px-8 sm:py-6 md:flex-row md:text-right flex-col text-center">
            <div>
              <h1 className="text-2xl font-bold text-text-primary m-0 sm:text-xl">داشبورد کاربری</h1>
              <p className="text-sm text-text-muted mt-1 sm:text-xs">
                خوش آمدید! شما هم خریدار و هم فروشنده هستید
              </p>
            </div>
            <div className="flex items-center gap-3 sm:justify-center">
              <div className="w-12 h-12 rounded-full bg-bg-surface flex items-center justify-center sm:w-10 sm:h-10">
                <span className="text-2xl sm:text-xl">👤</span>
              </div>
              <div>
                <p className="font-semibold text-text-primary m-0 sm:text-sm">{userData.name}</p>
                <p className="text-xs text-text-muted m-0 sm:text-[11px]">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* تب‌ها */}
          <div 
            className="flex gap-2 bg-bg-secondary border-b border-border-color overflow-x-auto px-4 py-3 sm:px-8 sm:py-4"
            role="tablist"
          >
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              />
            ))}
          </div>

          {/* محتوای اصلی */}
          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === TABS.OVERVIEW && renderOverview()}
            {activeTab === TABS.PRODUCTS && renderProducts()}
            {activeTab === TABS.ORDERS && renderOrders()}
            {activeTab === TABS.WALLET && renderWallet()}
          </div>
        </div>
      </div>
    </>
  );
}