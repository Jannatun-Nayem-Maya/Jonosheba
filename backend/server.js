import 'dotenv/config';
import 'express-async-errors'; // lets the central error handler catch errors from async routes
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import bloodRoutes from './routes/blood.js';
import scholarshipRoutes from './routes/scholarships.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import liveRoutes from './routes/live.js';

process.env.JWT_SECRET ||= 'dev_only_secret_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jonoseba_db';
const PORT = process.env.PORT || 5000;

fs.mkdirSync('uploads', { recursive: true });

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/live', liveRoutes);
app.use('/api', apiRoutes);

// Central error handler (also catches multer upload errors)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 400).json({ message: err.message || 'Something went wrong' });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection failed. Is MongoDB running?', e.message);
    process.exit(1);
  });