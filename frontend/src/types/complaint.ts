export const COMPLAINT_CATEGORIES = [
  'ELECTRICITY',
  'PLUMBING',
  'CLEANING',
  'INTERNET',
  'ROOM',
  'FOOD',
  'SECURITY',
  'OTHER',
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  ELECTRICITY: 'Electricity',
  PLUMBING: 'Plumbing',
  CLEANING: 'Cleaning',
  INTERNET: 'Internet',
  ROOM: 'Room',
  FOOD: 'Food',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export const COMPLAINT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const COMPLAINT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export interface ComplaintResident {
  id: string;
  name: string;
}

export interface Complaint {
  id: string;
  resident: ComplaintResident | null;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedStaffName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComplaints {
  complaints: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateComplaintInput {
  residentId?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
}

export interface UpdateComplaintInput {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedStaffName?: string;
}

export interface ComplaintStats {
  pending: number;
  total: number;
}
