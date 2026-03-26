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
router.put('/currency-exchange-rate', authenticate, updateCurrencyExchangeRate);
router.put('/refer-amount', authenticate, updateReferAmount);
router.get('/all', authenticate, getAllSettings);

export default router;

