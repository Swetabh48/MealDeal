import mongoose, { Schema, Document, Model } from 'mongoose';

interface IExercise {
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'breathing';
  targetMuscles: string[];
  sets: number;
  reps: string;
  restBetweenSets: string;
  instructions: string;
  modifications: string;
  equipment: string;
  caloriesBurn: number;
  benefits: string;
  safetyTips: string;
  videoReference: string;
}

interface IMealSuggestion {
  timing: string;
  foods: string[];
  reason: string;
}

interface IDayWorkout {
  restDay: boolean;
  workoutType: string;
  duration: string;
  exercises: IExercise[];
  warmup: string;
  cooldown: string;
  totalCaloriesBurn: number;
  preWorkoutMeal: IMealSuggestion;
  postWorkoutMeal: IMealSuggestion;
}

interface IProgressionPlan {
  'week1-2': string;
  'week3-4': string;
  'week5+': string;
}

export interface IWorkoutPlan extends Document {
  userId: mongoose.Types.ObjectId;
  weeklySchedule: {
    monday: IDayWorkout;
    tuesday: IDayWorkout;
    wednesday: IDayWorkout;
    thursday: IDayWorkout;
    friday: IDayWorkout;
    saturday: IDayWorkout;
    sunday: IDayWorkout;
  };
  guidelines: string[];
  progressionPlan: IProgressionPlan;
  warnings: string[];
  restAndRecovery: string;
  gymTiming?: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for tracking workout completion
export interface IWorkoutLog extends Document {
  userId: mongoose.Types.ObjectId;
  workoutPlanId: mongoose.Types.ObjectId;
  date: Date;
  day: string;
  exercises: Array<{
    exerciseName: string;
    setsCompleted: number;
    repsCompleted: string[];
    notes: string;
    completed: boolean;
  }>;
  totalDuration: number;
  caloriesBurned: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  notes: string;
  createdAt: Date;
}

const ExerciseSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['strength', 'cardio', 'flexibility', 'breathing'], required: true },
  targetMuscles: [{ type: String }],
  sets: { type: Number, required: true },
  reps: { type: String, required: true },
  restBetweenSets: { type: String, required: true },
  instructions: { type: String, required: true },
  modifications: { type: String },
  equipment: { type: String, required: true },
  caloriesBurn: { type: Number, required: true },
  benefits: { type: String },
  safetyTips: { type: String },
  videoReference: { type: String }
}, { _id: false });

const MealSuggestionSchema = new Schema({
  timing: { type: String, required: true },
  foods: [{ type: String }],
  reason: { type: String }
}, { _id: false });

const DayWorkoutSchema = new Schema({
  restDay: { type: Boolean, default: false },
  workoutType: { type: String, required: true },
  duration: { type: String, required: true },
  exercises: [ExerciseSchema],
  warmup: { type: String, required: true },
  cooldown: { type: String, required: true },
  totalCaloriesBurn: { type: Number, required: true },
  preWorkoutMeal: MealSuggestionSchema,
  postWorkoutMeal: MealSuggestionSchema
}, { _id: false });

const ProgressionPlanSchema = new Schema({
  'week1-2': { type: String, required: true },
  'week3-4': { type: String, required: true },
  'week5+': { type: String, required: true }
}, { _id: false });

const WorkoutPlanSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weeklySchedule: {
      monday: { type: DayWorkoutSchema, required: true },
      tuesday: { type: DayWorkoutSchema, required: true },
      wednesday: { type: DayWorkoutSchema, required: true },
      thursday: { type: DayWorkoutSchema, required: true },
      friday: { type: DayWorkoutSchema, required: true },
      saturday: { type: DayWorkoutSchema, required: true },
      sunday: { type: DayWorkoutSchema, required: true }
    },
    guidelines: [{ type: String }],
    progressionPlan: ProgressionPlanSchema,
    warnings: [{ type: String }],
    restAndRecovery: { type: String, required: true },
    gymTiming: { type: String },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Workout Log Schema for tracking
const WorkoutLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workoutPlanId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan', required: true },
    date: { type: Date, required: true },
    day: { type: String, required: true },
    exercises: [{
      exerciseName: { type: String, required: true },
      setsCompleted: { type: Number, required: true },
      repsCompleted: [{ type: String }],
      notes: { type: String },
      completed: { type: Boolean, default: false }
    }],
    totalDuration: { type: Number },
    caloriesBurned: { type: Number },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard'] },
    notes: { type: String }
  },
  { timestamps: true }
);

// Indexes
WorkoutPlanSchema.index({ userId: 1, createdAt: -1 });
WorkoutLogSchema.index({ userId: 1, date: -1 });

const WorkoutPlan: Model<IWorkoutPlan> =
  mongoose.models.WorkoutPlan || mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);

const WorkoutLog: Model<IWorkoutLog> =
  mongoose.models.WorkoutLog || mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema);

export { WorkoutPlan, WorkoutLog };
export default WorkoutPlan;