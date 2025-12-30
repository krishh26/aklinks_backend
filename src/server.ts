import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import session from 'express-session';
import connectDB from './config/db';
import passport from './config/googleAuth';
import Routes from './routes';
import { errorHandler, notFound } from './middlewares/errorMiddleware';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ===========================
   DATABASE
=========================== */
connectDB();

/* ===========================
   SECURITY HEADERS
=========================== */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

/* ===========================
   CORS (SIMPLE & CORRECT)
=========================== */
app.use(
  cors({
    origin: [
      'https://aklinks.in',
      'https://ads.aklinks.in',
      'http://localhost:4200',
    ],
    credentials: true,
  })
);

/* ===========================
   BODY PARSERS (MUST BE FIRST)
=========================== */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ===========================
   SESSION (CROSS-DOMAIN SAFE)
=========================== */
app.use(
  session({
    name: 'aklinks.sid',
    secret: process.env.SESSION_SECRET || 'aklinks-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,          // HTTPS required
      httpOnly: true,
      sameSite: 'none',      // 🔴 REQUIRED for cross-domain
      domain: '.aklinks.in', // 🔴 REQUIRED
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);

/* ===========================
   PASSPORT
=========================== */
app.use(passport.initialize());
app.use(passport.session());

/* ===========================
   BASE ROUTES
=========================== */
app.get('/', (_req, res) => {
  res.json({
    status: 'success',
    message: 'AKLinks Backend API running',
    version: '1.0.0',
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'success',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ===========================
   API ROUTES
=========================== */
app.use('/api/v1', Routes);

/* ===========================
   ERROR HANDLERS
=========================== */
app.use(notFound);
app.use(errorHandler);

/* ===========================
   START SERVER
=========================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
