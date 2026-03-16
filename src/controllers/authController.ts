import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Referral from '../models/Referral';
import Settings from '../models/Settings';
import { generateToken, generateResetToken } from '../utils/tokenUtils';
import { sendPasswordResetEmail } from '../utils/emailUtils';
import crypto from 'crypto';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role = 'user', referralCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
      return;
    }

    // Handle referral code if provided
    let referrer: any = null;
    if (referralCode) {
      const cleanReferralCode = referralCode.trim().toUpperCase();
      referrer = await User.findOne({ referralCode: cleanReferralCode });
      if (!referrer) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid referral code'
        });
        return;
      }
      
      // Prevent self-referral
      if (referrer.email === email) {
        res.status(400).json({
          status: 'error',
          message: 'You cannot use your own referral code'
        });
        return;
      }
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      provider: 'local',
      referredBy: referrer ? referrer._id : null
    });

    await user.save();

    // Process referral if applicable
    if (referrer) {
      try {
        // Get referral amount from settings
        const referAmountSetting = await Settings.findOne({ key: 'refer_amount' });
        const referAmount = referAmountSetting ? (referAmountSetting.value as number) : 0;

        // Always create referral record for tracking, even if amount is 0
        const referralRecord = await Referral.create({
          referrer: referrer._id,
          referredUser: user._id,
          referralCode: referralCode.trim().toUpperCase(),
          amount: referAmount,
          status: referAmount > 0 ? 'credited' : 'pending'
        });

        // Credit referrer's wallet if amount > 0
        if (referAmount > 0) {
          referrer.walletBalance = (referrer.walletBalance || 0) + referAmount;
          await referrer.save();
          console.log(`Credited ${referAmount} to referrer ${referrer.email}. New balance: ${referrer.walletBalance}`);
        }
        
        console.log(`Referral record created: ${referrer.email} referred ${user.email}`);
      } catch (referralError) {
        // Log error but don't fail registration
        console.error('Error processing referral:', referralError);
      }
    }

    // Generate token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: (user as any).referralCode,
          walletBalance: (user as any).walletBalance || 0,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password field, also get wallet balance and referral code
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
      return;
    }

    // Check password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          referralCode: (user as any).referralCode,
          walletBalance: (user as any).walletBalance || 0
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'No user found with this email address'
      });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY || '3600000')); // 1 hour

    await user.save();

    // Send email
    try {
      console.log("hhhhhhhhhhhhhhhhhhhhhhhhhh", user.email)
      await sendPasswordResetEmail(user.email, resetToken);

      res.status(200).json({
        status: 'success',
        message: 'Password reset email sent successfully'
      });
    } catch (emailError) {
      // Reset the token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    console.log("useruseruser", user)

    if (!user) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatar: (req.user as any).avatar,
          referralCode: (req.user as any).referralCode,
          walletBalance: (req.user as any).walletBalance || 0,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createMasterAdmin = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
       res.status(400).json({ message: 'Name, email and password are required' });
       return
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'User with this email already exists' });
      return
    }

    const user = await User.create({
      name,
      email,
      password: password,
      role: 'super_admin',
      provider: 'local'
    });

     res.status(201).json({
      message: 'Master admin created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create master admin'
    });
  }
};
