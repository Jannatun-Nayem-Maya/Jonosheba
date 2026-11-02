
import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import Complaint from '../models/Complaint.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

const STATUSES = [
  'pending',
  'in_progress',
  'resolved',
  'rejected',
  'reopened'
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const DEPARTMENTS = [
  'unassigned',
  'roads',
  'water',
  'electricity',
  'sanitation',
  'general'
];

const CATEGORIES = [
  'road',
  'water',
  'electricity',
  'waste',
  'drainage',
  'street_light',
  'other'
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (
      ['image/jpeg', 'image/png', 'image/webp']
        .includes(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WebP images allowed'));
    }
  }
});

function checkImage(file) {
  if (!file) return true;

  const b = file.buffer;
  if (!b || b.length < 12) return false;

  if (file.mimetype === 'image/jpeg') {
    return b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[2] === 0xff;
  }

  if (file.mimetype === 'image/png') {
    return b.subarray(0, 8)
      .equals(Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10
      ]));
  }

  if (file.mimetype === 'image/webp') {
    return b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP';
  }

  return false;
}

function safeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isOwnerOrAdmin(req, complaint) {
  return req.user.role === 'admin' ||
    String(complaint.user) === String(req.user._id);
}

function errorResponse(res, error) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2 MB or smaller.'
        : error.message
    });
  }

  return res.status(400).json({
    message: error.message || 'Invalid request'
  });
}

router.use(protect);

// Citizen: submit complaint
router.post('/', (req, res, next) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({
      message: 'Admin cannot submit citizen complaints.'
    });
  }

  upload.single('photo')(req, res, async error => {
    if (error) return errorResponse(res, error);

    try {
      const category = safeText(req.body.category);
      const title = safeText(req.body.title);
      const description = safeText(req.body.description);
      const district = safeText(req.body.district);
      const address = safeText(req.body.address);

      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: 'Choose a valid category.'
        });
      }

      if (title.length < 5 || title.length > 120) {
        return res.status(400).json({
          message: 'Title must be 5–120 characters.'
        });
      }

      if (
        description.length < 15 ||
        description.length > 2000
      ) {
        return res.status(400).json({
          message: 'Description must be 15–2000 characters.'
        });
      }

      if (
        !district ||
        district.length > 100 ||
        !address ||
        address.length > 250
      ) {
        return res.status(400).json({
          message: 'Valid district and address are required.'
        });
      }

      if (!checkImage(req.file)) {
        return res.status(400).json({
          message: 'Invalid image file.'
        });
      }

      const trackingId =
        'CMP-' +
        new Date().getFullYear() +
        '-' +
        randomUUID().replace(/-/g, '')
          .slice(0, 12).toUpperCase();

      const complaint = await Complaint.create({
        trackingId,
        user: req.user._id,
        category,
        title,
        description,
        district,
        address,
        photo: req.file
          ? {
              data: req.file.buffer,
              mimeType: req.file.mimetype
            }
          : undefined,
        history: [{
          status: 'pending',
          message: 'Complaint submitted',
          by: req.user._id
        }]
      });

      return res.status(201).json({
        message: 'Complaint submitted successfully.',
        complaint: {
          id: complaint.id,
          trackingId: complaint.trackingId,
          status: complaint.status
        }
      });
    } catch (err) {
      next(err);
    }
  });
});

// Citizen: own complaints
router.get('/mine', async (req, res) => {
  const complaints = await Complaint.find({
    user: req.user._id
  })
    .select('-photo.data')
    .sort({ createdAt: -1 })
    .limit(200);

  res.json(complaints);
});

// Admin: complaint statistics
router.get('/admin/stats', adminOnly, async (req, res) => {
  const total = await Complaint.countDocuments();

  const summary = await Complaint.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const counts = Object.fromEntries(
    STATUSES.map(s => [s, 0])
  );

  summary.forEach(item => {
    counts[item._id] = item.count;
  });

  res.json({ total, counts });
});

