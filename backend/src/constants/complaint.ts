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

export const PENDING_COMPLAINT_STATUSES: ComplaintStatus[] = ['OPEN', 'IN_PROGRESS'];
