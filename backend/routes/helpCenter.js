
import { Router } from 'express';

import {
  Donor,
  Scholarship,
  Alert,
  Welfare,
  VolunteerEvent,
  Hotline,
  Shelter
} from '../models/index.js';

import {
  HelpArticle,
  UnansweredQuestion,
  HELP_CATEGORIES
} from '../models/HelpCenter.js';

// ==========================================
// JONOSEBA SMART HELP CENTER
// ==========================================

const router = Router();

const MAX_QUESTION_LENGTH = 300;
const MAX_SEARCH_LENGTH = 120;
const MAX_RESULTS = 8;

// ==========================================
// TEXT NORMALIZATION
// ==========================================

const normalize = (value = '') =>
  String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/[?!.,:;।'"“”‘’()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectLanguage = (text) =>
  /[\u0980-\u09ff]/.test(String(text))
    ? 'bn'
    : 'en';

const bilingual = (bn, en, language) =>
  language === 'bn' ? bn : en;

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const matchesAny = (text, keywords) =>
  keywords.some((keyword) =>
    text.includes(normalize(keyword))
  );

const localLink = (route, bn, en) => ({
  type: 'internal',
  url: route,
  label: { bn, en }
});

const externalLink = (url, bn, en) => ({
  type: 'external',
  url,
  label: { bn, en }
});

// ==========================================
// BASIC INPUT VALIDATION
// ==========================================

const validateQuestion = (value) => {
  if (typeof value !== 'string') {
    return 'Question must be text.';
  }

  const length = value.trim().length;

  if (length < 2 || length > MAX_QUESTION_LENGTH) {
    return `Question must contain 2-${MAX_QUESTION_LENGTH} characters.`;
  }

  if (/[\u0000-\u001f\u007f]/.test(value)) {
    return 'Question contains invalid characters.';
  }

  return null;
};

// Avoid storing common personal identifiers.
// The actual question may still be processed,
// but personal details will not be saved.

const containsSensitiveInformation = (question) => {
  const value = String(question);

  const email =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

  const phone =
    /(?:\+?880|0)1[3-9][0-9]{8}/;

  const longNumber =
    /(?:^|\D)\d{10,17}(?:\D|$)/;

  const identityWords =
    /password|পাসওয়ার্ড|পাসওয়ার্ড|otp|ওটিপি|nid number|এনআইডি নম্বর|জাতীয় পরিচয়পত্র নম্বর|জাতীয় পরিচয়পত্র নম্বর/i;

  return (
    email.test(value) ||
    phone.test(value) ||
    longNumber.test(value) ||
    identityWords.test(value)
  );
};

// ==========================================
// LIGHTWEIGHT RATE LIMITING
// ==========================================

// This is a single-process development safeguard.
// Production should use a shared rate limiter.

const requestBuckets = new Map();

function limitRequests(req, res, next) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const key = req.ip || 'unknown';

  if (requestBuckets.size > 10000) {
    for (const [ip, bucket] of requestBuckets) {
      if (now - bucket.started > windowMs) {
        requestBuckets.delete(ip);
      }
    }
  }

  const previous = requestBuckets.get(key);

  if (
    !previous ||
    now - previous.started >= windowMs
  ) {
    requestBuckets.set(key, {
      started: now,
      count: 1
    });

    return next();
  }

  previous.count += 1;

  if (previous.count > maxRequests) {
    return res.status(429).json({
      message:
        'Too many requests. Please try again shortly.'
    });
  }

  next();
}

router.use(limitRequests);

// ==========================================
// FAQ RESULT FORMATTER
// ==========================================

function formatArticle(article, language) {
  const source = {
    type: article.sourceType,
    url: article.sourceUrl || null,
    verifiedAt: article.verifiedAt || null
  };

  const links = [];

  if (article.serviceRoute) {
    links.push({
      type: 'internal',
      url: article.serviceRoute,
      label: {
        bn: 'সংশ্লিষ্ট সেবা দেখুন',
        en: 'Open Related Service'
      }
    });
  }

  if (article.sourceUrl) {
    links.push(
      externalLink(
        article.sourceUrl,
        'অফিসিয়াল উৎস দেখুন',
        'View Official Source'
      )
    );
  }

  return {
    id: String(article._id),
    type: 'faq',
    language,
    category: article.category,
    question: article.question[language],
    answer: article.answer[language],
    bilingual: {
      question: article.question,
      answer: article.answer
    },
    source,
    links,
    confidence: 'verified'
  };
}

