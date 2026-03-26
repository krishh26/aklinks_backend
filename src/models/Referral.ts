import mongoose from 'mongoose';

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    referralCode: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'credited', 'cancelled'],
      default: 'credited'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

// Indexes for better query performance
// Note: referredUser field has unique: true which automatically creates an index
// Do not add an explicit index for 'referredUser' as it would create a duplicate
ReferralSchema.index({ referrer: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ createdAt: -1 });

export default mongoose.model('Referral', ReferralSchema);
