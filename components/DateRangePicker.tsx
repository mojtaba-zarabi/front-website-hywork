'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import moment from 'moment-jalaali';

moment.locale('fa');

// ==================== آیکون‌ها ====================
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const DoubleChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

const DoubleChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 5 12 12 19" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ==================== نوع‌ها ====================
interface DateRangePickerProps {
  onSelect: (range: { start: Date; end: Date }) => void;
  onClose?: () => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

interface DayItem {
  day: number | null;
  isCurrentMonth: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  isInRange?: boolean;
  isTempInRange?: boolean;
  fullDate?: moment.Moment;
}

// ==================== کامپوننت اصلی ====================
export default function DateRangePicker({
  onSelect,
  onClose,
  initialStartDate = null,
  initialEndDate = null,
}: DateRangePickerProps) {
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [startDate, setStartDate] = useState<moment.Moment | null>(() => {
    if (initialStartDate) return moment(initialStartDate);
    return null;
  });
  const [endDate, setEndDate] = useState<moment.Moment | null>(() => {
    if (initialEndDate) return moment(initialEndDate);
    return null;
  });
  const [tempStartDate, setTempStartDate] = useState<moment.Moment | null>(null);
  const [startTime, setStartTime] = useState(() => {
    if (initialStartDate) {
      const m = moment(initialStartDate);
      return { hour: m.hour(), minute: m.minute() };
    }
    return { hour: 9, minute: 0 };
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialEndDate) {
      const m = moment(initialEndDate);
      return { hour: m.hour(), minute: m.minute() };
    }
    return { hour: 17, minute: 0 };
  });
  const [currentMonth, setCurrentMonth] = useState<moment.Moment>(moment());

  // به‌روزرسانی state اولیه در صورت تغییر props
  useEffect(() => {
    if (initialStartDate) {
      const m = moment(initialStartDate);
      setStartDate(m);
      setStartTime({ hour: m.hour(), minute: m.minute() });
    } else {
      setStartDate(null);
      setStartTime({ hour: 9, minute: 0 });
    }
  }, [initialStartDate]);

  useEffect(() => {
    if (initialEndDate) {
      const m = moment(initialEndDate);
      setEndDate(m);
      setEndTime({ hour: m.hour(), minute: m.minute() });
    } else {
      setEndDate(null);
      setEndTime({ hour: 17, minute: 0 });
    }
  }, [initialEndDate]);

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  const toPersianNumber = (num: number | string): string => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const generateDaysInMonth = useCallback((): DayItem[] => {
    const startOfMonth = currentMonth.clone().startOf('jMonth');
    const endOfMonth = currentMonth.clone().endOf('jMonth');
    const startDayOfWeek = startOfMonth.weekday();
    const days: DayItem[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    const currentDay = startOfMonth.clone();
    while (currentDay <= endOfMonth) {
      const isStart = startDate && currentDay.isSame(startDate, 'day');
      const isEnd = endDate && currentDay.isSame(endDate, 'day');
      const isInRange = startDate && endDate && currentDay.isBetween(startDate, endDate, 'day', '[]');
      const isTempInRange = startDate && tempStartDate && !endDate && currentDay.isBetween(startDate, tempStartDate, 'day', '[]');

      days.push({
        day: currentDay.jDate(),
        isCurrentMonth: true,
        isStart: isStart || false,
        isEnd: isEnd || false,
        isInRange: isInRange || false,
        isTempInRange: isTempInRange || false,
        fullDate: currentDay.clone(),
      });
      currentDay.add(1, 'day');
    }
    return days;
  }, [currentMonth, startDate, endDate, tempStartDate]);

  const daysInMonth = useMemo(() => generateDaysInMonth(), [generateDaysInMonth]);

  const changeMonth = (delta: number) => setCurrentMonth((prev) => prev.clone().add(delta, 'jMonth'));
  const changeYear = (delta: number) => setCurrentMonth((prev) => prev.clone().add(delta, 'jYear'));

  const selectDay = (day: DayItem) => {
    if (!day || !day.isCurrentMonth || !day.fullDate) return;
    const clickedDate = day.fullDate.clone();

    if (!startDate) {
      setStartDate(clickedDate);
      setEndDate(null);
      setTempStartDate(null);
    } else if (startDate && !endDate) {
      if (clickedDate.isBefore(startDate)) {
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
      setTempStartDate(null);
    } else if (startDate && endDate) {
      setStartDate(clickedDate);
      setEndDate(null);
      setTempStartDate(null);
    }
  };

  const handleDayHover = (day: DayItem) => {
    if (!day || !day.isCurrentMonth || !day.fullDate) return;
    if (startDate && !endDate) {
      setTempStartDate(day.fullDate.clone());
    }
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      alert('لطفاً ابتدا تاریخ شروع و پایان را انتخاب کنید');
      return;
    }
    const finalStart = startDate.clone().hour(startTime.hour).minute(startTime.minute);
    const finalEnd = endDate.clone().hour(endTime.hour).minute(endTime.minute);
    onSelect({ start: finalStart.toDate(), end: finalEnd.toDate() });
    if (onClose) onClose();
  };

  const formatDate = (date: moment.Moment | null): string => {
    if (!date) return '——';
    return `${toPersianNumber(date.jDate())} ${persianMonths[date.jMonth()]}`;
  };

  const formatTimeValue = (hour: number, minute: number): string =>
    `${toPersianNumber(hour.toString().padStart(2, '0'))}:${toPersianNumber(minute.toString().padStart(2, '0'))}`;

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);
  const currentJYear = currentMonth.jYear();
  const currentJMonth = currentMonth.jMonth();

