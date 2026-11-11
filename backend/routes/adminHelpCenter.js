
import { Router } from 'express';
import mongoose from 'mongoose';

import {
  HelpArticle,
  UnansweredQuestion,
  HELP_CATEGORIES
} from '../models/HelpCenter.js';

import {
  protect,
  adminOnly
} from '../middleware/auth.js';

// ==========================================
// JONOSEBA ADMIN HELP CENTER API
// ==========================================

const router = Router();

// Only authenticated admins can access
// any endpoint in this router.

router.use(protect, adminOnly);

// ==========================================
// CONSTANTS
// ==========================================

const ARTICLE_STATUSES = [
  'draft',
  'published',
  'archived'
];

const SOURCE_TYPES = [
  'jonoseba',
  'official',
  'verified_knowledge'
];

const QUESTION_STATUSES = [
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
];

const MAX_PAGE_SIZE = 50;

// ==========================================
// GENERAL HELPERS
// ==========================================

const isValidId = (value) =>
  mongoose.isValidObjectId(value);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value);

const cleanString = (value, maxLength = 1000) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const cleanStringArray = (
  value,
  maxItems = 30,
  maxLength = 100
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((item) => typeof item === 'string')
        .map((item) =>
          cleanString(item, maxLength)
        )
        .filter(Boolean)
    )
  ].slice(0, maxItems);
};

const cleanBilingual = (value, maxLength = 5000) => {
  if (!isPlainObject(value)) {
    return {
      bn: '',
      en: ''
    };
  }

  return {
    bn: cleanString(value.bn, maxLength),
    en: cleanString(value.en, maxLength)
  };
};

const validHttpUrl = (value) => {
  if (!value) return true;

  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:'
    );
  } catch {
    return false;
  }
};

const validInternalRoute = (value) => {
  if (!value) return true;

  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.includes('\n') &&
    !value.includes('\r') &&
    !value.includes('?redirect=//')
  );
};

const safeNumber = (
  value,
  defaultValue = 0,
  minimum = 0,
  maximum = 100000
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return defaultValue;
  }

  return Math.min(
    Math.max(number, minimum),
    maximum
  );
};

const escapeRegex = (value) =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );

const errorResponse = (
  res,
  status,
  message
) =>
  res.status(status).json({
    success: false,
    message
  });

