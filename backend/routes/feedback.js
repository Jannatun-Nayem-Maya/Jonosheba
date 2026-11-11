
import { Router } from 'express';
import mongoose from 'mongoose';

import Feedback from '../models/Feedback.js';

import {
  optionalAuth,
  protect,
  adminOnly
} from '../middleware/auth.js';

const router = Router();

// -------------------------------------------
// Submit feedback - Public / Citizen
// POST /api/feedback
// -------------------------------------------

router.post('/', optionalAuth, async (req, res) => {
  // Admin accounts cannot submit feedback
  // while authenticated as an admin.
  if (req.user?.role === 'admin') {
    return res.status(403).json({
      message: 'Admins cannot submit user feedback.'
    });
  }

  const { name, rating, comment } = req.body || {};

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return res.status(400).json({
      message: 'Select a rating between 1 and 5.'
    });
  }

  if (
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > 1000
  ) {
    return res.status(400).json({
      message: 'Enter feedback between 1 and 1000 characters.'
    });
  }

  if (
    name !== undefined &&
    (
      typeof name !== 'string' ||
      name.trim().length > 80
    )
  ) {
    return res.status(400).json({
      message: 'Name must be 80 characters or fewer.'
    });
  }

  const feedback = await Feedback.create({
    name: name?.trim() || 'Anonymous',
    rating,
    comment: comment.trim(),
    status: 'pending'
  });

  return res.status(201).json({
    message: 'Feedback submitted successfully. Pending review.',
    feedbackId: feedback._id
  });
});

// -------------------------------------------
// Public rating summary - Approved only
// GET /api/feedback/summary
// -------------------------------------------

router.get('/summary', async (req, res) => {
  const [stats] = await Feedback.aggregate([
    {
      $match: {
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        average: { $avg: '$rating' },
        five: {
          $sum: {
            $cond: [{ $eq: ['$rating', 5] }, 1, 0]
          }
        },
        four: {
          $sum: {
            $cond: [{ $eq: ['$rating', 4] }, 1, 0]
          }
        },
        three: {
          $sum: {
            $cond: [{ $eq: ['$rating', 3] }, 1, 0]
          }
        },
        two: {
          $sum: {
            $cond: [{ $eq: ['$rating', 2] }, 1, 0]
          }
        },
        one: {
          $sum: {
            $cond: [{ $eq: ['$rating', 1] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.json({
    total: stats?.total || 0,
    averageRating: stats
      ? Number(stats.average.toFixed(1))
      : 0,
    distribution: {
      5: stats?.five || 0,
      4: stats?.four || 0,
      3: stats?.three || 0,
      2: stats?.two || 0,
      1: stats?.one || 0
    }
  });
});

// -------------------------------------------
// ADMIN ONLY: Feedback statistics
// GET /api/feedback/admin/stats
// -------------------------------------------

router.get(
  '/admin/stats',
  protect,
  adminOnly,
  async (req, res) => {
    const [total, pending, approved, hidden] =
      await Promise.all([
        Feedback.countDocuments(),
        Feedback.countDocuments({ status: 'pending' }),
        Feedback.countDocuments({ status: 'approved' }),
        Feedback.countDocuments({ status: 'hidden' })
      ]);

    res.json({
      total,
      pending,
      approved,
      hidden
    });
  }
);

// -------------------------------------------
// ADMIN ONLY: List feedback
// GET /api/feedback/admin?status=pending
// -------------------------------------------

router.get(
  '/admin',
  protect,
  adminOnly,
  async (req, res) => {
    const status = String(req.query.status || 'all');

    const allowed = [
      'all',
      'pending',
      'approved',
      'hidden'
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: 'Invalid feedback status.'
      });
    }

    const filter =
      status === 'all' ? {} : { status };

    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(feedback);
  }
);

// -------------------------------------------
// ADMIN ONLY: Approve / Hide / Re-review
// PATCH /api/feedback/admin/:id
// -------------------------------------------

router.patch(
  '/admin/:id',
  protect,
  adminOnly,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid feedback ID.'
      });
    }

    if (
      !['pending', 'approved', 'hidden'].includes(status)
    ) {
      return res.status(400).json({
        message: 'Invalid feedback status.'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true
      }
    );

    if (!feedback) {
      return res.status(404).json({
        message: 'Feedback not found.'
      });
    }

    res.json({
      message: 'Feedback status updated successfully.',
      feedback
    });
  }
);

// -------------------------------------------
// Public reviews - Approved only
// GET /api/feedback
// -------------------------------------------

router.get('/', async (req, res) => {
  const feedback = await Feedback.find({
    status: 'approved'
  })
    .select('name rating comment createdAt')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json(feedback);
});

export default router;
