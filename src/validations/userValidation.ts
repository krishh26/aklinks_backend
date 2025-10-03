import { body, param } from 'express-validator';

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

export const updateUserRoleValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),

  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

export const deleteUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID')
];

export const changePasswordValidation = [
  body('oldPassword')
    .isLength({ min: 6 })
    .withMessage('Old password must be at least 6 characters'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];