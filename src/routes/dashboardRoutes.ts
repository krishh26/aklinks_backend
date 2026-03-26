import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
  getUserDashboard,
  getLinkAnalytics,
  getDashboardRecentActivity,
  getDashboardTopLinks,
} from '../controllers/dashboardController';

const router = Router();

// User-level dashboard metrics
router.get('/dashboard', authenticate, getUserDashboard as any);

// Dashboard widgets (scoped by role inside controller)
router.get('/dashboard/recent-activity', authenticate, getDashboardRecentActivity as any);
router.get('/dashboard/top-links', authenticate, getDashboardTopLinks as any);

// Per-link analytics
router.get('/link-analytics/:id', authenticate, getLinkAnalytics as any);

export default router;

