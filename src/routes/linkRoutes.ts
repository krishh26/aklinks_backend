import { Router } from 'express';
import {
  createLink,
  getAllLinks,
  deleteLink
} from '../controllers/linkController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Protected link routes
router.post('/create', authenticate, createLink);
router.get('/all', authenticate, getAllLinks);
router.delete('/:id', authenticate, deleteLink);

export default router;

