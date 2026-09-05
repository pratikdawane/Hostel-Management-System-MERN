import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { BED_STATUSES, type BedStatus } from '../constants/bed.js';

export interface IBed {
  roomId: Types.ObjectId;
  label: string;
  status: BedStatus;
  residentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type BedModelType = Model<IBed>;

export type BedDocument = HydratedDocument<IBed>;

const bedSchema = new Schema<IBed, BedModelType>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    label: {
      type: String,
      required: [true, 'Bed label is required'],
      trim: true,
      maxlength: [10, 'Bed label must be at most 10 characters'],
    },
    status: {
      type: String,
      enum: BED_STATUSES,
      default: 'AVAILABLE',
      required: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
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

bedSchema.index({ roomId: 1, label: 1 }, { unique: true });
bedSchema.index({ status: 1 });

export const Bed = model<IBed, BedModelType>('Bed', bedSchema);