const getPagination = (query) => {
  const page = Math.max(
    1,
    Math.floor(safeNumber(
      query.page,
      1,
      1,
      100000
    ))
  );

  const limit = Math.max(
    1,
    Math.floor(safeNumber(
      query.limit,
      20,
      1,
      MAX_PAGE_SIZE
    ))
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

// ==========================================
// VALIDATE AND PREPARE ARTICLE
// ==========================================

function prepareArticle(body, existing = null) {
  if (!isPlainObject(body)) {
    return {
      error: 'Invalid article data.'
    };
  }

  // Only explicitly approved fields are accepted.
  // This prevents assigning protected fields
  // directly from the request body.

  const article = {
    question: cleanBilingual(
      body.question ??
      existing?.question,
      500
    ),

    answer: cleanBilingual(
      body.answer ??
      existing?.answer,
      5000
    ),

    category: body.category ??
      existing?.category ??
      'general',

    keywordsBn: cleanStringArray(
      body.keywordsBn ??
      existing?.keywordsBn,
      30,
      100
    ),

    keywordsEn: cleanStringArray(
      body.keywordsEn ??
      existing?.keywordsEn,
      30,
      100
    ),

    alternativeQuestionsBn: cleanStringArray(
      body.alternativeQuestionsBn ??
      existing?.alternativeQuestionsBn,
      30,
      300
    ),

    alternativeQuestionsEn: cleanStringArray(
      body.alternativeQuestionsEn ??
      existing?.alternativeQuestionsEn,
      30,
      300
    ),

    sourceType: body.sourceType ??
      existing?.sourceType ??
      'jonoseba',

    sourceUrl: cleanString(
      body.sourceUrl ??
      existing?.sourceUrl ??
      '',
      1000
    ),

    serviceRoute: cleanString(
      body.serviceRoute ??
      existing?.serviceRoute ??
      '',
      250
    ),

    status: body.status ??
      existing?.status ??
      'draft',

    featured: body.featured === undefined
      ? existing?.featured ?? false
      : body.featured,

    sortOrder: body.sortOrder === undefined
      ? existing?.sortOrder ?? 0
      : Number(body.sortOrder),

    verifiedAt: body.verifiedAt === undefined
      ? existing?.verifiedAt ?? null
      : body.verifiedAt
  };

  // ========================================
  // FIELD VALIDATION
  // ========================================

  if (!article.question.bn && !article.question.en) {
    return {
      error:
        'At least one question language is required.'
    };
  }

  if (!article.answer.bn && !article.answer.en) {
    return {
      error:
        'At least one answer language is required.'
    };
  }

  if (!HELP_CATEGORIES.includes(article.category)) {
    return {
      error: 'Invalid FAQ category.'
    };
  }

  if (!SOURCE_TYPES.includes(article.sourceType)) {
    return {
      error: 'Invalid source type.'
    };
  }

  if (!ARTICLE_STATUSES.includes(article.status)) {
    return {
      error: 'Invalid article status.'
    };
  }

  if (typeof article.featured !== 'boolean') {
    return {
      error: 'Featured must be true or false.'
    };
  }

  if (
    !Number.isFinite(article.sortOrder) ||
    article.sortOrder < -100000 ||
    article.sortOrder > 100000
  ) {
    return {
      error: 'Invalid sort order.'
    };
  }

  if (!validHttpUrl(article.sourceUrl)) {
    return {
      error:
        'Source URL must be a valid HTTP or HTTPS URL.'
    };
  }

  if (!validInternalRoute(article.serviceRoute)) {
    return {
      error:
        'Service route must be a valid internal path.'
    };
  }

  // An article must have both language versions
  // before it can become publicly visible.

  if (article.status === 'published') {
    if (
      !article.question.bn ||
      !article.question.en ||
      !article.answer.bn ||
      !article.answer.en
    ) {
      return {
        error:
          'Published FAQs must contain Bangla and English questions and answers.'
      };
    }

    if (
      article.sourceType === 'official' &&
      !article.sourceUrl
    ) {
      return {
        error:
          'Official guidance requires a source URL before publishing.'
      };
    }
  }

  // Verified date can be null.
  if (article.verifiedAt) {
    const date = new Date(article.verifiedAt);

    if (Number.isNaN(date.getTime())) {
      return {
        error: 'Invalid verification date.'
      };
    }

    article.verifiedAt = date;
  } else {
    article.verifiedAt = null;
  }

  return { article };
}

// ==========================================
// FORMAT ADMIN ARTICLE
// ==========================================

function formatAdminArticle(article) {
  return {
    id: String(article._id),
    _id: String(article._id),

    question: article.question,
    answer: article.answer,

    category: article.category,

    keywordsBn: article.keywordsBn || [],
    keywordsEn: article.keywordsEn || [],

    alternativeQuestionsBn:
      article.alternativeQuestionsBn || [],

    alternativeQuestionsEn:
      article.alternativeQuestionsEn || [],

    sourceType: article.sourceType,
    sourceUrl: article.sourceUrl || '',
    serviceRoute: article.serviceRoute || '',

    status: article.status,
    featured: article.featured,
    sortOrder: article.sortOrder,

    verifiedAt: article.verifiedAt,
    viewCount: article.viewCount || 0,

    createdBy: article.createdBy,
    updatedBy: article.updatedBy,

    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  };
}

// ==========================================
// GET ADMIN HELP CENTER STATISTICS
// GET /api/admin/help-center/stats
// ==========================================

router.get('/stats', async (req, res) => {
  const [
    total,
    published,
    draft,
    archived,
    featured,
    unanswered,
    reviewed,
    resolved
  ] = await Promise.all([
    HelpArticle.countDocuments(),

    HelpArticle.countDocuments({
      status: 'published'
    }),

    HelpArticle.countDocuments({
      status: 'draft'
    }),

    HelpArticle.countDocuments({
      status: 'archived'
    }),

    HelpArticle.countDocuments({
      status: 'published',
      featured: true
    }),

    UnansweredQuestion.countDocuments({
      status: 'pending'
    }),

    UnansweredQuestion.countDocuments({
      status: 'reviewed'
    }),

    UnansweredQuestion.countDocuments({
      status: 'resolved'
    })
  ]);

  res.json({
    success: true,
    stats: {
      total,
      published,
      draft,
      archived,
      featured,
      unanswered,
      reviewed,
      resolved
    }
  });
});

// ==========================================
// GET ALL FAQ ARTICLES
// GET /api/admin/help-center/faqs
// ==========================================

router.get('/faqs', async (req, res) => {
  const {
    page,
    limit,
    skip
  } = getPagination(req.query);

  const filter = {};

  const status = cleanString(
    req.query.status,
    30
  );

  const category = cleanString(
    req.query.category,
    30
  );

  const search = cleanString(
    req.query.q,
    120
  );

  if (
    status &&
    status !== 'all'
  ) {
    if (!ARTICLE_STATUSES.includes(status)) {
      return errorResponse(
        res,
        400,
        'Invalid status filter.'
      );
    }

    filter.status = status;
  }

  if (
    category &&
    category !== 'all'
  ) {
    if (!HELP_CATEGORIES.includes(category)) {
      return errorResponse(
        res,
        400,
        'Invalid category filter.'
      );
    }

    filter.category = category;
  }

  if (search) {
    const regex = new RegExp(
      escapeRegex(search),
      'i'
    );

    filter.$or = [
      { 'question.bn': regex },
      { 'question.en': regex },
      { 'answer.bn': regex },
      { 'answer.en': regex },
      { keywordsBn: regex },
      { keywordsEn: regex },
      { alternativeQuestionsBn: regex },
      { alternativeQuestionsEn: regex }
    ];
  }

  const [items, total] = await Promise.all([
    HelpArticle.find(filter)
      .sort({
        featured: -1,
        sortOrder: 1,
        updatedAt: -1
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    HelpArticle.countDocuments(filter)
  ]);

  res.json({
    success: true,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: items.map(formatAdminArticle)
  });
});

// ==========================================
// GET SINGLE FAQ ARTICLE
// GET /api/admin/help-center/faqs/:id
// ==========================================

router.get('/faqs/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return errorResponse(
      res,
      400,
      'Invalid FAQ ID.'
    );
  }

  const article = await HelpArticle.findById(id)
    .lean();

  if (!article) {
    return errorResponse(
      res,
      404,
      'FAQ not found.'
    );
  }

  res.json({
    success: true,
    item: formatAdminArticle(article)
  });
});

// ==========================================
// CREATE NEW FAQ
// POST /api/admin/help-center/faqs
// ==========================================

router.post('/faqs', async (req, res) => {
  const prepared = prepareArticle(req.body);

  if (prepared.error) {
    return errorResponse(
      res,
      400,
      prepared.error
    );
  }

  const article = await HelpArticle.create({
    ...prepared.article,

    createdBy: req.user._id,
    updatedBy: req.user._id,

    viewCount: 0
  });

  res.status(201).json({
    success: true,
    message: 'FAQ created successfully.',
    item: formatAdminArticle(article)
  });
});

// ==========================================
// UPDATE EXISTING FAQ
// PUT /api/admin/help-center/faqs/:id
// ==========================================

router.put('/faqs/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return errorResponse(
      res,
      400,
      'Invalid FAQ ID.'
    );
  }

  const existing = await HelpArticle.findById(id);

  if (!existing) {
    return errorResponse(
      res,
      404,
      'FAQ not found.'
    );
  }

  const prepared = prepareArticle(
    req.body,
    existing
  );

  if (prepared.error) {
    return errorResponse(
      res,
      400,
      prepared.error
    );
  }

  Object.assign(
    existing,
    prepared.article
  );

  existing.updatedBy = req.user._id;

  await existing.save();

  res.json({
    success: true,
    message: 'FAQ updated successfully.',
    item: formatAdminArticle(existing)
  });
});

