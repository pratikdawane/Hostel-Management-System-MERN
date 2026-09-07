import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
} from '../constants/complaint.js';

export interface IComplaint {
  residentId: Types.ObjectId;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedStaffName?: string;
  resolvedAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type ComplaintModelType = Model<IComplaint>;

export type ComplaintDocument = HydratedDocument<IComplaint>;

const complaintSchema = new Schema<IComplaint, ComplaintModelType>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: { type: String, enum: COMPLAINT_CATEGORIES, required: true },
    priority: { type: String, enum: COMPLAINT_PRIORITIES, default: 'MEDIUM', required: true },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'OPEN', required: true },
    assignedStaffName: { type: String, trim: true, maxlength: [100, 'Assignee name is too long'] },
    resolvedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  },
);

complaintSchema.index({ residentId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: 1 });

export const Complaint = model<IComplaint, ComplaintModelType>('Complaint', complaintSchema);
