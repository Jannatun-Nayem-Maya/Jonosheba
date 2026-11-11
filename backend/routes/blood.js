
import { Router } from 'express';
import mongoose from 'mongoose';

import {
  BloodRequest,
  Donor,
  DonationRecord
} from '../models/index.js';

import {
  protect,
  optionalAuth
} from '../middleware/auth.js';

const r = Router();

// ==========================================
// CONSTANTS
// ==========================================

const GROUPS = [
  'A+', 'A-', 'B+', 'B-',
  'AB+', 'AB-', 'O+', 'O-'
];

const URGENCY_OPTIONS = [
  'Emergency',
  'Within 24 Hours',
  'Regular'
];

// Escape regex special characters
const safeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ==========================================
// DATE VALIDATION
// ==========================================

const validDate = (value) => {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  // Bangladesh timezone: UTC+6
  const todayDhaka = new Date(
    Date.now() + 6 * 3600000
  ).toISOString().slice(0, 10);

  return value <= todayDhaka
    ? date
    : null;
};

// Request owner or Admin
const isOwnerOrAdmin = (req, doc) =>
  req.user.role === 'admin' ||
  String(doc.createdBy) === String(req.user._id);

// ==========================================
// PUBLIC BLOOD REQUESTS
// GET /api/blood/requests
// ==========================================

r.get('/requests', async (req, res) => {
  const query = {
    status: {
      $in: ['open', 'fulfilled']
    }
  };

  if (GROUPS.includes(req.query.group)) {
    query.bloodGroup = req.query.group;
  }

  if (
    ['open', 'fulfilled'].includes(
      req.query.status
    )
  ) {
    query.status = req.query.status;
  }

  const requests = await BloodRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(requests);
});

// ==========================================
// MY BLOOD REQUESTS
// GET /api/blood/requests/mine
// ==========================================

r.get(
  '/requests/mine',
  protect,
  async (req, res) => {
    const requests = await BloodRequest.find({
      createdBy: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(requests);
  }
);

// ==========================================
// SUBMIT BLOOD REQUEST
// POST /api/blood/requests
// ==========================================

r.post(
  '/requests',
  protect,
  async (req, res) => {
    // Admin cannot submit citizen requests
    if (req.user.role === 'admin') {
      return res.status(403).json({
        message:
          'Admin cannot submit blood requests.'
      });
    }

    const {
      patientName,
      bloodGroup,
      hospital,
      contactNumber,
      location,
      urgency,
      details
    } = req.body || {};

    const requiredFields = [
      patientName,
      hospital,
      contactNumber,
      location
    ];

    if (
      !requiredFields.every(
        (value) =>
          typeof value === 'string' &&
          value.trim()
      ) ||
      !GROUPS.includes(bloodGroup)
    ) {
      return res.status(400).json({
        message:
          'Complete all required request fields.'
      });
    }

    if (
      patientName.length > 120 ||
      hospital.length > 180 ||
      contactNumber.length > 25 ||
      location.length > 120 ||
      String(details || '').length > 1000
    ) {
      return res.status(400).json({
        message:
          'One or more request fields are too long.'
      });
    }

    if (
      urgency &&
      !URGENCY_OPTIONS.includes(urgency)
    ) {
      return res.status(400).json({
        message: 'Invalid urgency.'
      });
    }

    const request = await BloodRequest.create({
      patientName: patientName.trim(),
      bloodGroup,
      hospital: hospital.trim(),
      contactNumber: contactNumber.trim(),
      location: location.trim(),
      urgency: urgency || 'Emergency',
      details: String(details || '').trim(),
      createdBy: req.user._id
    });

    res.status(201).json(request);
  }
);

// ==========================================
// MARK BLOOD REQUEST FULFILLED
// PATCH /api/blood/requests/:id/fulfill
// ==========================================

r.patch(
  '/requests/:id/fulfill',
  protect,
  async (req, res) => {
    if (
      !mongoose.isValidObjectId(req.params.id)
    ) {
      return res.status(400).json({
        message: 'Invalid request ID.'
      });
    }

    const request = await BloodRequest.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: 'Request not found.'
      });
    }

    if (!isOwnerOrAdmin(req, request)) {
      return res.status(403).json({
        message: 'Not allowed.'
      });
    }

    if (request.status !== 'open') {
      return res.status(400).json({
        message:
          'Only open requests can be fulfilled.'
      });
    }

    request.status = 'fulfilled';

    await request.save();

    res.json(request);
  }
);

