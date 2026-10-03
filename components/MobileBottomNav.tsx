'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

// ==================== آیکون‌ها (SVG Inline) ====================
const ProfileIcon = ({ className, stroke, fill }: { className?: string; stroke?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke || 'currentColor'} strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = ({ className, stroke, fill }: { className?: string; stroke?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke || 'currentColor'} strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CreatePostIcon = ({ className, stroke, fill }: { className?: string; stroke?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke || 'currentColor'} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const CartIcon = ({ className, stroke, fill }: { className?: string; stroke?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke || 'currentColor'} strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
  </svg>
);

const MessagesIcon = ({ className, stroke, fill }: { className?: string; stroke?: string; fill?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill={fill || 'none'} stroke={stroke || 'currentColor'} strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

// ==================== کامپوننت اصلی ====================
interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string; stroke?: string; fill?: string }>;
}

interface MobileBottomNavProps {
  suppressActiveProfile?: boolean;
}

export default function MobileBottomNav({
  suppressActiveProfile = false,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const menuItems: MenuItem[] = [
    { name: 'پروفایل', path: '/profile', icon: ProfileIcon },
    { name: 'جستجو', path: '/search', icon: SearchIcon },
    { name: 'ساخت پست', path: '/create-post', icon: CreatePostIcon },
    { name: 'سبد خرید', path: '/cart', icon: CartIcon },
    { name: 'پیام‌ها', path: '/messages', icon: MessagesIcon },
  ];

  const isActivePath = (path: string) => pathname === path;
  const activeColor = theme === 'dark' ? '#ffffff' : '#000000';
  const inactiveColor = theme === 'dark' ? '#a0a0a0' : '#737373';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-color)] flex justify-around items-center px-3 z-[1100] shadow-[0_-2px_10px_var(--color-shadow)]">
      {menuItems.map((item) => {
        const active =
          !(suppressActiveProfile && item.path === '/profile') &&
          isActivePath(item.path);
        const IconComponent = item.icon;
        const itemColor = active ? activeColor : inactiveColor;

        return (
          <Link
            key={item.name}
            href={item.path}
            className="flex flex-col items-center gap-1 no-underline flex-1 py-1 transition-all duration-200 hover:scale-105"
            style={{ color: itemColor }}
          >
            <div className="relative flex items-center justify-center">
              <IconComponent
                className="w-6 h-6 block"
                stroke={itemColor}
                fill={active ? itemColor : 'none'}
              />
            </div>
            <span className="text-[11px] transition-colors duration-200">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
