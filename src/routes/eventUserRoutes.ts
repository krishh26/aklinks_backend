import { Router } from 'express';
import { createEventUser, getAllEventUsers } from '../controllers/eventUserController';

const router = Router();

// Public endpoints (no authentication required)
router.post('/', createEventUser);
router.get('/', getAllEventUsers);

export default router;

