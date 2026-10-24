import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import prisma from './config/prisma.js';
import { authenticateSession } from './middleware/auth.js';
import { csrfTokenGenerator, csrfProtection } from './middleware/csrf.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { sendSuccess } from './utils/response.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import skillsRoutes from './modules/skills/skills.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import recommendationsRoutes from './modules/recommendations/recommendations.routes.js';
import applicationsRoutes from './modules/applications/applications.routes.js';
import membershipsRoutes from './modules/memberships/memberships.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import milestonesRoutes from './modules/milestones/milestones.routes.js';
import discussionsRoutes from './modules/discussions/discussions.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS allowlist
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// Body & Cookie Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(config.cookieSecret));

// Session authentication & CSRF setup
app.use(authenticateSession);
app.use(csrfTokenGenerator);

// Health check endpoint (exempt from rate limit)
app.get('/api/v1/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: { code: 'UNHEALTHY', message: 'Database connection failed' }
    });
  }
});

// General rate limiter for API
app.use('/api/', generalLimiter);

// CSRF check on state-changing API endpoints
app.use('/api/', csrfProtection);

// Mount API modules under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/recommendations', recommendationsRoutes);
app.use('/api/v1/applications', applicationsRoutes);
app.use('/api/v1/memberships', membershipsRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/milestones', milestonesRoutes);
app.use('/api/v1', discussionsRoutes); // covers /projects/:id/messages and /messages/:id
app.use('/api/v1/activity', activityRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
