import React, { useCallback } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

export default function DateOfBirthPicker({ value, onChange, disabled }: Props) {
  const parts = value ? value.split('-') : ['', '', ''];
  const selectedYear = parts[0] || '';
  const selectedMonth = parts[1] || '';
  const selectedDay = parts[2] || '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i);
  const daysInMonth = getDaysInMonth(parseInt(selectedMonth), parseInt(selectedYear));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const update = useCallback(
    (year: string, month: string, day: string) => {
      // Only update the final value when all three parts are selected
      if (year && month && day) {
        const d = parseInt(day);
        const maxDay = getDaysInMonth(parseInt(month), parseInt(year));
        const safeDay = d > maxDay ? maxDay : d;
        onChange(`${year}-${month.padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
      } else {
        // Keep partial selection in a temporary format so user can complete selection
        // Store as temporary format: year-month-day (even if incomplete)
        const tempValue = `${year || ''}-${month || ''}-${day || ''}`;
        onChange(tempValue === '--' ? '' : tempValue);
      }
    },
    [onChange]
  );

  // Handle day change - adjust if day exceeds max days in month
  const handleDayChange = (day: string) => {
    const year = selectedYear;
    const month = selectedMonth;
    
    if (year && month && day) {
      const maxDay = getDaysInMonth(parseInt(month), parseInt(year));
      const safeDay = parseInt(day) > maxDay ? String(maxDay).padStart(2, '0') : day;
      update(year, month, safeDay);
    } else {
      update(year, month, day);
    }
  };

  // Handle month change - adjust day if needed
  const handleMonthChange = (month: string) => {
    const year = selectedYear;
    const day = selectedDay;
    
    if (year && month && day) {
      const maxDay = getDaysInMonth(parseInt(month), parseInt(year));
      const safeDay = parseInt(day) > maxDay ? String(maxDay).padStart(2, '0') : day;
      update(year, month, safeDay);
    } else {
      update(year, month, day);
    }
  };

  const baseSelect =
    'flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 dark:text-white placeholder-gray-400 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex gap-2">
      {/* Day */}
      <select
        disabled={disabled}
        value={selectedDay}
        onChange={(e) => handleDayChange(e.target.value)}
        className={`${baseSelect} w-20`}
        aria-label="Day"
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={String(d).padStart(2, '0')}>
            {d}
          </option>
        ))}
      </select>

      {/* Month */}
      <select
        disabled={disabled}
        value={selectedMonth}
        onChange={(e) => handleMonthChange(e.target.value)}
        className={`${baseSelect} flex-[2]`}
        aria-label="Month"
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={String(i + 1).padStart(2, '0')}>
            {m}
          </option>
        ))}
      </select>

      {/* Year */}
      <select
        disabled={disabled}
        value={selectedYear}
        onChange={(e) => update(e.target.value, selectedMonth, selectedDay)}
        className={`${baseSelect} w-28`}
        aria-label="Year"
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
