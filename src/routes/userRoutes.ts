import { Router } from 'express';
import {
  updateProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
  changePassword,
  getUserById,
  toggleUserStatus
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
router.get('/:userId', authenticate, authorize('admin'), getUserById);
router.put('/:userId/role', authenticate, authorize('admin'), updateUserRoleValidation, handleValidationErrors, updateUserRole);
router.put('/:userId/toggle-status', authenticate, authorize('admin'), toggleUserStatus);
router.delete('/:userId', authenticate, authorize('admin'), deleteUserValidation, handleValidationErrors, deleteUser);

export default router;
