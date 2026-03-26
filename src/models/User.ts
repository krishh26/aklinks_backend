import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      required: function (this: { googleId?: string }) : boolean {
        return !this.googleId;
      },
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin'],
      default: 'user'
    },
    resetPasswordToken: {
      type: String,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    avatar: {
      type: String
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0
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
  { versionKey: false, minimize: false }
);

UserSchema.pre('save', async function (next) {
  try {
    // Update updatedAt on each save
    (this as any).updatedAt = new Date();

    // Hash password if modified
    if ((this as any).isModified && (this as any).isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      (this as any).password = await bcrypt.hash((this as any).password, salt);
    }

    // Generate referral code if not exists and user is new
    if ((this as any).isNew && !(this as any).referralCode) {
      let code: string | any;
      let isUnique = false;
      const UserModel = (this as any).constructor;
      
      while (!isUnique) {
        // Generate a random 8-character alphanumeric code
        code  = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existingUser = await UserModel.findOne({ referralCode: code });
        if (!existingUser) {
          isUnique = true;
        }
      }
      
      (this as any).referralCode = code;
    }

    next();
  } catch (err) {
    next(err as any);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, (this as any).password);
};

UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

export default mongoose.model('User', UserSchema);

