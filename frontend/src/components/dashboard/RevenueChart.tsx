import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';
import type { MonthlyRevenuePoint } from '@/types/payment';

interface RevenueChartProps {
  data: MonthlyRevenuePoint[] | null;
  isLoading: boolean;
}

interface TooltipPayloadEntry {
  value: number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <span className="font-medium text-gray-900">{label}:</span>{' '}
      <span className="text-gray-600">₹{payload[0]!.value.toLocaleString('en-IN')}</span>
    </div>
  );
}

/** Live monthly revenue, computed from recorded Payment records via /api/payments/stats —
 * shows an honest empty state instead of a fabricated trend when nothing has been paid yet. */
export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const hasData = data !== null && data.some((point) => point.revenue > 0);
  const chartData = data ?? [];

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

      {isLoading ? (
        <div className="h-56 w-full animate-pulse rounded-2xl bg-gray-100" />
      ) : (
        <div className="relative h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              {hasData && <Tooltip content={<ChartTooltip />} />}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-primary-600)"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>

          {!hasData && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-gray-400">No revenue recorded yet</p>
              <p className="text-xs text-gray-400">
                This chart fills in as payments are recorded in Rent &amp; Payments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