// Admin: all complaints
router.get('/admin', adminOnly, async (req, res) => {
  const query = {};

  if (STATUSES.includes(req.query.status)) {
    query.status = req.query.status;
  }

  if (CATEGORIES.includes(req.query.category)) {
    query.category = req.query.category;
  }

  const q = safeText(req.query.q).slice(0, 100);

  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    query.$or = [
      { trackingId: regex },
      { title: regex },
      { district: regex }
    ];
  }

  const complaints = await Complaint.find(query)
    .select('-photo.data')
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(300);

  res.json(complaints);
});

// Owner or Admin: full complaint details
router.get('/:id', async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .select('-photo.data')
    .populate('user', 'name email phone');

  if (!complaint) {
    return res.status(404).json({
      message: 'Complaint not found.'
    });
  }

  const ownerId = complaint.user?._id || complaint.user;

  if (
    req.user.role !== 'admin' &&
    String(ownerId) !== String(req.user._id)
  ) {
    return res.status(403).json({
      message: 'Access denied.'
    });
  }

  res.json(complaint);
});

// Protected image access
router.get('/:id/photo', async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .select('+photo.data');

  if (!complaint) {
    return res.status(404).json({
      message: 'Complaint not found.'
    });
  }

  if (!isOwnerOrAdmin(req, complaint)) {
    return res.status(403).json({
      message: 'Access denied.'
    });
  }

  if (!complaint.photo?.data) {
    return res.status(404).json({
      message: 'No photo attached.'
    });
  }

  res.setHeader('Content-Type', complaint.photo.mimeType);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(complaint.photo.data);
});

// Admin: update complaint
router.patch('/:id/admin', adminOnly, async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      message: 'Complaint not found.'
    });
  }

  const {
    status,
    priority,
    department,
    adminResponse
  } = req.body;

  if (
    !STATUSES.includes(status) ||
    !PRIORITIES.includes(priority) ||
    !DEPARTMENTS.includes(department)
  ) {
    return res.status(400).json({
      message: 'Invalid status, priority or department.'
    });
  }

  const response = safeText(adminResponse);

  if (response.length > 2000) {
    return res.status(400).json({
      message: 'Response cannot exceed 2000 characters.'
    });
  }

  if (
    ['resolved', 'rejected'].includes(status) &&
    response.length < 10
  ) {
    return res.status(400).json({
      message: 'Resolution/rejection requires a response.'
    });
  }

  const oldStatus = complaint.status;
  const changed = oldStatus !== status ||
    complaint.priority !== priority ||
    complaint.department !== department ||
    complaint.adminResponse !== response;

  complaint.status = status;
  complaint.priority = priority;
  complaint.department = department;
  complaint.adminResponse = response;

  complaint.resolvedAt = status === 'resolved'
    ? (complaint.resolvedAt || new Date())
    : undefined;

  if (changed) {
    complaint.history.push({
      status,
      message: response ||
        `Priority: ${priority}; Department: ${department}`,
      by: req.user._id
    });
  }

  await complaint.save();

  res.json({
    message: 'Complaint updated.',
    complaint: await Complaint.findById(complaint.id)
      .select('-photo.data')
  });
});

// Citizen: request reopening
router.post('/:id/reopen', async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      message: 'Complaint not found.'
    });
  }

  if (
    String(complaint.user) !== String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(403).json({
      message: 'Access denied.'
    });
  }

  if (complaint.status !== 'resolved') {
    return res.status(400).json({
      message: 'Only resolved complaints can be reopened.'
    });
  }

  const reason = safeText(req.body.reason);

  if (reason.length < 10 || reason.length > 500) {
    return res.status(400).json({
      message: 'Reason must be 10–500 characters.'
    });
  }

  complaint.status = 'reopened';
  complaint.resolvedAt = undefined;
  complaint.history.push({
    status: 'reopened',
    message: reason,
    by: req.user._id
  });

  await complaint.save();

  res.json({
    message: 'Reopen request submitted.',
    complaint
  });
});

export default router;
