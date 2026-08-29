import { Users, BedDouble, Wallet, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/types/auth';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { RevenueChart } from '@/components/dashboard/RevenueChart';

interface StatTileProps {
  icon: typeof Users;
  label: string;
  accent?: boolean;
}

/** Placeholder stat card: the Students/Rooms/Rent/Complaints modules aren't built yet, so this
 * shows an honest "not tracked yet" state instead of a fabricated number. */
function StatTile({ icon: Icon, label, accent = false }: StatTileProps) {
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
        {accent ? (
          <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
            Soon
          </span>
        ) : (
          <Badge variant="neutral">Soon</Badge>
        )}
      </div>
      <div>
        <p
          className={cn('text-2xl font-bold', accent ? 'text-white' : 'text-gray-300')}
          aria-label="Not tracked yet"
        >
          —
        </p>
        <p className={cn('mt-0.5 text-xs font-medium', accent ? 'text-white/70' : 'text-gray-500')}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();

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
        <StatTile accent icon={Users} label="Total students" />
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