// ==========================================
// CANCEL BLOOD REQUEST
// PATCH /api/blood/requests/:id/cancel
// ==========================================

r.patch(
  '/requests/:id/cancel',
  protect,
  async (req, res) => {
    if (
      !mongoose.isValidObjectId(req.params.id)
    ) {
      return res.status(400).json({
        message: 'Invalid request ID.'
      });
    }

    const request = await BloodRequest.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: 'Request not found.'
      });
    }

    if (!isOwnerOrAdmin(req, request)) {
      return res.status(403).json({
        message: 'Not allowed.'
      });
    }

    if (request.status !== 'open') {
      return res.status(400).json({
        message:
          'Only open requests can be cancelled.'
      });
    }

    request.status = 'cancelled';

    await request.save();

    res.json(request);
  }
);

// ==========================================
// PUBLIC DONOR SEARCH
// GET /api/blood/donors
// ==========================================

r.get(
  '/donors',
  optionalAuth,
  async (req, res) => {
    // Only available donors appear publicly
    const query = {
      available: true
    };

    if (GROUPS.includes(req.query.group)) {
      query.bloodGroup = req.query.group;
    }

    if (
      typeof req.query.location === 'string' &&
      req.query.location.trim()
    ) {
      query.location = new RegExp(
        safeRegex(
          req.query.location
            .trim()
            .slice(0, 80)
        ),
        'i'
      );
    }

    const donors = await Donor.find(query)
      .select('-user -verifiedBy')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Guests cannot see donor phone numbers
    res.json(
      donors.map((donor) =>
        req.user
          ? donor
          : {
              ...donor,
              phone: null
            }
      )
    );
  }
);

// ==========================================
// MY DONOR PROFILE
// GET /api/blood/donors/mine
// ==========================================

r.get(
  '/donors/mine',
  protect,
  async (req, res) => {
    const donor = await Donor.findOne({
      user: req.user._id
    });

    res.json(donor);
  }
);

// ==========================================
// DONOR REGISTRATION / PROFILE UPDATE
// POST /api/blood/donors
// ==========================================

