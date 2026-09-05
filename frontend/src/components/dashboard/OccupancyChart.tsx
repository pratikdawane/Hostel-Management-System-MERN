import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { BedDouble } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NEU_RAISED } from '@/styles/neumorphism';
import type { RoomStats } from '@/types/room';

interface OccupancyChartProps {
  stats: RoomStats | null;
  isLoading: boolean;
}

const OCCUPIED_COLOR = 'var(--color-primary-600)';
const AVAILABLE_COLOR = 'var(--color-success)';

interface TooltipPayloadEntry {
  name: string;
  value: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]!;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <span className="font-medium text-gray-900">{entry.name}:</span>{' '}
      <span className="text-gray-600">{entry.value} beds</span>
    </div>
  );
}

/** Live "Occupied vs Available beds" split — derived from the same /api/rooms/stats counts
 * as the dashboard tiles, so it's never a fabricated number. */
export function OccupancyChart({ stats, isLoading }: OccupancyChartProps) {
  const hasData = stats !== null && stats.totalBeds > 0;
  const occupied = stats ? stats.totalBeds - stats.availableBeds : 0;
  const available = stats?.availableBeds ?? 0;
  const occupancyRate = hasData ? Math.round((occupied / stats.totalBeds) * 100) : 0;

  const data = [
    { name: 'Occupied', value: occupied, color: OCCUPIED_COLOR },
    { name: 'Available', value: available, color: AVAILABLE_COLOR },
  ];

  return (
    <div className={cn('flex flex-col gap-4 rounded-3xl bg-[var(--color-neu-surface)] p-6', NEU_RAISED)}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <BedDouble className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Bed occupancy</h2>
          <p className="text-xs text-gray-500">Occupied vs available beds</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="h-40 w-40 animate-pulse rounded-full bg-gray-100" />
        </div>
      ) : !hasData ? (
        <div className="flex h-56 flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-gray-400">No beds recorded yet</p>
          <p className="text-xs text-gray-400">Add rooms and beds to see occupancy here.</p>
        </div>
      ) : (
        <div className="relative h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="90%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-gray-900">{occupancyRate}%</p>
            <p className="text-xs text-gray-500">occupied</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: OCCUPIED_COLOR }} />
          <span className="text-xs text-gray-600">Occupied ({occupied})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AVAILABLE_COLOR }} />
          <span className="text-xs text-gray-600">Available ({available})</span>
        </div>
      </div>
    </div>
  );
}
