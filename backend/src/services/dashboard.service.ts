import type { Role } from '../constants/roles.js';
import type { ResidentDocument } from '../models/resident.model.js';
import * as residentService from './resident.service.js';
import * as roomService from './room.service.js';
import * as paymentService from './payment.service.js';
import * as complaintService from './complaint.service.js';
import type { ResidentStats } from './resident.service.js';
import type { RoomStats } from './room.service.js';
import type { PaymentStats } from './payment.service.js';
import type { ComplaintStats, ComplaintListItem } from './complaint.service.js';
import type { PaymentListItem } from './payment.service.js';

interface AuthUser {
  id: string;
  role: Role;
}

// How many rows each "recent activity" panel shows on the dashboard.
const RECENT_LIMIT = 5;

export interface RoomOccupancyStats extends RoomStats {
  occupiedBeds: number;
  occupancyRate: number;
}

export interface DashboardSummary {
  residents: ResidentStats | null;
  rooms: RoomOccupancyStats | null;
  payments: PaymentStats | null;
  complaints: ComplaintStats;
  recentResidents: ResidentDocument[] | null;
  recentPayments: PaymentListItem[] | null;
  recentComplaints: ComplaintListItem[];
}

function withOccupancy(stats: RoomStats): RoomOccupancyStats {
  const occupiedBeds = stats.totalBeds - stats.availableBeds;
  const occupancyRate = stats.totalBeds > 0 ? Math.round((occupiedBeds / stats.totalBeds) * 100) : 0;
  return { ...stats, occupiedBeds, occupancyRate };
}

/**
 * One aggregated summary for the dashboard, composed from the same service functions each
 * module's own stats endpoint already uses — a single HTTP round trip for the frontend, not
 * several. Residents/rooms/payments are Admin/Manager-only, matching resident.routes.ts,
 * room.routes.ts and payment.routes.ts; Complaints stay visible to every role, scoped to the
 * caller's own records inside complaintService for a Resident.
 */
export async function getDashboardSummary(user: AuthUser): Promise<DashboardSummary> {
  const canViewOperationalData = user.role === 'admin' || user.role === 'manager';

  const [residents, rooms, payments, complaints, recentResidents, recentPayments, recentComplaints] =
    await Promise.all([
      canViewOperationalData ? residentService.getResidentStats() : Promise.resolve(null),
      canViewOperationalData ? roomService.getRoomStats() : Promise.resolve(null),
      canViewOperationalData ? paymentService.getPaymentStats() : Promise.resolve(null),
      complaintService.getComplaintStats(user),
      canViewOperationalData
        ? residentService
            .listResidents({ q: undefined, page: 1, limit: RECENT_LIMIT })
            .then((result) => result.residents)
        : Promise.resolve(null),
      canViewOperationalData
        ? paymentService
            .listPayments({ page: 1, limit: RECENT_LIMIT })
            .then((result) => result.payments)
        : Promise.resolve(null),
      complaintService
        .listComplaints({ page: 1, limit: RECENT_LIMIT }, user)
        .then((result) => result.complaints),
    ]);

  return {
    residents,
    rooms: rooms ? withOccupancy(rooms) : null,
    payments,
    complaints,
    recentResidents,
    recentPayments,
    recentComplaints,
  };
}
