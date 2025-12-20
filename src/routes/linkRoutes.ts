import { Router } from 'express';
import {
  createLink,
  getAllLinks,
  deleteLink,
  getLinksByUserId,
  adminDeleteLink
} from '../controllers/linkController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Protected link routes
router.post('/create', authenticate, createLink);
router.get('/all', authenticate, authorize('admin'), getAllLinks);
router.delete('/:id', authenticate, deleteLink);

// Admin routes
router.get('/user/:userId', authenticate, getLinksByUserId);
router.delete('/:id/admin', authenticate, authorize('admin'), adminDeleteLink);

export default router;

