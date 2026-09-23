'use client';

import { useState, useEffect, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/contexts/UserContext';
import PostSlider from './PostSlider';
import { toPersianNumber, formatPrice, formatRating } from '@/utils/numberUtils';
import type { Post, Comment, User } from '@/types';

// ==================== هوک‌های کمکی ====================
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
};

const useScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};

const useEscapeKey = (handler: () => void) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handler]);
};

// ==================== آواتار ====================
const UserAvatar = ({
  user,
  size = 40,
  onClick,
}: {
  user?: { avatar?: string; username?: string; status?: string };
  size?: number;
  onClick?: () => void;
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'busy':
        return '#f44336';
      case 'ready':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <img
      src={user?.avatar || '/images/avatars/default.png'}
      alt={user?.username || 'کاربر'}
      onClick={onClick}
      className={`w-${size} h-${size} rounded-full object-cover border-2 flex-shrink-0 cursor-pointer`}
      style={{
        width: size,
        height: size,
        borderColor: getStatusColor(user?.status),
      }}
    />
  );
};

// ==================== آیکون‌ها ====================
const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? '#ff3040' : 'none'}
    stroke={filled ? '#ff3040' : 'currentColor'}
    strokeWidth="1.5"
  >
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const SaveIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? '#262626' : 'none'}
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? '#FFD700' : 'none'}
    stroke="#FFD700"
    strokeWidth="1.5"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);

// ==================== تابع کمکی برای نرمال‌سازی مسیر تصاویر ====================
const normalizeImagePath = (path?: string): string => {
  if (!path) return '/images/posts/placeholder.svg';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return path;
  return `/images/posts/${path}`;
};

// ==================== Props ====================
interface PostModalProps {
  post: Post;
  onAddToCart?: (post: Post) => void;
  onClose: () => void;
  onSellerClick?: () => void;
}

