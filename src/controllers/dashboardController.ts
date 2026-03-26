import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Link from '../models/Link';
import LinkAnalytics from '../models/LinkAnalytics';
import Referral from '../models/Referral';

const isDashboardAdmin = (user: { role?: string } | null | undefined): boolean => {
  const r = user?.role?.toLowerCase();
  return r === 'admin' || r === 'super_admin';
};

/**
 * GET /admin/dashboard
 * High-level admin metrics: users, links, clicks, earnings, CPM, impressions, etc.
 */
export const getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalLinks, linkClickAgg] = await Promise.all([
      User.countDocuments({}),
      Link.countDocuments({ deleted: false }),
      LinkAnalytics.aggregate([
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            totalRevenue: { $sum: '$revenueGenerated' },
          },
        },
      ]),
    ]);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaysClicksAgg, monthlyEarningsAgg] = await Promise.all([
      LinkAnalytics.aggregate([
        {
          $match: {
            clickTime: { $gte: startOfToday },
          },
        },
        {
          $group: {
            _id: null,
            todaysClicks: { $sum: 1 },
          },
        },
      ]),
      LinkAnalytics.aggregate([
        {
          $match: {
            clickTime: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            monthlyEarnings: { $sum: '$revenueGenerated' },
          },
        },
      ]),
    ]);

    const totalClicks = linkClickAgg[0]?.totalClicks || 0;
    const internalEarnings = linkClickAgg[0]?.totalRevenue || 0;
    const todaysClicks = todaysClicksAgg[0]?.todaysClicks || 0;
    const monthlyEarnings = monthlyEarningsAgg[0]?.monthlyEarnings || 0;

    // For now, impressions / CPM are inferred from click analytics only.
    // Once Adsterra stats are persisted, these can be enriched from that model.
    const impressions = totalClicks;
    const totalEarnings = internalEarnings;
    const cpm = impressions > 0 ? (totalEarnings / impressions) * 1000 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totals: {
          users: totalUsers,
          links: totalLinks,
          clicks: totalClicks,
          earnings: totalEarnings,
          impressions,
          cpm,
        },
        today: {
          clicks: todaysClicks,
        },
        monthly: {
          earnings: monthlyEarnings,
        },
      },
    });
  } catch (error: any) {
    console.error('getAdminDashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load admin dashboard stats',
    });
  }
};

/**
 * GET /user/dashboard
 * User-specific dashboard metrics: links, clicks, earnings.
 */
export const getUserDashboard = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    const [totalLinks, clickAgg] = await Promise.all([
      Link.countDocuments({ userId, deleted: false }),
      LinkAnalytics.aggregate([
        {
          $match: {
            userId,
          },
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            totalRevenue: { $sum: '$revenueGenerated' },
          },
        },
      ]),
    ]);

    const totalClicks = clickAgg[0]?.totalClicks || 0;
    const totalEarnings = clickAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      status: 'success',
      data: {
        links: totalLinks,
        clicks: totalClicks,
        earnings: totalEarnings,
      },
    });
  } catch (error: any) {
    console.error('getUserDashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load user dashboard stats',
    });
  }
};

/**
 * GET /user/link-analytics/:id
 * Detailed analytics for a single link: total clicks, unique clicks, CPM-style metrics.
 */
export const getLinkAnalytics = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { id: linkId } = req.params;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
      return;
    }

    if (!linkId) {
      res.status(400).json({
        status: 'error',
        message: 'Link ID is required',
      });
      return;
    }

    const link = await Link.findOne({ _id: linkId, userId, deleted: false });
    if (!link) {
      res.status(404).json({
        status: 'error',
        message: 'Link not found',
      });
      return;
    }

    const [agg, lastClicks] = await Promise.all([
      LinkAnalytics.aggregate([
        {
          $match: {
            linkId: link._id,
          },
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            uniqueIps: { $addToSet: '$ipAddress' },
            totalRevenue: { $sum: '$revenueGenerated' },
          },
        },
      ]),
      LinkAnalytics.find({ linkId: link._id })
        .sort({ clickTime: -1 })
        .limit(50),
    ]);

    const totalClicks = agg[0]?.totalClicks || 0;
    const uniqueClicks = (agg[0]?.uniqueIps || []).filter(
      (ip: string | null) => !!ip
    ).length;
    const earnings = agg[0]?.totalRevenue || 0;
    const impressions = totalClicks;
    const cpm = impressions > 0 ? (earnings / impressions) * 1000 : 0;

    res.status(200).json({
      status: 'success',
      data: {
        link: {
          id: link._id,
          originalLink: link.originalLink,
          shortLink: link.shortLink,
        },
        summary: {
          totalClicks,
          uniqueClicks,
          earnings,
          impressions,
          cpm,
        },
        recentClicks: lastClicks,
      },
    });
  } catch (error: any) {
    console.error('getLinkAnalytics error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load link analytics',
    });
  }
}

