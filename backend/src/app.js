import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import roomRoutes from './routes/roomRoutes.js';
import runRoutes from './routes/runRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp(frontendUrl) {
  const app = express();

  app.use(
    cors({
      origin: frontendUrl,
      credentials: true
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'interview-prep-backend' });
  });

  app.use('/api/rooms', roomRoutes);
  app.use('/api/run', runRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/recordings', recordingRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/problems', problemRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
