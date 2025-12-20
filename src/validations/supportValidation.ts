import { body } from 'express-validator';

export const supportValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('consent').optional().isBoolean().withMessage('Consent must be boolean')
];
