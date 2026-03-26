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
router.get('/all', authenticate, getAllUsers);
router.get('/:userId', authenticate, getUserById);
router.put('/:userId/role', authenticate, updateUserRoleValidation, handleValidationErrors, updateUserRole);
router.put('/:userId/toggle-status', authenticate, toggleUserStatus);
router.delete('/:userId', authenticate, deleteUserValidation, handleValidationErrors, deleteUser);

export default router;
