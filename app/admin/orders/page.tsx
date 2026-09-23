// app/admin/orders/page.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { toPersianNumber, formatPrice } from '@/utils/numberUtils';
import { useToast } from '@/components/NotificationToast';

// ==================== آیکون‌های SVG ====================
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ArrowDownUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 3v18" />
    <path d="M3 7l4-4 4 4" />
    <path d="M17 21V3" />
    <path d="M13 17l4 4 4-4" />
  </svg>
);

const ArrowDownSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14" />
    <path d="M18 13l-6 6-6-6" />
  </svg>
);

const ArrowUpSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 19V5" />
    <path d="M6 11l6-6 6 6" />
  </svg>
);

const CaretDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const ShowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditPencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CloseSmIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

const SmileySadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const TrashFullIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const TruckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 3h15v13H1z" />
    <path d="M16 8h4l3 3v5h-3" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const PackageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// ==================== کامپوننت سلکت سفارشی ====================
interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
}

const CustomSelect = ({ options, value, onChange, placeholder }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        dropdownRef.current.style.top = 'auto';
        dropdownRef.current.style.bottom = '100%';
        dropdownRef.current.style.marginTop = '0';
        dropdownRef.current.style.marginBottom = '8px';
      } else {
        dropdownRef.current.style.top = '100%';
        dropdownRef.current.style.bottom = 'auto';
        dropdownRef.current.style.marginTop = '8px';
        dropdownRef.current.style.marginBottom = '0';
      }
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={selectRef} className="relative min-w-[140px]">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 border rounded-xl text-[13px] font-inherit bg-(--color-bg-primary) cursor-pointer transition-all duration-200 text-(--color-text-primary) ${
          isOpen 
            ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]' 
            : 'border-(--color-border-color)'
        }`}
      >
        <span className="text-[13px]">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className={`inline-flex transition-transform duration-200 mr-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <CaretDownIcon />
        </span>
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 left-0 bg-(--color-bg-card) border border-(--color-border-color) rounded-xl shadow-lg z-50 overflow-hidden mt-2"
        >
          {options.map(opt => (
            <div
              key={String(opt.value)}
              onClick={() => handleSelect(opt.value)}
              className={`px-4 py-2.5 text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap text-(--color-text-primary) hover:bg-(--color-bg-surface) ${
                opt.value === value ? 'bg-(--color-bg-surface) font-medium' : ''
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== کامپوننت منوی سه نقطه ====================
interface OrderMoreMenuProps {
  order: any;
  onViewDetails: (order: any) => void;
  onEditOrder: (order: any) => void;
  onCancelOrder: (orderId: number) => void;
  onDeleteOrder: (order: any) => void;
  onUpdateStatus: (orderId: number, status: string) => void;
  onAddTracking: (order: any) => void;
  onViewDispute: (order: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const OrderMoreMenu = ({ 
  order, onViewDetails, onEditOrder, onCancelOrder, onDeleteOrder, 
  onUpdateStatus, onAddTracking, onViewDispute, isOpen, onToggle, onClose 
}: OrderMoreMenuProps) => {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuHeight, setMenuHeight] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const estimatedMenuHeight = menuHeight > 0 ? menuHeight : 220;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      let top;
      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        top = buttonRect.top - estimatedMenuHeight - 8;
      } else {
        top = buttonRect.bottom + 8;
      }
      top = Math.max(8, Math.min(top, viewportHeight - estimatedMenuHeight - 8));
      let left = buttonRect.right - 180;
      left = Math.max(8, Math.min(left, viewportWidth - 190));
      setMenuPosition({ top, left });
    }
  }, [isOpen, menuHeight]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const height = menuRef.current.offsetHeight;
      if (height !== menuHeight) setMenuHeight(height);
    }
  }, [isOpen, menuHeight]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleScrollOrResize = () => onClose();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  const handleAction = useCallback((action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    action();
    onClose();
  }, [onClose]);

  const status = order?.status;

  return (
    <div className="static inline-block">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer inline-flex items-center justify-center transition-all duration-200 text-(--color-text-muted) hover:bg-(--color-bg-surface)"
      >
        <MoreVerticalIcon />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9998] bg-transparent" onClick={onClose} />
          <div
            ref={menuRef}
            className="fixed bg-(--color-bg-card) rounded-xl shadow-lg min-w-[190px] z-[9999] overflow-hidden border border-(--color-border-color)"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <button onClick={(e) => handleAction(() => onViewDetails(order), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface)">
              <ShowIcon /> <span>جزئیات سفارش</span>
            </button>
            <button onClick={(e) => handleAction(() => onEditOrder(order), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface)">
              <EditPencilIcon /> <span>ویرایش سفارش</span>
            </button>
            
            {status === 'pending_payment' && (
              <button onClick={(e) => handleAction(() => onCancelOrder(order.id), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-red-500 hover:bg-red-500/10">
                <CloseSmIcon /> <span>لغو سفارش</span>
              </button>
            )}
            
            {status === 'paid' && (
              <button onClick={(e) => handleAction(() => onUpdateStatus(order.id, 'shipped'), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-purple-500 hover:bg-purple-500/10">
                <TruckIcon /> <span>ارسال سفارش</span>
              </button>
            )}
            
            {status === 'shipped' && (
              <button onClick={(e) => handleAction(() => onAddTracking(order), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-blue-500 hover:bg-blue-500/10">
                <PackageIcon /> <span>افزودن کد رهگیری</span>
              </button>
            )}
            
            {status === 'in_dispute' && (
              <button onClick={(e) => handleAction(() => onViewDispute(order), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-pink-500 hover:bg-pink-500/10">
                <SmileySadIcon /> <span>مدیریت اختلاف</span>
              </button>
            )}
            
            {(status === 'delivered' || status === 'cancelled') && (
              <button onClick={(e) => handleAction(() => onDeleteOrder(order), e)} className="flex items-center gap-3 w-full px-4 py-2.5 border-none bg-transparent cursor-pointer text-[13px] text-right transition-colors duration-200 text-red-500 hover:bg-red-500/10">
                <TrashFullIcon /> <span>حذف سفارش</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== کامپوننت آیکون مرتب‌سازی ====================
interface SortIconProps {
  field: string;
  sortField: string;
  sortDirection: string;
}

const SortIcon = ({ field, sortField, sortDirection }: SortIconProps) => {
  if (sortField !== field) {
    return <span className="inline-block mr-1"><ArrowDownUpIcon /></span>;
  }
  if (sortDirection === 'asc') {
    return <span className="inline-block mr-1 text-(--color-text-primary)"><ArrowUpSmIcon /></span>;
  } else {
    return <span className="inline-block mr-1 text-(--color-text-primary)"><ArrowDownSmIcon /></span>;
  }
};

// ==================== کامپوننت‌های مودال ====================
interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onUpdate: (order: any) => void;
}

const EditOrderModal = ({ isOpen, onClose, order, onUpdate }: EditOrderModalProps) => {
  const { success } = useToast();
  const [status, setStatus] = useState(order?.status || '');
  const [trackingCode, setTrackingCode] = useState(order?.trackingCode || '');
  const [shippingCost, setShippingCost] = useState(order?.shippingCost || 0);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'pending_payment', label: 'در انتظار پرداخت' },
    { value: 'paid', label: 'پرداخت شده' },
    { value: 'shipped', label: 'در حال ارسال' },
    { value: 'delivered', label: 'تحویل شده' },
    { value: 'cancelled', label: 'لغو شده' },
    { value: 'in_dispute', label: 'در حال پیگیری' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onUpdate({
        ...order,
        status,
        trackingCode,
        shippingCost: Number(shippingCost),
        updatedAt: new Date().toLocaleString('fa-IR')
      });
      setLoading(false);
      onClose();
      success('سفارش با موفقیت ویرایش شد');
    }, 500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 bg-(--color-bg-card) rounded-2xl">
        <h2 className="text-xl font-bold mb-5 text-(--color-text-primary)">ویرایش سفارش #{order?.orderNumber}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">وضعیت سفارش</label>
            <CustomSelect options={statusOptions} value={status} onChange={setStatus} placeholder="انتخاب وضعیت" />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">کد رهگیری</label>
            <input type="text" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} className="w-full p-2.5 border border-(--color-border-color) rounded-xl text-sm outline-none bg-(--color-bg-primary) text-(--color-text-primary)" placeholder="مثال: TRK-12345" />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">هزینه ارسال (تومان)</label>
            <input type="number" value={shippingCost} onChange={(e) => setShippingCost(Number(e.target.value))} className="w-full p-2.5 border border-(--color-border-color) rounded-xl text-sm outline-none bg-(--color-bg-primary) text-(--color-text-primary)" />
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-(--color-bg-surface) border-none rounded-xl cursor-pointer text-sm font-medium text-(--color-text-primary) hover:bg-(--color-border-color) transition-colors">انصراف</button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 bg-(--color-text-primary) text-(--color-bg-primary) border-none rounded-xl cursor-pointer text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// ==================== تایپ‌ها ====================
interface OrderParty {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface OrderDispute {
  reason?: string;
  status?: string;
  createdAt?: string;
  resolvedAt?: string;
  resolution?: string;
  note?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  buyer: OrderParty;
  seller: OrderParty;
  products: { id: number; title: string; price: number; quantity: number; image: string }[];
  totalAmount: number;
  shippingCost: number;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  shippingMethod: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  trackingCode: string | null;
  dispute: OrderDispute | null;
}

// ==================== کامپوننت اصلی ====================
export default function OrdersManagement() {
  const { success, info, warning } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | number>('all');
  const [dateFilter, setDateFilter] = useState<string | number>('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | string>(10);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // داده‌های نمونه سفارشات
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1001,
      orderNumber: 'ORD-1001',
      buyer: { id: 1, name: 'علی محمدی', phone: '09123456789', email: 'ali@example.com' },
      seller: { id: 2, name: 'زهرا کریمی', phone: '09123456788', email: 'zahra@example.com' },
      products: [{ id: 1, title: 'هدفون بیسیم حرفه‌ای X200', price: 1250000, quantity: 1, image: '/images/products/1.jpg' }],
      totalAmount: 1250000,
      shippingCost: 50000,
      finalAmount: 1300000,
      status: 'pending_payment',
      paymentMethod: 'online',
      shippingMethod: 'post',
      address: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
      createdAt: '۱۴۰۳/۰۲/۱۵ ۱۴:۳۰',
      updatedAt: '۱۴۰۳/۰۲/۱۵ ۱۴:۳۰',
      trackingCode: null,
      dispute: null
    },
    {
      id: 1002,
      orderNumber: 'ORD-1002',
      buyer: { id: 3, name: 'محمد رضایی', phone: '09123456787', email: 'mohammad@example.com' },
      seller: { id: 1, name: 'علی محمدی', phone: '09123456789', email: 'ali@example.com' },
      products: [{ id: 2, title: 'کیف چرمی اصل', price: 890000, quantity: 2, image: '/images/products/2.png' }],
      totalAmount: 1780000,
      shippingCost: 80000,
      finalAmount: 1860000,
      status: 'paid',
      paymentMethod: 'online',
      shippingMethod: 'courier',
      address: 'اصفهان، خیابان چهارباغ، پلاک ۴۵',
      createdAt: '۱۴۰۳/۰۲/۱۴ ۱۰:۱۵',
      updatedAt: '۱۴۰۳/۰۲/۱۴ ۱۰:۲۰',
      trackingCode: 'TRK-001',
      dispute: null
    },
    {
      id: 1003,
      orderNumber: 'ORD-1003',
      buyer: { id: 4, name: 'سارا حسینی', phone: '09123456786', email: 'sara@example.com' },
      seller: { id: 2, name: 'زهرا کریمی', phone: '09123456788', email: 'zahra@example.com' },
      products: [{ id: 3, title: 'ساعت هوشمند اپل', price: 12500000, quantity: 1, image: '/images/products/4.jpg' }],
      totalAmount: 12500000,
      shippingCost: 0,
      finalAmount: 12500000,
      status: 'shipped',
      paymentMethod: 'online',
      shippingMethod: 'pickup',
      address: 'شیراز، خیابان زند، پلاک ۷۸',
      createdAt: '۱۴۰۳/۰۲/۱۳ ۱۶:۴۵',
      updatedAt: '۱۴۰۳/۰۲/۱۴ ۰۹:۰۰',
      trackingCode: 'TRK-002',
      dispute: null
    },
    {
      id: 1004,
      orderNumber: 'ORD-1004',
      buyer: { id: 5, name: 'رضا احمدی', phone: '09123456785', email: 'reza@example.com' },
      seller: { id: 3, name: 'محمد رضایی', phone: '09123456787', email: 'mohammad@example.com' },
      products: [{ id: 4, title: 'کتاب آموزش ری اکت', price: 250000, quantity: 3, image: '/images/products/3.png' }],
      totalAmount: 750000,
      shippingCost: 50000,
      finalAmount: 800000,
      status: 'delivered',
      paymentMethod: 'cash',
      shippingMethod: 'post',
      address: 'مشهد، خیابان امام رضا، پلاک ۳۲',
      createdAt: '۱۴۰۳/۰۲/۱۲ ۱۱:۲۰',
      updatedAt: '۱۴۰۳/۰۲/۱۴ ۱۸:۳۰',
      trackingCode: 'TRK-003',
      dispute: null
    },
    {
      id: 1005,
      orderNumber: 'ORD-1005',
      buyer: { id: 1, name: 'علی محمدی', phone: '09123456789', email: 'ali@example.com' },
      seller: { id: 4, name: 'سارا حسینی', phone: '09123456786', email: 'sara@example.com' },
      products: [{ id: 5, title: 'ماوس گیمینگ ریزر', price: 1450000, quantity: 1, image: '/images/products/6.jpg' }],
      totalAmount: 1450000,
      shippingCost: 50000,
      finalAmount: 1500000,
      status: 'cancelled',
      paymentMethod: 'online',
      shippingMethod: 'post',
      address: 'تهران، خیابان آزادی، پلاک ۵۶',
      createdAt: '۱۴۰۳/۰۲/۱۱ ۰۹:۰۰',
      updatedAt: '۱۴۰۳/۰۲/۱۲ ۱۴:۲۰',
      trackingCode: null,
      dispute: null
    },
    {
      id: 1006,
      orderNumber: 'ORD-1006',
      buyer: { id: 2, name: 'زهرا کریمی', phone: '09123456788', email: 'zahra@example.com' },
      seller: { id: 1, name: 'علی محمدی', phone: '09123456789', email: 'ali@example.com' },
      products: [{ id: 6, title: 'اسپیکر بلوتوثی جی‌بی‌ال', price: 3980000, quantity: 1, image: '/images/products/7.jpg' }],
      totalAmount: 3980000,
      shippingCost: 80000,
      finalAmount: 4060000,
      status: 'in_dispute',
      paymentMethod: 'online',
      shippingMethod: 'courier',
      address: 'کرج، خیابان فردیس، پلاک ۱۲',
      createdAt: '۱۴۰۳/۰۲/۱۰ ۱۵:۳۰',
      updatedAt: '۱۴۰۳/۰۲/۱۳ ۱۰:۰۰',
      trackingCode: 'TRK-004',
      dispute: { reason: 'محصول خراب رسیده است', status: 'pending', createdAt: '۱۴۰۳/۰۲/۱۳' }
    },
  ]);

  const statusOptions = [
    { value: 'pending_payment', label: 'در انتظار پرداخت', color: '#f59e0b', icon: '⏳' },
    { value: 'paid', label: 'پرداخت شده', color: '#3b82f6', icon: '💰' },
    { value: 'shipped', label: 'در حال ارسال', color: '#8b5cf6', icon: '🚚' },
    { value: 'delivered', label: 'تحویل شده', color: '#10b981', icon: '✅' },
    { value: 'cancelled', label: 'لغو شده', color: '#ef4444', icon: '❌' },
    { value: 'in_dispute', label: 'در حال پیگیری', color: '#ec489a', icon: '⚠️' },
  ];

  const dateOptions = [
    { value: 'all', label: 'همه' },
    { value: 'today', label: 'امروز' },
    { value: 'week', label: 'هفته جاری' },
    { value: 'month', label: 'ماه جاری' },
  ];

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = order.orderNumber.includes(searchTerm) || 
                           order.buyer.name.includes(searchTerm) ||
                           order.seller.name.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      let matchesDate = true;
      if (dateFilter !== 'all') {
        matchesDate = true;
      }
      return matchesSearch && matchesStatus && matchesDate;
    });
    
    filtered.sort((a, b) => {
      let aVal = a[sortField as keyof typeof a] as unknown as string | number;
      let bVal = b[sortField as keyof typeof b] as unknown as string | number;
      if (sortField === 'finalAmount' || sortField === 'totalAmount') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    
    return filtered;
  }, [orders, searchTerm, statusFilter, dateFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredOrders.length / Number(itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * Number(itemsPerPage), currentPage * Number(itemsPerPage));

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
    info(`مرتب‌سازی بر اساس ${field}`, 1000);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = statusOptions.find(opt => opt.value === status);
    return statusMap || { color: '#6b7280', label: 'نامشخص', icon: '❓' };
  };

  // عملیات‌ها
  const handleViewDetails = (order: any) => {
    setSelectedOrderDetail(order);
    setIsModalOpen(true);
    info(`مشاهده جزئیات سفارش ${order.orderNumber}`, 2000);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleUpdateOrder = (updatedOrder: any) => {
    setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleCancelOrder = (orderId: number) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled', updatedAt: new Date().toLocaleString('fa-IR') } : o));
    success('سفارش با موفقیت لغو شد');
  };

  const handleDeleteOrder = (orderId: number, reason?: string) => {
    setOrders(orders.filter(o => o.id !== orderId));
  };

  const handleUpdateStatus = (orderId: number, newStatus: string) => {
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label;
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toLocaleString('fa-IR') } : o));
    success(`وضعیت سفارش با موفقیت به ${statusLabel} تغییر یافت`);
  };

  const handleAddTracking = (order: any) => {
    setSelectedOrder(order);
    setIsTrackingModalOpen(true);
  };

  const handleSaveTracking = (orderId: number, trackingCode: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, trackingCode, updatedAt: new Date().toLocaleString('fa-IR') } : o));
  };

  const handleViewDispute = (order: any) => {
    setSelectedOrder(order);
    setIsDisputeModalOpen(true);
  };

  const handleResolveDispute = (orderId: number, resolution: string, note: string) => {
    const newStatus = resolution === 'buyer' ? 'cancelled' : 'delivered';
    const statusLabel = newStatus === 'cancelled' ? 'لغو شده' : 'تحویل شده';
    setOrders(orders.map(o => o.id === orderId ? { 
      ...o, 
      status: newStatus,
      dispute: { ...o.dispute, resolvedAt: new Date().toLocaleString('fa-IR'), resolution, note }
    } : o));
    success(`اختلاف با موفقیت حل شد. سفارش ${statusLabel} شد`);
  };

  const handleToggleMenu = (menuId: number) => {
    setOpenMenuId(openMenuId === menuId ? null : menuId);
  };

  const handleCloseMenu = () => {
    setOpenMenuId(null);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-(--color-text-primary) m-0">مدیریت سفارشات</h1>
          <p className="text-[13px] text-(--color-text-secondary) mt-0.5">مدیریت و پیگیری سفارشات سایت</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-bg-card) rounded-full border border-(--color-border-color) text-[12px] text-(--color-text-primary)">
            <span>📦</span><strong>{toPersianNumber(orders.length)}</strong><small className="text-(--color-text-muted)">کل سفارشات</small>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-bg-card) rounded-full border border-(--color-border-color) text-[12px] text-(--color-text-primary)">
            <span>⏳</span><strong>{toPersianNumber(orders.filter(o => o.status === 'pending_payment').length)}</strong><small className="text-(--color-text-muted)">در انتظار</small>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-bg-card) rounded-full border border-(--color-border-color) text-[12px] text-(--color-text-primary)">
            <span>🚚</span><strong>{toPersianNumber(orders.filter(o => o.status === 'shipped').length)}</strong><small className="text-(--color-text-muted)">در حال ارسال</small>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-(--color-bg-card) rounded-full border border-(--color-border-color) text-[12px] text-(--color-text-primary)">
            <span>⚠️</span><strong>{toPersianNumber(orders.filter(o => o.status === 'in_dispute').length)}</strong><small className="text-(--color-text-muted)">اختلافات</small>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center bg-(--color-bg-card) border border-(--color-border-color) rounded-full px-3.5 py-1.5 flex-1 max-w-[350px] gap-2">
          <SearchIcon />
          <input
            type="text"
            placeholder="جستجو بر اساس شماره سفارش، خریدار یا فروشنده..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none outline-none text-[13px] font-inherit bg-transparent text-(--color-text-primary)"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <CustomSelect
            options={[{ value: 'all', label: 'همه وضعیت‌ها' }, ...statusOptions.map(opt => ({ value: opt.value, label: opt.label }))]}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            placeholder="وضعیت"
          />
          <CustomSelect
            options={dateOptions}
            value={dateFilter}
            onChange={(val) => { setDateFilter(val); setCurrentPage(1); }}
            placeholder="تاریخ"
          />
          <CustomSelect
            options={[10, 25, 50].map(n => ({ value: n, label: `${toPersianNumber(n)} در صفحه` }))}
            value={itemsPerPage}
            onChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            placeholder="تعداد در صفحه"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border-color) overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('orderNumber')}>
                شماره سفارش <SortIcon field="orderNumber" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('buyer')}>
                خریدار <SortIcon field="buyer" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('seller')}>
                فروشنده <SortIcon field="seller" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('finalAmount')}>
                مبلغ کل <SortIcon field="finalAmount" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('status')}>
                وضعیت <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium cursor-pointer" onClick={() => handleSort('createdAt')}>
                تاریخ ثبت <SortIcon field="createdAt" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th className="sticky end-0 z-1 bg-(--color-bg-card) text-right p-3 border-b border-(--color-border-color) text-(--color-text-secondary) text-[12px] font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map(order => {
              const statusBadge = getStatusBadge(order.status);
              return (
                <tr key={order.id}>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <div className="font-semibold text-(--color-text-primary)">{order.orderNumber}</div>
                  </td>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <div className="flex flex-col">
                      <div className="font-medium mb-0.5 text-(--color-text-primary)">{order.buyer.name}</div>
                      <div className="text-[10px] text-(--color-text-muted)">{order.buyer.phone}</div>
                    </div>
                  </td>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <div className="flex flex-col">
                      <div className="font-medium mb-0.5 text-(--color-text-primary)">{order.seller.name}</div>
                      <div className="text-[10px] text-(--color-text-muted)">{order.seller.phone}</div>
                    </div>
                  </td>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <div className="font-semibold text-orange-500">{formatPrice(order.finalAmount)}</div>
                    <div className="text-[10px] text-(--color-text-muted)">+ {formatPrice(order.shippingCost)} پست</div>
                  </td>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium`} style={{ backgroundColor: statusBadge.color + '15', color: statusBadge.color }}>
                      <span className="ml-1">{statusBadge.icon}</span> {statusBadge.label}
                    </span>
                  </td>
                  <td className="p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">{order.createdAt}</td>
                  <td className="sticky end-0 z-1 bg-(--color-bg-card) p-3 text-[12px] text-(--color-text-primary) border-b border-(--color-border-light)">
                    <OrderMoreMenu
                      order={order}
                      onViewDetails={handleViewDetails}
                      onEditOrder={handleEditOrder}
                      onCancelOrder={handleCancelOrder}
                      onDeleteOrder={() => { setSelectedOrder(order); setIsDeleteModalOpen(true); }}
                      onUpdateStatus={handleUpdateStatus}
                      onAddTracking={handleAddTracking}
                      onViewDispute={handleViewDispute}
                      isOpen={openMenuId === order.id}
                      onToggle={() => handleToggleMenu(order.id)}
                      onClose={handleCloseMenu}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-5 flex-wrap">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-md border border-(--color-border-color) bg-(--color-bg-card) cursor-pointer text-[12px] text-(--color-text-primary) disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-border-color) transition-colors">«</button>
          <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-md border border-(--color-border-color) bg-(--color-bg-card) cursor-pointer text-[12px] text-(--color-text-primary) disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-border-color) transition-colors">‹</button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            let pageNum = totalPages <= 5 ? i + 1 : (currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i));
            return (
              <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-2.5 py-1.5 rounded-md border border-(--color-border-color) bg-(--color-bg-card) cursor-pointer text-[12px] text-(--color-text-primary) hover:bg-(--color-border-color) transition-colors ${currentPage === pageNum ? 'bg-(--color-text-primary) text-(--color-bg-primary) border-(--color-text-primary)' : ''}`}>
                {toPersianNumber(pageNum)}
              </button>
            );
          })}
          <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-md border border-(--color-border-color) bg-(--color-bg-card) cursor-pointer text-[12px] text-(--color-text-primary) disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-border-color) transition-colors">›</button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-md border border-(--color-border-color) bg-(--color-bg-card) cursor-pointer text-[12px] text-(--color-text-primary) disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--color-border-color) transition-colors">»</button>
        </div>
      )}

      {/* Modal: جزئیات سفارش */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" noPadding>
        {selectedOrderDetail && (
          <div className="flex flex-col max-h-[85vh] overflow-hidden bg-(--color-bg-card)">
            <div className="flex justify-between items-center p-4 px-5 border-b border-(--color-border-color) bg-(--color-bg-card)">
              <h2 className="text-lg font-semibold text-(--color-text-primary)">جزئیات سفارش #{selectedOrderDetail.orderNumber}</h2>
              <span className={`px-3 py-1 rounded-full text-[12px] font-medium`} style={{ backgroundColor: getStatusBadge(selectedOrderDetail.status).color + '15', color: getStatusBadge(selectedOrderDetail.status).color }}>
                {getStatusBadge(selectedOrderDetail.status).icon} {getStatusBadge(selectedOrderDetail.status).label}
              </span>
            </div>
            <div className="p-5 overflow-y-auto">
              {/* اطلاعات خریدار */}
              <div className="mb-5 p-4 bg-(--color-bg-surface) rounded-xl">
                <h4 className="font-semibold text-(--color-text-primary) mb-2">اطلاعات خریدار</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><strong>نام:</strong> {selectedOrderDetail.buyer.name}</div>
                  <div><strong>تلفن:</strong> {selectedOrderDetail.buyer.phone}</div>
                  <div><strong>ایمیل:</strong> {selectedOrderDetail.buyer.email}</div>
                  <div><strong>آدرس:</strong> {selectedOrderDetail.address}</div>
                </div>
              </div>

              {/* اطلاعات فروشنده */}
              <div className="mb-5 p-4 bg-(--color-bg-surface) rounded-xl">
                <h4 className="font-semibold text-(--color-text-primary) mb-2">اطلاعات فروشنده</h4>
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div><strong>نام:</strong> {selectedOrderDetail.seller.name}</div>
                  <div><strong>تلفن:</strong> {selectedOrderDetail.seller.phone}</div>
                  <div><strong>ایمیل:</strong> {selectedOrderDetail.seller.email}</div>
                </div>
              </div>

              {/* محصولات */}
              <div className="mb-5">
                <h4 className="font-semibold text-(--color-text-primary) mb-3">محصولات سفارش</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrderDetail.products.map((product: any) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-(--color-bg-surface) rounded-xl">
                      <img src={product.image} alt={product.title} className="w-[50px] h-[50px] object-cover rounded-lg" />
                      <div className="flex-1">
                        <div className="font-medium text-[13px] text-(--color-text-primary)">{product.title}</div>
                        <div className="text-[12px] text-(--color-text-muted)">تعداد: {toPersianNumber(product.quantity)} عدد</div>
                      </div>
                      <div className="font-semibold text-orange-500 text-[13px]">{formatPrice(product.price * product.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* اطلاعات مالی */}
              <div className="p-4 bg-(--color-bg-surface) rounded-xl mb-5">
                <div className="flex justify-between py-1.5 text-[13px] text-(--color-text-primary)"><span>جمع کل:</span><span>{formatPrice(selectedOrderDetail.totalAmount)}</span></div>
                <div className="flex justify-between py-1.5 text-[13px] text-(--color-text-primary)"><span>هزینه ارسال:</span><span>{formatPrice(selectedOrderDetail.shippingCost)}</span></div>
                <div className="flex justify-between py-2.5 text-[16px] font-bold border-t border-(--color-border-color) mt-1.5 text-(--color-text-primary)"><span>مبلغ قابل پرداخت:</span><span>{formatPrice(selectedOrderDetail.finalAmount)}</span></div>
                <div className="flex justify-between py-1.5 text-[13px] text-(--color-text-primary)"><span>روش پرداخت:</span><span>{selectedOrderDetail.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت در محل'}</span></div>
                <div className="flex justify-between py-1.5 text-[13px] text-(--color-text-primary)"><span>روش ارسال:</span><span>{selectedOrderDetail.shippingMethod === 'post' ? 'پست پیشتاز' : selectedOrderDetail.shippingMethod === 'courier' ? 'پیک موتوری' : 'تحویل حضوری'}</span></div>
                {selectedOrderDetail.trackingCode && (
                  <div className="flex justify-between py-1.5 text-[13px] text-(--color-text-primary)"><span>کد رهگیری:</span><span className="font-mono font-semibold text-blue-500">{selectedOrderDetail.trackingCode}</span></div>
                )}
              </div>

              {/* اختلاف */}
              {selectedOrderDetail.dispute && (
                <div className="p-4 bg-amber-500/15 border border-amber-500 rounded-xl text-(--color-text-primary)">
                  <h4 className="font-semibold mb-2">اختلاف ثبت شده</h4>
                  <div><strong>دلیل:</strong> {selectedOrderDetail.dispute.reason}</div>
                  <div><strong>تاریخ ثبت:</strong> {selectedOrderDetail.dispute.createdAt}</div>
                  {selectedOrderDetail.dispute.resolution && (
                    <>
                      <div><strong>نتیجه:</strong> {selectedOrderDetail.dispute.resolution === 'buyer' ? 'به نفع خریدار' : 'به نفع فروشنده'}</div>
                      <div><strong>توضیحات:</strong> {selectedOrderDetail.dispute.note}</div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <EditOrderModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} order={selectedOrder} onUpdate={handleUpdateOrder} />

      {/* Delete Order Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <div className="p-6 bg-(--color-bg-card) rounded-2xl">
          <h2 className="text-xl font-bold mb-4 text-red-500">حذف سفارش</h2>
          <p className="text-(--color-text-primary)">آیا از حذف سفارش <strong>{selectedOrder?.orderNumber}</strong> مطمئن هستید؟</p>
          <div className="mb-4 mt-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">دلیل حذف (اختیاری)</label>
            <textarea onChange={(e) => setSelectedOrder({ ...selectedOrder, deleteReason: e.target.value })} className="w-full p-2.5 border border-(--color-border-color) rounded-xl text-sm resize-y font-inherit bg-(--color-bg-primary) text-(--color-text-primary)" rows={3} placeholder="دلیل حذف سفارش را وارد کنید..." />
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 bg-(--color-bg-surface) border-none rounded-xl cursor-pointer text-sm font-medium text-(--color-text-primary) hover:bg-(--color-border-color) transition-colors">انصراف</button>
            <button onClick={() => { handleDeleteOrder(selectedOrder?.id, selectedOrder?.deleteReason); setIsDeleteModalOpen(false); }} className="px-5 py-2.5 bg-red-500 border-none rounded-xl cursor-pointer text-sm font-medium text-white hover:bg-red-600 transition-colors">تایید حذف</button>
          </div>
        </div>
      </Modal>

      {/* Tracking Modal */}
      <Modal isOpen={isTrackingModalOpen} onClose={() => setIsTrackingModalOpen(false)} size="sm">
        <div className="p-6 bg-(--color-bg-card) rounded-2xl">
          <h2 className="text-xl font-bold mb-4 text-(--color-text-primary)">کد رهگیری سفارش</h2>
          <p className="text-(--color-text-primary) mb-4">سفارش: <strong>{selectedOrder?.orderNumber}</strong></p>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">کد رهگیری پستی</label>
            <input type="text" defaultValue={selectedOrder?.trackingCode || ''} onChange={(e) => setSelectedOrder({ ...selectedOrder, trackingCode: e.target.value })} className="w-full p-2.5 border border-(--color-border-color) rounded-xl text-sm outline-none bg-(--color-bg-primary) text-(--color-text-primary)" placeholder="مثال: IR-1234567890" />
          </div>
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={() => setIsTrackingModalOpen(false)} className="px-5 py-2.5 bg-(--color-bg-surface) border-none rounded-xl cursor-pointer text-sm font-medium text-(--color-text-primary) hover:bg-(--color-border-color) transition-colors">انصراف</button>
            <button onClick={() => { handleSaveTracking(selectedOrder?.id, selectedOrder?.trackingCode); setIsTrackingModalOpen(false); }} className="px-5 py-2.5 bg-(--color-text-primary) text-(--color-bg-primary) border-none rounded-xl cursor-pointer text-sm font-medium hover:opacity-90 transition-opacity">ذخیره کد</button>
          </div>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={isDisputeModalOpen} onClose={() => setIsDisputeModalOpen(false)} size="md">
        <div className="p-6 bg-(--color-bg-card) rounded-2xl">
          <h2 className="text-xl font-bold mb-4 text-pink-500">حل اختلاف سفارش</h2>
          <p className="text-(--color-text-primary)">سفارش: <strong>{selectedOrder?.orderNumber}</strong></p>
          <p className="text-(--color-text-primary)"><strong>دلیل اختلاف:</strong> {selectedOrder?.dispute?.reason}</p>
          <p className="text-(--color-text-primary) mb-4"><strong>تاریخ ثبت:</strong> {selectedOrder?.dispute?.createdAt}</p>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">نتیجه اختلاف</label>
            <div className="flex flex-col gap-2.5 mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-(--color-text-primary)"><input type="radio" name="resolution" value="buyer" onChange={(e) => setSelectedOrder({ ...selectedOrder, resolution: e.target.value })} /> به نفع خریدار (لغو سفارش و برگشت وجه)</label>
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-(--color-text-primary)"><input type="radio" name="resolution" value="seller" onChange={(e) => setSelectedOrder({ ...selectedOrder, resolution: e.target.value })} /> به نفع فروشنده (تکمیل سفارش)</label>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 font-medium text-[13px] text-(--color-text-secondary)">توضیحات (اختیاری)</label>
            <textarea onChange={(e) => setSelectedOrder({ ...selectedOrder, disputeNote: e.target.value })} className="w-full p-2.5 border border-(--color-border-color) rounded-xl text-sm resize-y font-inherit bg-(--color-bg-primary) text-(--color-text-primary)" rows={3} placeholder="توضیحات بیشتر..." />
          </div>
          
          <div className="flex gap-3 mt-6 justify-end">
            <button onClick={() => setIsDisputeModalOpen(false)} className="px-5 py-2.5 bg-(--color-bg-surface) border-none rounded-xl cursor-pointer text-sm font-medium text-(--color-text-primary) hover:bg-(--color-border-color) transition-colors">انصراف</button>
            <button onClick={() => { handleResolveDispute(selectedOrder?.id, selectedOrder?.resolution, selectedOrder?.disputeNote); setIsDisputeModalOpen(false); }} className="px-5 py-2.5 bg-pink-500 border-none rounded-xl cursor-pointer text-sm font-medium text-white hover:bg-pink-600 transition-colors">تایید و حل اختلاف</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}