  const getDayClasses = (day: DayItem): string => {
    let classes =
      'aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-150 ';

    if (!day.isCurrentMonth) {
      classes += 'opacity-30 cursor-default ';
    } else {
      classes += 'text-text-primary hover:bg-bg-surface hover:scale-105 ';
    }

    if (day.isStart) {
      classes += 'bg-accent-color text-white rounded-l-lg ';
    }
    if (day.isEnd) {
      classes += 'bg-accent-color text-white rounded-r-lg ';
    }
    if (day.isInRange && !day.isStart && !day.isEnd) {
      classes += 'bg-bg-surface rounded-none ';
    }
    if (day.isTempInRange && !day.isStart && !day.isEnd) {
      classes += 'bg-[rgba(96,165,250,0.15)] rounded-none ';
    }

    return classes;
  };

  return (
    <div className="w-full max-w-95 bg-bg-secondary rounded-2xl overflow-hidden flex flex-col mx-auto shadow-[0_8px_24px_var(--color-shadow)]">
      {/* هدر محدوده تاریخ */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-bg-card border-b border-(--color-border-light)">
        <div className="flex-1 text-center">
          <span className="block text-[10px] text-(--color-text-muted) mb-1">شروع</span>
          <div className="text-sm font-semibold text-text-primary">{startDate ? formatDate(startDate) : '——'}</div>
          <div className="text-[11px] text-text-secondary mt-0.5">{formatTimeValue(startTime.hour, startTime.minute)}</div>
        </div>
        <div className="text-(--color-text-muted) mx-1 flex items-center">
          <ArrowRight className="w-5 h-5" />
        </div>
        <div className="flex-1 text-center">
          <span className="block text-[10px] text-(--color-text-muted) mb-1">پایان</span>
          <div className="text-sm font-semibold text-text-primary">{endDate ? formatDate(endDate) : '——'}</div>
          <div className="text-[11px] text-text-secondary mt-0.5">{formatTimeValue(endTime.hour, endTime.minute)}</div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-(--color-border-light) bg-bg-secondary">
        <button
          onClick={() => setActiveTab('date')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 bg-transparent border-none text-xs font-medium transition-all duration-200 ${
            activeTab === 'date'
              ? 'text-accent-color border-b-2 border-accent-color'
              : 'text-(--color-text-muted)'
          }`}
        >
          <CalendarIcon className="w-4.5 h-4.5" /> تقویم
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 bg-transparent border-none text-xs font-medium transition-all duration-200 ${
            activeTab === 'time'
              ? 'text-accent-color border-b-2 border-accent-color'
              : 'text-(--color-text-muted)'
          }`}
        >
          <ClockIcon className="w-4.5 h-4.5" /> زمان
        </button>
      </div>

      <div className="min-h-95 max-h-95 overflow-y-auto bg-bg-secondary">
        {activeTab === 'date' && (
          <div className="p-3 flex flex-col">
            {/* هدر تقویم */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-1.5">
                <button
                  onClick={() => changeYear(-1)}
                  aria-label="سال قبل"
                  className="w-8 h-8 rounded-lg border border-border-color bg-bg-surface cursor-pointer flex items-center justify-center text-text-primary transition-all hover:bg-(--color-bg-hover) hover:border-accent-color"
                >
                  <DoubleChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => changeMonth(-1)}
                  aria-label="ماه قبل"
                  className="w-8 h-8 rounded-lg border border-border-color bg-bg-surface cursor-pointer flex items-center justify-center text-text-primary transition-all hover:bg-(--color-bg-hover) hover:border-accent-color"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm font-semibold text-text-primary">
                {persianMonths[currentJMonth]} {toPersianNumber(currentJYear)}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => changeMonth(1)}
                  aria-label="ماه بعد"
                  className="w-8 h-8 rounded-lg border border-border-color bg-bg-surface cursor-pointer flex items-center justify-center text-text-primary transition-all hover:bg-(--color-bg-hover) hover:border-accent-color"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => changeYear(1)}
                  aria-label="سال بعد"
                  className="w-8 h-8 rounded-lg border border-border-color bg-bg-surface cursor-pointer flex items-center justify-center text-text-primary transition-all hover:bg-(--color-bg-hover) hover:border-accent-color"
                >
                  <DoubleChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* روزهای هفته */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center py-1.5 text-xs font-medium text-(--color-text-muted)">
                  {day}
                </div>
              ))}
            </div>

            {/* روزهای ماه */}
            <div className="grid grid-cols-7 gap-0.5">
              {daysInMonth.map((day, idx) => (
                <div
                  key={idx}
                  onClick={() => selectDay(day)}
                  onMouseEnter={() => handleDayHover(day)}
                  className={getDayClasses(day)}
                >
                  {day.day ? toPersianNumber(day.day) : ''}
                </div>
              ))}
            </div>

            {/* وضعیت */}
            <div className="mt-4 px-3 py-1.5 bg-bg-surface rounded-xl text-[11px] text-text-secondary text-center">
              {!startDate && 'برای انتخاب بازه، روی تاریخ شروع کلیک کنید'}
              {startDate && !endDate && 'اکنون روی تاریخ پایان کلیک کنید'}
              {startDate && endDate && '✓ بازه تاریخی انتخاب شد'}
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="flex gap-4 p-4 min-h-85">
            {/* ستون ساعت شروع */}
            <div className="flex-1 flex flex-col">
              <div className="text-center text-xs font-semibold text-text-primary mb-2.5">ساعت شروع</div>
              <div className="flex gap-2 flex-1 min-h-0">
                <div className="flex-1 h-70 overflow-y-auto border border-border-color rounded-xl p-1.5 bg-bg-primary [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-(--color-text-muted) [&::-webkit-scrollbar-thumb]:rounded-full">
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setStartTime({ ...startTime, hour })}
                      className={`w-full py-1.5 text-center border-none bg-transparent cursor-pointer rounded-md text-xs transition-all duration-150 ${
                        startTime.hour === hour ? 'bg-accent-color text-white' : 'text-text-primary hover:bg-bg-surface'
                      }`}
                    >
                      {toPersianNumber(hour.toString().padStart(2, '0'))}
                    </button>
                  ))}
                </div>
                <div className="flex-1 h-70 overflow-y-auto border border-border-color rounded-xl p-1.5 bg-bg-primary [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-(--color-text-muted) [&::-webkit-scrollbar-thumb]:rounded-full">
                  {minuteOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => setStartTime({ ...startTime, minute: min })}
                      className={`w-full py-1.5 text-center border-none bg-transparent cursor-pointer rounded-md text-xs transition-all duration-150 ${
                        startTime.minute === min ? 'bg-accent-color text-white' : 'text-text-primary hover:bg-bg-surface'
                      }`}
                    >
                      {toPersianNumber(min.toString().padStart(2, '0'))}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ستون ساعت پایان */}
            <div className="flex-1 flex flex-col">
              <div className="text-center text-xs font-semibold text-text-primary mb-2.5">ساعت پایان</div>
              <div className="flex gap-2 flex-1 min-h-0">
                <div className="flex-1 h-70 overflow-y-auto border border-border-color rounded-xl p-1.5 bg-bg-primary [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-(--color-text-muted) [&::-webkit-scrollbar-thumb]:rounded-full">
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => setEndTime({ ...endTime, hour })}
                      className={`w-full py-1.5 text-center border-none bg-transparent cursor-pointer rounded-md text-xs transition-all duration-150 ${
                        endTime.hour === hour ? 'bg-accent-color text-white' : 'text-text-primary hover:bg-bg-surface'
                      }`}
                    >
                      {toPersianNumber(hour.toString().padStart(2, '0'))}
                    </button>
                  ))}
                </div>
                <div className="flex-1 h-70 overflow-y-auto border border-border-color rounded-xl p-1.5 bg-bg-primary [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-(--color-text-muted) [&::-webkit-scrollbar-thumb]:rounded-full">
                  {minuteOptions.map((min) => (
                    <button
                      key={min}
                      onClick={() => setEndTime({ ...endTime, minute: min })}
                      className={`w-full py-1.5 text-center border-none bg-transparent cursor-pointer rounded-md text-xs transition-all duration-150 ${
                        endTime.minute === min ? 'bg-accent-color text-white' : 'text-text-primary hover:bg-bg-surface'
                      }`}
                    >
                      {toPersianNumber(min.toString().padStart(2, '0'))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* فوتر */}
      <div className="flex gap-3 px-4 py-3.5 border-t border-(--color-border-light) bg-bg-secondary">
        <button
          onClick={onClose}
          className="flex-1 px-2 py-2 bg-bg-surface border-none rounded-[30px] text-xs font-medium text-text-primary cursor-pointer transition-all hover:bg-(--color-bg-hover)"
        >
          انصراف
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-2 py-2 bg-accent-color border-none rounded-[30px] text-xs font-semibold text-white cursor-pointer transition-all hover:bg-accent-hover hover:-translate-y-0.5"
        >
          تایید
        </button>
      </div>
    </div>
  );
}