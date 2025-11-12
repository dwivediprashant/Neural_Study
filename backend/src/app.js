import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import courseRoutes from './routes/courseRoutes.js';
import testRoutes from './routes/testRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { initAuth } from './middleware/auth.js';
import { attachI18n } from './middleware/i18n.js';

dotenv.config();

const app = express();

attachI18n(app);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());
initAuth(app);

// database connection
connectDB();

// health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// api routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/comments', commentRoutes);

export default app;
