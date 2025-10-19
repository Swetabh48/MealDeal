import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance';
  dietaryRestrictions: string[];
  medicalConditions: string[];
  budget: 'lower' | 'middle' | 'upper';
  location: {
    country: string;
    state: string;
    city: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
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
    budget: { type: String, enum: ['lower', 'middle', 'upper'] },
    location: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;