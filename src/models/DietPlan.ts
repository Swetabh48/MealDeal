import mongoose, { Schema, Document, Model } from 'mongoose';

interface IFood {
  item: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  estimatedCost: number;
  recipe?: string;
  benefits?: string;
}

interface IMeal {
  name: string;
  time: string;
  foods: IFood[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalCost: number;
}

interface IDayPlan {
  meals: IMeal[];
  dailyTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    cost: number;
  };
}

interface ISupplement {
  name: string;
  dosage: string;
  reason: string;
  timing: string;
}

export interface IDietPlan extends Document {
  userId: mongoose.Types.ObjectId;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFats: number;
  weeklyPlan: {
    monday: IDayPlan;
    tuesday: IDayPlan;
    wednesday: IDayPlan;
    thursday: IDayPlan;
    friday: IDayPlan;
    saturday: IDayPlan;
    sunday: IDayPlan;
  };
  recommendations: string[];
  supplements: ISupplement[];
  hydration: string;
  exerciseRecommendations?: string;
  progressTracking?: string;
  cautionaryNotes?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema({
  item: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  estimatedCost: { type: Number, required: true },
  recipe: { type: String },
  benefits: { type: String },
}, { _id: false });

const MealSchema = new Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  foods: [FoodSchema],
  totalCalories: { type: Number, required: true },
  totalProtein: { type: Number, required: true },
  totalCarbs: { type: Number, required: true },
  totalFats: { type: Number, required: true },
  totalCost: { type: Number, required: true },
}, { _id: false });

const DayPlanSchema = new Schema({
  meals: [MealSchema],
  dailyTotal: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true },
    cost: { type: Number, required: true },
  }
}, { _id: false });

const SupplementSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  reason: { type: String, required: true },
  timing: { type: String, required: true },
}, { _id: false });

const DietPlanSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dailyCalories: { type: Number, required: true },
    dailyProtein: { type: Number, required: true },
    dailyCarbs: { type: Number, required: true },
    dailyFats: { type: Number, required: true },
    weeklyPlan: {
      monday: { type: DayPlanSchema, required: true },
      tuesday: { type: DayPlanSchema, required: true },
      wednesday: { type: DayPlanSchema, required: true },
      thursday: { type: DayPlanSchema, required: true },
      friday: { type: DayPlanSchema, required: true },
      saturday: { type: DayPlanSchema, required: true },
      sunday: { type: DayPlanSchema, required: true },
    },
    recommendations: [{ type: String }],
    supplements: [SupplementSchema],
    hydration: { type: String, required: true },
    exerciseRecommendations: { type: String },
    progressTracking: { type: String },
    cautionaryNotes: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DietPlanSchema.index({ userId: 1, createdAt: -1 });

const DietPlan: Model<IDietPlan> =
  mongoose.models.DietPlan || mongoose.model<IDietPlan>('DietPlan', DietPlanSchema);

export default DietPlan;