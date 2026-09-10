import { useEffect, useState } from 'react';
import { Users, UserCheck, Building2, BedDouble, Wallet, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/auth';
import { RESIDENT_STATUS_LABELS } from '@/types/resident';
import { PAYMENT_STATUS_LABELS } from '@/types/payment';
import { COMPLAINT_STATUS_LABELS, COMPLAINT_PRIORITY_LABELS } from '@/types/complaint';
import type { DashboardSummary } from '@/types/dashboard';
import * as dashboardService from '@/services/dashboardService';
import { statusBadgeVariant } from '@/utils/resident';
import { paymentStatusBadgeVariant } from '@/utils/payment';
import { complaintStatusBadgeVariant, complaintPriorityBadgeVariant } from '@/utils/complaint';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { RecentListCard } from '@/components/dashboard/RecentListCard';

interface StatTileProps {
  icon: typeof Users;
  label: string;
  accent?: boolean;
  value?: number;
  isLoading?: boolean;
  placeholderLabel?: string;
  formatValue?: (value: number) => string;
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
  formatValue,
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
            {value !== undefined ? (formatValue ? formatValue(value) : value) : '—'}
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canViewResidents = user?.role === 'admin' || user?.role === 'manager';
  const canViewRooms = user?.role === 'admin' || user?.role === 'manager';
  const canViewRevenue = user?.role === 'admin';

  const residentStats = summary?.residents ?? null;
  const roomStats = summary?.rooms ?? null;
  const paymentStats = summary?.payments ?? null;
  const complaintStats = summary?.complaints ?? null;

  // One aggregated GET /api/dashboard call powers every stat tile, chart, and recent-activity
  // panel below — not several small requests.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);

    dashboardService
      .getDashboard()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        // Leave summary null — every tile/chart/panel falls back to an honest placeholder.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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
          isLoading={canViewResidents && isLoading}
          placeholderLabel={canViewResidents ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={UserCheck}
          label="Active residents"
          value={canViewResidents ? residentStats?.active : undefined}
          isLoading={canViewResidents && isLoading}
          placeholderLabel={canViewResidents ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={Building2}
          label="Total rooms"
          value={canViewRooms ? roomStats?.totalRooms : undefined}
          isLoading={canViewRooms && isLoading}
          placeholderLabel={canViewRooms ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={BedDouble}
          label="Total beds"
          value={canViewRooms ? roomStats?.totalBeds : undefined}
          isLoading={canViewRooms && isLoading}
          placeholderLabel={canViewRooms ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={BedDouble}
          label="Available beds"
          value={canViewRooms ? roomStats?.availableBeds : undefined}
          isLoading={canViewRooms && isLoading}
          placeholderLabel={canViewRooms ? 'Unavailable' : 'Staff only'}
        />
        <StatTile
          icon={Wallet}
          label="Monthly revenue"
          value={canViewRevenue ? paymentStats?.monthlyRevenue : undefined}
          isLoading={canViewRevenue && isLoading}
          placeholderLabel={canViewRevenue ? 'Unavailable' : 'Staff only'}
          formatValue={(value) => `₹${value.toLocaleString('en-IN')}`}
        />
        <StatTile
          icon={MessageSquareWarning}
          label="Pending complaints"
          value={complaintStats?.pending}
          isLoading={isLoading}
          placeholderLabel="Unavailable"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {user.role === 'admin' && (
          <div className="lg:col-span-2">
            <RevenueChart data={paymentStats?.monthlyTrend ?? null} isLoading={isLoading} />
          </div>
        )}

        {canViewRooms && (
          <div className={cn(user.role === 'admin' ? '' : 'lg:col-span-1')}>
            <OccupancyChart stats={roomStats} isLoading={isLoading} />
          </div>
        )}

        <div
          className={cn(
            user.role === 'admin' || !canViewRooms ? 'lg:col-span-3' : 'lg:col-span-2',
          )}
        >
          <MiniCalendar />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {canViewResidents && (
          <RecentListCard
            icon={Users}
            title="Recent residents"
            subtitle="Latest additions"
            isLoading={isLoading}
            items={summary?.recentResidents ?? null}
            emptyTitle="No residents recorded yet"
            emptySubtitle="New residents will show up here."
            keyExtractor={(resident) => resident.id}
            renderItem={(resident) => (
              <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{resident.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(resident.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(resident.status)}>
                  {RESIDENT_STATUS_LABELS[resident.status]}
                </Badge>
              </div>
            )}
          />
        )}

        {canViewRevenue && (
          <RecentListCard
            icon={Wallet}
            title="Recent payments"
            subtitle="Latest transactions"
            isLoading={isLoading}
            items={summary?.recentPayments ?? null}
            emptyTitle="No payments recorded yet"
            emptySubtitle="Recorded payments will show up here."
            keyExtractor={(payment) => payment.id}
            renderItem={(payment) => (
              <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {payment.resident?.name ?? 'Unknown resident'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                  <Badge variant={paymentStatusBadgeVariant(payment.status)}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </div>
              </div>
            )}
          />
        )}

        <RecentListCard
          icon={MessageSquareWarning}
          title="Recent complaints"
          subtitle={user.role === 'resident' ? 'Your latest complaints' : 'Latest filed'}
          isLoading={isLoading}
          items={summary?.recentComplaints ?? null}
          emptyTitle="No complaints recorded yet"
          emptySubtitle="Filed complaints will show up here."
          keyExtractor={(complaint) => complaint.id}
          renderItem={(complaint) => (
            <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-white/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{complaint.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={complaintPriorityBadgeVariant(complaint.priority)}>
                  {COMPLAINT_PRIORITY_LABELS[complaint.priority]}
                </Badge>
                <Badge variant={complaintStatusBadgeVariant(complaint.status)}>
                  {COMPLAINT_STATUS_LABELS[complaint.status]}
                </Badge>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
