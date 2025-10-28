import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails?.[0]?.value });
        
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.avatar = profile.photos?.[0]?.value;
          user.provider = 'google';
          await user.save();
          return done(null, user);
        }
        
        // Create new user
        user = new User({
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          role: 'user',
          password: 'google-oauth-user', // Dummy password for Google users
          provider: 'google'
        });
        
        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error as Error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error as Error, undefined);
  }
});

export default passport;
