import mongoose from 'mongoose';

const TrafficSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    trafficSource: {
      type: String,
      required: true,
      trim: true
    },
    site: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'pending', 'declined'],
      default: 'pending'
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    dateAdded: {
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

TrafficSchema.pre('save', function (next) {
  (this as any).updatedAt = new Date();
  next();
});

export default mongoose.model('TrafficSource', TrafficSchema);
