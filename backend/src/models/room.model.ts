import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { ROOM_TYPES, ROOM_STATUSES, type RoomType, type RoomStatus } from '../constants/room.js';

export interface IRoom {
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  monthlyRent: number;
  status: RoomStatus;
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type RoomModelType = Model<IRoom>;

export type RoomDocument = HydratedDocument<IRoom>;

const roomSchema = new Schema<IRoom, RoomModelType>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      maxlength: [20, 'Room number must be at most 20 characters'],
    },
    floor: {
      type: Number,
      required: [true, 'Floor is required'],
    },
    type: {
      type: String,
      enum: ROOM_TYPES,
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [0, 'Monthly rent cannot be negative'],
    },
    status: {
      type: String,
      enum: ROOM_STATUSES,
      default: 'AVAILABLE',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
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

roomSchema.index({ roomNumber: 1 }, { unique: true });
roomSchema.index({ floor: 1 });
roomSchema.index({ status: 1 });

export const Room = model<IRoom, RoomModelType>('Room', roomSchema);
