import { Router } from 'express';
import {
  createLink,
  getAllLinks,
  deleteLink,
  getLinksByUserId,
  adminDeleteLink,
  toggleLinkStatus,
  getPublicLinkByShortCode,
} from '../controllers/linkController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Public: resolve short code → destination URL (no token)
router.get('/public/:shortLink', getPublicLinkByShortCode);

// Protected link routes
router.post('/create', authenticate, createLink);
router.get('/all', authenticate, getAllLinks);
router.delete('/:id', authenticate, deleteLink);

// Admin routes
router.get('/user/:userId', authenticate, getLinksByUserId);
router.put('/:id/toggle-status', authenticate, toggleLinkStatus);
router.delete('/:id/admin', authenticate, adminDeleteLink);

export default router;

