import { Router } from 'express';
import {
  createTrafficSource,
  getMyTrafficSources,
  updateMyTrafficSource,
  deleteMyTrafficSource,
  getAllTrafficSources,
  updateTrafficSourceStatus,
  deleteTrafficSourceAdmin
} from '../controllers/trafficSourceController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

//User
router.post('/create', authenticate, createTrafficSource);
router.get('/get', authenticate, getMyTrafficSources);
router.put('/update/:id', authenticate, updateMyTrafficSource);
router.delete('/delete/:id', authenticate, deleteMyTrafficSource);

//Admin
router.get('/admin/get', authenticate, authorize('super_admin'), getAllTrafficSources);
router.patch('/update/:id/status', authenticate, authorize('super_admin'), updateTrafficSourceStatus);
router.delete('/admin/delete/:id', authenticate, authorize('super_admin'), deleteTrafficSourceAdmin);

export default router;
