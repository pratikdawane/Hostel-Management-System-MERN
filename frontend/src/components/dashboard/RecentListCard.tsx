import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';

interface RecentListCardProps<T> {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  isLoading: boolean;
  items: T[] | null;
  emptyTitle: string;
  emptySubtitle: string;
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

/** Shared "recent activity" panel shell for the dashboard — same neumorphic card, skeleton and
 * empty-state idiom as RevenueChart/OccupancyChart. `items === null` means this role can't see
 * the underlying data (an honest "not tracked for you" state); `[]` means the data source is
 * reachable but genuinely has nothing recorded yet. */
export function RecentListCard<T>({
  icon: Icon,
  title,
  subtitle,
  isLoading,
  items,
  emptyTitle,
  emptySubtitle,
  keyExtractor,
  renderItem,
}: RecentListCardProps<T>) {
  const hasData = items !== null && items.length > 0;

  return (
    <div className={cn('flex flex-col gap-4 rounded-3xl bg-[var(--color-neu-surface)] p-6', NEU_RAISED)}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-12 w-full animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-gray-400">{emptyTitle}</p>
          <p className="text-xs text-gray-400">{emptySubtitle}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={keyExtractor(item)}>{renderItem(item)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
