import mongoose from 'mongoose';

const LinkSchema = new mongoose.Schema(
  {
    originalLink: {
      type: String,
      required: true,
      trim: true
    },
    shortLink: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    clicks: {
      type: Number,
      default: 0
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
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

LinkSchema.pre('save', function (next) {
  (this as any).updatedAt = new Date();
  next();
});

export default mongoose.model('Link', LinkSchema);

