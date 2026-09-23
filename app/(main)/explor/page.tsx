// src/app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import PostCard from '@/components/PostCard';
import PostModal from '@/components/PostModal';
import AdvancedFilter from '@/components/AdvancedFilter';
import { fetchAllPosts } from '@/services/postService';
import type { Post, FilterState } from '@/types';
import { useToast } from '@/components/NotificationToast';

// ============================================================
// 1️⃣ هوک تشخیص Media Query - React 19 استاندارد
// ============================================================

/**
 * هوک تشخیص Media Query با استفاده از useSyncExternalStore
 * این روش استاندارد React 19 برای اشتراک‌گذاری state با سیستم‌های خارجی است
 */
const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

// ============================================================
// 2️⃣ داینامیک ایمپورت نقشه
// ============================================================
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-75 flex items-center justify-center bg-bg-surface rounded-lg">
      <span className="text-text-muted">در حال بارگذاری نقشه...</span>
    </div>
  ),
});

// ============================================================
// 3️⃣ مودال فیلتر موبایل
// ============================================================
const MobileFilterDrawer = ({
  isOpen,
  onClose,
  categories,
  minPrice,
  maxPrice,
  onFilterChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  onFilterChange: (filters: FilterState) => void;
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    categories: [],
    minRating: 0,
    inStockOnly: false,
  });

  // مدیریت overflow بدنه
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  // ریست فیلترها هنگام باز شدن
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setLocalFilters({
          priceRange: [minPrice, maxPrice],
          categories: [],
          minRating: 0,
          inStockOnly: false,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, minPrice, maxPrice]);

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      categories: [],
      minRating: 0,
      inStockOnly: false,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-1200 transition-opacity duration-300"
      />
      {/* drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-1201 flex flex-col max-h-[85vh] bg-bg-secondary rounded-t-2xl shadow-[0_-4px_20px_var(--color-shadow)] transition-transform duration-300 ease-in-out translate-y-0">
        {/* header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-color bg-bg-secondary rounded-t-2xl">
          <h3 className="m-0 text-lg font-semibold text-text-primary">فیلتر محصولات</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary p-2 flex items-center justify-center rounded-full w-9 h-9 hover:bg-bg-surface transition-colors"
            aria-label="بستن فیلتر"
          >
            ✕
          </button>
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto p-0">
          <AdvancedFilter
            categories={categories}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={setLocalFilters}
            initialFilters={localFilters}
          />
        </div>
        {/* actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-border-color bg-bg-secondary">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 px-4 bg-bg-surface border-none rounded-lg text-sm font-medium text-text-secondary cursor-pointer hover:bg-border-color transition-colors"
          >
            حذف همه فیلترها
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 bg-accent-color border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-accent-hover transition-colors"
          >
            اعمال فیلترها
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// 4️⃣ مودال فیلتر دسکتاپ
// ============================================================
const FilterModal = ({
  isOpen,
  onClose,
  categories,
  minPrice,
  maxPrice,
  onFilterChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  onFilterChange: (filters: FilterState) => void;
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>({
    priceRange: [minPrice, maxPrice],
    categories: [],
    minRating: 0,
    inStockOnly: false,
  });

  // ریست فیلترها هنگام باز شدن
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setLocalFilters({
          priceRange: [minPrice, maxPrice],
          categories: [],
          minRating: 0,
          inStockOnly: false,
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, minPrice, maxPrice]);

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      priceRange: [minPrice, maxPrice],
      categories: [],
      minRating: 0,
      inStockOnly: false,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary rounded-2xl w-[90%] max-w-150 max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-color">
          <h3 className="m-0 text-lg font-semibold text-text-primary">فیلتر محصولات</h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-text-secondary p-2 flex items-center justify-center rounded-full w-9 h-9 hover:bg-bg-surface transition-colors"
            aria-label="بستن فیلتر"
          >
            ✕
          </button>
        </div>
        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AdvancedFilter
            categories={categories}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={setLocalFilters}
            initialFilters={localFilters}
          />
        </div>
        {/* actions */}
        <div className="flex gap-3 px-5 py-4 border-t border-border-color">
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 px-4 bg-bg-surface border-none rounded-lg text-sm font-medium text-text-secondary cursor-pointer hover:bg-border-color transition-colors"
          >
            حذف همه فیلترها
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 bg-accent-color border-none rounded-lg text-sm font-medium text-white cursor-pointer hover:bg-accent-hover transition-colors"
          >
            اعمال فیلترها
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 5️⃣ کامپوننت اصلی
// ============================================================

