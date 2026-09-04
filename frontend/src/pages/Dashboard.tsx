import { useEffect, useState } from 'react';
import { Users, UserCheck, BedDouble, Wallet, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/auth';
import type { ResidentStats } from '@/types/resident';
import * as residentService from '@/services/residentService';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

interface StatTileProps {
  icon: typeof Users;
  label: string;
  accent?: boolean;
  value?: number;
  isLoading?: boolean;
  placeholderLabel?: string;
}

/** Stat card: shows a real, live number once its data source is available and reachable by
 * this role; otherwise it shows an honest placeholder instead of a fabricated number — never
 * a guess. */
function StatTile({
  icon: Icon,
  label,
  accent = false,
  value,
  isLoading = false,
  placeholderLabel = 'Soon',
}: StatTileProps) {
  const hasValue = value !== undefined;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-3xl p-5 transition-transform duration-200 hover:-translate-y-1',
        NEU_RAISED,
        accent ? 'bg-primary-600 text-white' : 'bg-[var(--color-neu-surface)] text-gray-900',
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-2xl',
            accent ? 'bg-white/20' : 'bg-primary-50 text-primary-600',
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        {!hasValue &&
          !isLoading &&
          (accent ? (
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
              {placeholderLabel}
            </span>
          ) : (
            <Badge variant="neutral">{placeholderLabel}</Badge>
          ))}
      </div>
      <div>
        {isLoading ? (
          <div
            className={cn(
              'h-8 w-14 animate-pulse rounded-md',
              accent ? 'bg-white/20' : 'bg-gray-100',
            )}
          />
        ) : (
          <p
            className={cn(
              'text-2xl font-bold',
              accent ? 'text-white' : hasValue ? 'text-gray-900' : 'text-gray-300',
            )}
            aria-label={hasValue ? undefined : 'Not tracked yet'}
          >
            {hasValue ? value : '—'}
          </p>
        )}
        <p className={cn('mt-0.5 text-xs font-medium', accent ? 'text-white/70' : 'text-gray-500')}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [residentStats, setResidentStats] = useState<ResidentStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const canViewResidents = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!canViewResidents) return;

    let cancelled = false;
    setIsStatsLoading(true);

    residentService
      .getResidentStats()
      .then((stats) => {
        if (!cancelled) setResidentStats(stats);
      })
      .catch(() => {
        // Leave residentStats null — the tile falls back to an honest "Unavailable" placeholder.
      })
      .finally(() => {
        if (!cancelled) setIsStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canViewResidents]);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_200ms_ease]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s a quick look at your account.</p>
        </div>
        <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          accent
          icon={Users}
          label="Total residents"
          value={canViewResidents ? residentStats?.total : undefined}
          isLoading={canViewResidents && isStatsLoading}
          placeholderLabel={canViewResidents ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={UserCheck}
          label="Active residents"
          value={canViewResidents ? residentStats?.active : undefined}
          isLoading={canViewResidents && isStatsLoading}
          placeholderLabel={canViewResidents ? 'Unavailable' : 'Staff only'}
        />
        <StatTile icon={BedDouble} label="Remaining rooms" />
        <StatTile icon={Wallet} label="Revenue" />
        <StatTile icon={MessageSquareWarning} label="Complaints" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {user.role === 'admin' && (
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
        )}

        <div className={cn(user.role === 'admin' ? '' : 'lg:col-span-3')}>
          <MiniCalendar />
        </div>
      </div>
    </div>
  );
}
