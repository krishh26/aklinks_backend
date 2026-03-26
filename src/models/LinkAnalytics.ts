import mongoose from 'mongoose';

const LinkAnalyticsSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    country: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    device: {
      type: String,
      default: null,
      trim: true,
    },
    browser: {
      type: String,
      default: null,
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
    },
    referrer: {
      type: String,
      default: null,
    },
    clickTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    revenueGenerated: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    minimize: false,
  }
);

export default mongoose.model('LinkAnalytics', LinkAnalyticsSchema);

