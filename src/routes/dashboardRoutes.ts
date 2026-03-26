import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { getUserDashboard, getLinkAnalytics } from '../controllers/dashboardController';

const router = Router();

// User-level dashboard metrics
router.get('/dashboard', authenticate, getUserDashboard as any);

// Per-link analytics
router.get('/link-analytics/:id', authenticate, getLinkAnalytics as any);

export default router;

