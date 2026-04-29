import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './modules/auth/auth.routes';
import eventsRouter from './modules/events/events.routes';
import reservationsRouter from './modules/reservations/reservations.routes';
import reviewsRouter from './modules/reviews/reviews.routes';
import statsRouter from './modules/stats/stats.routes';
import uploadRouter from './modules/upload/upload.routes';
import usersRouter from './modules/users/users.routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/upload', uploadRouter);

app.use(errorHandler);
