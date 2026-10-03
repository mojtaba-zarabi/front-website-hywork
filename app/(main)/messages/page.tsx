// src/app/(main)/messages/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { toPersianNumber } from '@/utils/numberUtils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useToast } from '@/components/NotificationToast';
import styles from './page.module.css';

// ============================================================
// 1️⃣ آیکون‌های SVG
// ============================================================

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DeleteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

const ReplyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 10l7-7v4a9 9 0 018 7v6" />
    <path d="M3 10l7 7v-4a9 9 0 018-7v-6" />
  </svg>
);

const ForwardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10l-7-7v4a9 9 0 00-8 7v6" />
    <path d="M21 10l-7 7v-4a9 9 0 00-8-7v-6" />
  </svg>
);

const CopyIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const SaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
);

const PinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 17v5M5 9l3-3m6 0l3 3M6 12l3 3m6-3l-3 3" />
    <path d="M12 2v7l-3 3h6l-3-3V2" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="8" y1="2" x2="8" y2="22" />
    <line x1="16" y1="2" x2="16" y2="22" />
    <line x1="2" y1="8" x2="22" y2="8" />
    <line x1="2" y1="16" x2="22" y2="16" />
  </svg>
);

const BackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const AttachIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

const EventIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ContactIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const VoiceIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckAllBigIcon = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="18 6 9 15 4 10" />
    <polyline points="20 10 15 15 14 14" />
  </svg>
);

// ============================================================
// 2️⃣ تعریف نوع‌ها
// ============================================================

/** نوع پیام */
interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  time: string;
  type: 'text' | 'image' | 'video' | 'voice' | 'file';
  status?: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  fileName?: string;
  replyTo?: { id: number; text: string };
}

/** نوع چت */
interface Chat {
  id: number;
  name: string;
  username: string;
  avatar: string;
  status: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  messages: Message[];
}

/** نوع کاربر برای آواتار */
interface UserForAvatar {
  avatar?: string;
  username?: string;
  status?: string;
}

// ============================================================
// 3️⃣ داده‌های نمونه
// ============================================================

const INITIAL_CHATS: Chat[] = [
  {
    id: 1,
    name: 'زهرا محمدی',
    username: 'zahra_m',
    avatar: '/images/avatar/me.png',
    status: 'ready',
    lastMessage: 'دوست داشتم! بعداً صحبت می‌کنیم',
    time: '12:45',
    unread: 0,
    isOnline: true,
    messages: [
      { id: 101, text: 'سلام! چطوری؟', sender: 'other', time: '12:30', type: 'text', status: 'read' },
      { id: 102, text: 'خوبم، تو چطوری؟', sender: 'me', time: '12:35', type: 'text', status: 'read' },
      { id: 103, text: 'دوست داشتم! بعداً صحبت می‌کنیم', sender: 'other', time: '12:45', type: 'text', status: 'read' },
    ],
  },
  {
    id: 2,
    name: 'محمد رضایی',
    username: 'mohammad_r',
    avatar: '/images/avatar/me.png',
    status: 'busy',
    lastMessage: 'قرار ساعت ۴ یادت نره',
    time: 'دیروز',
    unread: 2,
    isOnline: false,
    messages: [
      { id: 201, text: 'قرار ساعت ۴ یادت نره', sender: 'other', time: 'دیروز', type: 'text', status: 'read' },
      { id: 202, text: 'باشه, حتماً میام', sender: 'me', time: 'دیروز', type: 'text', status: 'read' },
    ],
  },
  {
    id: 3,
    name: 'سارا کریمی',
    username: 'sara_k',
    avatar: '/images/avatar/me.png',
    status: 'inactive',
    lastMessage: 'مرسی عزیزم 😍',
    time: 'دیروز',
    unread: 0,
    isOnline: true,
    messages: [
      { id: 301, text: 'عکس جدیدت رو دیدم عالی بود', sender: 'me', time: 'دیروز', type: 'text', status: 'read' },
      { id: 302, text: 'مرسی عزیزم 😍', sender: 'other', time: 'دیروز', type: 'text', status: 'read' },
    ],
  },
];

