
import mongoose from 'mongoose';

const categories = [
  'land',
  'transport',
  'rail',
  'police',
  'fees',
  'grs',
  'utility',
  'jobs'
];

function isOfficialUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== 'https:') {
      return false;
    }

    const host = url.hostname.toLowerCase();

    return (
      host === 'gov.bd' ||
      host.endsWith('.gov.bd')
    );
  } catch {
    return false;
  }
}

const govServiceSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/
    },

    category: {
      type: String,
      required: true,
      enum: categories
    },

    titleBn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },

    titleEn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },

    summaryBn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    summaryEn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    officialUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: isOfficialUrl,
        message:
          'Please provide an official HTTPS Bangladesh government URL.'
      }
    },

    stepsBn: {
      type: [String],
      default: []
    },

    stepsEn: {
      type: [String],
      default: []
    },

    documentsBn: {
      type: [String],
      default: []
    },

    documentsEn: {
      type: [String],
      default: []
    },

    published: {
      type: Boolean,
      default: false
    },

    sourceVerifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

govServiceSchema.index({
  category: 1,
  published: 1
});

export default mongoose.model(
  'GovService',
  govServiceSchema
);
