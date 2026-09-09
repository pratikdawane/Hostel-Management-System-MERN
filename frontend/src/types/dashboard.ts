import type { ResidentStats, Resident } from './resident';
import type { RoomStats } from './room';
import type { PaymentStats } from './payment';
import type { ComplaintStats, Complaint } from './complaint';
import type { Payment } from './payment';

export interface RoomOccupancyStats extends RoomStats {
  occupiedBeds: number;
  occupancyRate: number;
}

export interface DashboardSummary {
  residents: ResidentStats | null;
  rooms: RoomOccupancyStats | null;
  payments: PaymentStats | null;
  complaints: ComplaintStats;
  recentResidents: Resident[] | null;
  recentPayments: Payment[] | null;
  recentComplaints: Complaint[];
}
