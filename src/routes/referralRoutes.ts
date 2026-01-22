import { Router } from 'express';
import {
  getMyReferralData,
  getAllReferralData,
  getReferWiseTotalUsers
} from '../controllers/referralController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Authenticated user routes
router.get('/my-referrals', authenticate, getMyReferralData);

// Admin only routes
router.get('/all', authenticate, authorize('admin', 'super_admin'), getAllReferralData);
router.get('/refer-wise-users', authenticate, authorize('admin', 'super_admin'), getReferWiseTotalUsers);

export default router;
