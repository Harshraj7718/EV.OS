import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env';
import { morganStream } from './utils/logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app: Application = express();

// Render (and most PaaS platforms) sit behind a single reverse proxy that sets
// X-Forwarded-For. Trusting exactly one hop lets Express (and express-rate-limit)
// resolve the real client IP instead of the proxy's internal address.
app.set('trust proxy', 1);

// CORS_ORIGIN may be a single origin or a comma-separated list (e.g. apex + www).
const allowedOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', { stream: morganStream }));
app.use('/api', apiRateLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
