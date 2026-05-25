import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import * as path from 'path';

import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { LocalStorageService } from './services/storage/local-storage.service';
import { sendSuccess } from './utils/api-response';

// Import routers
import authRouter from './modules/auth/auth.routes';
import companiesRouter from './modules/companies/companies.routes';
import workspacesRouter from './modules/workspaces/workspaces.routes';
import projectsRouter from './modules/projects/project.routes';
import roomsRouter from './modules/rooms/rooms.routes';
import templatesRouter from './modules/templates/templates.routes';

const app = express();

// Initialize local storage folder
LocalStorageService.initialize();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to load locally on frontend
}));

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o: string) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

// Request Logging
app.use(morgan('dev'));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local upload static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/api/health', (_req, res) => {
  return sendSuccess(res, { status: 'healthy', timestamp: new Date() }, 'SAQR AI Backend Service is active');
});

// Mounting Sub-Routers
app.use('/api/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);

// Nested and Standalone Room Routes
app.use('/api/projects/:projectId/rooms', roomsRouter);
app.use('/api/rooms', roomsRouter);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
