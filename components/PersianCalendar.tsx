// components/PersianCalendar.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment-jalaali';

moment.locale('fa');

interface PersianCalendarProps {
  onSelect: (date: Date) => void;
  onClose?: () => void;
  initialDate?: Date | null;
  title?: string;
}

interface DayType {
  day: number | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  fullDate: moment.Moment | null;
}

const PersianCalendar = ({ 
  onSelect, 
  onClose, 
  initialDate = null, 
  title = "انتخاب تاریخ" 
}: PersianCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<moment.Moment>(() => {
    if (initialDate) return moment(initialDate);
    return moment();
  });
  const [currentMonth, setCurrentMonth] = useState<moment.Moment>(() => {
    if (initialDate) return moment(initialDate);
    return moment();
  });
  const [daysInMonth, setDaysInMonth] = useState<DayType[]>([]);
  
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // تبدیل عدد به فارسی
  const toPersianNumber = (num: number | string) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
  };

  // ساخت آرایه روزهای ماه جاری
  const generateDaysInMonth = useCallback(() => {
    const startOfMonth = currentMonth.clone().startOf('jMonth');
    const endOfMonth = currentMonth.clone().endOf('jMonth');
    const startDayOfWeek = startOfMonth.weekday();
    
    const days: DayType[] = [];
    
    // روزهای خالی قبل از شروع ماه
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ 
        day: null, 
        isCurrentMonth: false, 
        isToday: false, 
        isSelected: false, 
        fullDate: null 
      });
    }
    
    // روزهای ماه
    let currentDay = startOfMonth.clone();
    while (currentDay <= endOfMonth) {
      const isToday = currentDay.isSame(moment(), 'day');
      const isSelected = currentDay.isSame(selectedDate, 'day');
      
      days.push({
        day: currentDay.jDate(),
        isCurrentMonth: true,
        isToday,
        isSelected,
        fullDate: currentDay.clone()
      });
      
      currentDay.add(1, 'day');
    }
    
    return days;
  }, [currentMonth, selectedDate]);

  useEffect(() => {
    setDaysInMonth(generateDaysInMonth());
  }, [generateDaysInMonth]);

  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => prev.clone().add(delta, 'jMonth'));
  };

  const changeYear = (delta: number) => {
    setCurrentMonth(prev => prev.clone().add(delta, 'jYear'));
  };

  const selectDay = (day: DayType) => {
    if (!day || !day.isCurrentMonth || !day.fullDate) return;
    setSelectedDate(day.fullDate.clone());
  };

  const handleConfirm = () => {
    onSelect(selectedDate.toDate());
    if (onClose) onClose();
  };

  const currentJYear = currentMonth.jYear();
  const currentJMonth = currentMonth.jMonth();

  return (
    <div className="w-full max-w-[360px] bg-(--color-bg-secondary) rounded-2xl overflow-hidden shadow-[0_4px_20px_var(--color-shadow)] font-inherit rtl">
      {/* Header */}
      <div className="flex justify-center items-center px-5 py-4 bg-(--color-bg-secondary) border-b border-(--color-border-color)">
        <span className="text-[15px] font-semibold text-(--color-text-primary)">{title}</span>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center px-5 pt-3 pb-2 bg-(--color-bg-secondary)">
        <div className="flex gap-2">
          <button 
            onClick={() => changeYear(-1)} 
            className="w-8 h-8 rounded-lg border border-(--color-border-color) bg-(--color-bg-surface) cursor-pointer text-base flex items-center justify-center transition-all duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface) hover:border-(--color-accent-color)"
            title="سال قبل"
          >
            ≪
          </button>
          <button 
            onClick={() => changeMonth(-1)} 
            className="w-8 h-8 rounded-lg border border-(--color-border-color) bg-(--color-bg-surface) cursor-pointer text-base flex items-center justify-center transition-all duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface) hover:border-(--color-accent-color)"
            title="ماه قبل"
          >
            ‹
          </button>
        </div>
        <div className="text-[15px] font-semibold text-(--color-text-primary)">
          {persianMonths[currentJMonth]} {toPersianNumber(currentJYear)}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => changeMonth(1)} 
            className="w-8 h-8 rounded-lg border border-(--color-border-color) bg-(--color-bg-surface) cursor-pointer text-base flex items-center justify-center transition-all duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface) hover:border-(--color-accent-color)"
            title="ماه بعد"
          >
            ›
          </button>
          <button 
            onClick={() => changeYear(1)} 
            className="w-8 h-8 rounded-lg border border-(--color-border-color) bg-(--color-bg-surface) cursor-pointer text-base flex items-center justify-center transition-all duration-200 text-(--color-text-primary) hover:bg-(--color-bg-surface) hover:border-(--color-accent-color)"
            title="سال بعد"
          >
            ≫
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 px-3 py-2 bg-(--color-bg-surface) border-b border-(--color-border-color)">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[13px] font-medium text-(--color-text-muted)">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5 p-3 pb-3 bg-(--color-bg-secondary)">
        {daysInMonth.map((day, index) => (
          <div
            key={index}
            onClick={() => selectDay(day)}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-200
              ${!day.isCurrentMonth ? 'cursor-default opacity-30 bg-transparent' : ''}
              ${day.isToday ? 'bg-(--color-bg-surface) border border-(--color-accent-color) font-semibold' : ''}
              ${day.isSelected ? 'bg-(--color-accent-color) text-white font-semibold shadow-[0_2px_6px_var(--color-shadow)]' : 'text-(--color-text-primary) bg-(--color-bg-secondary)'}
              ${day.isCurrentMonth && !day.isSelected ? 'hover:bg-(--color-bg-surface) hover:scale-105' : ''}
            `}
          >
            {day.day ? toPersianNumber(day.day) : ''}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-center px-5 pt-3 pb-5 border-t border-(--color-border-color) bg-(--color-bg-secondary)">
        <button 
          onClick={handleConfirm} 
          className="w-full py-2.5 bg-(--color-accent-color) border-none rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-(--color-accent-hover) hover:-translate-y-0.5 hover:shadow-[0_4px_10px_var(--color-shadow)]"
        >
          تایید
        </button>
      </div>
    </div>
  );
};

export default PersianCalendar;