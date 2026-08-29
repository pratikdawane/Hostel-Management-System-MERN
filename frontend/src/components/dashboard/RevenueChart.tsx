import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';

const LAST_SIX_MONTHS = Array.from({ length: 6 }, (_, index) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - (5 - index));
  return { month: date.toLocaleDateString(undefined, { month: 'short' }), revenue: 0 };
});

/** No Rent & Payments module exists yet, so this renders a real chart frame with an
 * honest empty state instead of a fabricated revenue trend. */
export function RevenueChart() {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-3xl bg-[var(--color-neu-surface)] p-6',
        NEU_RAISED,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Wallet className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Revenue</h2>
          <p className="text-xs text-gray-500">Last 6 months</p>
        </div>
      </div>

      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={LAST_SIX_MONTHS} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-600)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--color-primary-600)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-primary-600)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-gray-400">No revenue recorded yet</p>
          <p className="text-xs text-gray-400">This chart fills in once Rent &amp; Payments goes live.</p>
        </div>
      </div>
    </div>
  );
}
