import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import roomRoutes from './routes/roomRoutes.js';
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
