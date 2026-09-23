'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from './ImageWithFallback';
import DropdownMenu from './DropdownMenu';
import AvatarWithStatus from './AvatarWithStatus';
import { toPersianNumber, formatPrice, formatRating } from '@/utils/numberUtils';

interface PostCardProps {
  id: number;
  title: string;
  price: number;
  images?: string[];
  rating?: number;
  sellerName?: string;
  sellerUsername?: string;
  sellerAvatar?: string;
  category?: string;
  stock?: number;
  description?: string;
  hideHeader?: boolean;
  compact?: boolean;
  sellerId?: number;
}

export default function PostCard({
  id,
  title,
  price,
  images = [],
  rating = 0,
  sellerName,
  sellerUsername,
  sellerAvatar,
  category,
  stock = 0,
  description,
  hideHeader = false,
  compact = false,
  sellerId,
}: PostCardProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getDisplayImage = () => {
    if (images && Array.isArray(images) && images.length > 0) return images[0];
    return '/images/posts/placeholder.svg';
  };

  const displayImage = getDisplayImage();
  const formattedPrice = formatPrice(price);
  const formattedRating = formatRating(rating);
  const formattedStock = toPersianNumber(stock || 0);
  const isService = category === 'خدمات';

  const truncateTitle = (text: string, maxLength = compact ? 30 : 35) => {
    if (!text) return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
  };

  const truncateDescription = (text?: string, maxLength = 70) => {
    if (!text) return 'توضیحاتی برای این محصول موجود نیست.';
    return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
  };

  const handleReport = () => alert(`گزارش محصول "${title}" با موفقیت ثبت شد`);
  const handleShare = () => {
    const url = `${window.location.origin}/product/${id}`;
    navigator.clipboard.writeText(url);
    alert('لینک محصول کپی شد');
  };
  const handleSave = () => alert(`محصول "${title}" در لیست ذخیره شده‌ها قرار گرفت`);
  const handleViewSeller = () => {
    if (sellerUsername && sellerUsername !== 'unknown') {
      router.push(`/profile?user=${sellerUsername}`);
    } else if (sellerId) {
      router.push(`/profile?user=${sellerId}`);
    } else {
      alert('اطلاعات فروشنده در دسترس نیست');
    }
  };

  const dropdownItems = [
    { label: 'مشاهده فروشنده', icon: '👤', onClick: handleViewSeller },
    { label: 'ذخیره', icon: '🔖', onClick: handleSave },
    { label: 'اشتراک گذاری', icon: '📤', onClick: handleShare },
    { label: 'گزارش', icon: '🚫', onClick: handleReport },
  ];

  // حالت فشرده (compact) - برای پروفایل کاربر
  if (compact) {
    return (
      <div className="bg-(--color-bg-card) overflow-hidden cursor-pointer relative">
        <div className="relative aspect-square overflow-hidden bg-(--color-bg-surface)">
          <ImageWithFallback
            src={displayImage}
            alt={title}
            fallbackSrc="/images/posts/placeholder.svg"
            className="w-full h-full object-cover"
          />
          {isService && (
            <span className="absolute top-2 right-2 bg-green-500 text-white px-2.5 py-1 text-[11px] font-medium z-[2] rounded-full">
              خدمات
            </span>
          )}
          {stock === 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white px-2.5 py-1 text-[11px] font-medium z-[2] rounded-full">
              ناموجود
            </span>
          )}
        </div>
        <div className="p-2">
          <h3
            className={`text-[13px] font-medium m-0 mb-1 text-(--color-text-primary) line-clamp-2 leading-tight min-h-[28px] sm:min-h-[32px]`}
            title={title}
          >
            {truncateTitle(title, isMobile ? 30 : 35)}
          </h3>
          <div className={`text-[14px] font-bold text-(--color-accent-color) ${isMobile ? 'text-[11px]' : ''}`}>
            {formattedPrice} تومان
          </div>
        </div>
      </div>
    );
  }

  // حالت کامل (پیش‌فرض)
  return (
    <div className="bg-(--color-bg-card) overflow-hidden cursor-pointer relative ">
      {!hideHeader && (
        <div className="flex justify-between items-center px-3 py-2.5 bg-(--color-bg-card) border-b border-(--color-border-light) relative">
          <Link
            href={sellerUsername && sellerUsername !== 'unknown' ? `/profile?user=${sellerUsername}` : sellerId ? `/profile?user=${sellerId}` : '/profile'}
            className="no-underline flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <AvatarWithStatus
                src={sellerAvatar || '/images/avatars/default.png'}
                alt={sellerName || sellerUsername || 'کاربر'}
                size={32}
                status="online"
                showStatus={true}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-(--color-text-primary) line-clamp-1">
                  {sellerName || sellerUsername || 'نامشخص'}
                </span>
                <span className="text-[10px] text-(--color-text-muted) line-clamp-1">
                  @{sellerUsername || 'unknown'}
                </span>
              </div>
            </div>
          </Link>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu items={dropdownItems} iconSize={20} />
          </div>
        </div>
      )}

      <div className="relative aspect-square overflow-hidden bg-(--color-bg-surface)">
        <ImageWithFallback
          src={displayImage}
          alt={title}
          fallbackSrc="/images/posts/placeholder.svg"
          className="w-full h-full object-cover"
        />
        {isService && (
          <span className="absolute top-2 right-2 bg-green-500 text-white px-2.5 py-1 text-[11px] font-medium z-[2] rounded-full">
            خدمات
          </span>
        )}
        {stock === 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white px-2.5 py-1 text-[11px] font-medium z-[2] rounded-full">
            ناموجود
          </span>
        )}
      </div>

      <div className="p-3 pb-3">
        <h3
          className="text-sm font-semibold m-0 mb-1.5 text-(--color-text-primary) leading-tight truncate"
          title={title}
        >
          {truncateTitle(title)}
        </h3>
        <p
          className="text-xs leading-relaxed text-(--color-text-secondary) m-0 mb-3 line-clamp-2 min-h-[36px]"
          title={description}
        >
          {truncateDescription(description)}
        </p>
        <div className="flex items-center mb-1.5 w-full justify-between">
          <div />
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-(--color-text-muted)">موجودی</span>
            <span className="font-medium">{formattedStock} عدد</span>
          </div>
          {rating > 0 && (
            <div className="flex items-center px-1.5">
              <span className="text-[11px]">⭐</span>
              <span className="text-[11px] font-semibold text-amber-500">{formattedRating}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end">
          <div className="text-[15px] font-bold text-(--color-accent-color)">
            {formattedPrice} تومان
          </div>
        </div>
      </div>
    </div>
  );
}