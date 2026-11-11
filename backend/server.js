
import 'dotenv/config';
import 'express-async-errors';

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// ==========================================
// EXISTING ROUTES
// ==========================================

import authRoutes from './routes/auth.js';
import bloodRoutes from './routes/blood.js';
import scholarshipRoutes from './routes/scholarships.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import liveRoutes from './routes/live.js';

// ==========================================
// NEARBY ESSENTIAL SERVICES
// ==========================================

import nearbyRoutes from './routes/nearby.js';

// ==========================================
// CITIZEN COMPLAINT & TRACKING SYSTEM
// ==========================================

import complaintsRoutes from './routes/complaints.js';

// ==========================================
// GOVERNMENT E-SERVICES HUB
// ==========================================

import govServicesRoutes from './routes/govServices.js';

// ==========================================
// FEEDBACK & RATING SYSTEM
// ==========================================

import feedbackRoutes from './routes/feedback.js';

// ==========================================
// SMART HELP CENTER (NEW)
// ==========================================

// Public bilingual FAQ and Help Assistant
import helpCenterRoutes from './routes/helpCenter.js';

// Admin FAQ and Knowledge Management
import adminHelpCenterRoutes from './routes/adminHelpCenter.js';

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

process.env.JWT_SECRET ||= 'dev_only_secret_change_me';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/jonoseba_db';

const PORT = process.env.PORT || 5000;

const CLIENT_URL =
  process.env.CLIENT_URL ||
  'http://localhost:5173';

// ==========================================
// INITIALIZE EXPRESS
// ==========================================

const app = express();

// Ensure uploads directory exists
fs.mkdirSync('uploads', { recursive: true });

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: CLIENT_URL
  })
);

// JSON request parsing
app.use(
  express.json({
    limit: '1mb'
  })
);

// Form submission parsing
app.use(
  express.urlencoded({
    extended: true
  })
);

// Serve existing uploaded files
app.use(
  '/uploads',
  express.static('uploads')
);

// ==========================================
// API HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Jonoseba API is running'
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Registration, Login and Current User
app.use(
  '/api/auth',
  authRoutes
);

// ==========================================
// BLOOD DONATION ROUTES
// ==========================================

// Blood Requests, Donors and Donation History
app.use(
  '/api/blood',
  bloodRoutes
);

// ==========================================
// SCHOLARSHIP ROUTES
// ==========================================

app.use(
  '/api/scholarships',
  scholarshipRoutes
);

// ==========================================
// EXISTING ADMIN ROUTES
// ==========================================

// User, Application, Content and Blood Management
app.use(
  '/api/admin',
  adminRoutes
);

// ==========================================
// LIVE WEATHER & DISASTER ROUTES
// ==========================================

app.use(
  '/api/live',
  liveRoutes
);

// ==========================================
// NEARBY ESSENTIAL SERVICES ROUTES
// ==========================================

app.use(
  '/api/nearby',
  nearbyRoutes
);

// ==========================================
// CITIZEN COMPLAINT ROUTES
// ==========================================

app.use(
  '/api/complaints',
  complaintsRoutes
);

// ==========================================
// GOVERNMENT E-SERVICES ROUTES
// ==========================================

app.use(
  '/api/gov-services',
  govServicesRoutes
);

// ==========================================
// FEEDBACK & RATING ROUTES
// ==========================================

// POST /api/feedback
// GET  /api/feedback
// GET  /api/feedback/summary

app.use(
  '/api/feedback',
  feedbackRoutes
);

// ==========================================
// SMART HELP CENTER ROUTES (NEW)
// ==========================================

// Public Help Center APIs:
//
// GET  /api/help-center/status
// GET  /api/help-center/faqs
// GET  /api/help-center/featured
// POST /api/help-center/ask
//
// Supports:
// - Bangla and English questions
// - Verified FAQ answers
// - Website database lookup
// - Bangladesh general knowledge (from FAQ database)
// - Unanswered question recording

app.use(
  '/api/help-center',
  helpCenterRoutes
);

// ==========================================
// ADMIN HELP CENTER ROUTES (NEW)
// ==========================================

// Admin Help Center APIs:
//
// GET    /api/admin/help-center/stats
// GET    /api/admin/help-center/faqs
// GET    /api/admin/help-center/faqs/:id
// POST   /api/admin/help-center/faqs
// PUT    /api/admin/help-center/faqs/:id
// PATCH  /api/admin/help-center/faqs/:id/status
// PATCH  /api/admin/help-center/faqs/:id/featured
// DELETE /api/admin/help-center/faqs/:id
//
// GET    /api/admin/help-center/unanswered
// PATCH  /api/admin/help-center/unanswered/:id
// DELETE /api/admin/help-center/unanswered/:id
//
// GET    /api/admin/help-center/categories
//
// Access:
// Authenticated Admin Only

app.use(
  '/api/admin/help-center',
  adminHelpCenterRoutes
);

// ==========================================
// GENERAL API ROUTES
// ==========================================

// Existing public API functionality
app.use(
  '/api',
  apiRoutes
);

// ==========================================
// UNKNOWN API ROUTES
// ==========================================

app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API endpoint not found'
  });
});

// ==========================================
// CENTRAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error(
    'Server error:',
    err.message
  );

  // ----------------------------------------
  // Multer Upload Size Error
  // ----------------------------------------

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message:
        'Uploaded file exceeds the allowed size.'
    });
  }

  // ----------------------------------------
  // Invalid MongoDB ObjectId
  // ----------------------------------------

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid resource ID.'
    });
  }

  // ----------------------------------------
  // Mongoose Validation Error
  // ----------------------------------------

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: err.message
    });
  }

  // ----------------------------------------
  // Duplicate MongoDB Key
  // ----------------------------------------

  if (err.code === 11000) {
    return res.status(409).json({
      message:
        'Duplicate record already exists.'
    });
  }

  // ----------------------------------------
  // Other HTTP Errors
  // ----------------------------------------

  const status =
    err.status ||
    err.statusCode ||
    500;

  res.status(status).json({
    message:
      status < 500
        ? err.message
        : 'Something went wrong on the server.'
  });
});

// ==========================================
// CONNECT MONGODB AND START SERVER
// ==========================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(
      'MongoDB connected successfully'
    );

    app.listen(PORT, () => {
      console.log(
        `Jonoseba API running on http://localhost:${PORT}`
      );

      // Existing services
      console.log(
        `Nearby Services API: http://localhost:${PORT}/api/nearby`
      );

      console.log(
        `Complaint Management API: http://localhost:${PORT}/api/complaints`
      );

      console.log(
        `Government E-Services API: http://localhost:${PORT}/api/gov-services`
      );

      console.log(
        `Feedback API: http://localhost:${PORT}/api/feedback`
      );

      // New Smart Help Center
      console.log(
        `Smart Help Center API: http://localhost:${PORT}/api/help-center`
      );

      console.log(
        `Admin Help Center API: http://localhost:${PORT}/api/admin/help-center`
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