// ==========================================
// FAQ MATCHING ENGINE
// ==========================================

function calculateScore(article, question) {
  const q = normalize(question);

  const questionBn = normalize(article.question?.bn);
  const questionEn = normalize(article.question?.en);

  if (!q) return 0;

  if (questionBn === q || questionEn === q) {
    return 100;
  }

  let score = 0;

  if (
    (questionBn && questionBn.includes(q)) ||
    (questionEn && questionEn.includes(q))
  ) {
    score += 70;
  }

  const alternatives = [
    ...safeArray(article.alternativeQuestionsBn),
    ...safeArray(article.alternativeQuestionsEn)
  ];

  for (const alternative of alternatives) {
    const alternativeText = normalize(alternative);

    if (alternativeText === q) {
      score = Math.max(score, 95);
    } else if (
      alternativeText &&
      alternativeText.includes(q)
    ) {
      score = Math.max(score, 65);
    }
  }

  const keywords = [
    ...safeArray(article.keywordsBn),
    ...safeArray(article.keywordsEn)
  ];

  let matchedKeywords = 0;

  for (const keyword of keywords) {
    const key = normalize(keyword);

    if (key && q.includes(key)) {
      matchedKeywords += 1;
    }
  }

  score += Math.min(matchedKeywords * 18, 54);

  // Word overlap
  const words = q
    .split(' ')
    .filter((word) => word.length >= 3);

  const articleText = normalize([
    article.question?.bn,
    article.question?.en,
    ...alternatives
  ].join(' '));

  const matchedWords = words.filter(
    (word) => articleText.includes(word)
  );

  if (words.length > 0) {
    score +=
      (matchedWords.length / words.length) * 25;
  }

  return Math.min(Math.round(score), 100);
}

// ==========================================
// FIND VERIFIED KNOWLEDGE
// ==========================================

