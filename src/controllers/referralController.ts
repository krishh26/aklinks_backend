import { Response, NextFunction } from 'express';
import Referral from '../models/Referral';
import User from '../models/User';

/**
 * Get user's referral link and stats
 * Authenticated users can get their own referral data
 */
export const getMyReferralData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    // Get referral stats
    const totalReferrals = await Referral.countDocuments({ referrer: user._id });
    const totalEarnings = await Referral.aggregate([
      { $match: { referrer: user._id, status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalEarned = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

    // Get referral history
    const referrals = await Referral.find({ referrer: user._id })
      .populate('referredUser', 'name email createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      message: 'Referral data retrieved successfully',
      data: {
        referralCode: (user as any).referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/signup?ref=${(user as any).referralCode || ''}`,
        totalReferrals,
        totalEarned,
        walletBalance: (user as any).walletBalance || 0,
        referrals: referrals.map(ref => ({
          id: ref._id,
          referredUser: {
            id: (ref.referredUser as any)._id,
            name: (ref.referredUser as any).name,
            email: (ref.referredUser as any).email,
            joinDate: (ref.referredUser as any).createdAt
          },
          amount: ref.amount,
          status: ref.status,
          createdAt: ref.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all referral data (Admin only)
 */
export const getAllReferralData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Get all referrals with pagination
    const referrals = await Referral.find()
      .populate('referrer', 'name email referralCode')
      .populate('referredUser', 'name email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Referral.countDocuments();

    // Get aggregate stats
    const totalReferrals = await Referral.countDocuments();
    const totalEarnings = await Referral.aggregate([
      { $match: { status: 'credited' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalEarned = totalEarnings.length > 0 ? totalEarnings[0].total : 0;

    res.status(200).json({
      status: 'success',
      message: 'All referral data retrieved successfully',
      data: {
        stats: {
          totalReferrals,
          totalEarned
        },
        referrals: referrals.map(ref => ({
          id: ref._id,
          referrer: {
            id: (ref.referrer as any)._id,
            name: (ref.referrer as any).name,
            email: (ref.referrer as any).email,
            referralCode: (ref.referrer as any).referralCode
          },
          referredUser: {
            id: (ref.referredUser as any)._id,
            name: (ref.referredUser as any).name,
            email: (ref.referredUser as any).email,
            joinDate: (ref.referredUser as any).createdAt
          },
          referralCode: ref.referralCode,
          amount: ref.amount,
          status: ref.status,
          createdAt: ref.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get refer-wise total users (Admin only)
 */
export const getReferWiseTotalUsers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    // Get all users with their referral stats and referrer information
    const users = await User.find({ role: 'user' })
      .select('name email referralCode walletBalance createdAt referredBy')
      .populate('referredBy', 'name email referralCode')
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const referralCount = await Referral.countDocuments({ referrer: user._id });
        const totalEarned = await Referral.aggregate([
          { $match: { referrer: user._id, status: 'credited' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Get referrer information if user was referred
        let referrerInfo = null;
        if ((user as any).referredBy) {
          const referrer = (user as any).referredBy;
          referrerInfo = {
            id: referrer._id,
            name: referrer.name,
            email: referrer.email,
            referralCode: referrer.referralCode
          };
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          referralCode: (user as any).referralCode,
          totalReferrals: referralCount,
          totalEarned: totalEarned.length > 0 ? totalEarned[0].total : 0,
          walletBalance: (user as any).walletBalance || 0,
          joinDate: user.createdAt,
          referredBy: referrerInfo
        };
      })
    );

    res.status(200).json({
      status: 'success',
      message: 'Refer-wise total users retrieved successfully',
      data: {
        users: usersWithStats
      }
    });
  } catch (error) {
    next(error);
  }
};
