import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMealCheckIn extends Document {
  userId: mongoose.Types.ObjectId;
  /** Calendar day key YYYY-MM-DD (local intent — stored as string for stable streak math) */
  dateKey: string;
  mealName: string;
  mealTime?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  /** Portion ratios applied at log time (optional) */
  portionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealCheckInSchema = new Schema<IMealCheckIn>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    mealName: { type: String, required: true },
    mealTime: { type: String },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    portionNote: { type: String },
  },
  { timestamps: true }
);

MealCheckInSchema.index({ userId: 1, dateKey: 1, mealName: 1 }, { unique: true });

const MealCheckIn: Model<IMealCheckIn> =
  mongoose.models.MealCheckIn ||
  mongoose.model<IMealCheckIn>('MealCheckIn', MealCheckInSchema);

export default MealCheckIn;