r.post(
  '/donors',
  protect,
  async (req, res) => {
    // Admin cannot register as a donor
    if (req.user.role === 'admin') {
      return res.status(403).json({
        message:
          'Admin cannot register as a donor.'
      });
    }

    const {
      name,
      bloodGroup,
      location,
      phone,
      lastDonation,
      available
    } = req.body || {};

    // --------------------------------------
    // VALIDATE REQUIRED FIELDS
    // --------------------------------------

    if (
      ![name, location, phone].every(
        (value) =>
          typeof value === 'string' &&
          value.trim()
      ) ||
      !GROUPS.includes(bloodGroup)
    ) {
      return res.status(400).json({
        message:
          'Complete all required donor fields.'
      });
    }

    if (
      name.length > 100 ||
      location.length > 120 ||
      phone.length > 25
    ) {
      return res.status(400).json({
        message: 'Donor details are too long.'
      });
    }

    // --------------------------------------
    // VALIDATE LAST DONATION DATE
    // --------------------------------------

    let date = null;

    if (lastDonation) {
      date = validDate(lastDonation);

      if (!date) {
        return res.status(400).json({
          message:
            'Invalid last donation date.'
        });
      }
    }

    // --------------------------------------
    // GET LATEST DONATION HISTORY
    // --------------------------------------

    const latestHistory =
      await DonationRecord.findOne({
        user: req.user._id
      }).sort({ donatedAt: -1 });

    // Use the most recent known donation date
    const effectiveDate =
      latestHistory &&
      (
        !date ||
        latestHistory.donatedAt > date
      )
        ? latestHistory.donatedAt
        : date;

    // --------------------------------------
    // NEW: CHECK PREVIOUS DONOR PROFILE
    // --------------------------------------

    const previousDonor = await Donor.findOne({
      user: req.user._id
    });

    const cleanName = name.trim();
    const cleanLocation = location.trim();
    const cleanPhone = phone.trim();

    // A new donor always starts unverified.
    // Existing verification is invalidated if
    // name, group, location or phone changes.

    const profileChanged =
      previousDonor !== null &&
      (
        previousDonor.name !== cleanName ||
        previousDonor.bloodGroup !== bloodGroup ||
        previousDonor.location !== cleanLocation ||
        previousDonor.phone !== cleanPhone
      );

    // --------------------------------------
    // SAVE PROFILE
    // --------------------------------------

    const updateFields = {
      name: cleanName,
      bloodGroup,
      location: cleanLocation,
      phone: cleanPhone,
      lastDonation: effectiveDate,
      available: available !== false
    };

    // Important:
    // Reset verification ONLY when actual
    // identity/contact profile details change.

    if (profileChanged) {
      updateFields.verified = false;
      updateFields.verifiedAt = null;
      updateFields.verifiedBy = null;
    }

    // New registrations are unverified.
    if (!previousDonor) {
      updateFields.verified = false;
      updateFields.verifiedAt = null;
      updateFields.verifiedBy = null;
    }

    // Existing verification remains unchanged
    // if only availability or lastDonation changes.

    const donor = await Donor.findOneAndUpdate(
      {
        user: req.user._id
      },
      {
        $set: updateFields
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );

    res.status(201).json(donor);
  }
);

// ==========================================
// MY DONATION HISTORY
// GET /api/blood/donors/mine/history
// ==========================================

r.get(
  '/donors/mine/history',
  protect,
  async (req, res) => {
    const records = await DonationRecord.find({
      user: req.user._id
    })
      .sort({ donatedAt: -1 })
      .limit(50)
      .lean();

    res.json(records);
  }
);

// ==========================================
// ADD DONATION HISTORY RECORD
// POST /api/blood/donors/mine/history
// ==========================================

r.post(
  '/donors/mine/history',
  protect,
  async (req, res) => {
    // Admin cannot add donation history
    if (req.user.role === 'admin') {
      return res.status(403).json({
        message:
          'Admin cannot add donation history.'
      });
    }

    // User must have a donor profile
    const donor = await Donor.findOne({
      user: req.user._id
    });

    if (!donor) {
      return res.status(404).json({
        message:
          'Register as a donor first.'
      });
    }

    const {
      date,
      place,
      note
    } = req.body || {};

    // --------------------------------------
    // VALIDATE DATE
    // --------------------------------------

    const donatedAt = validDate(date);

    if (!donatedAt) {
      return res.status(400).json({
        message:
          'Choose a valid past donation date.'
      });
    }

    // --------------------------------------
    // VALIDATE LOCATION AND NOTE
    // --------------------------------------

    if (
      typeof place !== 'string' ||
      !place.trim() ||
      place.trim().length > 150 ||
      (
        note != null &&
        typeof note !== 'string'
      ) ||
      String(note || '').length > 300
    ) {
      return res.status(400).json({
        message:
          'Provide a location (max 150 chars) and optional note (max 300 chars).'
      });
    }

    // --------------------------------------
    // LIMIT HISTORY TO 50 RECORDS
    // --------------------------------------

    const recordCount =
      await DonationRecord.countDocuments({
        user: req.user._id
      });

    if (recordCount >= 50) {
      return res.status(400).json({
        message:
          'Maximum 50 records allowed.'
      });
    }

    // --------------------------------------
    // PREVENT DUPLICATE DATE
    // APPLICATION-LEVEL CHECK
    // NO UNIQUE INDEX REQUIRED
    // --------------------------------------

    const existingRecord =
      await DonationRecord.exists({
        user: req.user._id,
        donatedAt
      });

    if (existingRecord) {
      return res.status(409).json({
        message:
          'A donation on this date already exists.'
      });
    }

    // --------------------------------------
    // CREATE DONATION HISTORY
    // --------------------------------------

    const record = await DonationRecord.create({
      user: req.user._id,
      donatedAt,
      place: place.trim(),
      note: String(note || '').trim()
    });

    // --------------------------------------
    // UPDATE DONOR LAST DONATION DATE
    // --------------------------------------

    if (
      !donor.lastDonation ||
      donatedAt > donor.lastDonation
    ) {
      donor.lastDonation = donatedAt;

      // Changing last donation date does not
      // affect admin profile verification.

      await donor.save();
    }

    res.status(201).json(record);
  }
);

// ==========================================
// EXPORT BLOOD ROUTES
// ==========================================

export default r;