async function findMatchingFAQ(question, language) {
  const articles = await HelpArticle.find({
    status: 'published'
  })
    .sort({
      featured: -1,
      sortOrder: 1,
      updatedAt: -1
    })
    .limit(500)
    .lean();

  const ranked = articles
    .map((article) => ({
      article,
      score: calculateScore(article, question)
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  // Conservative threshold:
  // refuse weak matches instead of guessing.
  if (!best || best.score < 65) {
    return null;
  }

  if (
    !best.article.question?.[language] ||
    !best.article.answer?.[language]
  ) {
    return null;
  }

  return formatArticle(best.article, language);
}

// ==========================================
// LIVE DATA INTENT RULES
// ==========================================

const INTENTS = [
  {
    key: 'blood',
    categories: [
      'blood',
      'donor',
      'blood group',
      'রক্ত',
      'রক্তদাতা'
    ],
    actionWords: [
      'available',
      'find',
      'search',
      'list',
      'count',
      'কোথায়',
      'খুঁজ',
      'পাওয়া',
      'পাওয়া',
      'তালিকা',
      'কত'
    ]
  },
  {
    key: 'scholarship',
    categories: [
      'scholarship',
      'scholarships',
      'বৃত্তি',
      'স্কলারশিপ'
    ],
    actionWords: [
      'available',
      'list',
      'current',
      'find',
      'show',
      'which',
      'কোন',
      'কী',
      'কি',
      'আছে',
      'তালিকা',
      'দেখাও'
    ]
  },
  {
    key: 'disaster',
    categories: [
      'disaster alert',
      'disaster warning',
      'weather alert',
      'flood alert',
      'দুর্যোগ সতর্কতা',
      'বন্যার সতর্কতা',
      'ঘূর্ণিঝড় সতর্কতা'
    ],
    actionWords: [
      'current',
      'latest',
      'show',
      'list',
      'recent',
      'today',
      'এখন',
      'সাম্প্রতিক',
      'আজ',
      'দেখাও',
      'আছে'
    ]
  },
  {
    key: 'welfare',
    categories: [
      'welfare',
      'allowance',
      'ভাতা',
      'কল্যাণ কর্মসূচি'
    ],
    actionWords: [
      'available',
      'list',
      'show',
      'which',
      'what',
      'কোন',
      'কি',
      'কী',
      'তালিকা',
      'আছে'
    ]
  },
  {
    key: 'volunteer',
    categories: [
      'volunteer event',
      'volunteer events',
      'volunteering events',
      'স্বেচ্ছাসেবক ইভেন্ট',
      'স্বেচ্ছাসেবী ইভেন্ট'
    ],
    actionWords: [
      'upcoming',
      'next',
      'show',
      'list',
      'available',
      'কবে',
      'কোন',
      'দেখাও',
      'আছে'
    ]
  },
  {
    key: 'hotline',
    categories: [
      'emergency contacts',
      'emergency numbers',
      'hotline',
      'হটলাইন',
      'জরুরি নম্বর',
      'জরুরি যোগাযোগ'
    ],
    actionWords: [
      'number',
      'list',
      'what',
      'show',
      'কত',
      'কি',
      'কী',
      'দেখাও',
      'তালিকা'
    ]
  },
  {
    key: 'shelter',
    categories: [
      'shelter',
      'shelters',
      'আশ্রয়কেন্দ্র',
      'আশ্রয়কেন্দ্র'
    ],
    actionWords: [
      'where',
      'list',
      'available',
      'open',
      'find',
      'কোথায়',
      'কোথায়',
      'আছে',
      'খুঁজ'
    ]
  }
];

function detectIntent(question) {
  const q = normalize(question);

  for (const intent of INTENTS) {
    const hasCategory = matchesAny(
      q,
      intent.categories
    );

    const hasAction = matchesAny(
      q,
      intent.actionWords
    );

    if (hasCategory && hasAction) {
      return intent.key;
    }
  }

  return null;
}

// ==========================================
// BLOOD GROUP DETECTION
// ==========================================

function extractBloodGroup(question) {
  const upper = String(question).toUpperCase();

  const match = upper.match(
    /(?:^|[^A-Z])(?:AB|A|B|O)\s*[+-](?=$|[^A-Z0-9])/
  );

  if (!match) return null;

  const found = match[0].trim().replace(/\s+/g, '');

  const groups = [
    'A+', 'A-', 'B+', 'B-',
    'AB+', 'AB-', 'O+', 'O-'
  ];

  return groups.includes(found)
    ? found
    : null;
}

// ==========================================
// LIVE DATA ANSWERS
// ==========================================

async function getLiveAnswer(intent, question, language) {
  const bn = language === 'bn';

  if (intent === 'blood') {
    const group = extractBloodGroup(question);

    const filter = {
      available: true
    };

    if (group) {
      filter.bloodGroup = group;
    }

    const [count, donors] = await Promise.all([
      Donor.countDocuments(filter),
      Donor.find(filter)
        .select('name bloodGroup location verified')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean()
    ]);

    const details = donors.map((donor) =>
      `${donor.name} (${donor.bloodGroup}) — ${donor.location}`
    );

    const intro = bn
      ? `জনসেবা ডাটাবেজে ${group || 'সব গ্রুপ মিলিয়ে'} বর্তমানে ${count} জন উপলব্ধ রক্তদাতার রেকর্ড আছে।`
      : `Jonoseba currently lists ${count} available blood donor records${group ? ` for ${group}` : ''}.`;

    return {
      category: 'blood',
      answer: [
        intro,
        ...details,
        bn
          ? 'দাতার বর্তমান সম্মতি ও উপলব্ধতা যোগাযোগ করে নিশ্চিত করুন।'
          : 'Confirm each donor’s current consent and availability before proceeding.'
      ].join('\n'),
      links: [
        localLink(
          '/blood-donors',
          'রক্তদাতা খুঁজুন',
          'Find Blood Donors'
        )
      ]
    };
  }

  if (intent === 'scholarship') {
    const now = new Date();

    const filter = {
      $or: [
        { deadline: { $gte: now } },
        { deadline: null },
        { deadline: { $exists: false } }
      ]
    };

    const [count, items] = await Promise.all([
      Scholarship.countDocuments(filter),
      Scholarship.find(filter)
        .select(
          'titleBn titleEn providerBn providerEn deadline link'
        )
        .sort({ deadline: 1 })
        .limit(5)
        .lean()
    ]);

    const names = items.map(
      (item) =>
        item[bn ? 'titleBn' : 'titleEn'] ||
        item.titleEn
    );

    return {
      category: 'scholarship',
      answer: [
        bn
          ? `জনসেবায় ${count}টি বৃত্তির রেকর্ড রয়েছে যেগুলোর শেষ তারিখ পার হয়নি অথবা শেষ তারিখ দেওয়া নেই।`
          : `Jonoseba lists ${count} scholarship records with future deadlines or no specified deadline.`,
        ...names,
        bn
          ? 'শেষ তারিখ না দেওয়া থাকলে বৃত্তিটি বর্তমানে খোলা আছে কি না অফিসিয়াল উৎসে যাচাই করুন।'
          : 'A missing deadline does not confirm that applications are open. Check the official source.'
      ].join('\n'),
      links: [
        localLink(
          '/scholarship',
          'বৃত্তির বিস্তারিত দেখুন',
          'Explore Scholarships'
        )
      ]
    };
  }

  if (intent === 'disaster') {
    const alerts = await Alert.find()
      .select(
        'titleBn titleEn district level createdAt source sourceUrl'
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const lines = alerts.map((item) => {
      const title =
        item[bn ? 'titleBn' : 'titleEn'] ||
        item.titleEn ||
        item.titleBn ||
        'Alert';

      return `${title} — ${item.district || 'Bangladesh'}`;
    });

    return {
      category: 'disaster',
      answer: alerts.length
        ? [
            bn
              ? 'জনসেবায় প্রকাশিত সাম্প্রতিক দুর্যোগ সতর্কতার রেকর্ড:'
              : 'Recently recorded disaster alerts on Jonoseba:',
            ...lines,
            bn
              ? 'এগুলো সর্বশেষ সংরক্ষিত রেকর্ড; সব সতর্কতা এখনো কার্যকর আছে এমন নিশ্চয়তা নয়।'
              : 'These are recent stored records, not a guarantee that every alert remains active.'
          ].join('\n')
        : bilingual(
            'জনসেবা ডাটাবেজে বর্তমানে কোনো দুর্যোগ সতর্কতার রেকর্ড পাওয়া যায়নি।',
            'No disaster alert records were found in the Jonoseba database.',
            language
          ),
      links: [
        localLink(
          '/disaster-alerts',
          'দুর্যোগ সতর্কতা দেখুন',
          'View Disaster Alerts'
        )
      ]
    };
  }

  if (intent === 'welfare') {
    const programs = await Welfare.find()
      .select(
        'titleBn titleEn monthly minAge requires'
      )
      .limit(10)
      .lean();

    const lines = programs.map(
      (program) =>
        program[bn ? 'titleBn' : 'titleEn'] ||
        program.titleEn ||
        program.titleBn
    ).filter(Boolean);

    return {
      category: 'welfare',
      answer: [
        bilingual(
          `জনসেবায় ${programs.length}টি কল্যাণ কর্মসূচির রেকর্ড পাওয়া গেছে।`,
          `${programs.length} welfare program records were found on Jonoseba.`,
          language
        ),
        ...lines,
        bilingual(
          'যোগ্যতা, ভাতা এবং আবেদন সংক্রান্ত বিস্তারিত সংশ্লিষ্ট কর্মসূচির পাতায় দেখুন।',
          'Check the relevant program page for eligibility, allowances and application guidance.',
          language
        )
      ].join('\n'),
      links: [
        localLink(
          '/welfare-programs',
          'কল্যাণ কর্মসূচি দেখুন',
          'View Welfare Programs'
        )
      ]
    };
  }

  if (intent === 'volunteer') {
    const events = await VolunteerEvent.find({
      date: { $gte: new Date() }
    })
      .select('titleBn titleEn date locationBn locationEn')
      .sort({ date: 1 })
      .limit(5)
      .lean();

    const lines = events.map((event) => {
      const title =
        event[bn ? 'titleBn' : 'titleEn'] ||
        event.titleEn ||
        event.titleBn;

      const location =
        event[bn ? 'locationBn' : 'locationEn'] ||
        event.locationEn ||
        event.locationBn ||
        '';

      const date = event.date
        ? new Date(event.date).toLocaleDateString(
            bn ? 'bn-BD' : 'en-GB',
            { timeZone: 'Asia/Dhaka' }
          )
        : '';

      return `${title} — ${location} (${date})`;
    });

    return {
      category: 'volunteer',
      answer: events.length
        ? [
            bilingual(
              'আসন্ন স্বেচ্ছাসেবক ইভেন্ট:',
              'Upcoming volunteer events:',
              language
            ),
            ...lines
          ].join('\n')
        : bilingual(
            'জনসেবা ডাটাবেজে আসন্ন কোনো স্বেচ্ছাসেবক ইভেন্ট পাওয়া যায়নি।',
            'No upcoming volunteer events were found.',
            language
          ),
      links: [
        localLink(
          '/volunteer',
          'স্বেচ্ছাসেবক কার্যক্রম দেখুন',
          'View Volunteer Activities'
        )
      ]
    };
  }

  if (intent === 'hotline') {
    const records = await Hotline.find()
      .select('nameBn nameEn number')
      .limit(10)
      .lean();

    const lines = records.map((item) => {
      const name =
        item[bn ? 'nameBn' : 'nameEn'] ||
        item.nameEn ||
        item.nameBn;

      return `${name}: ${item.number}`;
    });

    return {
      category: 'emergency',
      answer: records.length
        ? [
            bilingual(
              'জনসেবায় তালিকাভুক্ত জরুরি যোগাযোগ:',
              'Emergency contacts listed on Jonoseba:',
              language
            ),
            ...lines
          ].join('\n')
        : bilingual(
            'জরুরি যোগাযোগের কোনো রেকর্ড পাওয়া যায়নি।',
            'No emergency contact records were found.',
            language
          ),
      links: [
        localLink(
          '/emergency-contacts',
          'জরুরি যোগাযোগ দেখুন',
          'View Emergency Contacts'
        )
      ]
    };
  }

  if (intent === 'shelter') {
    const shelters = await Shelter.find({
      status: 'open'
    })
      .select(
        'nameBn nameEn addressBn addressEn district'
      )
      .limit(10)
      .lean();

    const lines = shelters.map((item) => {
      const name =
        item[bn ? 'nameBn' : 'nameEn'] ||
        item.nameEn ||
        item.nameBn;

      const address =
        item[bn ? 'addressBn' : 'addressEn'] ||
        item.addressEn ||
        item.addressBn ||
        item.district ||
        '';

      return `${name} — ${address}`;
    });

    return {
      category: 'disaster',
      answer: shelters.length
        ? [
            bilingual(
              'জনসেবায় খোলা হিসেবে তালিকাভুক্ত আশ্রয়কেন্দ্র:',
              'Shelters marked open in Jonoseba:',
              language
            ),
            ...lines,
            bilingual(
              'যাওয়ার আগে আশ্রয়কেন্দ্রের বর্তমান অবস্থা নিশ্চিত করুন।',
              'Confirm current shelter status before travelling.',
              language
            )
          ].join('\n')
        : bilingual(
            'খোলা আশ্রয়কেন্দ্রের কোনো রেকর্ড পাওয়া যায়নি।',
            'No shelters marked open were found.',
            language
          ),
      links: [
        localLink(
          '/disaster-alerts',
          'দুর্যোগ সেবা দেখুন',
          'View Disaster Services'
        )
      ]
    };
  }

  return null;
}

// ==========================================
// STORE UNANSWERED QUESTIONS
// ==========================================

async function saveUnanswered(question, language) {
  if (containsSensitiveInformation(question)) {
    return;
  }

  const cleaned = question.trim();

  const existing = await UnansweredQuestion.findOne({
    question: cleaned,
    language,
    status: 'pending'
  });

  if (existing) {
    await UnansweredQuestion.updateOne(
      { _id: existing._id },
      { $inc: { count: 1 } }
    );
    return;
  }

  await UnansweredQuestion.create({
    question: cleaned,
    language,
    category: 'general',
    count: 1,
    status: 'pending'
  });
}

// ==========================================
// GET PUBLISHED FAQs
// GET /api/help-center/faqs
// ==========================================

router.get('/faqs', async (req, res) => {
  const language =
    req.query.lang === 'en' ? 'en' : 'bn';

  const category = String(
    req.query.category || 'all'
  );

  const search = String(
    req.query.q || ''
  ).trim();

  if (search.length > MAX_SEARCH_LENGTH) {
    return res.status(400).json({
      message: 'Search text is too long.'
    });
  }

  const filter = {
    status: 'published'
  };

  if (
    category !== 'all' &&
    HELP_CATEGORIES.includes(category)
  ) {
    filter.category = category;
  }

  const articles = await HelpArticle.find(filter)
    .sort({
      featured: -1,
      sortOrder: 1,
      updatedAt: -1
    })
    .limit(500)
    .lean();

  let results = articles;

  if (search) {
    results = articles
      .map((article) => ({
        article,
        score: calculateScore(article, search)
      }))
      .filter(({ score }) => score >= 20)
      .sort((a, b) => b.score - a.score)
      .map(({ article }) => article);
  }

  const limit = Math.min(
    Math.max(Number(req.query.limit) || 20, 1),
    50
  );

  res.json({
    success: true,
    language,
    total: results.length,
    items: results
      .slice(0, limit)
      .map((article) =>
        formatArticle(article, language)
      )
  });
});

// ==========================================
// GET FEATURED FAQs
// GET /api/help-center/featured
// ==========================================

router.get('/featured', async (req, res) => {
  const language =
    req.query.lang === 'en' ? 'en' : 'bn';

  const articles = await HelpArticle.find({
    status: 'published',
    featured: true
  })
    .sort({
      sortOrder: 1,
      updatedAt: -1
    })
    .limit(MAX_RESULTS)
    .lean();

  res.json({
    success: true,
    items: articles.map((article) =>
      formatArticle(article, language)
    )
  });
});

// ==========================================
// ASK HELP ASSISTANT
// POST /api/help-center/ask
// ==========================================

router.post('/ask', async (req, res) => {
  const question = req.body?.question;

  const validationError =
    validateQuestion(question);

  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError
    });
  }

  const language =
    ['bn', 'en'].includes(req.body?.language)
      ? req.body.language
      : detectLanguage(question);

  const intent = detectIntent(question);

  // Priority 1:
  // Specific questions about current website data.
  if (intent) {
    const liveResult = await getLiveAnswer(
      intent,
      question,
      language
    );

    if (liveResult) {
      return res.json({
        success: true,
        matched: true,
        type: 'live',
        language,
        category: liveResult.category,
        answer: liveResult.answer,
        links: liveResult.links || [],
        source: {
          type: 'jonoseba_database',
          url: null,
          verifiedAt: null
        },
        confidence: 'database',
        generatedAt: new Date().toISOString()
      });
    }
  }

  // Priority 2:
  // Admin-approved Bangla/English FAQ.
  const faqResult = await findMatchingFAQ(
    question,
    language
  );

  if (faqResult) {
    // Do not block the answer if analytics update fails.
    HelpArticle.updateOne(
      { _id: faqResult.id },
      { $inc: { viewCount: 1 } }
    ).catch(() => {});

    return res.json({
      success: true,
      matched: true,
      ...faqResult
    });
  }

  // Priority 3:
  // Unknown question, no invented answer.
  try {
    await saveUnanswered(
      question,
      language
    );
  } catch (error) {
    console.error(
      'Help Center unanswered question save failed:',
      error.message
    );
  }

  res.json({
    success: true,
    matched: false,
    type: 'unanswered',
    language,
    category: 'general',
    answer: bilingual(
      'দুঃখিত, এই প্রশ্নের যাচাইকৃত উত্তর বর্তমানে আমাদের কাছে নেই। আপনি সংশ্লিষ্ট সেবা পৃষ্ঠা দেখতে পারেন অথবা পরে আবার চেষ্টা করতে পারেন।',
      'Sorry, a verified answer is not currently available for this question. Please check the relevant service page or try again later.',
      language
    ),
    links: [
      localLink(
        '/services',
        'সকল সেবা দেখুন',
        'Browse All Services'
      )
    ],
    source: null,
    confidence: 'unanswered'
  });
});

// ==========================================
// HELP CENTER HEALTH CHECK
// GET /api/help-center/status
// ==========================================

router.get('/status', async (req, res) => {
  const totalPublished = await HelpArticle.countDocuments({
    status: 'published'
  });

  res.json({
    success: true,
    service: 'Jonoseba Smart Help Center',
    languages: ['bn', 'en'],
    publishedFAQs: totalPublished,
    liveData: true,
    generativeAI: false
  });
});

export default router;
