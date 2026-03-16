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
router.get('/admin/get', authenticate, getAllTrafficSources);
router.patch('/update/:id/status', authenticate, updateTrafficSourceStatus);
router.delete('/admin/delete/:id', authenticate, deleteTrafficSourceAdmin);

export default router;
