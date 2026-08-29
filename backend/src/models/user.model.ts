import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, type Role } from '../constants/roles.js';

const SALT_ROUNDS = 12;

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
  isActive: boolean;
  tokenVersion: number;
  passwordChangedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModelType = Model<IUser, Record<string, never>, IUserMethods>;

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModelType, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: 'resident',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.passwordChangedAt;
        delete ret._id;
        return ret;
      },
    },
  },
);

userSchema.index({ role: 1 });

userSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);

  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

userSchema.methods.comparePassword = function (this: UserDocument, candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser, UserModelType>('User', userSchema);
