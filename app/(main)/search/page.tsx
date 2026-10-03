'use client';

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import PostCard from '@/components/PostCard';
import PostModal from '@/components/PostModal';
import { fetchAllPosts } from '@/services/postService';
import type { Post } from '@/types';

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" strokeLinecap="round" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
  </svg>
);

const useMediaQuery = (query: string) => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener('change', onStoreChange);
    return () => media.removeEventListener('change', onStoreChange);
  }, [query]);

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export default function SearchPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const posts = useMemo(() => fetchAllPosts(), []);

  const filteredPosts = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('fa');
    if (!term) return posts;

    return posts.filter((post) =>
      [
        post.title,
        post.caption,
        post.description,
        post.category,
        post.brand,
        post.model,
        post.authorName,
        post.authorUsername,
      ].some((value) => value?.toLocaleLowerCase('fa').includes(term))
    );
  }, [posts, searchTerm]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      <main className="min-h-screen pb-24 md:pb-8 md:mr-[72px]">
        <header className="sticky top-0 z-40 border-b border-[var(--color-border-color)] bg-[var(--color-bg-primary)]/95 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1480px] items-center gap-2 px-3 py-3 sm:px-5 lg:px-8">
            <button
              type="button"
              onClick={() => router.push('/full-map')}
              className="flex min-w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-none bg-transparent px-2 py-1 text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-surface)]"
              aria-label="انتخاب موقعیت"
            >
              <LocationIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">تهران</span>
            </button>

            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="جستجوی محصول، دسته‌بندی یا فروشنده..."
                aria-label="جستجوی محصولات"
                className="h-11 w-full rounded-full border border-[var(--color-border-color)] bg-[var(--color-bg-secondary)] px-12 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-color)]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="پاک کردن جستجو"
                  className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-none bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] hover:text-[var(--color-text-primary)]"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1480px] px-2 py-3 sm:px-4 lg:px-6">
          <div className="mb-3 flex items-center justify-between gap-4 px-1">
            <p className="m-0 text-xs text-[var(--color-text-muted)]">
              {filteredPosts.length.toLocaleString('fa-IR')} محصول
            </p>
            {searchTerm && (
              <p className="m-0 truncate text-xs text-[var(--color-text-secondary)]">
                نتایج «{searchTerm}»
              </p>
            )}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--color-border-color)] bg-[var(--color-border-color)] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`مشاهده ${post.title}`}
                  onClick={() => setSelectedPost(post)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPost(post);
                    }
                  }}
                  className="min-w-0 bg-[var(--color-bg-card)] outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent-color)]"
                >
                  <PostCard
                    id={post.id}
                    title={post.title}
                    price={post.price}
                    images={post.images || (post.image ? [post.image] : [])}
                    rating={post.rating}
                    sellerName={post.authorName}
                    sellerUsername={post.authorUsername}
                    sellerAvatar={post.authorAvatar}
                    sellerId={post.userId}
                    category={post.category}
                    stock={post.stock}
                    description={post.caption || post.description}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-color)] px-6 text-center">
              <SearchIcon className="mb-4 h-12 w-12 text-[var(--color-text-muted)]" />
              <h2 className="mb-2 text-lg font-semibold">محصولی پیدا نشد</h2>
              <p className="m-0 max-w-sm text-sm text-[var(--color-text-secondary)]">
                عبارت جستجو را تغییر دهید یا برای مشاهده همه محصولات، جستجو را پاک کنید.
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="mt-5 rounded-full border-none bg-[var(--color-accent-color)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]"
              >
                نمایش همه محصولات
              </button>
            </div>
          )}
        </section>
      </main>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onAddToCart={(post) => window.alert(`${post.title} به سبد خرید اضافه شد`)}
        />
      )}
    </div>
  );
}
