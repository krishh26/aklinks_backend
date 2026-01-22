import { Router } from 'express';
import {
  getCurrencyExchangeRate,
  updateCurrencyExchangeRate,
  getAllSettings,
  getReferAmount,
  updateReferAmount
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Public routes
router.get('/currency-exchange-rate', getCurrencyExchangeRate);
router.get('/refer-amount', getReferAmount);

// Admin only routes
router.put('/currency-exchange-rate', authenticate, authorize('admin', 'super_admin'), updateCurrencyExchangeRate);
router.put('/refer-amount', authenticate, authorize('admin', 'super_admin'), updateReferAmount);
router.get('/all', authenticate, authorize('admin', 'super_admin'), getAllSettings);

export default router;

