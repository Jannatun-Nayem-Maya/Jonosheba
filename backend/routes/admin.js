
import { Router } from 'express';

import {
  User,
  Application,
  Shelter,
  BloodRequest,
  Donor,
  Volunteer,
  Scholarship,
  Alert,
  Hotline,
  Welfare,
  VolunteerEvent
} from '../models/index.js';

import {
  protect,
  adminOnly
} from '../middleware/auth.js';

const r = Router();

// Only authenticated administrators
r.use(protect, adminOnly);

// ==========================================
// GENERAL ADMIN STATISTICS
// ==========================================

r.get('/stats', async (req, res) => {
  const [
    users,
    pending,
    approved,
    rejected,
    shelters,
    openBlood,
    donors,
    volunteers
  ] = await Promise.all([
    User.countDocuments(),
    Application.countDocuments({ status: 'pending' }),
    Application.countDocuments({ status: 'approved' }),
    Application.countDocuments({ status: 'rejected' }),
    Shelter.countDocuments({ status: 'open' }),
    BloodRequest.countDocuments({ status: 'open' }),
    Donor.countDocuments(),
    Volunteer.countDocuments()
  ]);

  res.json({
    users,
    pending,
    approved,
    rejected,
    shelters,
    openBlood,
    donors,
    volunteers
  });
});

// ==========================================
// APPLICATION MANAGEMENT
// ==========================================

r.get('/applications', async (req, res) => {
  const q = {};

  if (
    ['pending', 'approved', 'rejected'].includes(
      req.query.status
    )
  ) {
    q.status = req.query.status;
  }

  res.json(
    await Application.find(q)
      .sort({ createdAt: -1 })
      .limit(200)
  );
});

r.patch('/applications/:id', async (req, res) => {
  const { status, note } = req.body || {};

  if (
    !['approved', 'rejected', 'pending'].includes(status)
  ) {
    return res.status(400).json({
      message: 'Invalid status'
    });
  }

  const doc = await Application.findByIdAndUpdate(
    req.params.id,
    { status, note },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({
      message: 'Application not found'
    });
  }

  res.json(doc);
});

// ==========================================
// CONTENT MANAGEMENT
// ==========================================

const CONTENT = {
  scholarships: Scholarship,
  alerts: Alert,
  shelters: Shelter,
  hotlines: Hotline,
  welfare: Welfare,
  events: VolunteerEvent
};

const READONLY = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'joined'
]);

const getModel = (req, res) => {
  const M = CONTENT[req.params.type];

  if (!M) {
    res.status(404).json({
      message: 'Unknown content type'
    });
  }

  return M;
};

const clean = (M, body) => {
  const out = {};

  for (const key of Object.keys(M.schema.paths)) {
    if (
      READONLY.has(key) ||
      !(key in body)
    ) {
      continue;
    }

    let value = body[key];

    if (value === '') {
      value =
        M.schema.paths[key].instance === 'String'
          ? ''
          : null;
    }

    out[key] = value;
  }

  return out;
};

// Get content
r.get('/content/:type', async (req, res) => {
  const M = getModel(req, res);

  if (!M) return;

  res.json(
    await M.find()
      .sort({ createdAt: -1 })
      .limit(300)
  );
});

// Add content
r.post('/content/:type', async (req, res) => {
  const M = getModel(req, res);

  if (!M) return;

  res.status(201).json(
    await M.create(clean(M, req.body))
  );
});

// Edit content
r.put('/content/:type/:id', async (req, res) => {
  const M = getModel(req, res);

  if (!M) return;

  const doc = await M.findByIdAndUpdate(
    req.params.id,
    clean(M, req.body),
    {
      new: true,
      runValidators: true
    }
  );

  if (!doc) {
    return res.status(404).json({
      message: 'Item not found'
    });
  }

  res.json(doc);
});

// Delete content
r.delete('/content/:type/:id', async (req, res) => {
  const M = getModel(req, res);

  if (!M) return;

  const doc = await M.findByIdAndDelete(
    req.params.id
  );

  if (!doc) {
    return res.status(404).json({
      message: 'Item not found'
    });
  }

  res.json({ ok: true });
});

