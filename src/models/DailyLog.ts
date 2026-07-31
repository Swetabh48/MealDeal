import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;
  dateKey: string;
  waterGlasses: number;
  sleepHours?: number;
  sleepQuality?: 'poor' | 'ok' | 'great';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dateKey: { type: String, required: true },
    waterGlasses: { type: Number, default: 0, min: 0, max: 20 },
    sleepHours: { type: Number, min: 0, max: 24 },
    sleepQuality: { type: String, enum: ['poor', 'ok', 'great'] },
    notes: { type: String },
  },
  { timestamps: true }
);

DailyLogSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

const DailyLog: Model<IDailyLog> =
  mongoose.models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);

export default DailyLog;
