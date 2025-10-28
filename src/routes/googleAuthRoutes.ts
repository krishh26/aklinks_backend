import { Router } from 'express';
import passport from 'passport';
import { googleSuccess, googleFailure } from '../controllers/googleAuthController';

const router = Router();
console.log("✅ googleAuthRoutes loaded");

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] })
);

console.log("✅ googleAuthRoutes loaded after /google");

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/google/failure' 
  }),
  googleSuccess
);

router.get('/google/failure', googleFailure);

export default router;