// ==========================================
// BLOOD MANAGEMENT CONSTANTS
// ==========================================

const BLOOD_GROUPS = [
  'A+', 'A-',
  'B+', 'B-',
  'AB+', 'AB-',
  'O+', 'O-'
];

const BLOOD_STATUSES = [
  'open',
  'fulfilled',
  'cancelled'
];

const BLOOD_URGENCIES = [
  'Emergency',
  'Within 24 Hours',
  'Regular'
];

const isValidId = (id) =>
  /^[0-9a-fA-F]{24}$/.test(String(id));

const validText = (
  value,
  maxLength,
  required = true
) => (
  typeof value === 'string' &&
  value.trim().length <= maxLength &&
  (
    !required ||
    value.trim().length > 0
  )
);

// ==========================================
// DATE VALIDATION
// ==========================================

const parseDonationDate = (value) => {
  if (
    value === null ||
    value === ''
  ) {
    return {
      valid: true,
      date: null
    };
  }

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return { valid: false };
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  const todayBangladesh = new Date(
    Date.now() + 6 * 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value > todayBangladesh
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    date
  };
};

// ==========================================
// BLOOD DASHBOARD STATISTICS
// GET /api/admin/blood/stats
// ==========================================

r.get('/blood/stats', async (req, res) => {
  const [
    totalDonors,
    availableDonors,
    verifiedDonors,
    totalRequests,
    openRequests,
    fulfilledRequests,
    cancelledRequests
  ] = await Promise.all([
    Donor.countDocuments(),

    Donor.countDocuments({
      available: true
    }),

    Donor.countDocuments({
      verified: true
    }),

    BloodRequest.countDocuments(),

    BloodRequest.countDocuments({
      status: 'open'
    }),

    BloodRequest.countDocuments({
      status: 'fulfilled'
    }),

    BloodRequest.countDocuments({
      status: 'cancelled'
    })
  ]);

  res.json({
    totalDonors,
    availableDonors,

    unavailableDonors:
      totalDonors - availableDonors,

    verifiedDonors,

    unverifiedDonors:
      totalDonors - verifiedDonors,

    totalRequests,
    openRequests,
    fulfilledRequests,
    cancelledRequests
  });
});

// ==========================================
// VIEW ALL DONORS
// GET /api/admin/blood/donors
// ==========================================

r.get('/blood/donors', async (req, res) => {
  const donors = await Donor.find()
    .sort({ createdAt: -1 })
    .limit(300);

  res.json(donors);
});

// ==========================================
// EDIT DONOR INFORMATION
// PATCH /api/admin/blood/donors/:id
// ==========================================

r.patch('/blood/donors/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid donor ID'
    });
  }

  const donor = await Donor.findById(
    req.params.id
  );

  if (!donor) {
    return res.status(404).json({
      message: 'Donor not found'
    });
  }

  const body = req.body || {};
  const updates = {};

  const textFields = {
    name: 100,
    location: 120,
    phone: 25
  };

  for (
    const [key, maxLength]
    of Object.entries(textFields)
  ) {
    if (body[key] !== undefined) {
      if (!validText(body[key], maxLength)) {
        return res.status(400).json({
          message: `Invalid ${key}`
        });
      }

      updates[key] = body[key].trim();
    }
  }

  if (body.bloodGroup !== undefined) {
    if (!BLOOD_GROUPS.includes(body.bloodGroup)) {
      return res.status(400).json({
        message: 'Invalid blood group'
      });
    }

    updates.bloodGroup = body.bloodGroup;
  }

  if (body.available !== undefined) {
    if (typeof body.available !== 'boolean') {
      return res.status(400).json({
        message: 'Invalid availability'
      });
    }

    updates.available = body.available;
  }

  if (body.lastDonation !== undefined) {
    const parsed = parseDonationDate(
      body.lastDonation
    );

    if (!parsed.valid) {
      return res.status(400).json({
        message: 'Invalid donation date'
      });
    }

    updates.lastDonation = parsed.date;
  }

  // Any change to core profile/contact fields
  // invalidates the previous verification.

  const profileChanged = [
    'name',
    'bloodGroup',
    'location',
    'phone'
  ].some((key) =>
    Object.prototype.hasOwnProperty.call(
      updates,
      key
    ) &&
    updates[key] !== donor[key]
  );

  Object.assign(donor, updates);

  if (profileChanged) {
    donor.verified = false;
    donor.verifiedAt = null;
    donor.verifiedBy = null;
  }

  await donor.save();

  res.json({
    message: 'Donor updated successfully',
    donor
  });
});

