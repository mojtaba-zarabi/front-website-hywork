// src/app/(main)/cart/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { toPersianNumber } from '@/utils/numberUtils';
import { useToast } from '@/components/NotificationToast';

// ============================================
// ثابت‌های برنامه
// ============================================

/** وضعیت‌های سفارش */
const ORDER_STATUS = {
  DELIVERED: 'تحویل شده',
  PROCESSING: 'در حال ارسال',
  PAID: 'پرداخت شده',
  SHIPPED: 'ارسال شده',
} as const;

/** تب‌های موجود */
const TABS = {
  CART: 'cart',
  HISTORY: 'history',
  SALES: 'sales',
} as const;

/** کلیدهای ذخیره‌سازی محلی */
const STORAGE_KEYS = {
  CART_ITEMS: 'cart_items',
} as const;

// ============================================
// تعریف نوع‌های داده
// ============================================

/** آیتم سبد خرید */
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

/** تاریخچه سفارشات */
interface OrderHistory {
  id: number;
  date: string;
  total: number;
  items: string[];
  status: string;
}

/** آیتم فروش */
interface SalesItem {
  id: number;
  product: string;
  price: number;
  quantity: number;
  buyer: string;
  date: string;
  status: string;
}

// ============================================
// هوک‌های سفارشی - استاندارد React 19
// ============================================

/**
 * هوک تشخیص دستگاه موبایل با استفاده از useSyncExternalStore
 * این روش استاندارد React 19 برای اشتراک‌گذاری state با سیستم‌های خارجی است
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
// آیکون‌های SVG
// ============================================

const AddPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RemoveMinusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashFullIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

// ============================================
// کامپوننت‌های زیرمجموعه
// ============================================

/**
 * کامپوننت نمایش آیتم سبد خرید
 */
const CartItemComponent = ({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border-color pb-4">
      {/* تصویر محصول */}
      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* اطلاعات محصول */}
      <div className="flex-1 min-w-40">
        <h4 className="text-sm font-medium text-text-primary m-0">{item.name}</h4>
        <div className="text-xs text-text-muted mt-1">
          {toPersianNumber(item.price)} تومان
        </div>
        
        {/* کنترل‌های تعداد */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onUpdateQuantity(item.id, -1)}
            className="w-7 h-7 rounded border border-border-color bg-bg-secondary cursor-pointer flex items-center justify-center text-text-primary hover:bg-bg-surface transition-colors"
            aria-label="کاهش تعداد"
          >
            <RemoveMinusIcon className="w-4 h-4" />
          </button>
          
          <span className="min-w-7.5 text-center text-sm text-text-primary">
            {toPersianNumber(item.quantity)}
          </span>
          
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="w-7 h-7 rounded border border-border-color bg-bg-secondary cursor-pointer flex items-center justify-center text-text-primary hover:bg-bg-surface transition-colors"
            aria-label="افزایش تعداد"
          >
            <AddPlusIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onRemove(item.id)}
            className="bg-transparent border-none cursor-pointer text-red-500 ml-3 flex items-center justify-center hover:opacity-70 transition-opacity"
            aria-label="حذف از سبد خرید"
          >
            <TrashFullIcon className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* قیمت کل */}
      <div className="min-w-30 text-left font-bold text-sm text-text-primary sm:w-full sm:text-right sm:pr-17.5">
        {toPersianNumber(item.price * item.quantity)} تومان
      </div>
    </div>
  );
};

/**
 * کامپوننت دکمه‌های تب
 */
const TabButton = ({
  label,
  isActive,
  onClick,
  count,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}) => {
  return (
    <button
      className={`px-5 py-3 bg-transparent border-none text-sm cursor-pointer font-medium transition-all ${
        isActive
          ? 'text-text-primary font-semibold border-b-2 border-text-primary'
          : 'text-text-muted hover:text-text-primary'
      }`}
      onClick={onClick}
      aria-label={label}
      role="tab"
      aria-selected={isActive}
    >
      {label}
      {count !== undefined && ` (${toPersianNumber(count)})`}
    </button>
  );
};

// ============================================
// کامپوننت اصلی
// ============================================

/**
 * صفحه سبد خرید
 * 
 * روند کار:
 * 1. نمایش سبد خرید با قابلیت تغییر تعداد و حذف آیتم
 * 2. نمایش تاریخچه سفارشات
 * 3. نمایش فروش‌ها
 * 4. محاسبه مجموع قیمت
 * 5. هدایت به صفحه پرداخت
 */
