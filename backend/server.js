
import 'dotenv/config';
import 'express-async-errors';

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Existing routes
import authRoutes from './routes/auth.js';
import bloodRoutes from './routes/blood.js';
import scholarshipRoutes from './routes/scholarships.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import liveRoutes from './routes/live.js';

// Nearby Essential Services routes
import nearbyRoutes from './routes/nearby.js';

// Citizen Complaint & Tracking System routes
import complaintsRoutes from './routes/complaints.js';
import govServicesRoutes from './routes/govServices.js';

// -------------------------------------------
// Environment Configuration
// -------------------------------------------

process.env.JWT_SECRET ||= 'dev_only_secret_change_me';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/jonoseba_db';

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173';

// -------------------------------------------
// Initialize Express
// -------------------------------------------

const app = express();

// Ensure uploads directory exists
fs.mkdirSync('uploads', { recursive: true });

// -------------------------------------------
// Middleware
// -------------------------------------------

app.use(
  cors({
    origin: CLIENT_URL
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve existing uploaded files
app.use('/uploads', express.static('uploads'));

// -------------------------------------------
// API Health Check
// -------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Jonoseba API is running'
  });
});

// -------------------------------------------
// Authentication Routes
// -------------------------------------------

app.use('/api/auth', authRoutes);

// -------------------------------------------
// Blood Donation Routes
// -------------------------------------------

app.use('/api/blood', bloodRoutes);

// -------------------------------------------
// Scholarship Routes
// -------------------------------------------

app.use('/api/scholarships', scholarshipRoutes);

// -------------------------------------------
// Admin Routes
// -------------------------------------------

app.use('/api/admin', adminRoutes);

// -------------------------------------------
// Live Weather & Disaster Routes
// -------------------------------------------

app.use('/api/live', liveRoutes);

// -------------------------------------------
// Nearby Essential Services Routes
// -------------------------------------------

app.use('/api/nearby', nearbyRoutes);

// -------------------------------------------
// Citizen Complaint & Tracking Routes
// -------------------------------------------

app.use('/api/complaints', complaintsRoutes);
app.use('/api/gov-services', govServicesRoutes);

// -------------------------------------------
// General API Routes
// -------------------------------------------

app.use('/api', apiRoutes);

// -------------------------------------------
// Unknown API Routes
// -------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found'
  });
});

// -------------------------------------------
// Central Error Handler
// -------------------------------------------

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  // Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Uploaded file exceeds the allowed size.'
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid resource ID.'
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message
    });
  }

  // Duplicate MongoDB key
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate record already exists.'
    });
  }

  res.status(err.status || err.statusCode || 500).json({
    message:
      (err.status || err.statusCode) &&
      (err.status || err.statusCode) < 500
        ? err.message
        : 'Something went wrong on the server.'
  });
});

// -------------------------------------------
// Connect MongoDB and Start Server
// -------------------------------------------

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(
        `Jonoseba API running on http://localhost:${PORT}`
      );

      console.log(
        `Nearby Services API: http://localhost:${PORT}/api/nearby`
      );

      console.log(
        `Complaint Management API: http://localhost:${PORT}/api/complaints`
      );
    });
  })
  .catch((error) => {
    console.error(
      'MongoDB connection failed:',
      error.message
    );

    process.exit(1);
  });
