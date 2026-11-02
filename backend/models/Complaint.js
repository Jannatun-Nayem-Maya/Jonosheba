
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const historySchema = new Schema({
  status: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const complaintSchema = new Schema({
  trackingId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  category: {
    type: String,
    enum: [
      'road',
      'water',
      'electricity',
      'waste',
      'drainage',
      'street_light',
      'other'
    ],
    required: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 120
  },

  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 15,
    maxlength: 2000
  },

  district: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 250
  },

  photo: {
    data: {
      type: Buffer,
      select: false
    },
    mimeType: String
  },

  status: {
    type: String,
    enum: [
      'pending',
      'in_progress',
      'resolved',
      'rejected',
      'reopened'
    ],
    default: 'pending',
    index: true
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  department: {
    type: String,
    enum: [
      'unassigned',
      'roads',
      'water',
      'electricity',
      'sanitation',
      'general'
    ],
    default: 'unassigned'
  },

  adminResponse: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: ''
  },

  history: {
    type: [historySchema],
    default: []
  },

  resolvedAt: Date
}, { timestamps: true });

complaintSchema.index({
  createdAt: -1
});

export default model('Complaint', complaintSchema);
