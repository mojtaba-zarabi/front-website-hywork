'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { searchPosts } from '@/services/postService';

// ==================== آیکون‌ها ====================
const SearchIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const LocationPinSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CloseIconSvg = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// ==================== کامپوننت اصلی ====================
export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [location] = useState('تهران');
  const [isMobile, setIsMobile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setLoading(true);

    if (term.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    const results = await searchPosts(term);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    handleSearch(term);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const goToFullMap = () => {
    router.push('/full-map');
  };

  const hasSearchTerm = searchTerm.trim() !== '';

  return (
    <>
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      <div className="fixed inset-0 bg-[var(--color-bg-primary)] overflow-hidden">
        {/* بخش جستجو - ثابت در مرکز */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[700px] mx-auto px-4">
            <div ref={searchRef} className="relative w-full">
              <div className="flex items-center gap-2.5 w-full">
                {/* دکمه موقعیت */}
                <button
                  onClick={goToFullMap}
                  className="flex flex-col items-center bg-transparent border-none px-2.5 flex-shrink-0 transition-transform hover:scale-105"
                >
                  <LocationPinSvg className="w-8 h-8 text-[var(--color-text-primary)]" />
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-center">
                    {location}
                  </span>
                </button>

                {/* باکس جستجو */}
                <div className="relative flex-1 min-w-0">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="جستجو هوشمند ..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="w-full py-3.5 px-5 pr-12 text-base border border-[var(--color-border-color)] rounded-full outline-none bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] transition-all focus:border-[#0095f6]"
                    autoFocus
                  />
                  {searchTerm ? (
                    <button
                      onClick={clearSearch}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      <CloseIconSvg className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] flex items-center justify-center">
                      <SearchIconSvg className="w-[22px] h-[22px]" />
                    </div>
                  )}
                </div>
              </div>

              {/* لیست پیشنهادات - با اسکرول مستقل */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="absolute left-0 right-0 top-full mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-color)] rounded-xl shadow-lg max-h-64 overflow-y-auto z-50"
                  style={{ 
                    maxHeight: 'min(256px, 50vh)',
                    overscrollBehavior: 'contain'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}-${suggestion}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-5 py-3 text-right text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface)] transition-colors flex items-center gap-3 border-b border-[var(--color-border-color)] last:border-b-0"
                    >
                      <SearchIconSvg className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* پیام‌های وضعیت */}
            <div className="mt-8 text-center">
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-text-primary)]"></div>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">در حال جستجو...</p>
                </>
              ) : hasSearchTerm && suggestions.length === 0 ? (
                <>
                  <p className="text-lg text-[var(--color-text-secondary)] mb-2">
                    نتیجه‌ای برای &quot;{searchTerm}&quot; یافت نشد.
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] opacity-70">
                    عبارت دیگری را امتحان کنید.
                  </p>
                </>
              ) : !hasSearchTerm && (
                <>
                  <SearchIconSvg className="w-16 h-16 text-[var(--color-text-secondary)] opacity-30 mx-auto mb-4" />
                  <p className="text-lg text-[var(--color-text-secondary)]">
                    برای جستجو، عبارت مورد نظر را وارد کنید
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] opacity-60 mt-2">
                    پیشنهادات مرتبط با عبارت شما نمایش داده می‌شود
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}