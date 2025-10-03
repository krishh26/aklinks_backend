import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { handleValidationErrors } from '../middlewares/errorMiddleware';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../validations/authValidation';

const router = Router();

// Public routes
router.post('/register', registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post('/forgot-password', forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, resetPassword);

// Protected routes
router.get('/profile', authenticate, getMe);

export default router;

