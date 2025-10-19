import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight: number;
  notes: string;
  photos?: string[];
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  createdAt: Date;
}

const ProgressSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    weight: { type: Number, required: true },
    notes: { type: String },
    photos: [{ type: String }],
    measurements: {
      chest: Number,
      waist: Number,
      hips: Number,
      arms: Number,
      thighs: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Progress: Model<IProgress> =
  mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;