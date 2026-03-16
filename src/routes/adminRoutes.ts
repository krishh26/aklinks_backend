import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { getAdminDashboard } from '../controllers/dashboardController';
import { getAllUsers } from '../controllers/userController';
import { getAllLinks } from '../controllers/linkController';

const router = Router();

// Admin high-level dashboard
router.get(
  '/dashboard',
  authenticate,
  getAdminDashboard
);

// Admin users list (re-use existing controller)
router.get(
  '/users',
  authenticate,
  getAllUsers as any
);

// Admin links list (re-use existing controller)
router.get(
  '/links',
  authenticate,
  getAllLinks as any
);

export default router;

