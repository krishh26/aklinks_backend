import mongoose from 'mongoose';

const EventUserSchema = new mongoose.Schema(
  {
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

// Update updatedAt on save
EventUserSchema.pre('save', function (next) {
  (this as any).updatedAt = new Date();
  next();
});

export default mongoose.model('EventUser', EventUserSchema);