// ==========================================
// VERIFY / UNVERIFY DONOR
// PATCH /api/admin/blood/donors/:id/verify
// ==========================================

r.patch(
  '/blood/donors/:id/verify',
  async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donor ID'
      });
    }

    const { verified } = req.body || {};

    if (typeof verified !== 'boolean') {
      return res.status(400).json({
        message: 'Invalid verification status'
      });
    }

    const donor = await Donor.findById(
      req.params.id
    );

    if (!donor) {
      return res.status(404).json({
        message: 'Donor not found'
      });
    }

    donor.verified = verified;

    donor.verifiedAt = verified
      ? new Date()
      : null;

    // Only an Admin can access this route.
    // Save Admin ID, but frontend displays "Admin".

    donor.verifiedBy = verified
      ? req.user._id
      : null;

    await donor.save();

    res.json({
      message: verified
        ? 'Donor verified successfully'
        : 'Donor verification removed',
      donor
    });
  }
);

// ==========================================
// DELETE DONOR
// DELETE /api/admin/blood/donors/:id
// ==========================================

r.delete('/blood/donors/:id', async (req, res) => {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid donor ID'
    });
  }

  const donor = await Donor.findByIdAndDelete(
    req.params.id
  );

  if (!donor) {
    return res.status(404).json({
      message: 'Donor not found'
    });
  }

  res.json({
    ok: true,
    message: 'Donor removed successfully'
  });
});

// ==========================================
// VIEW ALL BLOOD REQUESTS
// GET /api/admin/blood/requests
// ==========================================

r.get('/blood/requests', async (req, res) => {
  const requests = await BloodRequest.find()
    .sort({ createdAt: -1 })
    .limit(300);

  res.json(requests);
});

// ==========================================
// EDIT BLOOD REQUEST / CHANGE STATUS
// PATCH /api/admin/blood/requests/:id
//
// IMPORTANT RULES:
// Open -> Open / Fulfilled / Cancelled
// Fulfilled -> LOCKED
// Cancelled -> LOCKED
//
// Locked requests cannot be edited or reopened.
// ==========================================

