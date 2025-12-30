import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../utils/tokenUtils';

export const googleAuth = (req: Request, res: Response, next: NextFunction) => {
  // This will be handled by passport middleware
  next();
};

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  // This will be handled by passport middleware
  next();
};

export const googleSuccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Google authentication failed'
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    });
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${token}&success=true`;
    return res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

export const googleFailure = (req: Request, res: Response, next: NextFunction) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/auth/callback?success=false&error=google_auth_failed`;
  
  res.redirect(redirectUrl);
};
