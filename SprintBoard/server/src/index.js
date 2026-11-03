import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT || 5045;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5174';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'sprintboard-dev-secret-change-me';
    console.warn('JWT_SECRET not set — using development default');
  }

  await connectDB();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: [CLIENT_ORIGIN, 'http://localhost:5174', 'http://127.0.0.1:5174'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  app.set('io', io);

  app.use(
    cors({
      origin: [CLIENT_ORIGIN, 'http://localhost:5174', 'http://127.0.0.1:5174'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'SprintBoard API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  io.on('connection', (socket) => {
    socket.on('project:join', (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });
    socket.on('project:leave', (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SprintBoard API listening on http://127.0.0.1:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