/**
 * GET /user/dashboard/recent-activity
 * Merged feed: new links, (admin) new users, clicks, referral credits.
 * Admin / super_admin: platform-wide. User: own data only.
 */
export const getDashboardRecentActivity = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const admin = isDashboardAdmin(req.user);
    const linkOwnerFilter = admin ? {} : { userId };

    const [recentLinks, recentUsers, recentClicks, recentReferrals] = await Promise.all([
      Link.find({ deleted: false, ...linkOwnerFilter })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('userId', 'name email')
        .lean(),
      admin
        ? User.find({})
            .sort({ createdAt: -1 })
            .limit(30)
            .select('name email createdAt')
            .lean()
        : Promise.resolve([]),
      LinkAnalytics.find(admin ? {} : { userId })
        .sort({ clickTime: -1 })
        .limit(30)
        .populate({ path: 'linkId', select: 'shortLink originalLink deleted userId' })
        .lean(),
      Referral.find(admin ? {} : { referrer: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('referredUser', 'name email')
        .lean(),
    ]);

    type ActivityRow = {
      type: 'link_created' | 'user_registered' | 'link_click' | 'referral_bonus';
      at: Date;
      shortLink?: string;
      originalLink?: string;
      actorName?: string;
      userName?: string;
      revenue?: number;
      amount?: number;
      referredUserName?: string;
    };

    const items: ActivityRow[] = [];

    for (const l of recentLinks as any[]) {
      const owner = l.userId;
      items.push({
        type: 'link_created',
        at: l.createdAt,
        shortLink: l.shortLink,
        originalLink: l.originalLink,
        actorName: owner?.name || owner?.email || undefined,
      });
    }

    if (admin) {
      for (const u of recentUsers as any[]) {
        items.push({
          type: 'user_registered',
          at: u.createdAt,
          userName: u.name,
        });
      }
    }

    for (const a of recentClicks as any[]) {
      const link = a.linkId;
      if (!link || link.deleted) continue;
      if (!admin && String(link.userId) !== String(userId)) continue;
      items.push({
        type: 'link_click',
        at: a.clickTime,
        shortLink: link.shortLink,
        originalLink: link.originalLink,
        revenue: a.revenueGenerated ?? 0,
      });
    }

    for (const r of recentReferrals as any[]) {
      const refUser = r.referredUser;
      items.push({
        type: 'referral_bonus',
        at: r.createdAt,
        amount: r.amount ?? 0,
        referredUserName: refUser?.name || refUser?.email || undefined,
      });
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const top = items.slice(0, 20);

    res.status(200).json({
      status: 'success',
      data: {
        scope: admin ? 'all' : 'user',
        items: top.map((row) => ({
          ...row,
          at: row.at instanceof Date ? row.at.toISOString() : new Date(row.at).toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('getDashboardRecentActivity error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load recent activity',
    });
  }
};

/**
 * GET /user/dashboard/top-links
 * Top links by click count from LinkAnalytics. Admin: all users. User: own links.
 */
export const getDashboardTopLinks = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const admin = isDashboardAdmin(req.user);
    const matchStage: Record<string, unknown> = {};
    if (!admin) {
      matchStage.userId = new mongoose.Types.ObjectId(String(userId));
    }

    const rows = await LinkAnalytics.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$linkId',
          clicks: { $sum: 1 },
          revenue: { $sum: '$revenueGenerated' },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'links',
          localField: '_id',
          foreignField: '_id',
          as: 'linkDoc',
        },
      },
      { $unwind: { path: '$linkDoc', preserveNullAndEmptyArrays: false } },
      { $match: { 'linkDoc.deleted': { $ne: true } } },
      {
        $lookup: {
          from: 'users',
          localField: 'linkDoc.userId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          shortLink: '$linkDoc.shortLink',
          originalLink: '$linkDoc.originalLink',
          clicks: 1,
          revenue: 1,
          ownerName: '$owner.name',
          ownerEmail: '$owner.email',
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        scope: admin ? 'all' : 'user',
        items: rows.map((r: any) => ({
          shortLink: r.shortLink,
          originalLink: r.originalLink,
          clicks: r.clicks ?? 0,
          revenue: r.revenue ?? 0,
          ownerName: admin ? r.ownerName || r.ownerEmail || '' : undefined,
          status: 'Active',
        })),
      },
    });
  } catch (error: any) {
    console.error('getDashboardTopLinks error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load top links',
    });
  }
};

