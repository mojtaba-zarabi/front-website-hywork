'use client';

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import UserAvatar from '@/components/UserAvatar';
import PostSlider from '@/components/PostSlider';
import DropdownMenu from '@/components/DropdownMenu';
import { toPersianNumber, formatPrice, formatRating } from '@/utils/numberUtils';
import { fetchPostById } from '@/services/postService';
import { UserContext } from '@/contexts/UserContext';
import commentsData from '@/data/comments.json';
import usersData from '@/data/users.json';
import type { Post as SharedPost } from '@/types';

// ==================== ICONS ====================
const CartIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const HeartIcon = ({ filled = false, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#ff3040" : "none"} stroke={filled ? "#ff3040" : "currentColor"} strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const SaveIcon = ({ filled = false, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const StarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const MoreVerticalIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const NavigationIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L2 22l10-6 10 6L12 2z" />
  </svg>
);

const ArrowBackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ==================== TYPES ====================
interface Comment {
  id: number;
  postId: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  likes: number;
  createdAt: string;
}

type Post = SharedPost & { shareCount?: number };

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

// ==================== COMMENT MODAL ====================
const CommentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  postId: number | null;
  comments: Comment[];
  onSendComment: (comment: Comment) => void;
  commentText: string;
  setCommentText: (text: string) => void;
  isMobile: boolean;
}> = ({ isOpen, onClose, postId, comments, onSendComment, commentText, setCommentText, isMobile }) => {
  const { user: currentUser } = useContext(UserContext);
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (comments && comments.length > 0) setLocalComments(comments);
  }, [comments]);

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

  if (!isOpen) return null;

  const handleSend = () => {
    if (commentText.trim() && currentUser) {
      const newComment: Comment = {
        id: Date.now(),
        postId: postId || 0,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.username || '',
        userAvatar: currentUser.avatar || '/default-avatar.png',
        text: commentText,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      onSendComment(newComment);
      setCommentText('');
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${toPersianNumber(diffMins)} دقیقه پیش`;
    if (diffHours < 24) return `${toPersianNumber(diffHours)} ساعت پیش`;
    if (diffDays < 7) return `${toPersianNumber(diffDays)} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-fade-in z-[2000] md:z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary w-full max-w-[550px] max-h-[85vh] rounded-t-2xl flex flex-col overflow-hidden animate-slide-up shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
        style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0)' : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-border-color bg-bg-secondary">
          <h3 className="text-base font-semibold text-text-primary m-0">
            نظرات ({toPersianNumber(localComments.length)})
          </h3>
          <button
            onClick={onClose}
            className="bg-none border-none text-2xl cursor-pointer text-text-secondary p-1 px-2 rounded-full transition-all hover:bg-bg-surface"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {localComments.length === 0 ? (
            <div className="text-center py-10 text-text-muted">
              <p>هنوز کامنتی ثبت نشده است</p>
              <p className="text-xs mt-2 text-text-secondary">اولین نفری باشید که نظر می‌دهید!</p>
            </div>
          ) : (
            localComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 pb-3 border-b border-border-color">
                <img
                  src={comment.userAvatar || '/default-avatar.png'}
                  alt={comment.userName}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <span className="text-sm font-semibold text-text-primary">{comment.userName}</span>
                    <span className="text-[10px] text-text-muted">{formatCommentDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary m-1 break-words">{comment.text}</p>
                  {comment.likes > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-text-muted">
                      <HeartIcon size={12} filled={false} />
                      <span>{toPersianNumber(comment.likes)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {currentUser ? (
          <div className="flex gap-3 px-5 py-4 border-t border-border-color bg-bg-secondary">
            <input
              type="text"
              placeholder="نظر خود را بنویسید..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-3 border border-border-color rounded-3xl outline-none text-sm bg-bg-primary text-text-primary rtl"
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!commentText.trim()}
              className={`px-5 py-2.5 rounded-3xl flex items-center gap-1.5 transition-all ${
                commentText.trim()
                  ? 'bg-accent-color text-white cursor-pointer hover:bg-accent-hover'
                  : 'bg-bg-surface text-text-muted border border-border-color cursor-not-allowed'
              }`}
            >
              <NavigationIcon size={18} />
            </button>
          </div>
        ) : (
          <div className="p-5 text-center border-t border-border-color">
            <p className="text-text-secondary">برای نوشتن نظر لطفاً وارد حساب کاربری خود شوید</p>
            <button
              className="mt-3 px-5 py-2 bg-accent-color text-white border-none rounded-2xl cursor-pointer"
              onClick={() => window.location.href = '/login'}
            >
              ورود به حساب
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id ? parseInt(params.id as string) : null;
  const { user: currentUser } = useContext(UserContext);
  const isMobile = useMobileDetect();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // ==================== LOAD COMMENTS ====================
  useEffect(() => {
    if (commentsData && commentsData.comments) {
      // کامنت‌های JSON فیلد date دارند و اطلاعات کاربر را ندارند
      const postComments: Comment[] = commentsData.comments
        .filter((comment) => comment.postId === postId)
        .map((comment) => {
          const author = usersData.users.find((u) => u.id === comment.userId);
          return {
            ...comment,
            userName: author?.name || author?.username || '',
            userAvatar: author?.avatar || '',
            createdAt: comment.date,
          };
        });
      setComments(postComments);
    }
  }, [postId]);

  // ==================== LOAD POST ====================
  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      if (postId) {
        const fetched = await fetchPostById(postId);
        if (fetched) {
          setPost(fetched);
        } else {
          // ✅ اگر پست در API نبود، از localStorage چک کن
          try {
            const savedPosts = localStorage.getItem('userPosts');
            if (savedPosts) {
              const posts = JSON.parse(savedPosts);
              const found = posts.find((p: any) => p.id === postId);
              if (found) {
                setPost(found);
              }
            }
          } catch (error) {
            console.error('Error loading post from localStorage:', error);
          }
        }
      }
      setLoading(false);
    };
    loadPost();
  }, [postId]);

  // ==================== HANDLERS ====================
  const handleSendComment = useCallback((newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
    setCommentText('');
  }, []);

  const handleSendCommentInline = useCallback(() => {
    if (newCommentText.trim() && currentUser) {
      const newComment: Comment = {
        id: Date.now(),
        postId: postId || 0,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.username || '',
        userAvatar: currentUser.avatar || '/default-avatar.png',
        text: newCommentText,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      setComments(prev => [newComment, ...prev]);
      setNewCommentText('');
    }
  }, [newCommentText, currentUser, postId]);

  const handleViewProfile = useCallback(() => {
    if (post?.authorUsername) router.push(`/${post.authorUsername}`);
    else if (post?.userId) router.push(`/profile?user=${post.authorUsername}`);
  }, [post, router]);

  const handleReport = useCallback(() => {}, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDeletePost = useCallback(() => {
    if (!post) return;
    
    if (window.confirm('آیا از حذف این پست مطمئن هستید؟')) {
      try {
        // حذف از localStorage
        const savedPosts = localStorage.getItem('userPosts');
        if (savedPosts) {
          const posts = JSON.parse(savedPosts);
          const updatedPosts = posts.filter((p: any) => p.id !== post.id);
          localStorage.setItem('userPosts', JSON.stringify(updatedPosts));
        }
        
        // حذف از posts.json (اگر در دیتا باشد)
        // اینجا می‌توانید API call برای حذف از سرور انجام دهید
        
        alert('پست با موفقیت حذف شد');
        router.push('/profile');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('خطا در حذف پست');
      }
    }
  }, [post, router]);

  const dropdownItems = [
    { label: 'مشاهده پروفایل', icon: '👤', onClick: handleViewProfile },
    { label: 'گزارش', icon: '🚫', onClick: handleReport },
  ];

  // ✅ اگر کاربر صاحب پست است، گزینه حذف رو هم اضافه کن
  if (currentUser && post && currentUser.id === post.userId) {
    dropdownItems.push({ label: 'حذف پست', icon: '🗑️', onClick: handleDeletePost });
  }

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'لحظاتی پیش';
    if (diffMins < 60) return `${toPersianNumber(diffMins)} دقیقه پیش`;
    if (diffHours < 24) return `${toPersianNumber(diffHours)} ساعت پیش`;
    if (diffDays < 7) return `${toPersianNumber(diffDays)} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  // ==================== LOADING ====================
  if (loading) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="text-center py-12 text-text-muted">
          <div className="w-10 h-10 border-3 border-border-color border-t-accent-color rounded-full animate-spin mx-auto" />
          <p className="mt-4">در حال بارگذاری...</p>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="text-center py-12">
          <h2 className="text-text-primary">پستی یافت نشد</h2>
          <button
            onClick={() => router.push('/')}
            className="mt-5 px-5 py-2.5 bg-accent-color text-white border-none rounded-lg cursor-pointer"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </>
    );
  }

  const likesCount = (post.likesCount || 0) + (liked ? 1 : 0);
  const postImages = post.images?.length ? post.images : (post.image ? [post.image] : []);

  // ==================== RENDER ====================
  return (
    <>
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      <div className="min-h-screen bg-bg-primary">
        {/* Desktop Layout */}
        <div className="hidden md:flex">
          <div className="flex gap-7 max-w-[1200px] mx-auto p-7 w-full">
            {/* Right Column */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={handleViewProfile}>
                  <UserAvatar
                    user={{ id: post.userId, avatar: post.authorAvatar, username: post.authorUsername, status: 'ready' }}
                    size={44}
                  />
                  <div>
                    <div className="font-semibold text-sm text-text-primary">{post.authorUsername || 'نویسنده'}</div>
                    <div className="text-xs text-text-muted">{post.authorName || ''}</div>
                  </div>
                </div>
                <DropdownMenu items={dropdownItems} triggerIcon={<MoreVerticalIcon size={20} />} iconSize={20} />
              </div>

              <div className="aspect-square bg-black overflow-hidden rounded-xl">
                <PostSlider images={postImages} postTitle={post.caption || post.title} />
              </div>

              <div className="flex justify-between items-center flex-wrap gap-2.5">
                <div className="flex gap-2 items-center flex-wrap">
                  <button className="bg-transparent border-none flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-primary px-3 py-2 rounded-lg transition-all hover:bg-bg-surface">
                    <CartIcon size={22} /><span>{toPersianNumber(0)}</span>
                  </button>
                  <button
                    onClick={() => setLiked(!liked)}
                    className="bg-transparent border-none flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-primary px-3 py-2 rounded-lg transition-all hover:bg-bg-surface"
                  >
                    <HeartIcon filled={liked} size={22} /><span>{toPersianNumber(likesCount)}</span>
                  </button>
                  <button
                    onClick={() => setIsCommentModalOpen(true)}
                    className="bg-transparent border-none flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-primary px-3 py-2 rounded-lg transition-all hover:bg-bg-surface"
                  >
                    <CommentIcon size={22} /><span>{toPersianNumber(comments.length)}</span>
                  </button>
                  <button className="bg-transparent border-none flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-primary px-3 py-2 rounded-lg transition-all hover:bg-bg-surface">
                    <ShareIcon size={22} /><span>{toPersianNumber(post.shareCount || 0)}</span>
                  </button>
                  <button
                    onClick={() => setSaved(!saved)}
                    className="bg-transparent border-none flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-primary px-3 py-2 rounded-lg transition-all hover:bg-bg-surface"
                  >
                    <SaveIcon filled={saved} size={22} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-bg-surface">
                  <StarIcon size={16} /><span className="text-sm font-semibold text-amber-500">{formatRating(post.rating || 0)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border-color">
                <span className="text-2xl font-extrabold text-accent-color">{formatPrice(post.price)} تومان</span>
              </div>
            </div>

            {/* Left Column */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              <h1 className="text-2xl font-bold text-text-primary m-0">{post.title || post.caption}</h1>
              <p className="text-sm leading-relaxed text-text-secondary m-0">{post.caption || 'توضیحاتی برای این پست موجود نیست.'}</p>

              <div className="bg-bg-surface p-4 rounded-xl">
                <h3 className="text-sm font-semibold mb-3 text-text-primary">مشخصات پست</h3>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-border-color">
                    <span className="text-sm text-text-muted">دسته بندی</span>
                    <span className="text-sm font-medium text-text-primary">{post.category || 'عمومی'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-color">
                    <span className="text-sm text-text-muted">موجودی</span>
                    <span className={`text-sm font-medium ${(post.stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(post.stock || 0) > 0 ? `${toPersianNumber(post.stock)} عدد` : 'ناموجود'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-text-muted">تاریخ انتشار</span>
                    <span className="text-sm font-medium text-text-primary">{new Date(post.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-bg-surface p-4 rounded-xl">
                <h3 className="text-sm font-semibold mb-3 text-text-primary">نظرات ({toPersianNumber(comments.length)})</h3>

                {currentUser && (
                  <div className="flex gap-2.5 mb-4">
                    <input
                      type="text"
                      placeholder="نظر خود را بنویسید..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendCommentInline()}
                      className="flex-1 px-3.5 py-2.5 border border-border-color rounded-3xl outline-none text-sm bg-bg-primary text-text-primary rtl"
                    />
                    <button
                      onClick={handleSendCommentInline}
                      disabled={!newCommentText.trim()}
                      className={`px-4 py-2 rounded-3xl flex items-center gap-1.5 transition-all ${
                        newCommentText.trim()
                          ? 'bg-accent-color text-white cursor-pointer hover:bg-accent-hover'
                          : 'bg-bg-surface text-text-muted border border-border-color cursor-not-allowed'
                      }`}
                    >
                      <NavigationIcon size={18} />
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center py-7 text-text-muted">
                      <p>هنوز کامنتی ثبت نشده است</p>
                      <p className="text-xs mt-2 text-text-secondary">اولین نفری باشید که نظر می‌دهید!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 pb-3 border-b border-border-color">
                        <img
                          src={comment.userAvatar || '/default-avatar.png'}
                          alt={comment.userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                            <span className="text-sm font-semibold text-text-primary">{comment.userName}</span>
                            <span className="text-[10px] text-text-muted">{formatCommentDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm leading-relaxed text-text-secondary m-1 break-words">{comment.text}</p>
                          {comment.likes > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-text-muted">
                              <HeartIcon size={12} filled={false} />
                              <span>{toPersianNumber(comment.likes)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col pt-4 pb-[70px]">
          <div className="flex flex-col gap-3 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 cursor-pointer" onClick={handleViewProfile}>
                <UserAvatar
                  user={{ id: post.userId, avatar: post.authorAvatar, username: post.authorUsername, status: 'ready' }}
                  size={40}
                />
                <div>
                  <div className="font-semibold text-sm text-text-primary">{post.authorUsername || 'نویسنده'}</div>
                  <div className="text-[11px] text-text-muted">{post.authorName || ''}</div>
                </div>
              </div>
              <DropdownMenu items={dropdownItems} triggerIcon={<MoreVerticalIcon size={20} />} iconSize={20} />
            </div>

            <div className="aspect-square bg-black overflow-hidden">
              <PostSlider images={postImages} postTitle={post.caption || post.title} />
            </div>

            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-1 items-center flex-wrap">
                <button className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-xs font-medium text-text-primary px-1.5 py-1.5 rounded-lg transition-all hover:bg-bg-surface">
                  <CartIcon size={18} /><span>{toPersianNumber(0)}</span>
                </button>
                <button
                  onClick={() => setLiked(!liked)}
                  className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-xs font-medium text-text-primary px-1.5 py-1.5 rounded-lg transition-all hover:bg-bg-surface"
                >
                  <HeartIcon filled={liked} size={18} /><span>{toPersianNumber(likesCount)}</span>
                </button>
                <button
                  onClick={() => setIsCommentModalOpen(true)}
                  className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-xs font-medium text-text-primary px-1.5 py-1.5 rounded-lg transition-all hover:bg-bg-surface"
                >
                  <CommentIcon size={18} /><span>{toPersianNumber(comments.length)}</span>
                </button>
                <button className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-xs font-medium text-text-primary px-1.5 py-1.5 rounded-lg transition-all hover:bg-bg-surface">
                  <ShareIcon size={18} /><span>{toPersianNumber(post.shareCount || 0)}</span>
                </button>
                <button
                  onClick={() => setSaved(!saved)}
                  className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-xs font-medium text-text-primary px-1.5 py-1.5 rounded-lg transition-all hover:bg-bg-surface"
                >
                  <SaveIcon filled={saved} size={18} />
                </button>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-2xl bg-bg-surface">
                <StarIcon size={14} /><span className="text-xs font-semibold text-amber-500">{formatRating(post.rating || 0)}</span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-border-color">
              <span className="text-xl font-extrabold text-accent-color">{formatPrice(post.price)} تومان</span>
            </div>

            <h1 className="text-lg font-bold text-text-primary m-0">{post.title || post.caption}</h1>
            <p className="text-sm leading-relaxed text-text-secondary m-0">{post.caption || 'توضیحاتی برای این پست موجود نیست.'}</p>

            <div className="bg-bg-surface p-3 rounded-xl">
              <h3 className="text-sm font-semibold mb-3 text-text-primary">مشخصات پست</h3>
              <div className="grid gap-2">
                <div className="flex justify-between items-center py-1.5 border-b border-border-color">
                  <span className="text-sm text-text-muted">دسته بندی</span>
                  <span className="text-sm font-medium text-text-primary">{post.category || 'عمومی'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-border-color">
                  <span className="text-sm text-text-muted">موجودی</span>
                  <span className={`text-sm font-medium ${(post.stock || 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(post.stock || 0) > 0 ? `${toPersianNumber(post.stock)} عدد` : 'ناموجود'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-text-muted">تاریخ انتشار</span>
                  <span className="text-sm font-medium text-text-primary">{new Date(post.createdAt).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            </div>

            {/* Mobile Comments */}
            <div className="bg-bg-surface p-3 rounded-xl mb-4">
              <h3 className="text-sm font-semibold mb-3 text-text-primary">نظرات ({toPersianNumber(comments.length)})</h3>

              {currentUser && (
                <div className="flex gap-2.5 mb-3">
                  <input
                    type="text"
                    placeholder="نظر خود را بنویسید..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendCommentInline()}
                    className="flex-1 px-3 py-2 border border-border-color rounded-3xl outline-none text-sm bg-bg-primary text-text-primary rtl"
                  />
                  <button
                    onClick={handleSendCommentInline}
                    disabled={!newCommentText.trim()}
                    className={`px-4 py-2 rounded-3xl flex items-center gap-1.5 transition-all ${
                      newCommentText.trim()
                        ? 'bg-accent-color text-white cursor-pointer hover:bg-accent-hover'
                        : 'bg-bg-surface text-text-muted border border-border-color cursor-not-allowed'
                    }`}
                  >
                    <NavigationIcon size={18} />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-5 text-text-muted">
                    <p>هنوز کامنتی ثبت نشده است</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 pb-3 border-b border-border-color">
                      <img
                        src={comment.userAvatar || '/default-avatar.png'}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                          <span className="text-sm font-semibold text-text-primary">{comment.userName}</span>
                          <span className="text-[10px] text-text-muted">{formatCommentDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-text-secondary m-1 break-words">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postId={postId}
        comments={comments}
        onSendComment={handleSendComment}
        commentText={commentText}
        setCommentText={setCommentText}
        isMobile={isMobile}
      />

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease;
        }
      `}</style>
    </>
  );
}