import { Router } from 'express';
import {
  createLink,
  getAllLinks,
  deleteLink,
  getLinksByUserId,
  adminDeleteLink,
  toggleLinkStatus
} from '../controllers/linkController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// Protected link routes
router.post('/create', authenticate, createLink);
router.get('/all', authenticate, getAllLinks);
router.delete('/:id', authenticate, deleteLink);

// Admin routes
router.get('/user/:userId', authenticate, getLinksByUserId);
router.put('/:id/toggle-status', authenticate, toggleLinkStatus);
router.delete('/:id/admin', authenticate, adminDeleteLink);

export default router;

