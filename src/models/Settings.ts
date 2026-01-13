import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { versionKey: false }
);

SettingsSchema.pre('save', function (next) {
  (this as any).updatedAt = new Date();
  next();
});

// Ensure only one settings document exists per key
SettingsSchema.index({ key: 1 }, { unique: true });

export default mongoose.model('Settings', SettingsSchema);

