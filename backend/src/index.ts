import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { testConnection } from './config/database';
import { storageService } from './services/StorageService';
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import imageRoutes from './routes/images.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import { analyticsService } from './services/AnalyticsService';
import { initializeInMemoryWorkers } from './workers/inMemoryWorkers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', async (_req, res) => {
  const dbConnected = await testConnection();
  const storageStats = await storageService.getStorageStats();

  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    queueType: 'in-memory',
    storage: {
      totalSize: storageStats.totalSize,
      fileCount: storageStats.fileCount,
      availableSpace: storageStats.availableSpace,
    },
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    // Initialize storage directory structure
    console.log('Initializing storage...');
    await storageService.initialize();
    console.log('Storage initialized');

    // Test database connection on startup
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('Warning: Database connection failed. Server starting anyway...');
    }

    // Initialize in-memory workers (no Redis required)
    console.log('Initializing background workers...');
    initializeInMemoryWorkers();
    console.log('Background workers initialized successfully');

    // Schedule periodic cleanup (every 24 hours)
    setInterval(
      async () => {
        try {
          const deletedCount = await storageService.cleanupTempFiles(24);
          console.log(`Cleaned up ${deletedCount} temporary files`);
        } catch (error) {
          console.error('Storage cleanup failed:', error);
        }
      },
      24 * 60 * 60 * 1000
    );

    // Schedule daily system stats update (at midnight)
    const scheduleStatsUpdate = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      setTimeout(() => {
        analyticsService.updateSystemStats().catch(console.error);
        // Schedule next update
        setInterval(() => {
          analyticsService.updateSystemStats().catch(console.error);
        }, 24 * 60 * 60 * 1000);
      }, msUntilMidnight);
    };

    scheduleStatsUpdate();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