/**
 * صفحه اصلی (خانه)
 * 
 * روند کار:
 * 1. نمایش نقشه
 * 2. نمایش لیست پست‌ها با قابلیت فیلتر
 * 3. فیلتر پیشرفته با قیمت، دسته‌بندی، امتیاز و موجودی
 * 4. مشاهده جزئیات پست در مودال
 * 5. واکنش‌گرا برای موبایل و دسکتاپ
 */
export default function HomePage() {
  // ============================================================
  // 5.1 هوک‌های ری‌اکت
  // ============================================================
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // ============================================================
  // 5.2 وضعیت‌های کامپوننت
  // ============================================================
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 5000000],
    categories: [],
    minRating: 0,
    inStockOnly: false,
  });
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // 5.3 بارگذاری پست‌ها
  // ============================================================

  /**
   * بارگذاری پست‌ها از سرور
   */
  useEffect(() => {
    let isMounted = true;
    
    const loadPosts = async () => {
      console.log('🔄 شروع بارگذاری پست‌ها');
      
      try {
        setLoading(true);
        setError(null);
        
        const allPosts = await fetchAllPosts();

        console.log('📦 پست‌های بارگذاری شده:', {
          count: allPosts?.length || 0,
          sample: allPosts?.[0],
          timestamp: new Date().toISOString(),
        });

        if (isMounted) {
          if (allPosts && Array.isArray(allPosts) && allPosts.length > 0) {
            setPosts(allPosts);
            // بازه قیمت پیش‌فرض باید همه محصولات را شامل شود
            const prices = allPosts.map((p) => p.price);
            setFilters((prev) => ({ ...prev, priceRange: [Math.min(...prices), Math.max(...prices)] }));
            console.log('✅ پست‌ها با موفقیت بارگذاری شدند');
          } else {
            console.warn('⚠️ هیچ پستی یافت نشد');
            setError('هیچ محصولی برای نمایش وجود ندارد');
            setPosts([]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ خطا در بارگذاری پست‌ها:', err);
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری محصولات';
          setError(errorMessage);
          toastError('خطا در بارگذاری محصولات');
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
      console.log('🧹 پاک‌سازی بارگذاری پست‌ها');
    };
  }, [toastError]);

  // ============================================================
  // 5.4 محاسبات با useMemo
  // ============================================================

  /** لیست دسته‌بندی‌ها */
  const categories = useMemo(
    () => [...new Set(posts.map((p) => p.category).filter(Boolean))],
    [posts]
  );

  /** حداقل قیمت */
  const minPrice = useMemo(
    () => (posts.length ? Math.min(...posts.map((p) => p.price)) : 0),
    [posts]
  );

  /** حداکثر قیمت */
  const maxPrice = useMemo(
    () => (posts.length ? Math.max(...posts.map((p) => p.price)) : 5000000),
    [posts]
  );

  /** پست‌های فیلتر شده */
  const filteredPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    let list = [...posts];
    
    // فیلتر قیمت
    list = list.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );
    
    // فیلتر دسته‌بندی
    if (filters.categories.length > 0) {
      list = list.filter((p) => filters.categories.includes(p.category));
    }
    
    // فیلتر امتیاز
    if (filters.minRating > 0) {
      list = list.filter((p) => p.rating >= filters.minRating);
    }
    
    // فیلتر موجودی
    if (filters.inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }
    
    return list;
  }, [posts, filters]);

  /** بررسی وجود فیلترهای فعال */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.priceRange[0] > minPrice ||
      filters.priceRange[1] < maxPrice ||
      filters.categories.length > 0 ||
      filters.minRating > 0 ||
      filters.inStockOnly
    );
  }, [filters, minPrice, maxPrice]);

  // ============================================================
  // 5.5 Event Handlers
  // ============================================================

  /**
   * تغییر فیلترها
   */
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    console.log('🔍 تغییر فیلترها:', newFilters);
    setFilters(newFilters);
    setIsFilterDrawerOpen(false);
    setIsFilterModalOpen(false);
  }, []);

  /**
   * باز کردن مودال پست
   */
  const openModal = useCallback(
    (post: Post) => {
      console.log('📖 باز کردن مودال پست:', { id: post.id, title: post.title });
      
      if (!isFilterDrawerOpen && !isFilterModalOpen) {
        setSelectedPost(post);
        setIsModalOpen(true);
      }
    },
    [isFilterDrawerOpen, isFilterModalOpen]
  );

  /**
   * بستن مودال پست
   */
  const closeModal = useCallback(() => {
    console.log('📖 بستن مودال پست');
    setIsModalOpen(false);
    setSelectedPost(null);
  }, []);

  /**
   * افزودن به سبد خرید
   */
  const handleAddToCart = useCallback((post: Post) => {
    console.log('🛒 افزودن به سبد خرید:', { id: post.id, title: post.title });
    success(`${post.title} به سبد خرید اضافه شد!`);
  }, [success]);

  /**
   * کلیک روی فروشنده
   */
  const handleSellerClick = useCallback(
    (sellerId: number) => {
      closeModal();
      const seller = posts.find((p) => p.userId === sellerId);
      if (seller && seller.authorUsername && seller.authorUsername !== 'unknown') {
        router.push(`/profile?user=${seller.authorUsername}`);
      } else {
        router.push(`/profile?user=${sellerId}`);
      }
    },
    [posts, router, closeModal]
  );

  /**
   * باز کردن مودال فیلتر
   */
  const openFilter = useCallback(() => {
    console.log('🔍 باز کردن مودال فیلتر');
    
    if (isMobile) {
      setIsFilterDrawerOpen(true);
    } else {
      setIsFilterModalOpen(true);
    }
  }, [isMobile]);

  /**
   * ریست فیلترها
   */
  const resetFilters = useCallback(() => {
    console.log('🔄 ریست فیلترها');
    setFilters({
      priceRange: [minPrice, maxPrice],
      categories: [],
      minRating: 0,
      inStockOnly: false,
    });
  }, [minPrice, maxPrice]);

  // ============================================================
  // 5.6 لاگ‌های رندر
  // ============================================================

  console.log('🖥️ رندر صفحه اصلی:', {
    isMobile,
    postsCount: posts.length,
    filteredPostsCount: filteredPosts.length,
    hasActiveFilters,
    loading,
    error,
    timestamp: new Date().toISOString(),
  });

  // ============================================================
  // 5.7 نمایش لودینگ
  // ============================================================
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-base text-text-secondary bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-color border-t-transparent rounded-full animate-spin" />
          <span>در حال بارگذاری محصولات...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // 5.8 نمایش خطا
  // ============================================================
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-base text-text-secondary bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <span className="text-red-500">{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent-color text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 5.9 رندر اصلی
  // ============================================================

  return (
    <div className="w-full max-w-screen overflow-x-hidden relative">
      {/* سایدبار */}
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      {/* محتوای اصلی */}
      <div
        className={`min-h-screen bg-bg-primary w-full max-w-full overflow-x-hidden transition-[margin] duration-300 box-border ${
          !isMobile
            ? 'ms-18 w-[calc(100%-72px)] max-w-[calc(100vw-72px)]'
            : 'ms-0 w-full max-w-screen'
        } ${isMobile ? 'mb-70px' : 'mb-0'}`}
      >
        <main className="flex flex-col w-full max-w-full overflow-x-hidden">
          {/* نقشه */}
          <MapComponent />

          {/* هدر فیلتر */}
          <div className="flex justify-between items-center px-4 py-3 bg-bg-primary border-b border-border-color w-full box-border">
            <button
              onClick={openFilter}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-color rounded-full text-sm font-medium text-text-primary cursor-pointer relative transition-colors duration-200 hover:bg-bg-surface shrink-0"
              aria-label="باز کردن فیلترها"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              فیلترها
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-primary" />
              )}
            </button>
            <div className="text-[13px] text-text-secondary whitespace-nowrap shrink-0">
              {filteredPosts.length.toLocaleString('fa-IR')} محصول
            </div>
          </div>

          {/* لیست محصولات */}
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-secondary gap-4">
              <div className="text-6xl">📦</div>
              <p className="text-lg">هیچ محصولی یافت نشد</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-accent-color text-white rounded-lg hover:bg-accent-hover transition-colors"
                >
                  حذف همه فیلترها
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-0.5 bg-bg-primary p-0.5 w-full max-w-full box-border grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => openModal(post)}
                  className="cursor-pointer w-full min-w-0"
                  role="button"
                  tabIndex={0}
                  aria-label={`مشاهده ${post.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      openModal(post);
                    }
                  }}
                >
                  <PostCard
                    id={post.id}
                    title={post.title}
                    price={post.price}
                    stock={post.stock}
                    category={post.category}
                    rating={post.rating}
                    images={
                      post.images
                        ? post.images
                        : post.image
                        ? [post.image]
                        : []
                    }
                    description={post.caption}
                    sellerName={post.authorName}
                    sellerUsername={post.authorUsername}
                    sellerAvatar={post.authorAvatar}
                    sellerId={post.userId}
                  />
                </div>
              ))}
            </div>
          )}
        </main>

        {/* مودال‌های فیلتر */}
        <MobileFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          categories={categories}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onFilterChange={handleFilterChange}
        />

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          categories={categories}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onFilterChange={handleFilterChange}
        />

        {/* مودال پست */}
        {isModalOpen && selectedPost && (
          <PostModal
            post={selectedPost}
            onAddToCart={handleAddToCart}
            onClose={closeModal}
            onSellerClick={() => handleSellerClick(selectedPost.userId)}
          />
        )}
      </div>
    </div>
  );
}