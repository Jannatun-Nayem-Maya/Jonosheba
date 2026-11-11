
import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

// ==========================================
// BILINGUAL TEXT SCHEMA
// ==========================================

const bilingualTextSchema = new Schema(
  {
    bn: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    },
    en: {
      type: String,
      default: '',
      trim: true,
      maxlength: 5000
    }
  },
  { _id: false }
);

// ==========================================
// HELP CENTER CATEGORIES
// ==========================================

export const HELP_CATEGORIES = [
  'general',
  'jonoseba',
  'health',
  'blood',
  'scholarship',
  'relief',
  'volunteer',
  'welfare',
  'disaster',
  'complaint',
  'government',
  'bangladesh',
  'emergency'
];

// ==========================================
// HELP ARTICLE / DYNAMIC FAQ MODEL
// ==========================================

const helpArticleSchema = new Schema(
  {
    // Question in Bangla and English
    question: {
      type: bilingualTextSchema,
      required: true
    },

    // Answer in Bangla and English
    answer: {
      type: bilingualTextSchema,
      required: true
    },

    // Category
    category: {
      type: String,
      enum: HELP_CATEGORIES,
      default: 'general',
      index: true
    },

    // Search keywords for both languages
    keywordsBn: {
      type: [String],
      default: []
    },

    keywordsEn: {
      type: [String],
      default: []
    },

    // Alternative question phrases
    alternativeQuestionsBn: {
      type: [String],
      default: []
    },

    alternativeQuestionsEn: {
      type: [String],
      default: []
    },

    // Information classification
    sourceType: {
      type: String,
      enum: [
        'jonoseba',
        'official',
        'verified_knowledge'
      ],
      default: 'jonoseba'
    },

    // Official website source
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
      validate: {
        validator(value) {
          if (!value) return true;

          try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(
              url.protocol
            );
          } catch {
            return false;
          }
        },
        message: 'A valid HTTP or HTTPS URL is required.'
      }
    },

    // Internal Jonoseba page link
    serviceRoute: {
      type: String,
      trim: true,
      default: '',
      maxlength: 250,
      validate: {
        validator(value) {
          if (!value) return true;

          // Allow local application routes only.
          // Disallow protocol-relative URLs.
          return (
            value.startsWith('/') &&
            !value.startsWith('//') &&
            !value.includes('\\')
          );
        },
        message: 'Service route must be an internal path.'
      }
    },

    // When the information was verified
    verifiedAt: {
      type: Date,
      default: null
    },

    // Admin publishing status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true
    },

    // Frequently asked / highlighted
    featured: {
      type: Boolean,
      default: false
    },

    // Ordering in Help Center
    sortOrder: {
      type: Number,
      default: 0
    },

    // Admin ownership
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Number of times this answer was selected
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ==========================================
// DATA VALIDATION
// ==========================================

helpArticleSchema.pre('validate', function (next) {
  const questionBn = this.question?.bn?.trim();
  const questionEn = this.question?.en?.trim();

  const answerBn = this.answer?.bn?.trim();
  const answerEn = this.answer?.en?.trim();

  // Every published answer must support
  // both Bangla and English.

  if (this.status === 'published') {
    if (!questionBn || !questionEn) {
      this.invalidate(
        'question',
        'Published questions require Bangla and English.'
      );
    }

    if (!answerBn || !answerEn) {
      this.invalidate(
        'answer',
        'Published answers require Bangla and English.'
      );
    }

    // Official guidance must have a source URL.
    if (
      this.sourceType === 'official' &&
      !this.sourceUrl
    ) {
      this.invalidate(
        'sourceUrl',
        'Published official guidance requires a source URL.'
      );
    }
  }

  next();
});

// ==========================================
// DATABASE INDEXES
// ==========================================

helpArticleSchema.index({
  status: 1,
  category: 1,
  sortOrder: 1
});

helpArticleSchema.index({
  status: 1,
  featured: -1,
  updatedAt: -1
});

// ==========================================
// HELP ARTICLE MODEL
// ==========================================

export const HelpArticle =
  models.HelpArticle ||
  model('HelpArticle', helpArticleSchema);

// ==========================================
// UNANSWERED QUESTION MODEL
// ==========================================

const unansweredQuestionSchema = new Schema(
  {
    // User question that needs admin review
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 500
    },

    language: {
      type: String,
      enum: ['bn', 'en'],
      default: 'bn'
    },

    category: {
      type: String,
      enum: HELP_CATEGORIES,
      default: 'general'
    },

    // How many times this question was asked
    count: {
      type: Number,
      default: 1,
      min: 1
    },

    // Review status
    status: {
      type: String,
      enum: [
        'pending',
        'reviewed',
        'resolved',
        'dismissed'
      ],
      default: 'pending',
      index: true
    },

    // Optional matching knowledge article
    resolvedArticle: {
      type: Schema.Types.ObjectId,
      ref: 'HelpArticle',
      default: null
    },

    // Admin notes
    adminNote: {
      type: String,
      default: '',
      maxlength: 1000
    },

    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ==========================================
// UNANSWERED QUESTION INDEXES
// ==========================================

unansweredQuestionSchema.index({
  status: 1,
  count: -1,
  createdAt: -1
});

// ==========================================
// UNANSWERED QUESTION MODEL
// ==========================================

export const UnansweredQuestion =
  models.UnansweredQuestion ||
  model(
    'UnansweredQuestion',
    unansweredQuestionSchema
  );
