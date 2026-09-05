import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { ALLOCATION_STATUSES, type AllocationStatus } from '../constants/allocation.js';

export interface IRoomAllocation {
  residentId: Types.ObjectId;
  roomId: Types.ObjectId;
  bedId: Types.ObjectId;
  checkInDate: Date;
  expectedCheckOutDate?: Date;
  actualCheckOutDate?: Date;
  monthlyRent: number;
  securityDeposit: number;
  status: AllocationStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type RoomAllocationModelType = Model<IRoomAllocation>;

export type RoomAllocationDocument = HydratedDocument<IRoomAllocation>;

const roomAllocationSchema = new Schema<IRoomAllocation, RoomAllocationModelType>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    bedId: {
      type: Schema.Types.ObjectId,
      ref: 'Bed',
      required: true,
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    expectedCheckOutDate: {
      type: Date,
    },
    actualCheckOutDate: {
      type: Date,
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [0, 'Monthly rent cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: [0, 'Security deposit cannot be negative'],
    },
    status: {
      type: String,
      enum: ALLOCATION_STATUSES,
      default: 'ACTIVE',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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

// A resident/bed can have at most one ACTIVE allocation at a time — backstops the
// service-level checks in allocation.service.ts against a race between concurrent requests.
roomAllocationSchema.index(
  { bedId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
);
roomAllocationSchema.index(
  { residentId: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } },
);
roomAllocationSchema.index({ roomId: 1 });
roomAllocationSchema.index({ status: 1 });

export const RoomAllocation = model<IRoomAllocation, RoomAllocationModelType>(
  'RoomAllocation',
  roomAllocationSchema,
);
