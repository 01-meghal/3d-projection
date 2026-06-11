import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

// Security considerations from 2-backend-api.md: CORS + Rate Limiting.

export const corsMiddleware = cors({
  origin: config.clientOrigin,
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
