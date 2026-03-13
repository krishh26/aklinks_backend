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

// All Adsterra routes require authentication and admin-level access
// API key management - Admin only
router.get('/api-key', authenticate, getAdsterraApiKey);
router.put('/api-key', authenticate, updateAdsterraApiKey);

// Adsterra API proxy - Admin only (keeps API key server-side)
router.get('/domains', authenticate, getDomains);
router.get(
  '/domain/:domainId/placements',
  authenticate,
  getDomainPlacements
);
router.get('/placements', authenticate, getAllPlacements);
router.get('/smart-links', authenticate, getSmartLinks);
router.get('/stats', authenticate, getStatistics);

export default router;
