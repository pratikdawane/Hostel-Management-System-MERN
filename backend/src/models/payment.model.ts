import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentType,
} from '../constants/payment.js';

export interface IPayment {
  residentId: Types.ObjectId;
  allocationId: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  transactionId?: string;
  type: PaymentType;
  status: PaymentStatus;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type PaymentModelType = Model<IPayment>;

export type PaymentDocument = HydratedDocument<IPayment>;

const paymentSchema = new Schema<IPayment, PaymentModelType>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    allocationId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomAllocation',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      maxlength: [100, 'Transaction ID is too long'],
    },
    type: {
      type: String,
      enum: PAYMENT_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PAID',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes are too long'],
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

paymentSchema.index({ residentId: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ allocationId: 1 });

export const Payment = model<IPayment, PaymentModelType>('Payment', paymentSchema);
