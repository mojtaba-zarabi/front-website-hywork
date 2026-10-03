'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { UserContext } from '@/contexts/UserContext';

// ==================== آیکون‌ها ====================
const House01Icon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const MessagesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const CreatePostIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CartIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ==================== مودال خروج ====================
const ConfirmLogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [isOpen]);

  useEffect(() => {
    let animationFrame: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isOpen) {
      animationFrame = requestAnimationFrame(() => {
        setIsVisible(true);
        setIsAnimatingOut(false);
      });
    } else if (!isOpen && isVisible) {
      animationFrame = requestAnimationFrame(() => {
        setIsAnimatingOut(true);
        timer = setTimeout(() => {
          setIsVisible(false);
          setIsAnimatingOut(false);
        }, 300);
      });
    }
    return () => {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] pointer-events-auto
        ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-bg-secondary)] rounded-xl w-[90%] max-w-[380px] overflow-hidden
          ${isAnimatingOut ? 'animate-modalExit' : 'animate-modalEnter'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[var(--color-border-color)]">
          <h3 className="m-0 text-lg font-semibold text-[var(--color-text-primary)] text-center">
            خروج از حساب کاربری
          </h3>
        </div>
        <div className="p-6 text-center">
          <p className="m-0 text-sm text-[var(--color-text-secondary)]">
            آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟
          </p>
        </div>
        <div className="flex gap-3 p-4 border-t border-[var(--color-border-color)]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-[var(--color-bg-surface)] border-none rounded-lg text-sm font-medium text-[var(--color-text-primary)] cursor-pointer transition-colors hover:bg-[var(--color-border-color)]"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 bg-red-600 border-none rounded-lg text-sm font-medium text-white cursor-pointer transition-colors hover:bg-red-700"
          >
            خروج
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== کامپوننت اصلی سایدبار ====================
interface SidebarProps {
  disableHover?: boolean;
  suppressActiveProfile?: boolean;
}

interface MenuItem {
  name: string;
  path?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Sidebar({
  disableHover = false,
  suppressActiveProfile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const userContext = useContext(UserContext);
  const setUser = userContext?.setUser ?? null;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (setUser) setUser(null);
    router.push('/login');
    setShowLogoutModal(false);
  };

  const isActivePath = (path: string) => pathname === path;

  const isActive = (item: MenuItem) => {
    if (item.path === '/profile') {
      return !suppressActiveProfile && isActivePath(item.path);
    }
    if (item.path) return isActivePath(item.path);
    return false;
  };


  const menuItems: MenuItem[] = [
    { name: 'خانه', path: '/', icon: House01Icon },
    { name: 'جستجو', path: '/search', icon: SearchIcon },
    { name: 'پیام‌ها', path: '/messages', icon: MessagesIcon },
    { name: 'ساخت پست', path: '/create-post', icon: CreatePostIcon },
// در بخش menuItems، آیتم پروفایل رو اینطور تغییر بده:
{ 
  name: 'پروفایل', 
  path: '/profile',  // از action به path تغییر بده
  icon: ProfileIcon 
},
    { name: 'سبد خرید', path: '/cart', icon: CartIcon },
    { name: 'داشبورد', path: '/dashboard', icon: DashboardIcon },
  ];

  const activeColor = theme === 'dark' ? '#ffffff' : '#000000';
  const inactiveColor = theme === 'dark' ? '#aaaaaa' : '#6c757d';

  // عرض سایدبار در حالت بسته و باز
  const sidebarWidth = isHovered ? '220px' : '72px';

  return (
    <>
      <aside
        className="fixed right-0 top-0 h-screen bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-color)] py-5 px-0 overflow-y-auto z-[1000] transition-all duration-300 ease-in-out"
        style={{ 
          width: sidebarWidth,
          overflowX: 'hidden',
        }}
        onMouseEnter={() => !disableHover && setIsHovered(true)}
        onMouseLeave={() => !disableHover && setIsHovered(false)}
      >
        {/* لوگو */}
        <div className="px-5 pb-5 mb-2.5 border-b border-[var(--color-border-color)] text-center transition-all duration-300">
          <Link href="/" className="no-underline">
            <span className={`text-2xl font-bold text-[var(--color-text-primary)] transition-all duration-300 ${isHovered ? 'inline' : 'hidden'}`}>
              🚀 MyApp
            </span>
            <span className={`text-2xl font-bold text-[var(--color-text-primary)] transition-all duration-300 ${isHovered ? 'hidden' : 'inline'}`}>
              🚀
            </span>
          </Link>
        </div>

        <ul className="list-none p-0 m-0">
          {menuItems.map((item) => {
            const active = isActive(item);
            const IconComponent = item.icon;
            const itemColor = active ? activeColor : inactiveColor;

            const content = (
              <>
                <IconComponent className="w-6 h-6 shrink-0" />
                <span 
                  className={`text-sm transition-all duration-300 whitespace-nowrap overflow-hidden`}
                  style={{
                    opacity: isHovered ? 1 : 0,
                    width: isHovered ? 'auto' : '0',
                    color: itemColor,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {item.name}
                </span>
              </>
            );

            // نکته: gap فقط وقتی سایدبار باز است اعمال می‌شود.
            // اگر gap همیشه ثابت باشد (مثلاً gap-3)، حتی وقتی span
            // عرض 0 دارد، همان فاصله‌ی gap بین آیکون و span باقی می‌ماند
            // و باعث می‌شود آیکون در حالت justify-center دقیقاً وسط
            // نباشد (به اندازه‌ی نصف gap به یک طرف منحرف می‌شود).
            const itemGap = isHovered ? '12px' : '0px';

            if (item.action) {
              return (
                <li key={item.name} className="my-1">
                  <button
                    onClick={item.action}
                    className={`
                      flex items-center py-3 text-sm rounded-xl mx-2 w-[calc(100%-16px)] text-right
                      transition-all duration-200 border-none cursor-pointer
                      ${active ? 'bg-[var(--color-bg-surface)]' : 'bg-transparent'}
                      ${isHovered ? 'px-5 justify-start' : 'px-0 justify-center'}
                    `}
                    style={{
                      color: itemColor,
                      fontWeight: active ? '600' : '400',
                      justifyContent: isHovered ? 'flex-start' : 'center',
                      gap: itemGap,
                    }}
                  >
                    {content}
                  </button>
                </li>
              );
            }

            return (
              <li key={item.name} className="my-1">
                <Link
                  href={item.path!}
                  className={`
                    flex items-center py-3 text-sm rounded-xl mx-2 w-[calc(100%-16px)] text-right
                    transition-all duration-200 no-underline
                    ${active ? 'bg-[var(--color-bg-surface)]' : 'bg-transparent'}
                    ${isHovered ? 'px-5 justify-start' : 'px-0 justify-center'}
                  `}
                  style={{
                    color: itemColor,
                    fontWeight: active ? '600' : '400',
                    justifyContent: isHovered ? 'flex-start' : 'center',
                    gap: itemGap,
                  }}
                >
                  {content}
                </Link>
              </li>
            );
          })}

          {/* دکمه خروج */}
          <li className="my-1">
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`
                flex items-center py-3 text-sm rounded-xl mx-2 w-[calc(100%-16px)] text-right
                transition-all duration-200 border-none cursor-pointer bg-transparent
                ${isHovered ? 'px-5 justify-start' : 'px-0 justify-center'}
              `}
              style={{
                color: inactiveColor,
                fontWeight: '400',
                justifyContent: isHovered ? 'flex-start' : 'center',
                gap: isHovered ? '12px' : '0px',
              }}
            >
              <LogoutIcon className="w-6 h-6 shrink-0" />
              <span 
                className={`text-sm transition-all duration-300 whitespace-nowrap overflow-hidden`}
                style={{
                  opacity: isHovered ? 1 : 0,
                  width: isHovered ? 'auto' : '0',
                  color: inactiveColor,
                }}
              >
                خروج
              </span>
            </button>
          </li>
        </ul>
      </aside>

      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modalEnter {
          0% {
            opacity: 0;
            transform: scale(0.85) rotate(-2deg) translateY(30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg) translateY(0);
          }
        }
        @keyframes modalExit {
          0% {
            opacity: 1;
            transform: scale(1) rotate(0deg) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) rotate(1deg) translateY(-20px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.25s ease-in forwards;
        }
        .animate-modalEnter {
          animation: modalEnter 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
        }
        .animate-modalExit {
          animation: modalExit 0.25s ease-in forwards;
        }
      `}</style>
    </>
  );
}
