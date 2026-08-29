import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NEU_RAISED, NEU_PRESSED, NEU_PRESS_ON_ACTIVE } from '@/styles/neumorphism';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL_COUNT = 42; // 6 fixed weeks so the grid height never jumps between months

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(viewDate: Date): DayCell[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month, -i), inCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inCurrentMonth: true });
  }
  while (cells.length < CELL_COUNT) {
    const last = cells[cells.length - 1]!.date;
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inCurrentMonth: false });
  }

  return cells;
}

export function MiniCalendar() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const grid = useMemo(() => getMonthGrid(viewDate), [viewDate]);
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const goToMonth = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-3xl bg-[var(--color-neu-surface)] p-6',
        NEU_RAISED,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">{monthLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:text-primary-600',
              NEU_RAISED,
              NEU_PRESS_ON_ACTIVE,
            )}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className={cn(
              'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:text-primary-600',
              NEU_RAISED,
              NEU_PRESS_ON_ACTIVE,
            )}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            {label}
          </span>
        ))}

        {grid.map(({ date, inCurrentMonth }) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!inCurrentMonth}
              onClick={() => setSelectedDate(date)}
              className={cn(
                'mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-200',
                !inCurrentMonth && 'cursor-default text-gray-300',
                inCurrentMonth && !isSelected && 'text-gray-700 hover:-translate-y-0.5 cursor-pointer',
                isSelected && isToday && cn('bg-primary-600 text-white', NEU_RAISED),
                isSelected && !isToday && cn('text-primary-700', NEU_PRESSED),
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
