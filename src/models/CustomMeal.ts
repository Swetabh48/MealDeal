// src/models/CustomMeal.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

interface IFoodItem {
  item: string;
  quantity: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  healthScore?: number;
  healthNote?: string;
}

interface INutritionAnalysis {
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCalories: number;
  macroRatio: {
    protein: number;
    carbs: number;
    fats: number;
  };
  healthScore: number;
  recommendation: string;
}

export interface ICustomMeal extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  mealType: string;
  mealName: string;
  foods: IFoodItem[];
  totalCalories: number;
  isCustom: boolean;
  nutritionAnalysis: INutritionAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema({
  item: { type: String, required: true },
  quantity: { type: String, required: true },
  brand: { type: String },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  healthScore: { type: Number, min: 1, max: 10 },
  healthNote: { type: String }
}, { _id: false });

const NutritionAnalysisSchema = new Schema({
  totalProtein: { type: Number, required: true },
  totalCarbs: { type: Number, required: true },
  totalFats: { type: Number, required: true },
  totalCalories: { type: Number, required: true },
  macroRatio: {
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number }
  },
  healthScore: { type: Number, min: 1, max: 10 },
  recommendation: { type: String }
}, { _id: false });

const CustomMealSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    mealType: { type: String, required: true },
    mealName: { type: String, required: true },
    foods: [FoodItemSchema],
    totalCalories: { type: Number, required: true },
    isCustom: { type: Boolean, default: true },
    nutritionAnalysis: NutritionAnalysisSchema
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CustomMealSchema.index({ userId: 1, date: -1 });

const CustomMeal: Model<ICustomMeal> =
  mongoose.models.CustomMeal || mongoose.model<ICustomMeal>('CustomMeal', CustomMealSchema);

export default CustomMeal;