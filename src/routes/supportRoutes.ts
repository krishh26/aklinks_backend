import { Router } from 'express';
import { createSupport, getAllSupport } from '../controllers/supportController';
import { supportValidation } from '../validations/supportValidation';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Public endpoint: submit support/feedback
router.post('/', supportValidation, createSupport);

// Admin: list all support messages
router.get('/all', authenticate, getAllSupport);

export default router;
