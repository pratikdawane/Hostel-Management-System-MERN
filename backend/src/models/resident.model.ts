import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  RESIDENT_STATUSES,
  GENDERS,
  type ResidentStatus,
  type Gender,
} from '../constants/residentStatus.js';

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface IResident {
  name: string;
  email?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: IEmergencyContact;
  college?: string;
  course?: string;
  studentId?: string;
  profileImage?: string;
  status: ResidentStatus;
  user?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

type ResidentModelType = Model<IResident>;

export type ResidentDocument = HydratedDocument<IResident>;

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      maxlength: 20,
    },
    relation: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  { _id: false },
);

const residentSchema = new Schema<IResident, ResidentModelType>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    gender: {
      type: String,
      enum: GENDERS,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    emergencyContact: {
      type: emergencyContactSchema,
    },
    college: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    course: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    profileImage: {
      type: String,
      trim: true,
      maxlength: 2048,
    },
    status: {
      type: String,
      enum: RESIDENT_STATUSES,
      default: 'ACTIVE',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

residentSchema.index({ email: 1 }, { unique: true, sparse: true });
residentSchema.index({ studentId: 1 }, { unique: true, sparse: true });
residentSchema.index({ phone: 1 });
residentSchema.index({ user: 1 }, { unique: true, sparse: true });
residentSchema.index({ status: 1 });

export const Resident = model<IResident, ResidentModelType>('Resident', residentSchema);