r.patch(
  '/blood/requests/:id',
  async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid request ID'
      });
    }

    const request = await BloodRequest.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: 'Blood request not found'
      });
    }

    // --------------------------------------
    // STATUS LOCK
    // --------------------------------------

    if (
      request.status === 'fulfilled' ||
      request.status === 'cancelled'
    ) {
      return res.status(409).json({
        message:
          'This blood request is already finalized. Fulfilled or cancelled requests cannot be edited or reopened.'
      });
    }

    // Only Open requests can reach this point.
    if (request.status !== 'open') {
      return res.status(409).json({
        message:
          'Only open blood requests can be modified.'
      });
    }

    // --------------------------------------
    // VALIDATE REQUEST FIELDS
    // --------------------------------------

    const body = req.body || {};
    const updates = {};

    const textFields = {
      patientName: 120,
      hospital: 180,
      contactNumber: 25,
      location: 120,
      details: 1000
    };

    for (
      const [key, maxLength]
      of Object.entries(textFields)
    ) {
      if (body[key] !== undefined) {
        const required = key !== 'details';

        if (
          !validText(
            body[key],
            maxLength,
            required
          )
        ) {
          return res.status(400).json({
            message: `Invalid ${key}`
          });
        }

        updates[key] = body[key].trim();
      }
    }

    // Blood group validation
    if (body.bloodGroup !== undefined) {
      if (
        !BLOOD_GROUPS.includes(
          body.bloodGroup
        )
      ) {
        return res.status(400).json({
          message: 'Invalid blood group'
        });
      }

      updates.bloodGroup = body.bloodGroup;
    }

    // Urgency validation
    if (body.urgency !== undefined) {
      if (
        !BLOOD_URGENCIES.includes(
          body.urgency
        )
      ) {
        return res.status(400).json({
          message: 'Invalid urgency'
        });
      }

      updates.urgency = body.urgency;
    }

    // Status validation
    if (body.status !== undefined) {
      if (
        !BLOOD_STATUSES.includes(
          body.status
        )
      ) {
        return res.status(400).json({
          message: 'Invalid request status'
        });
      }

      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields provided.'
      });
    }

    // --------------------------------------
    // ATOMIC STATUS PROTECTION
    // --------------------------------------
    // Update only if the request is STILL open.
    //
    // This prevents a stale Admin edit from
    // reopening a request that a Citizen has
    // already cancelled or fulfilled.
    //
    // Even if another action changes the status
    // between reading and writing, the update
    // will not overwrite that final status.

    const updatedRequest =
      await BloodRequest.findOneAndUpdate(
        {
          _id: req.params.id,
          status: 'open'
        },
        {
          $set: updates
        },
        {
          new: true,
          runValidators: true
        }
      );

    // If no document matched, status may have
    // changed during the request.

    if (!updatedRequest) {
      const stillExists =
        await BloodRequest.exists({
          _id: req.params.id
        });

      if (!stillExists) {
        return res.status(404).json({
          message: 'Blood request not found'
        });
      }

      return res.status(409).json({
        message:
          'This request has already been finalized or changed. Refresh the list to see its latest status.'
      });
    }

    res.json({
      message:
        'Blood request updated successfully',
      request: updatedRequest
    });
  }
);

// ==========================================
// DELETE BLOOD REQUEST
// DELETE /api/admin/blood/requests/:id
//
// Deletion remains Admin-only.
// Both open and finalized requests can be
// deleted after Admin confirmation in UI.
// ==========================================

r.delete(
  '/blood/requests/:id',
  async (req, res) => {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid request ID'
      });
    }

    const request =
      await BloodRequest.findByIdAndDelete(
        req.params.id
      );

    if (!request) {
      return res.status(404).json({
        message: 'Blood request not found'
      });
    }

    res.json({
      ok: true,
      message: 'Blood request removed'
    });
  }
);

// ==========================================
// USER MANAGEMENT
// ==========================================

// View/search users
r.get('/users', async (req, res) => {
  const q = {};

  if (req.query.q) {
    const rx = new RegExp(
      String(req.query.q).replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      ),
      'i'
    );

    q.$or = [
      { name: rx },
      { email: rx },
      { phone: rx }
    ];
  }

  res.json(
    await User.find(q)
      .select('-password -savedScholarships')
      .sort({ createdAt: -1 })
      .limit(300)
  );
});

// Update user role/block status
r.patch('/users/:id', async (req, res) => {
  if (
    String(req.params.id) ===
    String(req.user._id)
  ) {
    return res.status(400).json({
      message:
        'You cannot change your own role or block yourself'
    });
  }

  const update = {};

  if (
    typeof req.body.blocked === 'boolean'
  ) {
    update.blocked = req.body.blocked;
  }

  if (
    [
      'user',
      'student',
      'volunteer',
      'admin'
    ].includes(req.body.role)
  ) {
    update.role = req.body.role;
  }

  const doc = await User.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true }
  ).select(
    '-password -savedScholarships'
  );

  if (!doc) {
    return res.status(404).json({
      message: 'User not found'
    });
  }

  res.json(doc);
});

// Delete user
r.delete('/users/:id', async (req, res) => {
  if (
    String(req.params.id) ===
    String(req.user._id)
  ) {
    return res.status(400).json({
      message: 'You cannot delete yourself'
    });
  }

  await User.findByIdAndDelete(
    req.params.id
  );

  res.json({ ok: true });
});

// ==========================================
// EXPORT ADMIN ROUTES
// ==========================================

export default r;
