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
router.get('/all', authenticate, getAllReferralData);
router.get('/refer-wise-users', authenticate, getReferWiseTotalUsers);

export default router;
