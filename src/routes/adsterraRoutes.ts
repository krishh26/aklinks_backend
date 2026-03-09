import { Router } from 'express';
import {
  getDomains,
  getDomainPlacements,
  getAllPlacements,
  getSmartLinks,
  getStatistics,
  getAdsterraApiKey,
  updateAdsterraApiKey,
} from '../controllers/adsterraController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

// All Adsterra routes require authentication
// API key management - Admin only
router.get('/api-key', authenticate, authorize('admin', 'super_admin'), getAdsterraApiKey);
router.put('/api-key', authenticate, authorize('admin', 'super_admin'), updateAdsterraApiKey);

// Adsterra API proxy - Admin only (keeps API key server-side)
router.get('/domains', authenticate, authorize('admin', 'super_admin'), getDomains);
router.get('/domain/:domainId/placements', authenticate, authorize('admin', 'super_admin'), getDomainPlacements);
router.get('/placements', authenticate, authorize('admin', 'super_admin'), getAllPlacements);
router.get('/smart-links', authenticate, authorize('admin', 'super_admin'), getSmartLinks);
router.get('/stats', authenticate, authorize('admin', 'super_admin'), getStatistics);

export default router;
