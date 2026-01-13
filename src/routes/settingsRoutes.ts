import { Router } from 'express';
import {
  getCurrencyExchangeRate,
  updateCurrencyExchangeRate,
  getAllSettings
} from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Public route - anyone can get the exchange rate
router.get('/currency-exchange-rate', getCurrencyExchangeRate);

// Admin only routes
router.put('/currency-exchange-rate', authenticate, authorize('admin', 'super_admin'), updateCurrencyExchangeRate);
router.get('/all', authenticate, authorize('admin', 'super_admin'), getAllSettings);

export default router;

