import { Router } from 'express';
import {
  updateProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
  changePassword
} from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { handleValidationErrors } from '../middlewares/errorMiddleware';
import {
  updateProfileValidation,
  updateUserRoleValidation,
  deleteUserValidation,
  changePasswordValidation
} from '../validations/userValidation';

const router = Router();

// Protected user routes
router.put('/profile/:id', authenticate, updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/password/:id', authenticate, changePasswordValidation, handleValidationErrors, changePassword);

// Admin only routes
router.get('/all', authenticate, authorize('admin'), getAllUsers);
router.put('/:userId/role', authenticate, authorize('admin'), updateUserRoleValidation, handleValidationErrors, updateUserRole);
router.delete('/:userId', authenticate, authorize('admin'), deleteUserValidation, handleValidationErrors, deleteUser);

export default router;
