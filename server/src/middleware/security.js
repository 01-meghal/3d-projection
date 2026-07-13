import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// Security considerations from 2-backend-api.md: CORS + Rate Limiting.

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin === config.clientOrigin ||
      origin === 'http://localhost:5173' ||
      origin === 'https://3d-projection-client.vercel.app' ||
      origin.endsWith('.trycloudflare.com') ||
      origin.endsWith('.localtunnel.me') ||
      origin.endsWith('.loca.lt')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});

// Applied to /api routes. Generous enough for dev, tight enough to demo 429s.
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
