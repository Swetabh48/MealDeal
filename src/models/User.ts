import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance';
  dietaryRestrictions?: string[];
  medicalConditions?: string[];
  budget?: 'lower' | 'middle' | 'upper';
  location?: {
    country: string;
    state: string;
    city: string;
  };
  additionalInfo?: {
    goalDescription?: string;
    challenges?: string;
    expectations?: string;
    livesInHostel?: boolean;
    messMenuText?: string;
  };
  medicalReports?: {
    fileName: string;
    fileUrl: string;
    uploadDate: Date;
    type: string;
  }[];
  onboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { type: String, required: true },
    age: { type: Number },
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other'] 
    },
    height: { type: Number },
    weight: { type: Number },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    },
    goal: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance'],
    },
    dietaryRestrictions: [{ type: String }],
    medicalConditions: [{ type: String }],
    budget: { 
      type: String, 
      enum: ['lower', 'middle', 'upper'],
      default: 'middle'
    },
    location: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
    },
    additionalInfo: {
      goalDescription: { type: String },
      challenges: { type: String },
      expectations: { type: String },
      livesInHostel: { type: Boolean, default: false },
      messMenuText: { type: String },
    },
    medicalReports: [{
      fileName: { type: String },
      fileUrl: { type: String },
      uploadDate: { type: Date, default: Date.now },
      type: { type: String }
    }],
    onboardingCompleted: { 
      type: Boolean, 
      default: false 
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;