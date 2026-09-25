import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/apiError.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import regulatoryDocumentRoutes from './routes/regulatoryDocument.routes.js';
import agentRoutes from './routes/agent.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
  credentials: true
}));

// Request Rate Limiting
app.use('/api', apiRateLimiter);

// Body Parsers
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads directory
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/regulatory-documents', regulatoryDocumentRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all 404 Route
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
