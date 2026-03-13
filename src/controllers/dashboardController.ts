import { Request, Response } from 'express';
import User from '../models/User';
import Link from '../models/Link';
import LinkAnalytics from '../models/LinkAnalytics';

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

