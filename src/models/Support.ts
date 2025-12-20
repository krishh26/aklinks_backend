import mongoose from 'mongoose';

const SupportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    consent: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

export default mongoose.model('Support', SupportSchema);
