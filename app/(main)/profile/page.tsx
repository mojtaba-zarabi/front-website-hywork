'use client';

import { Suspense, useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import AvatarWithStatus from '@/components/AvatarWithStatus';
import PostCard from '@/components/PostCard';
import { useTheme } from '@/contexts/ThemeContext';
import { UserContext } from '@/contexts/UserContext';
import { fetchUserByUsername, fetchPostsByUserId } from '@/services/postService';
import { toPersianNumber } from '@/utils/numberUtils';
import type { Post, User } from '@/types';

// ==================== آیکون‌ها ====================
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const AddPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const BackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

// ==================== Theme Switch ====================
const ThemeSwitch = ({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) => (
  <div className="inline-flex items-center cursor-pointer" onClick={toggleTheme}>
    <div className={`w-[52px] h-[28px] rounded-[30px] flex items-center p-0.5 transition-all duration-300 border-2 border-border-color ${theme === 'dark' ? 'justify-end' : 'justify-start'}`}>
      <div className="w-[22px] h-[22px] bg-white rounded-full shadow-md border border-black/10 transition-transform duration-200" />
    </div>
  </div>
);

// ==================== Toast ====================
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl text-white font-medium shadow-lg animate-slideDown ${colors[type]}`}>
      {message}
    </div>
  );
};

// ==================== کاربر تست ====================
const MOCK_USER: User = {
  id: 1,
  username: 'mojtaba',
  name: 'مجتبی زرابی',
  email: 'mojtaba@example.com',
  avatar: '/images/avatars/default.png',
  bio: 'توسعه‌دهنده وب | عاشق تکنولوژی',
  location: 'تهران، ایران',
  followersCount: 120,
  followingCount: 85,
};

// ==================== کامپوننت اصلی ====================
// useSearchParams نیاز به Suspense دارد تا صفحه در build پیش‌رندر شود
export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get('user');
  const { theme, toggleTheme } = useTheme();
  const { user: currentUser, setUser } = useContext(UserContext);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [highlights] = useState([
    { id: 3, cover: '/images/highlights/3.png', title: 'معرفی' },
    { id: 2, cover: '/images/highlights/2.png', title: 'اطلاعیه' },
    { id: 1, cover: '/images/highlights/1.png', title: 'کدنویسی' },
  ]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch {
          localStorage.setItem('user', JSON.stringify(MOCK_USER));
          setUser(MOCK_USER);
        }
      } else {
        localStorage.setItem('user', JSON.stringify(MOCK_USER));
        setUser(MOCK_USER);
      }
    }
  }, [currentUser, setUser]);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        let userData: User | null = null;
        let targetUsername: string | null = null;

        if (usernameParam) {
          targetUsername = usernameParam;
        } else if (currentUser?.username) {
          targetUsername = currentUser.username;
        } else {
          targetUsername = MOCK_USER.username;
        }

        if (targetUsername) {
          userData = await fetchUserByUsername(targetUsername);
        }

        if (!userData && targetUsername === MOCK_USER.username) {
          userData = MOCK_USER;
        }

        if (userData) {
          setProfileUser(userData);
          const userPosts = await fetchPostsByUserId(userData.id);
          if (userPosts && userPosts.length > 0) {
            setPosts(userPosts);
          } else if (userData.username === 'mojtaba') {
            const mockPosts: Post[] = [
              {
                id: 1,
                userId: 1,
                title: 'پست نمونه ۱',
                caption: 'این یک پست نمونه برای نمایش در پروفایل است',
                price: 1250000,
                stock: 10,
                category: 'الکترونیک',
                rating: 4.8,
                image: '/images/posts/1.jpg',
                images: ['/images/posts/1.jpg'],
                likesCount: 25,
                commentsCount: 5,
                createdAt: new Date().toISOString(),
                authorName: userData.name || userData.username,
                authorUsername: userData.username,
                authorAvatar: userData.avatar || '/images/avatars/default.png',
              },
            ];
            setPosts(mockPosts);
          } else {
            setPosts([]);
          }
        } else {
          setProfileUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [currentUser, usernameParam]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleFollow = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/users/${profileUser?.id}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('خطا در عملیات دنبال کردن');
      }

      setIsFollowing(!isFollowing);
      setProfileUser((prev) => ({
        ...prev!,
        followersCount: isFollowing ? (prev!.followersCount || 0) - 1 : (prev!.followersCount || 0) + 1,
      }));
      
      showToast(isFollowing ? 'دنبال کردن لغو شد' : 'با موفقیت دنبال شدید', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در عملیات', 'error');
    }
  };

  const getAvatarSize = () => {
    if (typeof window === 'undefined') return 77;
    const w = window.innerWidth;
    if (w <= 340) return 56;
    if (w <= 380) return 60;
    if (w <= 480) return 70;
    if (w <= 768) return 77;
    return 150;
  };

  // ✅ اصلاح: تشخیص اینکه آیا کاربر صاحب پروفایل است
  // idهای users.json و کاربر لاگین‌شده از یک منبع نیستند و ممکن است تکراری باشند،
  // پس فقط username مقایسه می‌شود
  const isOwnProfile = () => {
    if (!currentUser?.username || !profileUser?.username) return false;
    return currentUser.username.toLowerCase() === profileUser.username.toLowerCase();
  };

  const goBack = () => {
    router.back();
  };

  // بارگذاری
  if (loading) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-text-muted text-center">
            <div className="w-10 h-10 border-4 border-border-color border-t-accent-color rounded-full animate-spin mx-auto" />
            <p className="mt-4">در حال بارگذاری...</p>
          </div>
        </div>
      </>
    );
  }

  // اگر کاربر لاگین نیست
  if (!currentUser && !usernameParam) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-5">
          <div className="text-center text-text-primary">
            <h2 className="text-2xl font-bold mb-2">لطفاً وارد شوید</h2>
            <p className="text-text-muted">برای مشاهده پروفایل خود باید وارد حساب کاربری شوید.</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-5 px-6 py-2.5 bg-accent-color text-white border-none rounded-lg cursor-pointer hover:bg-accent-hover transition-colors"
            >
              ورود به حساب
            </button>
          </div>
        </div>
      </>
    );
  }

  // اگر پروفایل پیدا نشد
  if (!profileUser) {
    return (
      <>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileBottomNav />}
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-5">
          <div className="text-center text-text-primary">
            <h2 className="text-2xl font-bold mb-2">پروفایل یافت نشد</h2>
            <p className="text-text-muted">کاربر مورد نظر وجود ندارد.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-5 px-6 py-2.5 bg-accent-color text-white border-none rounded-lg cursor-pointer hover:bg-accent-hover transition-colors"
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      </>
    );
  }

  const persianPostsCount = toPersianNumber(posts.length);
  const persianFollowers = toPersianNumber((profileUser.followersCount || 0).toLocaleString());
  const persianFollowing = toPersianNumber((profileUser.followingCount || 0).toLocaleString());

  const isOwn = isOwnProfile();

  return (
    <>
      {!isMobile && <Sidebar />}
      {isMobile && <MobileBottomNav />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="profile-content-area">
        <div className="profile-container">
          {/* دکمه بازگشت */}
          {!isOwn && usernameParam && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-text-primary bg-transparent border-none cursor-pointer p-2 mb-2 rounded-lg hover:bg-bg-surface transition-colors"
            >
              <BackIcon className="w-5 h-5" />
              <span>بازگشت</span>
            </button>
          )}

          {/* هدر پروفایل */}
          <div className="profile-header">
            <div className="profile-avatar-section">
              <AvatarWithStatus
                src={profileUser.avatar}
                alt={profileUser.username}
                size={getAvatarSize()}
              />
            </div>

            <div className="profile-info-section">
              <div className="profile-stats">
                <div className="profile-stat-item">
                  <strong>{persianPostsCount}</strong>
                  <span>پست</span>
                </div>
                <div className="profile-stat-item">
                  <strong>{persianFollowers}</strong>
                  <span>دنبال‌کننده</span>
                </div>
                <div className="profile-stat-item">
                  <strong>{persianFollowing}</strong>
                  <span>دنبال‌شونده</span>
                </div>
              </div>

              <div className="profile-bio">
                <strong>{profileUser.name || profileUser.username}</strong>
                <p>{profileUser.bio || 'خوش آمدید به پروفایل من'}</p>
                {profileUser.location && (
                  <p className="text-xs text-text-muted mt-1">📍 {profileUser.location}</p>
                )}
              </div>

              {/* ✅ بخش اکشن‌ها - اصلاح شده */}
              <div className="profile-actions">
                {isOwn ? (
                  // ✅ دکمه ویرایش پروفایل (فقط برای خود کاربر)
                  <>
                    <button 
                      onClick={() => router.push('/profile/edit')} 
                      className="profile-edit-btn"
                    >
                      ویرایش پروفایل
                    </button>
                    <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
                    <button className="profile-icon-btn">
                      <SettingsIcon className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  // ✅ دکمه دنبال کردن (برای کاربران دیگر)
                  <>
                    <button
                      className={isFollowing ? 'profile-following-btn' : 'profile-follow-btn'}
                      onClick={handleFollow}
                    >
                      {isFollowing ? 'دنبال می‌کنید' : 'دنبال کردن'}
                    </button>
                    <button className="profile-icon-btn">
                      <SettingsIcon className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* هایلایت‌ها */}
          <div className="profile-highlights-wrapper">
            <div className="profile-highlights">
              <div className="profile-highlight-item">
                <div className="profile-add-highlight-circle">
                  <AddPlusIcon className="w-8 h-8" />
                </div>
                <span className="profile-highlight-title">جدید</span>
              </div>

              {highlights.map((item) => (
                <div key={item.id} className="profile-highlight-item">
                  <div className="profile-highlight-circle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <span className="profile-highlight-title">{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* تب‌ها */}
          <div className="profile-tabs">
            <button className="profile-active-tab">
              <GridIcon className="w-6 h-6" />
              <span>پست‌ها</span>
            </button>
          </div>

          {/* گرید پست‌ها */}
          <div className="profile-products-grid">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="profile-product-link"
                >
                  <PostCard
                    id={post.id}
                    title={post.title}
                    price={post.price}
                    stock={post.stock}
                    category={post.category}
                    rating={post.rating}
                    images={post.images || [post.image || '/images/posts/placeholder.svg']}
                    description={post.caption}
                    sellerName={post.authorName}
                    sellerUsername={post.authorUsername}
                    sellerAvatar={post.authorAvatar}
                    sellerId={post.userId}
                    hideHeader={true}
                    compact={true}
                  />
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-text-muted col-span-full">
                <p>هیچ پستی یافت نشد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-content-area {
          min-height: 100vh;
          background-color: var(--color-bg-primary);
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }

        @media (max-width: 768px) {
          .profile-content-area {
            margin-right: 0;
            margin-bottom: 70px;
            margin-top: 0;
            min-height: calc(100vh - 70px);
          }
        }

        .profile-container {
          margin: 0 auto;
          width: 100%;
          overflow-x: hidden;
          position: relative;
        }

        @media (min-width: 769px) {
          .profile-container {
            width: 800px;
            max-width: 100%;
            padding: 30px 20px;
            margin: 0 auto;
          }
        }

        @media (max-width: 768px) {
          .profile-container {
            max-width: 100%;
            padding: 0;
          }
        }

        .profile-header {
          display: flex;
          width: 100%;
        }

        @media (min-width: 769px) {
          .profile-header {
            gap: 40px;
            margin-bottom: 40px;
            padding: 0;
          }
        }

        @media (max-width: 768px) {
          .profile-header {
            gap: 12px;
            margin-bottom: 16px;
            padding: 12px 12px 0 12px;
          }
        }

        .profile-avatar-section {
          flex-shrink: 0;
        }

        .profile-info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .profile-stats {
          display: flex;
          width: 100%;
        }

        @media (min-width: 769px) {
          .profile-stats {
            gap: 40px;
          }
          .profile-stat-item {
            text-align: center;
          }
          .profile-stat-item strong {
            font-size: 18px;
            display: block;
            color: var(--color-text-primary);
          }
          .profile-stat-item span {
            font-size: 14px;
            color: var(--color-text-muted);
          }
        }

        @media (max-width: 768px) {
          .profile-stats {
            gap: 8px;
            justify-content: space-between;
          }
          .profile-stat-item {
            text-align: center;
            flex: 1;
          }
          .profile-stat-item strong {
            font-size: 12px;
            display: block;
            color: var(--color-text-primary);
          }
          .profile-stat-item span {
            font-size: 9px;
            color: var(--color-text-muted);
            display: block;
          }
        }

        .profile-bio {
          line-height: 1.4;
          word-break: break-word;
          color: var(--color-text-primary);
        }

        @media (min-width: 769px) {
          .profile-bio {
            font-size: 14px;
          }
        }

        @media (max-width: 768px) {
          .profile-bio {
            font-size: 11px;
          }
        }

        .profile-bio strong {
          display: block;
          margin-bottom: 4px;
          color: var(--color-text-primary);
        }

        .profile-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .profile-edit-btn,
        .profile-follow-btn,
        .profile-following-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        @media (max-width: 768px) {
          .profile-edit-btn,
          .profile-follow-btn,
          .profile-following-btn {
            padding: 5px 12px;
            font-size: 11px;
          }
        }

        .profile-edit-btn {
          background-color: var(--color-bg-surface);
          color: var(--color-text-primary);
        }
        .profile-edit-btn:hover {
          background-color: var(--color-border-color);
        }

        .profile-follow-btn {
          background-color: #0095f6;
          color: #fff;
        }
        .profile-follow-btn:hover {
          background-color: #0080d4;
        }

        .profile-following-btn {
          background-color: var(--color-bg-surface);
          color: var(--color-text-primary);
        }
        .profile-following-btn:hover {
          background-color: var(--color-border-color);
        }

        .profile-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          color: var(--color-text-primary);
        }
        .profile-icon-btn:hover {
          background-color: var(--color-bg-surface);
        }

        .profile-highlights-wrapper {
          border-top: 1px solid var(--color-border-color);
          border-bottom: 1px solid var(--color-border-color);
          width: 100%;
          padding-bottom: 8px;
        }

        @media (min-width: 769px) {
          .profile-highlights-wrapper {
            padding: 20px 0 12px 0;
            margin: 0;
          }
        }

        @media (max-width: 768px) {
          .profile-highlights-wrapper {
            padding: 12px 0 6px 0;
          }
        }

        .profile-highlights {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
          padding: 0 16px 4px 16px;
          scroll-behavior: smooth;
        }

        .profile-highlights::-webkit-scrollbar {
          height: 4px;
        }
        .profile-highlights::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .profile-highlights::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
        }

        @media (max-width: 768px) {
          .profile-highlights {
            gap: 12px;
            padding: 0 12px 4px 12px;
          }
        }

        .profile-highlight-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .profile-highlight-circle {
          width: 77px;
          height: 77px;
          border-radius: 50%;
          border: 2px solid var(--color-border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background-color: var(--color-bg-card);
        }

        .profile-add-highlight-circle {
          width: 77px;
          height: 77px;
          border-radius: 50%;
          border: 2px dashed var(--color-border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-secondary);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .profile-highlight-circle,
          .profile-add-highlight-circle {
            width: 60px;
            height: 60px;
          }
        }

        .profile-highlight-title {
          font-size: 12px;
          color: var(--color-text-secondary);
        }

        @media (max-width: 768px) {
          .profile-highlight-title {
            font-size: 10px;
          }
        }

        .profile-tabs {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        @media (min-width: 769px) {
          .profile-tabs {
            margin-top: 20px;
          }
        }

        @media (max-width: 768px) {
          .profile-tabs {
            margin-top: 12px;
          }
        }

        .profile-active-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 0;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: var(--color-text-primary);
          position: relative;
        }

        .profile-active-tab::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--color-text-primary);
        }

        @media (max-width: 768px) {
          .profile-active-tab {
            font-size: 12px;
            padding: 8px 0;
          }
          .profile-active-tab svg {
            width: 18px;
            height: 18px;
          }
        }

        .profile-products-grid {
          display: grid;
          width: 100%;
          overflow-x: hidden;
        }

        @media (min-width: 769px) {
          .profile-products-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin-top: 4px;
          }
        }

        @media (max-width: 768px) {
          .profile-products-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            margin-top: 1px;
          }
        }

        .profile-product-link {
          text-decoration: none;
          color: inherit;
          display: block;
          width: 100%;
          min-width: 0;
        }

        .profile-product-link > div {
          width: 100%;
          overflow: hidden;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}