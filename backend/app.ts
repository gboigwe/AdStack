import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { httpLogStream } from './lib/logger';
import subscriptionRoutes from './api/subscription';
import authRoutes from './api/auth';
import campaignRoutes from './api/campaigns';
import analyticsRoutes from './api/analytics';
import paymentRoutes from './api/payments';
import userRoutes from './api/users';
import webhookRoutes from './api/webhooks';
import healthRoutes from './api/health';
import docsRoutes from './api/docs';

const app = express();

app.use(helmet({
  contentSecurityPolicy: config.app.env === 'production' ? undefined : false,
}));

app.use(cors({
  origin: config.security.corsOrigin || config.app.frontendUrl,
  credentials: config.security.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

app.use(compression());

app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.app.env !== 'test') {
  app.use(morgan('combined', { stream: httpLogStream() }));
}

app.use('/api/health', healthRoutes);

if (config.development.enableApiDocs) {
  app.use('/api/docs', docsRoutes);
}

app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