/** لیست اموجی‌ها */
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', 
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟',
  '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
  '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃'
];

// ============================================================
// 4️⃣ کامپوننت آواتار کاربر
// ============================================================

/**
 * کامپوننت نمایش آواتار کاربر با نشانگر وضعیت آنلاین
 */
const UserAvatar = ({
  user,
  size = 40,
}: {
  user: UserForAvatar;
  size?: number;
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'busy':
        return '#f44336';
      case 'ready':
        return '#4caf50';
      default:
        return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <img
        src={user?.avatar || '/images/avatar/me.png'}
        alt={user?.username || 'کاربر'}
        className="rounded-full object-cover border-2"
        style={{
          width: size,
          height: size,
          borderColor: getStatusColor(user?.status),
        }}
      />
    </div>
  );
};

// ============================================================
// 5️⃣ کامپوننت مودال پایین صفحه
// ============================================================

/**
 * مودال پایین صفحه برای انتخاب نوع رسانه
 */
const BottomModal = ({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  // مدیریت overflow بدنه
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      console.log('🔒 مودال باز شد - قفل اسکرول');
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      console.log('🔓 مودال بسته شد - آزادسازی اسکرول');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// ============================================================
// 6️⃣ کامپوننت منوی پیام
// ============================================================

/**
 * منوی عملیات روی پیام (کلیک راست)
 */
const MessageMenu = ({
  onReply,
  onForward,
  onCopy,
  onSave,
  onPin,
  onDelete,
  onClose,
}: {
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onSave: () => void;
  onPin: () => void;
  onDelete: () => void;
  onClose: () => void;
}) => {
  return (
    <div className={styles.messageMenu}>
      <button onClick={onReply} className={styles.menuItem}>
        <ReplyIcon className="w-[18px] h-[18px]" /> <span>پاسخ</span>
      </button>
      <button onClick={onForward} className={styles.menuItem}>
        <ForwardIcon className="w-[18px] h-[18px]" /> <span>فوروارد</span>
      </button>
      <button onClick={onCopy} className={styles.menuItem}>
        <CopyIcon className="w-[18px] h-[18px]" /> <span>کپی</span>
      </button>
      <button onClick={onSave} className={styles.menuItem}>
        <SaveIcon className="w-[18px] h-[18px]" /> <span>ذخیره</span>
      </button>
      <button onClick={onPin} className={styles.menuItem}>
        <PinIcon className="w-[18px] h-[18px]" /> <span>سنجاق</span>
      </button>
      <div className={styles.menuDivider} />
      <button onClick={onDelete} className={`${styles.menuItem} ${styles.menuItemDelete}`}>
        <DeleteIcon className="w-[18px] h-[18px]" /> <span>حذف</span>
      </button>
      <button onClick={onClose} className={styles.menuItem}>لغو</button>
    </div>
  );
};

// ============================================================
// 7️⃣ کامپوننت باکس پاسخ به پیام
// ============================================================

/**
 * نمایش پیام در حال پاسخ
 */
const ReplyBox = ({
  replyTo,
  onCancelReply,
  onGoToMessage,
}: {
  replyTo: { id: number; text: string };
  onCancelReply: () => void;
  onGoToMessage: () => void;
}) => {
  return (
    <div className={styles.replyBox}>
      <div className={styles.replyContent} onClick={onGoToMessage}>
        <span className={styles.replyLabel}>پاسخ به:</span>
        <span className={styles.replyText}>{replyTo.text?.substring(0, 50)}...</span>
      </div>
      <button onClick={onCancelReply} className={styles.cancelReplyBtn}>
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================================
// 8️⃣ کامپوننت اصلی صفحه پیام‌ها
// ============================================================

/**
 * صفحه پیام‌ها
 * 
 * روند کار:
 * 1. نمایش لیست چت‌ها با قابلیت جستجو
 * 2. انتخاب چت و نمایش پیام‌ها
 * 3. ارسال پیام متنی
 * 4. ارسال رسانه (تصویر، ویدیو، صوت، فایل)
 * 5. پاسخ به پیام
 * 6. عملیات روی پیام (کپی، حذف، فوروارد و...)
 * 7. نمایش وضعیت پیام (فرستاده، تحویل، خوانده)
 */
export default function MessagesPage() {
  // ============================================================
  // 8.1 هوک‌های ری‌اکت
  // ============================================================
  const router = useRouter();
  const { success, error, info } = useToast();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // ============================================================
  // 8.2 وضعیت‌های کامپوننت
  // ============================================================
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [selectedChat, setSelectedChat] = useState<Chat>(INITIAL_CHATS[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatDetail, setShowChatDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menuMessage, setMenuMessage] = useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [highlightedMsgId, setHighlightedMsgId] = useState<number | null>(null);

  // ============================================================
  // 8.3 رفرنس‌ها
  // ============================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // ============================================================
  // 8.4 محاسبات با useMemo
  // ============================================================

  /** چت‌های فیلتر شده بر اساس جستجو */
  const filteredChats = useMemo(() => {
    console.log('🔍 فیلتر چت‌ها:', { searchTerm });
    
    if (!searchTerm.trim()) {
      return chats;
    }
    const searchLower = searchTerm.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(searchLower) ||
        chat.username.toLowerCase().includes(searchLower)
    );
  }, [chats, searchTerm]);

  // ============================================================
  // 8.5 توابع کمکی
  // ============================================================

  /**
   * تبدیل زمان به فارسی
   */
  const formatTime = useCallback((timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.replace(/\d/g, (d) => toPersianNumber(parseInt(d)));
  }, []);

  /**
   * دریافت وضعیت رنگ بر اساس وضعیت پیام
   */
  const getStatusColor = useCallback((status?: string) => {
    switch (status) {
      case 'read':
        return '#4caf50';
      case 'delivered':
        return '#2196f3';
      default:
        return 'var(--color-text-muted)';
    }
  }, []);

  // ============================================================
  // 8.6 افکت‌ها
  // ============================================================

  /** اسکرول به انتهای پیام‌ها */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      console.log('📜 اسکرول به انتهای پیام‌ها');
    }
  }, [selectedChat?.messages]);

  /** بستن منو با کلیک خارج از آن */
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuMessage) {
        console.log('🔚 بستن منو با کلیک خارج');
        setMenuMessage(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuMessage]);

  /** پاک‌سازی هایلایت پیام */
  useEffect(() => {
    if (highlightedMsgId) {
      const timer = setTimeout(() => {
        console.log('✨ پاک‌سازی هایلایت پیام');
        setHighlightedMsgId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMsgId]);

  /** تنظیم نمایش چت در موبایل */
  useEffect(() => {
    console.log('📱 تغییر اندازه صفحه:', { isMobile });
    if (!isMobile) {
      setShowChatDetail(true);
    }
  }, [isMobile]);

  // ============================================================
  // 8.7 مدیریت چت‌ها
  // ============================================================

  /**
   * انتخاب چت
   */
  const handleSelectChat = useCallback((chat: Chat) => {
    console.log('💬 انتخاب چت:', { id: chat.id, name: chat.name });
    setSelectedChat(chat);
    if (isMobile) {
      setShowChatDetail(true);
    }
  }, [isMobile]);

  /**
   * بازگشت به لیست چت‌ها (موبایل)
   */
  const handleBackToList = useCallback(() => {
    console.log('🔙 بازگشت به لیست چت‌ها');
    setShowChatDetail(false);
  }, []);

  // ============================================================
  // 8.8 مدیریت پیام‌ها
  // ============================================================

  /**
   * ارسال پیام
   */
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedChat) {
      console.warn('⚠️ پیام خالی یا چت انتخاب نشده');
      return;
    }

    console.log('📤 ارسال پیام:', { text: newMessage, chatId: selectedChat.id });

    const newMsg: Message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      status: 'sent',
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text } : undefined,
    };

    // بروزرسانی چت‌ها
    const updatedChats = chats.map((chat) =>
      chat.id === selectedChat.id
        ? {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMessage,
            time: 'اکنون',
            unread: 0,
          }
        : chat
    );

    setChats(updatedChats);
    setSelectedChat(updatedChats.find((c) => c.id === selectedChat.id)!);
    setNewMessage('');
    setReplyTo(null);
    
    console.log('✅ پیام ارسال شد:', { id: newMsg.id });
    success('پیام ارسال شد');
  }, [newMessage, selectedChat, replyTo, chats, success]);

  /**
   * ارسال رسانه
   */
  const sendMedia = useCallback((file: File, type: Message['type']) => {
    if (!selectedChat) {
      console.warn('⚠️ چت برای ارسال رسانه انتخاب نشده');
      return;
    }

    console.log('📎 ارسال رسانه:', { type, fileName: file.name });

    const url = URL.createObjectURL(file);
    const newMsg: Message = {
      id: Date.now(),
      text: type === 'image' ? '📷 تصویر' : type === 'video' ? '🎥 ویدیو' : type === 'voice' ? '🎤 پیام صوتی' : `📎 ${file.name}`,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type,
      mediaUrl: url,
      fileName: file.name,
      status: 'sent',
    };

    const updatedChats = chats.map((chat) =>
      chat.id === selectedChat.id
        ? {
            ...chat,
            messages: [...chat.messages, newMsg],
            lastMessage: newMsg.text,
            time: 'اکنون',
          }
        : chat
    );

    setChats(updatedChats);
    setSelectedChat(updatedChats.find((c) => c.id === selectedChat.id)!);
    setIsModalOpen(false);
    
    console.log('✅ رسانه ارسال شد:', { id: newMsg.id });
    success('رسانه ارسال شد');
  }, [selectedChat, chats, success]);

  // ============================================================
  // 8.9 عملیات روی پیام
  // ============================================================

  /**
   * باز کردن منوی پیام
   */
  const handleOpenMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📋 باز کردن منوی پیام:', { id: msg.id });
    setMenuMessage(msg);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  /**
   * حذف پیام
   */
  const handleDeleteMessage = useCallback((msgId: number) => {
    if (!selectedChat) return;

    console.log('🗑️ حذف پیام:', { id: msgId });

    const updatedChats = chats.map((chat) => {
      if (chat.id === selectedChat.id) {
        const filtered = chat.messages.filter((m) => m.id !== msgId);
        return {
          ...chat,
          messages: filtered,
          lastMessage: filtered[filtered.length - 1]?.text || 'پیامی وجود ندارد',
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setSelectedChat(updatedChats.find((c) => c.id === selectedChat.id)!);
    setMenuMessage(null);
    
    success('پیام حذف شد');
  }, [selectedChat, chats, success]);

  /**
   * کپی پیام
   */
  const handleCopyMessage = useCallback((text: string) => {
    console.log('📋 کپی پیام:', { text });
    navigator.clipboard.writeText(text);
    info('پیام کپی شد');
    setMenuMessage(null);
  }, [info]);

  /**
   * دانلود فایل
   */
  const handleDownload = useCallback((url: string, fileName: string) => {
    console.log('📥 دانلود فایل:', { fileName });
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    success('دانلود شروع شد');
  }, [success]);

  /**
   * ذخیره پیام
   */
  const handleSaveMessage = useCallback((msg: Message) => {
    console.log('💾 ذخیره پیام:', { id: msg.id });
    localStorage.setItem(`saved_${msg.id}`, JSON.stringify(msg));
    success('پیام ذخیره شد');
    setMenuMessage(null);
  }, [success]);

  /**
   * سنجاق پیام
   */
  const handlePinMessage = useCallback(() => {
    console.log('📌 سنجاق پیام');
    success('پیام سنجاق شد');
    setMenuMessage(null);
  }, [success]);

  /**
   * فوروارد پیام
   */
  const handleForwardMessage = useCallback((msg: Message) => {
    console.log('↪️ فوروارد پیام:', { id: msg.id });
    success(`پیام فوروارد شد: ${msg.text}`);
    setMenuMessage(null);
  }, [success]);

  /**
   * اسکرول به پیام (برای پاسخ)
   */
  const scrollToMessage = useCallback((messageId: number) => {
    console.log('🔍 اسکرول به پیام:', { id: messageId });
    const ref = messageRefs.current[messageId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(messageId);
    }
  }, []);

  // ============================================================
  // 8.10 مدیریت مودال
  // ============================================================

  const handleAttachClick = useCallback(() => {
    console.log('📎 باز کردن مودال پیوست');
    setIsModalOpen(true);
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    console.log('😊 انتخاب اموجی:', { emoji });
    setNewMessage((prev) => prev + emoji);
  }, []);

  // ============================================================
  // 8.11 مدیریت رویدادها
  // ============================================================

  const handleEvent = useCallback(() => {
    console.log('📅 ایجاد رویداد');
    info('ایجاد رویداد');
    setIsModalOpen(false);
  }, [info]);

  const handleContact = useCallback(() => {
    console.log('👤 انتخاب مخاطب');
    info('انتخاب مخاطب');
    setIsModalOpen(false);
  }, [info]);

  const handleLocation = useCallback(() => {
    console.log('📍 ارسال موقعیت');
    info('ارسال موقعیت');
    setIsModalOpen(false);
  }, [info]);

  // ============================================================
  // 8.12 لاگ‌های رندر
  // ============================================================

  console.log('🖥️ رندر صفحه پیام‌ها:', {
    isMobile,
    selectedChat: selectedChat?.id,
    chatsCount: chats.length,
    filteredChatsCount: filteredChats.length,
    isModalOpen,
    hasReplyTo: !!replyTo,
    timestamp: new Date().toISOString(),
  });

  // ============================================================
  // 8.13 رندر پیام
  // ============================================================

  /**
   * رندر یک پیام
   */
  const renderMessage = useCallback((msg: Message) => {
    const isMe = msg.sender === 'me';
    const wrapperClass = `${styles.messageWrapper} ${
      isMe ? styles.messageWrapperMe : styles.messageWrapperOther
    } ${highlightedMsgId === msg.id ? styles.messageWrapperHighlight : ''}`;

    return (
      <div
        key={msg.id}
        ref={(el) => {
          messageRefs.current[msg.id] = el;
        }}
        className={wrapperClass}
        onContextMenu={(e) => handleOpenMenu(e, msg)}
      >
        <div className={styles.messageContainer}>
          {/* پاسخ به پیام */}
          {msg.replyTo && (
            <div
              className={`${styles.replyBubble} ${
                isMe ? styles.replyBubbleMe : styles.replyBubbleOther
              }`}
              onClick={(e) => {
                e.stopPropagation();
                scrollToMessage(msg.replyTo!.id);
              }}
            >
              <span className={styles.replyBubbleText}>
                پاسخ به: {msg.replyTo.text?.substring(0, 40)}...
              </span>
            </div>
          )}
          
          {/* محتوای پیام بر اساس نوع */}
          {msg.type === 'image' && (
            <img
              src={msg.mediaUrl}
              alt="تصویر اشتراک‌گذاری شده"
              className={styles.mediaImage}
              onClick={() => window.open(msg.mediaUrl)}
            />
          )}
          
          {msg.type === 'video' && (
            <video src={msg.mediaUrl} controls className={styles.mediaVideo} />
          )}
          
          {msg.type === 'voice' && (
            <audio src={msg.mediaUrl} controls className={styles.mediaAudio} />
          )}
          
          {msg.type === 'file' && (
            <div className={styles.fileBubble}>
              <span>📎</span>
              <span className={styles.fileName}>{msg.fileName}</span>
              <button
                onClick={() => handleDownload(msg.mediaUrl!, msg.fileName!)}
                className={styles.downloadBtn}
              >
                <DownloadIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {msg.type === 'text' && msg.text && (
            <div className={isMe ? styles.messageBubbleMe : styles.messageBubbleOther}>
              {msg.text}
            </div>
          )}
          
          {/* فوتر پیام */}
          <div className={styles.messageFooter}>
            <span className={styles.messageTime}>{formatTime(msg.time)}</span>
            {isMe && (
              <span className={styles.messageStatus}>
                {msg.status === 'sent' && <CheckIcon className="w-3 h-3" />}
                {msg.status === 'delivered' && <CheckAllBigIcon className="w-3 h-3" />}
                {msg.status === 'read' && <CheckAllBigIcon className="w-3 h-3" style={{ color: '#4caf50' }} />}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [highlightedMsgId, handleOpenMenu, scrollToMessage, formatTime, handleDownload]);

  // ============================================================
  // 8.14 رندر اصلی
  // ============================================================

  return (
    <div className={styles.messagesApp}>
      {/* ==================== لیست چت‌ها ==================== */}
      <div
        className={`${styles.chatList} ${
          isMobile && showChatDetail ? styles.chatListHidden : ''
        }`}
      >
        {/* سرچ */}
        <div className={styles.chatSearch}>
          <div className={styles.searchWrapper}>
            <SearchIcon className="w-5 h-5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="جستجو..."
              value={searchTerm}
              onChange={(e) => {
                console.log('🔍 جستجو:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className={styles.searchInput}
              aria-label="جستجوی چت‌ها"
            />
          </div>
          <button 
            className={styles.homeBackBtn} 
            onClick={() => {
              console.log('🏠 بازگشت به صفحه اصلی');
              router.push('/');
            }}
            aria-label="بازگشت به صفحه اصلی"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        </div>

        {/* لیست چت‌ها */}
        <div className={styles.chatItems}>
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${
                selectedChat?.id === chat.id ? styles.chatItemActive : ''
              }`}
              onClick={() => handleSelectChat(chat)}
            >
              <UserAvatar user={chat} size={isMobile ? 56 : 48} />
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                <div className={styles.chatMessage}>{chat.lastMessage}</div>
              </div>
              <div className={styles.chatMeta}>
                <div className={styles.chatTime}>{formatTime(chat.time)}</div>
                {chat.unread > 0 && (
                  <div className={styles.chatUnread}>{toPersianNumber(chat.unread)}</div>
                )}
              </div>
              {chat.isOnline && <div className={styles.onlineIndicator} />}
            </div>
          ))}
        </div>
      </div>

      {/* ==================== جزییات چت ==================== */}
      <div
        className={`${styles.chatDetail} ${
          isMobile && !showChatDetail ? styles.chatDetailHidden : ''
        }`}
      >
        {selectedChat ? (
          <>
            {/* هدر چت */}
            <div className={styles.chatHeader}>
              <UserAvatar user={selectedChat} size={isMobile ? 44 : 40} />
              <div className={styles.chatHeaderInfo}>
                <div className={styles.chatHeaderName}>{selectedChat.name}</div>
                <div className={styles.chatHeaderStatus}>
                  {selectedChat.isOnline ? 'آنلاین' : 'آفلاین'}
                </div>
              </div>
              {isMobile && (
                <button 
                  className={styles.backBtn} 
                  onClick={handleBackToList}
                  aria-label="بازگشت به لیست چت‌ها"
                >
                  <BackIcon className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* پیام‌ها */}
            <div className={styles.chatMessagesArea}>
              {selectedChat.messages.map((msg) => renderMessage(msg))}
              <div ref={messagesEndRef} />
            </div>

            {/* باکس پاسخ */}
            {replyTo && (
              <ReplyBox
                replyTo={replyTo}
                onCancelReply={() => {
                  console.log('❌ لغو پاسخ به پیام');
                  setReplyTo(null);
                }}
                onGoToMessage={() => scrollToMessage(replyTo.id)}
              />
            )}

            {/* ورودی پیام */}
            <div className={styles.chatInputArea}>
              <button 
                className={styles.attachBtn} 
                onClick={handleAttachClick}
                aria-label="پیوست فایل"
              >
                <AttachIcon className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="پیام..."
                className={styles.messageInput}
                aria-label="ورودی پیام"
              />
              <button 
                onClick={handleSendMessage} 
                className={styles.sendBtn}
                aria-label="ارسال پیام"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>

            {/* فایل‌های مخفی برای آپلود */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  sendMedia(e.target.files[0], 'image');
                }
              }}
              aria-label="انتخاب تصویر"
            />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  sendMedia(e.target.files[0], 'file');
                }
              }}
              aria-label="انتخاب فایل"
            />
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  sendMedia(e.target.files[0], 'video');
                }
              }}
              aria-label="انتخاب ویدیو"
            />
            <input
              type="file"
              ref={voiceInputRef}
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  sendMedia(e.target.files[0], 'voice');
                }
              }}
              aria-label="انتخاب صوت"
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <p>هیچ گفتگویی وجود ندارد</p>
          </div>
        )}
      </div>

      {/* ==================== منوی پیام ==================== */}
      {menuMessage && (
        <div 
          className={styles.floatingMenu} 
          style={{ top: menuPosition.y, left: menuPosition.x }}
        >
          <MessageMenu
            onReply={() => {
              console.log('↩️ پاسخ به پیام:', { id: menuMessage.id });
              setReplyTo(menuMessage);
              setMenuMessage(null);
            }}
            onForward={() => handleForwardMessage(menuMessage)}
            onCopy={() => handleCopyMessage(menuMessage.text)}
            onSave={() => handleSaveMessage(menuMessage)}
            onPin={handlePinMessage}
            onDelete={() => handleDeleteMessage(menuMessage.id)}
            onClose={() => {
              console.log('❌ بستن منو');
              setMenuMessage(null);
            }}
          />
        </div>
      )}

      {/* ==================== مودال ==================== */}
      <BottomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* اموجی‌ها */}
        <div className={styles.emojiRow}>
          {EMOJIS.map((emoji, idx) => (
            <button 
              key={idx} 
              className={styles.emojiItem} 
              onClick={() => handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* گزینه‌های پیوست */}
        <div className={styles.modalGrid}>
          <button className={styles.modalItem} onClick={() => imageInputRef.current?.click()}>
            <ImageIcon className="w-8 h-8" /> <span>تصویر</span>
          </button>
          <button className={styles.modalItem} onClick={() => videoInputRef.current?.click()}>
            <VideoIcon className="w-8 h-8" /> <span>ویدیو</span>
          </button>
          <button className={styles.modalItem} onClick={() => fileInputRef.current?.click()}>
            <FileIcon className="w-8 h-8" /> <span>فایل</span>
          </button>
          <button className={styles.modalItem} onClick={handleEvent}>
            <EventIcon className="w-8 h-8" /> <span>ایونت</span>
          </button>
          <button className={styles.modalItem} onClick={handleContact}>
            <ContactIcon className="w-8 h-8" /> <span>کانتکت</span>
          </button>
          <button className={styles.modalItem} onClick={handleLocation}>
            <LocationIcon className="w-8 h-8" /> <span>موقعیت</span>
          </button>
          <button className={styles.modalItem} onClick={() => voiceInputRef.current?.click()}>
            <VoiceIcon className="w-8 h-8" /> <span>صوتی</span>
          </button>
        </div>
        
        <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
          بستن
        </button>
      </BottomModal>
    </div>
  );
}