// ==========================================
// PUBLISH / UNPUBLISH FAQ
// PATCH /api/admin/help-center/faqs/:id/status
// ==========================================

router.patch(
  '/faqs/:id/status',
  async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(
        res,
        400,
        'Invalid FAQ ID.'
      );
    }

    const nextStatus = req.body?.status;

    if (
      !ARTICLE_STATUSES.includes(nextStatus)
    ) {
      return errorResponse(
        res,
        400,
        'Invalid article status.'
      );
    }

    const article = await HelpArticle.findById(id);

    if (!article) {
      return errorResponse(
        res,
        404,
        'FAQ not found.'
      );
    }

    const prepared = prepareArticle(
      { status: nextStatus },
      article
    );

    if (prepared.error) {
      return errorResponse(
        res,
        400,
        prepared.error
      );
    }

    article.status = nextStatus;
    article.updatedBy = req.user._id;

    await article.save();

    res.json({
      success: true,
      message:
        `FAQ status changed to ${nextStatus}.`,
      item: formatAdminArticle(article)
    });
  }
);

// ==========================================
// FEATURED FAQ TOGGLE
// PATCH /api/admin/help-center/faqs/:id/featured
// ==========================================

router.patch(
  '/faqs/:id/featured',
  async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(
        res,
        400,
        'Invalid FAQ ID.'
      );
    }

    const article = await HelpArticle.findById(id);

    if (!article) {
      return errorResponse(
        res,
        404,
        'FAQ not found.'
      );
    }

    const featured = req.body?.featured;

    if (typeof featured !== 'boolean') {
      return errorResponse(
        res,
        400,
        'Featured must be true or false.'
      );
    }

    article.featured = featured;
    article.updatedBy = req.user._id;

    await article.save();

    res.json({
      success: true,
      message: featured
        ? 'FAQ marked as featured.'
        : 'FAQ removed from featured list.',
      item: formatAdminArticle(article)
    });
  }
);