export default function CartPage() {
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
  const [activeTab, setActiveTab] = useState<string>(TABS.CART);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ============================================
  // داده‌های نمونه (در آینده از API دریافت می‌شود)
  // ============================================
  const orderHistory: OrderHistory[] = useMemo(() => [
    {
      id: 101,
      date: '۱۴۰۲/۱۱/۰۵',
      total: 1870000,
      items: ['هدفون', 'کیف'],
      status: ORDER_STATUS.DELIVERED,
    },
    {
      id: 102,
      date: '۱۴۰۲/۱۰/۲۰',
      total: 450000,
      items: ['کتاب ری اکت'],
      status: ORDER_STATUS.PROCESSING,
    },
  ], []);

  const salesItems: SalesItem[] = useMemo(() => [
    {
      id: 201,
      product: 'ساعت هوشمند',
      price: 3450000,
      quantity: 1,
      buyer: 'احمد رضایی',
      date: '۱۴۰۲/۱۲/۰۱',
      status: ORDER_STATUS.PAID,
    },
    {
      id: 202,
      product: 'اسپیکر بلوتوثی',
      price: 780000,
      quantity: 2,
      buyer: 'سارا کریمی',
      date: '۱۴۰۲/۱۱/۲۸',
      status: ORDER_STATUS.SHIPPED,
    },
  ], []);

  // ============================================
  // توابع
  // ============================================

  /**
   * دریافت آیتم‌های سبد خرید از localStorage
   */
  const getCartItems = useCallback((): CartItem[] => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData) as CartItem[];
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('✅ داده‌های سبد خرید از localStorage بارگذاری شد:', {
            count: parsedData.length,
          });
          return parsedData;
        }
      }
    } catch (parseError) {
      console.warn('⚠️ خطا در parsing داده‌های localStorage:', parseError);
    }

    // داده‌های پیش‌فرض
    const defaultItems: CartItem[] = [
      {
        id: 1,
        name: 'هدفون بیسیم حرفه‌ای X200',
        price: 1250000,
        quantity: 1,
        image: '/images/posts/1.jpg',
      },
      {
        id: 2,
        name: 'کیف چرمی اصل',
        price: 890000,
        quantity: 2,
        image: '/images/posts/2.png',
      },
      {
        id: 3,
        name: 'کتاب آموزش ری اکت',
        price: 250000,
        quantity: 1,
        image: '/images/posts/3.png',
      },
    ];

    // ذخیره در localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(defaultItems));
    } catch (storageError) {
      console.warn('⚠️ خطا در ذخیره‌سازی localStorage:', storageError);
    }

    console.log('✅ سبد خرید با داده‌های پیش‌فرض بارگذاری شد:', {
      count: defaultItems.length,
    });

    return defaultItems;
  }, []);

  /**
   * به‌روزرسانی تعداد آیتم
   */
  const updateQuantity = useCallback((id: number, delta: number) => {
    console.log('🔄 بروزرسانی تعداد:', { id, delta });

    setCartItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );

      // ذخیره در localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(newItems));
      } catch (storageError) {
        console.warn('⚠️ خطا در ذخیره‌سازی localStorage:', storageError);
      }

      return newItems;
    });
  }, []);

  /**
   * حذف آیتم از سبد خرید
   */
  const removeItem = useCallback((id: number) => {
    console.log('🗑️ حذف آیتم از سبد خرید:', { id });

    setCartItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      
      // ذخیره در localStorage
      try {
        localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(newItems));
      } catch (storageError) {
        console.warn('⚠️ خطا در ذخیره‌سازی localStorage:', storageError);
      }

      // نمایش پیام موفقیت
      success('آیتم با موفقیت حذف شد');

      return newItems;
    });
  }, [success]);

  /**
   * محاسبه مجموع قیمت
   */
  const getTotalPrice = useCallback((): number => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  /**
   * هدایت به صفحه پرداخت
   */
  const handleCheckout = useCallback(() => {
    console.log('💰 شروع فرآیند پرداخت');

    if (cartItems.length === 0) {
      console.warn('⚠️ سبد خرید خالی است');
      error('سبد خرید شما خالی است');
      return;
    }

    const total = getTotalPrice();
    console.log('📊 مجموع سبد خرید:', { total });

    success('در حال انتقال به صفحه پرداخت...');
    router.push('/checkout');
  }, [cartItems, getTotalPrice, router, success, error]);

  // ============================================
  // افکت‌ها
  // ============================================

  /**
   * بارگذاری داده‌ها هنگام mount
   * استفاده از تابع مجزا برای رعایت قوانین React 19
   */
  useEffect(() => {
    console.log('📄 صفحه سبد خرید بارگذاری شد');

    // بارگذاری داده‌ها با تاخیر صفر برای جلوگیری از setState مستقیم
    const timer = setTimeout(() => {
      const items = getCartItems();
      setCartItems(items);
      setIsLoading(false);
      console.log('✅ سبد خرید بارگذاری شد:', { count: items.length });
    }, 0);

    // پاک‌سازی تایمر
    return () => {
      clearTimeout(timer);
      console.log('🧹 صفحه سبد خرید unmount شد');
    };
  }, [getCartItems]);

  // ============================================
  // رندر تب‌ها
  // ============================================

  /**
   * رندر محتوای سبد خرید
   */
  const renderCart = useCallback(() => {
    console.log('🛒 رندر تب سبد خرید');

    if (isLoading) {
      return (
        <div className="py-10 text-center text-text-muted">
          در حال بارگذاری...
        </div>
      );
    }

    if (cartItems.length === 0) {
      return (
        <div className="py-10 text-center text-text-muted">
          سبد خرید شما خالی است
        </div>
      );
    }

    const total = getTotalPrice();

    return (
      <div className="py-5">
        {/* لیست آیتم‌ها */}
        <div className="flex flex-col gap-5">
          {cartItems.map((item) => (
            <CartItemComponent
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* جمع کل */}
        <div className="mt-5 text-left p-4 bg-bg-secondary rounded-lg border border-border-color sm:text-center">
          <div className="text-lg font-bold mb-3 text-text-primary">
            مجموع: {toPersianNumber(total)} تومان
          </div>
          
          <button
            onClick={handleCheckout}
            className="bg-accent-color text-white border-none px-6 py-2.5 rounded-[40px] cursor-pointer text-base font-semibold transition-all hover:bg-accent-hover hover:-translate-y-0.5 sm:w-full sm:py-3"
            aria-label="پرداخت و ثبت سفارش"
          >
            پرداخت و ثبت سفارش
          </button>
        </div>
      </div>
    );
  }, [cartItems, isLoading, updateQuantity, removeItem, getTotalPrice, handleCheckout]);

  /**
   * رندر تاریخچه سفارشات
   */
  const renderHistory = useCallback(() => {
    console.log('📜 رندر تب تاریخچه سفارشات');

    if (orderHistory.length === 0) {
      return (
        <div className="py-10 text-center text-text-muted">
          هیچ سفارشی وجود ندارد
        </div>
      );
    }

    return (
      <div className="py-5">
        {orderHistory.map((order) => {
          const isDelivered = order.status === ORDER_STATUS.DELIVERED;
          
          return (
            <div
              key={order.id}
              className="bg-bg-secondary p-4 rounded-lg mb-4 border border-border-color text-text-primary"
            >
              <div className="flex justify-between font-bold mb-2 flex-wrap gap-2 text-text-primary">
                <span>سفارش #{toPersianNumber(order.id)}</span>
                <span>{order.date}</span>
                <span style={{ color: isDelivered ? '#4caf50' : '#ff9800' }}>
                  {order.status}
                </span>
              </div>
              <div>محصولات: {order.items.join(' - ')}</div>
              <div>مبلغ کل: {toPersianNumber(order.total)} تومان</div>
            </div>
          );
        })}
      </div>
    );
  }, [orderHistory]);

  /**
   * رندر فروش‌ها
   */
  const renderSales = useCallback(() => {
    console.log('💰 رندر تب فروش‌ها');

    if (salesItems.length === 0) {
      return (
        <div className="py-10 text-center text-text-muted">
          هیچ فروشی ثبت نشده است
        </div>
      );
    }

    return (
      <div className="py-5">
        {salesItems.map((sale) => (
          <div
            key={sale.id}
            className="bg-bg-secondary p-4 rounded-lg mb-4 border border-border-color text-text-primary"
          >
            <div className="flex justify-between font-bold mb-2 flex-wrap gap-2 text-text-primary">
              <span>{sale.product}</span>
              <span>{sale.date}</span>
            </div>
            <div>
              تعداد: {toPersianNumber(sale.quantity)} | قیمت واحد: {toPersianNumber(sale.price)} تومان
            </div>
            <div>
              خریدار: {sale.buyer} | وضعیت: {sale.status}
            </div>
          </div>
        ))}
      </div>
    );
  }, [salesItems]);

  // ============================================
  // رندر اصلی
  // ============================================

  console.log('🖥️ رندر صفحه سبد خرید:', {
    activeTab,
    cartItemsCount: cartItems.length,
    isMobile,
    isLoading,
    timestamp: new Date().toISOString(),
  });

  return (
    <>
      {/* نوار کناری و ناوبری موبایل */}
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      {/* محتوای اصلی */}
      <div className={`min-h-screen overflow-y-auto p-5 box-border bg-bg-primary ${isMobile ? 'ms-0 p-4 mb-0' : ''}`}>
        <div className="max-w-250 mx-auto">
          {/* عنوان صفحه */}
          <h1 className="text-2xl font-bold text-text-primary mb-6">سبد خرید</h1>

          {/* تب‌ها */}
          <div 
            className="flex border-b border-border-color mb-5 gap-2.5 flex-wrap"
            role="tablist"
          >
            <TabButton
              label="سبد خرید"
              isActive={activeTab === TABS.CART}
              onClick={() => {
                console.log('🔄 تغییر تب به سبد خرید');
                setActiveTab(TABS.CART);
              }}
              count={cartItems.length}
            />
            
            <TabButton
              label="تاریخچه سفارشات"
              isActive={activeTab === TABS.HISTORY}
              onClick={() => {
                console.log('🔄 تغییر تب به تاریخچه سفارشات');
                setActiveTab(TABS.HISTORY);
              }}
            />
            
            <TabButton
              label="فروش‌ها"
              isActive={activeTab === TABS.SALES}
              onClick={() => {
                console.log('🔄 تغییر تب به فروش‌ها');
                setActiveTab(TABS.SALES);
              }}
            />
          </div>

          {/* محتوای تب‌ها */}
          <div role="tabpanel">
            {activeTab === TABS.CART && renderCart()}
            {activeTab === TABS.HISTORY && renderHistory()}
            {activeTab === TABS.SALES && renderSales()}
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