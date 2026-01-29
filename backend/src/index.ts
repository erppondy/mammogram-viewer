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
import annotationsRoutes from './routes/annotations.routes';
import reportsRoutes from './routes/reports.routes';
import exportRoutes from './routes/export.routes';
import licensesRoutes from './routes/licenses.routes';
import licenseTemplatesRoutes from './routes/license-templates.routes';
import ambulanceStatsRoutes from './routes/ambulance-stats.routes';
import { analyticsService } from './services/AnalyticsService';
import { initializeInMemoryWorkers } from './workers/inMemoryWorkers';
import { scheduleLicenseExpirationJob } from './workers/licenseExpirationJob';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(helmet());
app.use(compression());

// Request logging middleware
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Middleware
app.use(express.json());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5175',
  'http://10.184.3.15:5175',
  'https://xraycad.bosschn.in',
  'http://xraycad.bosschn.in',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      console.log('CORS Request from origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('No origin - allowing request');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log('Origin allowed:', origin);
        callback(null, true);
      } else {
        console.error('CORS BLOCKED - Origin not allowed:', origin);
        console.error('Allowed origins:', allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/annotations', annotationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/license-templates', licenseTemplatesRoutes);
app.use('/api/ambulance-stats', ambulanceStatsRoutes);

app.get('/health', async (req, res) => {
  console.log('=== HEALTH CHECK ===');
  console.log('IP:', req.ip || req.connection.remoteAddress);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('===================');
  
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
    requestFrom: req.ip || req.connection.remoteAddress,
  });
});

// Test endpoint to check connectivity
app.get('/test', (req, res) => {
  console.log('=== TEST ENDPOINT HIT ===');
  console.log('IP:', req.ip || req.connection.remoteAddress);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  console.log('All Headers:', JSON.stringify(req.headers, null, 2));
  console.log('========================');
  
  res.json({
    message: 'Backend is reachable!',
    yourIp: req.ip || req.connection.remoteAddress,
    origin: req.headers.origin,
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

    // Schedule license expiration job
    console.log('Scheduling license expiration job...');
    scheduleLicenseExpirationJob();
    console.log('License expiration job scheduled');

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

    app.listen(PORT, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`Listening on: 0.0.0.0:${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`Network: http://10.184.3.15:${PORT}`);
      console.log(`Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`Allowed CORS origins:`);
      console.log(`  - http://localhost:5173`);
      console.log(`  - http://localhost:5175`);
      console.log(`  - http://10.184.3.15:5175`);
      console.log(`  - https://xraycad.bosschn.in`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