// ==========================================
// DELETE FAQ
// DELETE /api/admin/help-center/faqs/:id
// ==========================================

router.delete('/faqs/:id', async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return errorResponse(
      res,
      400,
      'Invalid FAQ ID.'
    );
  }

  const deleted = await HelpArticle.findByIdAndDelete(
    id
  );

  if (!deleted) {
    return errorResponse(
      res,
      404,
      'FAQ not found.'
    );
  }

  // Remove references to the deleted article.
  // Keep the unanswered question records for review.

  await UnansweredQuestion.updateMany(
    { resolvedArticle: deleted._id },
    {
      $set: {
        resolvedArticle: null,
        status: 'pending',
        reviewedAt: null
      }
    }
  );

  res.json({
    success: true,
    message: 'FAQ deleted successfully.',
    deletedId: id
  });
});

// ==========================================
// GET UNANSWERED QUESTIONS
// GET /api/admin/help-center/unanswered
// ==========================================

router.get(
  '/unanswered',
  async (req, res) => {
    const {
      page,
      limit,
      skip
    } = getPagination(req.query);

    const status = cleanString(
      req.query.status,
      30
    );

    const language = cleanString(
      req.query.lang,
      10
    );

    const filter = {};

    if (
      status &&
      status !== 'all'
    ) {
      if (!QUESTION_STATUSES.includes(status)) {
        return errorResponse(
          res,
          400,
          'Invalid question status.'
        );
      }

      filter.status = status;
    }

    if (
      language &&
      language !== 'all'
    ) {
      if (!['bn', 'en'].includes(language)) {
        return errorResponse(
          res,
          400,
          'Invalid language.'
        );
      }

      filter.language = language;
    }

    const [items, total] = await Promise.all([
      UnansweredQuestion.find(filter)
        .select('-__v')
        .sort({
          status: 1,
          count: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'resolvedArticle',
          select: 'question category status'
        })
        .lean(),

      UnansweredQuestion.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items
    });
  }
);

// ==========================================
// UPDATE UNANSWERED QUESTION
// PATCH /api/admin/help-center/unanswered/:id
// ==========================================

router.patch(
  '/unanswered/:id',
  async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(
        res,
        400,
        'Invalid unanswered question ID.'
      );
    }

    if (!isPlainObject(req.body)) {
      return errorResponse(
        res,
        400,
        'Invalid request body.'
      );
    }

    const status = req.body.status;

    if (
      !QUESTION_STATUSES.includes(status)
    ) {
      return errorResponse(
        res,
        400,
        'Invalid review status.'
      );
    }

    const question =
      await UnansweredQuestion.findById(id);

    if (!question) {
      return errorResponse(
        res,
        404,
        'Unanswered question not found.'
      );
    }

    let articleId = null;

    // When marked resolved, a published,
    // verified article must be linked.

    if (status === 'resolved') {
      const requestedId =
        req.body.resolvedArticle;

      if (!isValidId(requestedId)) {
        return errorResponse(
          res,
          400,
          'A valid FAQ article is required to resolve the question.'
        );
      }

      const article =
        await HelpArticle.findOne({
          _id: requestedId,
          status: 'published'
        });

      if (!article) {
        return errorResponse(
          res,
          404,
          'A published FAQ article was not found.'
        );
      }

      articleId = article._id;
    }

    question.status = status;

    question.adminNote = cleanString(
      req.body.adminNote ??
      question.adminNote,
      1000
    );

    question.resolvedArticle = articleId;

    question.reviewedAt =
      status === 'pending'
        ? null
        : new Date();

    await question.save();

    res.json({
      success: true,
      message:
        'Question review updated successfully.',
      item: question
    });
  }
);

// ==========================================
// DELETE UNANSWERED QUESTION
// DELETE /api/admin/help-center/unanswered/:id
// ==========================================

router.delete(
  '/unanswered/:id',
  async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(
        res,
        400,
        'Invalid unanswered question ID.'
      );
    }

    const deleted =
      await UnansweredQuestion.findByIdAndDelete(id);

    if (!deleted) {
      return errorResponse(
        res,
        404,
        'Question not found.'
      );
    }

    res.json({
      success: true,
      message:
        'Unanswered question deleted successfully.',
      deletedId: id
    });
  }
);

// ==========================================
// GET AVAILABLE HELP CATEGORIES
// GET /api/admin/help-center/categories
// ==========================================

router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: HELP_CATEGORIES,
    articleStatuses: ARTICLE_STATUSES,
    sourceTypes: SOURCE_TYPES,
    questionStatuses: QUESTION_STATUSES,
    languages: ['bn', 'en']
  });
});

// ==========================================
// EXPORT ROUTER
// ==========================================

export default router;