// ==================== PostModal اصلی ====================
export default function PostModal({ post, onAddToCart, onClose, onSellerClick }: PostModalProps) {
  const router = useRouter();
  const { user: currentUser } = useContext(UserContext);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  useScrollLock(true);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  useEscapeKey(handleClose);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  const handleAuthorClick = useCallback(
    (event?: React.MouseEvent) => {
      if (event?.stopPropagation) event.stopPropagation();
      handleClose();
      if (onSellerClick) {
        onSellerClick();
      } else {
        const username = post?.authorUsername;
        if (username && username !== 'unknown') {
          router.push(`/profile?user=${username}`);
        } else if (post?.userId) {
          router.push(`/profile?user=${post.userId}`);
        } else {
          router.push('/profile');
        }
      }
    },
    [post, router, handleClose, onSellerClick]
  );

  if (!post) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center" onClick={handleOverlayClick}>
        <div className="bg-[var(--color-bg-card)] p-10 text-center text-[var(--color-text-primary)]">
          اطلاعات پست در دسترس نیست
          <button onClick={handleClose} className="mt-5 px-5 py-2.5 bg-[var(--color-accent-color)] text-white border-none cursor-pointer">
            بستن
          </button>
        </div>
      </div>
    );
  }

  const handleSendComment = () => {
    if (commentText.trim() === '') return;

    const commentUser: User = currentUser
      ? {
          id: currentUser.id,
          username: currentUser.username || 'کاربر',
          name: currentUser.name,
          avatar: currentUser.avatar,
        }
      : {
          id: 999,
          username: 'مهمان',
          avatar: '/images/avatars/default.png',
        };

    const newComment: Comment = {
      id: comments.length + 1,
      postId: post.id,
      userId: commentUser.id,
      user: commentUser,
      text: commentText,
      date: new Date().toISOString(),
      likes: 0,
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  // پردازش تصاویر پست
  let rawImages: string[] = [];
  if (post.images && Array.isArray(post.images) && post.images.length) {
    rawImages = post.images;
  } else if (post.image) {
    rawImages = [post.image];
  } else {
    rawImages = ['/images/posts/placeholder.svg'];
  }
  const postImages = rawImages.map((img) => normalizeImagePath(img));

  const truncatedDescription = (text?: string, maxLength = isMobile ? 120 : 180) => {
    if (!text) return 'توضیحاتی برای این پست موجود نیست.';
    return text.length <= maxLength ? text : text.substring(0, maxLength).trim() + '...';
  };

  const cartItemCount = post?.cartCount || 0;

  const handleAddToCartClick = () => {
    if (onAddToCart) onAddToCart(post);
  };

  const containerWidth = isMobile ? 'calc(100% - 20px)' : isTablet ? '90%' : '85%';
  const maxContainerWidth = isMobile ? '480px' : isTablet ? '900px' : '1200px';
  const maxContainerHeight = isMobile ? '85vh' : '90vh';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0"
      onClick={handleOverlayClick}
    >
      <div
        className="relative flex flex-col bg-[var(--color-bg-card)] overflow-hidden shadow-2xl"
        style={{
          width: containerWidth,
          maxWidth: maxContainerWidth,
          maxHeight: maxContainerHeight,
          margin: isMobile ? '10px' : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="بستن"
          className="absolute top-3 end-3 w-9 h-9 border-none bg-black/50 cursor-pointer flex items-center justify-center z-10 text-white"
        >
          <CloseIcon />
        </button>

        <div className="flex-1 overflow-y-auto p-2.5">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 w-full`}>
            {/* ستون راست - تصاویر و تعاملات */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={handleAuthorClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAuthorClick()}
              >
                <UserAvatar
                  user={{
                    avatar: post.authorAvatar,
                    username: post.authorUsername,
                    status: 'ready',
                  }}
                  size={isMobile ? 36 : 44}
                  onClick={handleAuthorClick}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                    {post.authorUsername || 'نویسنده'}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {post.authorName || ''}
                  </span>
                </div>
              </div>

              <div className="w-full aspect-square bg-black overflow-hidden">
                <PostSlider images={postImages} postTitle={post.title || post.caption || ''} />
              </div>

              <div className="flex justify-between items-center flex-wrap gap-2.5">
                <div className="flex gap-0.5 items-center flex-wrap">
                  <button onClick={handleAddToCartClick} className="border-none flex items-center gap-1 cursor-pointer text-xs font-medium p-1.5 text-[var(--color-text-primary)]">
                    <CartIcon />
                    <span>{toPersianNumber(cartItemCount)}</span>
                  </button>
                  <button onClick={() => setLiked(!liked)} className="border-none flex items-center gap-1 cursor-pointer text-xs font-medium p-1.5 text-[var(--color-text-primary)]">
                    <HeartIcon filled={liked} />
                    <span>{toPersianNumber((post.likesCount || 0) + (liked ? 1 : 0))}</span>
                  </button>
                  <button className="border-none flex items-center gap-1 cursor-pointer text-xs font-medium p-1.5 text-[var(--color-text-primary)]">
                    <CommentIcon />
                    <span>{toPersianNumber(comments.length)}</span>
                  </button>
                  <button className="border-none flex items-center gap-1 cursor-pointer text-xs font-medium p-1.5 text-[var(--color-text-primary)]">
                    <ShareIcon />
                    <span>{toPersianNumber(post.sharesCount || 0)}</span>
                  </button>
                  <button onClick={() => setSaved(!saved)} className="border-none flex items-center gap-1 cursor-pointer text-xs font-medium p-1.5 text-[var(--color-text-primary)]">
                    <SaveIcon filled={saved} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 p-1.5">
                  <StarIcon filled={true} />
                  <span className="text-xs font-bold text-amber-500">
                    {formatRating(post.rating || 4.5)}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 pt-2 border-t border-[var(--color-border-color)]">
                <span
                  className="font-extrabold text-[var(--color-accent-color)]"
                  style={{ fontSize: isMobile ? '18px' : isTablet ? '20px' : '22px' }}
                >
                  {formatPrice(post.price)}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">تومان</span>
              </div>
            </div>

            {/* ستون چپ - اطلاعات و کامنت‌ها */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <h2
                className={`font-bold m-0 leading-tight text-[var(--color-text-primary)] ${isMobile ? '' : 'pe-12'}`}
                style={{ fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px' }}
              >
                {post.title || post.caption}
              </h2>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {truncatedDescription(post.caption || post.description)}
              </p>

              <div
                className="grid gap-2.5 bg-[var(--color-bg-surface)] p-3"
                style={{
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '10px' : '12px',
                  padding: isMobile ? '12px' : '16px',
                }}
              >
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">برند:</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-left">{post.brand || 'نامشخص'}</span>
                </div>
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">مدل:</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-left">{post.model || 'نامشخص'}</span>
                </div>
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">رنگ:</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-left">{post.color || 'نامشخص'}</span>
                </div>
                <div className="flex justify-between items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">وزن:</span>
                  <span className="text-xs font-medium text-[var(--color-text-primary)] text-left">{post.weight || 'نامشخص'}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-center px-3 py-2.5 bg-[var(--color-bg-surface)]">
                <span className="font-semibold text-xs text-[var(--color-text-muted)]">دسته‌بندی:</span>
                <span className="text-xs">{post.category || 'عمومی'}</span>
              </div>

              <div className="flex gap-2.5 items-center px-3 py-2.5 bg-[var(--color-bg-surface)]">
                <span className="font-semibold text-xs text-[var(--color-text-muted)]">موجودی:</span>
                <span className={`text-xs ${(post.stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(post.stock || 0) > 0 ? `${toPersianNumber(post.stock || 0)} عدد` : 'ناموجود'}
                </span>
              </div>

              <div className="border-t border-[var(--color-border-color)] pt-4">
                <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-primary)]">
                  نظرات کاربران ({toPersianNumber(comments.length)})
                </h4>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <input
                    type="text"
                    placeholder="نظر خود را بنویسید..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                    className="flex-1 px-3.5 py-2.5 border border-[var(--color-border-color)] outline-none text-xs bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  />
                  <button
                    onClick={handleSendComment}
                    className={`px-5 py-2.5 font-semibold border-none ${
                      commentText.trim()
                        ? 'bg-[var(--color-accent-color)] text-white cursor-pointer'
                        : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-color)] cursor-not-allowed'
                    }`}
                  >
                    ارسال
                  </button>
                </div>
                <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1.5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 p-2.5 bg-[var(--color-bg-surface)]">
                      <UserAvatar
                        user={{
                          avatar: comment.user?.avatar,
                          username: comment.user?.username,
                        }}
                        size={32}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-[var(--color-text-primary)] mb-1">
                          {comment.user?.username || 'کاربر'}
                        </div>
                        <div className="text-xs leading-relaxed text-[var(--color-text-secondary)] break-words">
                          {comment.text}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-1">
                          {comment.date ? new Date(comment.date).toLocaleDateString('fa-IR') : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}