import mongoose, { Schema, Document, Model } from 'mongoose';

interface IMeal {
  name: string;
  time: string;
  foods: {
    item: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    estimatedCost: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCost: number;
}

export interface IDietPlan extends Document {
  userId: mongoose.Types.ObjectId;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  meals: IMeal[];
  recommendations: string[];
  supplements: string[];
  hydration: string;
  createdAt: Date;
  updatedAt: Date;
}

const DietPlanSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dailyCalories: { type: Number, required: true },
    dailyProtein: { type: Number, required: true },
    dailyCarbs: { type: Number, required: true },
    dailyFats: { type: Number, required: true },
    meals: [
      {
        name: String,
        time: String,
        foods: [
          {
            item: String,
            quantity: String,
            calories: Number,
            protein: Number,
            carbs: Number,
            fats: Number,
            estimatedCost: Number,
          },
        ],
        totalCalories: Number,
        totalProtein: Number,
        totalCarbs: Number,
        totalFats: Number,
        totalCost: Number,
      },
    ],
    recommendations: [{ type: String }],
    supplements: [{ type: String }],
    hydration: { type: String },
  },
  {
    timestamps: true,
  }
);

const DietPlan: Model<IDietPlan> =
  mongoose.models.DietPlan || mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);

export default DietPlan;