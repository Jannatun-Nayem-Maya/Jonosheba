
import {
  useState,
  useEffect,
  useCallback
} from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import {
  PageHeader,
  Loader,
  ErrorBox,
  useToast
} from '../components/ui.jsx';

// ==========================================
// JONOSEBA ADMIN HELP CENTER
// ==========================================

const CATEGORIES = [
  ['general', 'সাধারণ', 'General'],
  ['jonoseba', 'জনসেবা', 'Jonoseba'],
  ['health', 'স্বাস্থ্য', 'Health'],
  ['blood', 'রক্তদান', 'Blood Donation'],
  ['scholarship', 'বৃত্তি', 'Scholarships'],
  ['relief', 'ত্রাণ', 'Relief'],
  ['volunteer', 'স্বেচ্ছাসেবক', 'Volunteer'],
  ['welfare', 'কল্যাণ', 'Welfare'],
  ['disaster', 'দুর্যোগ', 'Disaster'],
  ['complaint', 'অভিযোগ', 'Complaints'],
  ['government', 'সরকারি সেবা', 'Government'],
  ['bangladesh', 'বাংলাদেশ', 'Bangladesh'],
  ['emergency', 'জরুরি সেবা', 'Emergency']
];

const FAQ_STATUSES = [
  ['published', 'প্রকাশিত', 'Published'],
  ['draft', 'খসড়া', 'Draft'],
  ['archived', 'আর্কাইভ', 'Archived']
];

const QUESTION_STATUSES = [
  ['pending', 'অপেক্ষমাণ', 'Pending'],
  ['reviewed', 'পর্যালোচিত', 'Reviewed'],
  ['resolved', 'সমাধানকৃত', 'Resolved'],
  ['dismissed', 'বাতিল', 'Dismissed']
];

const SOURCE_TYPES = [
  ['jonoseba', 'জনসেবা প্ল্যাটফর্ম', 'Jonoseba Platform'],
  ['official', 'সরকারি উৎস', 'Official Government Source'],
  ['verified_knowledge', 'যাচাইকৃত তথ্য', 'Verified Knowledge']
];

const PAGE_SIZE = 20;

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const labelOf = (options, value, lang) => {
  const item = options.find(([key]) => key === value);
  return item
    ? item[lang === 'bn' ? 1 : 2]
    : value || '—';
};

const displayDate = (value, lang) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(
    lang === 'bn' ? 'bn-BD' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' }
  );
};

const dateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toISOString().slice(0, 10);
};

const listText = (value) => safeArray(value).join(', ');

const parseList = (value) =>
  [...new Set(
    String(value || '')
      .split(/[,;\n]/)
      .map((x) => x.trim())
      .filter(Boolean)
  )];

const emptyFAQ = () => ({
  questionBn: '',
  questionEn: '',
  answerBn: '',
  answerEn: '',
  category: 'general',
  keywordsBn: '',
  keywordsEn: '',
  alternativeQuestionsBn: '',
  alternativeQuestionsEn: '',
  sourceType: 'jonoseba',
  sourceUrl: '',
  serviceRoute: '',
  verifiedAt: '',
  status: 'draft',
  featured: false,
  sortOrder: 0
});

const faqToForm = (a) => ({
  questionBn: a.question?.bn || '',
  questionEn: a.question?.en || '',
  answerBn: a.answer?.bn || '',
  answerEn: a.answer?.en || '',
  category: a.category || 'general',
  keywordsBn: listText(a.keywordsBn),
  keywordsEn: listText(a.keywordsEn),
  alternativeQuestionsBn: listText(a.alternativeQuestionsBn),
  alternativeQuestionsEn: listText(a.alternativeQuestionsEn),
  sourceType: a.sourceType || 'jonoseba',
  sourceUrl: a.sourceUrl || '',
  serviceRoute: a.serviceRoute || '',
  verifiedAt: dateInput(a.verifiedAt),
  status: a.status || 'draft',
  featured: Boolean(a.featured),
  sortOrder: a.sortOrder ?? 0
});

const formToFAQ = (f) => ({
  question: {
    bn: f.questionBn.trim(),
    en: f.questionEn.trim()
  },
  answer: {
    bn: f.answerBn.trim(),
    en: f.answerEn.trim()
  },
  category: f.category,
  keywordsBn: parseList(f.keywordsBn),
  keywordsEn: parseList(f.keywordsEn),
  alternativeQuestionsBn: parseList(f.alternativeQuestionsBn),
  alternativeQuestionsEn: parseList(f.alternativeQuestionsEn),
  sourceType: f.sourceType,
  sourceUrl: f.sourceUrl.trim(),
  serviceRoute: f.serviceRoute.trim(),
  verifiedAt: f.verifiedAt || null,
  status: f.status,
  featured: Boolean(f.featured),
  sortOrder: Number(f.sortOrder) || 0
});

// ==========================================
// COMMON UI COMPONENTS
// ==========================================

function StatusBadge({ status, question = false }) {
  const { lang } = useLang();

  return (
    <span className={`ah2-badge ah2-${status}`}>
      <span className="ah2-dot" />
      {labelOf(
        question ? QUESTION_STATUSES : FAQ_STATUSES,
        status,
        lang
      )}
    </span>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  tone = 'default',
  disabled = false,
  type = 'button'
}) {
  return (
    <button
      type={type}
      className={`ah2-action ah2-action-${tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <i className={`fa-solid ${icon}`} />}
      <span>{children}</span>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  unit
}) {
  const { t } = useLang();

  return (
    <div className="ah2-pagination">
      <span>
        {t('মোট', 'Total')}: <strong>{total}</strong> {unit}
      </span>

      <div className="ah2-page-buttons">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <i className="fa-solid fa-chevron-left" />
          {t('আগের', 'Previous')}
        </button>

        <span>{page} / {totalPages}</span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('পরের', 'Next')}
          <i className="fa-solid fa-chevron-right" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="ah2-empty">
      <i className="fa-regular fa-folder-open" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

// ==========================================
// FAQ ADD / EDIT FORM
// ==========================================

function FAQEditor({ article, onClose, onSaved }) {
  const { t } = useLang();
  const toast = useToast();

  const isEditing = Boolean(article);

  const [form, setForm] = useState(() =>
    article ? faqToForm(article) : emptyFAQ()
  );
  const [saving, setSaving] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.questionBn.trim() && !form.questionEn.trim()) {
      return t(
        'অন্তত একটি ভাষায় প্রশ্ন লিখুন।',
        'Enter a question in at least one language.'
      );
    }

    if (!form.answerBn.trim() && !form.answerEn.trim()) {
      return t(
        'অন্তত একটি ভাষায় উত্তর লিখুন।',
        'Enter an answer in at least one language.'
      );
    }

    if (form.status === 'published') {
      if (
        !form.questionBn.trim() ||
        !form.questionEn.trim() ||
        !form.answerBn.trim() ||
        !form.answerEn.trim()
      ) {
        return t(
          'Publish করতে উভয় ভাষায় প্রশ্ন ও উত্তর প্রয়োজন।',
          'Publishing requires questions and answers in both languages.'
        );
      }

      if (
        form.sourceType === 'official' &&
        !form.sourceUrl.trim()
      ) {
        return t(
          'সরকারি তথ্যের জন্য Official Source URL দিন।',
          'Official information requires a source URL.'
        );
      }
    }

    if (
      form.serviceRoute &&
      (!form.serviceRoute.startsWith('/') ||
        form.serviceRoute.startsWith('//'))
    ) {
      return t(
        'Service Route অবশ্যই / দিয়ে শুরু হতে হবে।',
        'Service route must begin with /.'
      );
    }

    return null;
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    const error = validate();
    if (error) {
      toast(error, 'error');
      return;
    }

    setSaving(true);

    try {
      await api(
        isEditing
          ? `/admin/help-center/faqs/${article._id}`
          : '/admin/help-center/faqs',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: formToFAQ(form)
        }
      );

      toast(
        t('FAQ সংরক্ষণ করা হয়েছে।', 'FAQ saved successfully.'),
        'success'
      );

      onSaved();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const field = (key, bn, en, rows = 2) => (
    <label className="ah2-field" key={key}>
      <span>{t(bn, en)}</span>
      <textarea
        rows={rows}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );

  const sectionTitle = (icon, bn, en) => (
    <h3 className="ah2-form-heading">
      <i className={`fa-solid ${icon}`} />
      {t(bn, en)}
    </h3>
  );

  return (
    <div
      className="ah2-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="ah2-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ah2-faq-modal-title"
      >
        <header className="ah2-modal-header">
          <div>
            <h2 id="ah2-faq-modal-title">
              {isEditing
                ? t('FAQ সম্পাদনা করুন', 'Edit FAQ')
                : t('নতুন FAQ যোগ করুন', 'Create New FAQ')}
            </h2>
            <p>
              {t(
                'প্রশ্ন, উত্তর এবং উৎস যাচাই করে সংরক্ষণ করুন।',
                'Enter verified questions, answers and sources.'
              )}
            </p>
          </div>

          <button
            type="button"
            className="ah2-close"
            onClick={onClose}
            disabled={saving}
            aria-label={t('বন্ধ করুন', 'Close')}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </header>

        <form onSubmit={save}>
          <div className="ah2-modal-body">
            {sectionTitle('fa-language', 'প্রশ্ন ও উত্তর', 'Questions & Answers')}

            <div className="ah2-form-grid">
              {field('questionBn', 'বাংলা প্রশ্ন', 'Question (Bangla)')}
              {field('questionEn', 'ইংরেজি প্রশ্ন', 'Question (English)')}
              {field('answerBn', 'বাংলা উত্তর', 'Answer (Bangla)', 6)}
              {field('answerEn', 'ইংরেজি উত্তর', 'Answer (English)', 6)}
            </div>

            {sectionTitle(
              'fa-magnifying-glass',
              'সার্চ ও শ্রেণিবিভাগ',
              'Search & Classification'
            )}

            <div className="ah2-form-grid">
              <label className="ah2-field">
                <span>{t('বিভাগ', 'Category')}</span>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                >
                  {CATEGORIES.map(([key, bn, en]) => (
                    <option key={key} value={key}>
                      {t(bn, en)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ah2-field">
                <span>{t('প্রদর্শনের ক্রম', 'Display Order')}</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => update('sortOrder', e.target.value)}
                />
              </label>

              {field('keywordsBn', 'বাংলা Keywords', 'Bangla Keywords', 3)}
              {field('keywordsEn', 'English Keywords', 'English Keywords', 3)}

              {field(
                'alternativeQuestionsBn',
                'বিকল্প বাংলা প্রশ্ন',
                'Alternative Bangla Questions',
                3
              )}
              {field(
                'alternativeQuestionsEn',
                'বিকল্প ইংরেজি প্রশ্ন',
                'Alternative English Questions',
                3
              )}
            </div>

            <p className="ah2-field-hint">
              {t(
                'Keywords ও বিকল্প প্রশ্ন কমা দিয়ে আলাদা করুন।',
                'Separate keywords and alternative questions with commas.'
              )}
            </p>

            {sectionTitle(
              'fa-shield-halved',
              'তথ্যের উৎস',
              'Information Source'
            )}

            <div className="ah2-form-grid">
              <label className="ah2-field">
                <span>{t('উৎসের ধরন', 'Source Type')}</span>
                <select
                  value={form.sourceType}
                  onChange={(e) => update('sourceType', e.target.value)}
                >
                  {SOURCE_TYPES.map(([key, bn, en]) => (
                    <option key={key} value={key}>
                      {t(bn, en)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ah2-field">
                <span>{t('সর্বশেষ যাচাই', 'Last Verified Date')}</span>
                <input
                  type="date"
                  value={form.verifiedAt}
                  onChange={(e) => update('verifiedAt', e.target.value)}
                />
              </label>

              <label className="ah2-field">
                <span>{t('অফিসিয়াল লিংক', 'Official Source URL')}</span>
                <input
                  type="url"
                  value={form.sourceUrl}
                  placeholder="https://bangladesh.gov.bd/"
                  onChange={(e) => update('sourceUrl', e.target.value)}
                />
              </label>

              <label className="ah2-field">
                <span>{t('সেবার পেজ', 'Service Route')}</span>
                <input
                  type="text"
                  value={form.serviceRoute}
                  placeholder="/blood-donors"
                  onChange={(e) => update('serviceRoute', e.target.value)}
                />
              </label>
            </div>

            {sectionTitle(
              'fa-cloud-arrow-up',
              'প্রকাশনা সেটিংস',
              'Publication Settings'
            )}

            <div className="ah2-form-grid">
              <label className="ah2-field">
                <span>{t('FAQ-এর অবস্থা', 'FAQ Status')}</span>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                >
                  {FAQ_STATUSES.map(([key, bn, en]) => (
                    <option key={key} value={key}>
                      {t(bn, en)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ah2-checkbox-panel">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update('featured', e.target.checked)}
                />
                <span>
                  <strong>{t('জনপ্রিয় প্রশ্নে দেখান', 'Featured FAQ')}</strong>
                  <small>
                    {t(
                      'Public Help Center-এর Popular Questions-এ দেখাবে।',
                      'Show in Popular Questions on the public Help Center.'
                    )}
                  </small>
                </span>
              </label>
            </div>

            <div className="ah2-note">
              <i className="fa-solid fa-circle-info" />
              {t(
                'Draft ও Archived প্রশ্ন সাধারণ ব্যবহারকারীরা দেখতে পাবে না।',
                'Draft and archived FAQs are not visible to regular users.'
              )}
            </div>
          </div>

          <footer className="ah2-modal-footer">
            <ActionButton onClick={onClose} disabled={saving}>
              {t('বাতিল', 'Cancel')}
            </ActionButton>

            <ActionButton
              type="submit"
              tone="primary"
              icon={saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}
              disabled={saving}
            >
              {saving
                ? t('সংরক্ষণ হচ্ছে...', 'Saving...')
                : t('FAQ সংরক্ষণ', 'Save FAQ')}
            </ActionButton>
          </footer>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// FAQ MANAGEMENT
// ==========================================

function FAQManagement({ onDataChanged }) {
  const { lang, t } = useLang();
  const toast = useToast();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: statusFilter,
        category: categoryFilter,
        q: searchQuery
      });

      const result = await api(
        `/admin/help-center/faqs?${params.toString()}`
      );

      setArticles(safeArray(result.items));
      setTotal(result.total || 0);
      setTotalPages(Math.max(result.totalPages || 1, 1));
    } catch (err) {
      setArticles([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, categoryFilter, searchQuery, refreshKey]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const refresh = () => {
    setRefreshKey((n) => n + 1);
    onDataChanged?.();
  };

  const changeStatus = async (article, status) => {
    if (busyId !== null || status === article.status) return;

    setBusyId(article._id);

    try {
      await api(
        `/admin/help-center/faqs/${article._id}/status`,
        { method: 'PATCH', body: { status } }
      );

      toast(t('অবস্থা আপডেট হয়েছে।', 'Status updated.'), 'success');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (article) => {
    if (busyId !== null) return;

    setBusyId(article._id);

    try {
      await api(
        `/admin/help-center/faqs/${article._id}/featured`,
        {
          method: 'PATCH',
          body: { featured: !article.featured }
        }
      );

      toast(
        t('Featured সেটিংস আপডেট হয়েছে।', 'Featured setting updated.'),
        'success'
      );

      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const deleteArticle = async (article) => {
    if (busyId !== null) return;

    const title =
      article.question?.[lang] ||
      article.question?.en ||
      article.question?.bn ||
      'FAQ';

    if (!window.confirm(
      t(
        `এই FAQ স্থায়ীভাবে মুছে ফেলবেন?\n\n${title}`,
        `Permanently delete this FAQ?\n\n${title}`
      )
    )) return;

    setBusyId(article._id);

    try {
      await api(
        `/admin/help-center/faqs/${article._id}`,
        { method: 'DELETE' }
      );

      toast(t('FAQ মুছে ফেলা হয়েছে।', 'FAQ deleted.'), 'success');

      if (articles.length === 1 && page > 1) {
        setPage((p) => p - 1);
        onDataChanged?.();
      } else {
        refresh();
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="ah2-panel">
      <header className="ah2-panel-header">
        <div>
          <h2>
            <i className="fa-solid fa-book-open" />
            {t('FAQ ব্যবস্থাপনা', 'FAQ Management')}
          </h2>
          <p>
            {t(
              'প্রশ্ন সম্পাদনা করুন, নতুন উত্তর যোগ করুন এবং প্রকাশনা নিয়ন্ত্রণ করুন।',
              'Edit questions, add answers and control publication.'
            )}
          </p>
        </div>

        <ActionButton
          tone="primary"
          icon="fa-plus"
          onClick={() => setEditing('new')}
        >
          {t('নতুন FAQ যোগ করুন', 'Add New FAQ')}
        </ActionButton>
      </header>

      <div className="ah2-toolbar">
        <form
          className="ah2-search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearchQuery(search.trim());
          }}
        >
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              'প্রশ্ন বা Keywords খুঁজুন',
              'Search questions or keywords'
            )}
          />
          <button type="submit">{t('খুঁজুন', 'Search')}</button>
        </form>

        <select
          value={categoryFilter}
          aria-label={t('বিভাগ', 'Category')}
          onChange={(e) => {
            setPage(1);
            setCategoryFilter(e.target.value);
          }}
        >
          <option value="all">{t('সব বিভাগ', 'All Categories')}</option>
          {CATEGORIES.map(([key, bn, en]) => (
            <option key={key} value={key}>{t(bn, en)}</option>
          ))}
        </select>

        <ActionButton icon="fa-rotate-right" onClick={refresh}>
          {t('রিফ্রেশ', 'Refresh')}
        </ActionButton>
      </div>

      <div className="ah2-filter-tabs">
        {[
          ['all', 'সব FAQ', 'All FAQs'],
          ...FAQ_STATUSES
        ].map(([key, bn, en]) => (
          <button
            type="button"
            key={key}
            className={statusFilter === key ? 'active' : ''}
            onClick={() => {
              setPage(1);
              setStatusFilter(key);
            }}
          >
            {t(bn, en)}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Loader />
      ) : articles.length === 0 ? (
        <EmptyState
          title={t('কোনো FAQ পাওয়া যায়নি', 'No FAQs Found')}
          description={t(
            'নতুন FAQ যোগ করুন অথবা ফিল্টার পরিবর্তন করুন।',
            'Add a new FAQ or change your filters.'
          )}
        />
      ) : (
        <div className="ah2-card-list">
          {articles.map((article) => {
            const primary =
              article.question?.[lang] ||
              article.question?.en ||
              article.question?.bn ||
              '—';

            const secondary =
              article.question?.[lang === 'bn' ? 'en' : 'bn'] ||
              '';

            const isBusy = busyId !== null;

            return (
              <article className="ah2-faq-card" key={article._id}>
                <div className="ah2-faq-top">
                  <div className="ah2-faq-content">
                    <h3>{primary}</h3>
                    {secondary && <p>{secondary}</p>}
                  </div>

                  <StatusBadge status={article.status} />
                </div>

                <div className="ah2-meta">
                  <span>
                    <i className="fa-solid fa-folder" />
                    {labelOf(CATEGORIES, article.category, lang)}
                  </span>
                  <span>
                    <i className="fa-regular fa-eye" />
                    {article.viewCount || 0} {t('বার দেখা', 'views')}
                  </span>
                  <span>
                    <i className="fa-regular fa-calendar" />
                    {displayDate(article.updatedAt, lang)}
                  </span>

                  {article.featured && (
                    <span className="ah2-featured-label">
                      <i className="fa-solid fa-star" />
                      {t('জনপ্রিয় প্রশ্ন', 'Featured')}
                    </span>
                  )}
                </div>

                <div className="ah2-faq-footer">
                  <div className="ah2-status-control">
                    <label htmlFor={`status-${article._id}`}>
                      {t('প্রকাশনার অবস্থা', 'Publication Status')}
                    </label>

                    <select
                      id={`status-${article._id}`}
                      value={article.status}
                      disabled={isBusy}
                      onChange={(e) =>
                        changeStatus(article, e.target.value)
                      }
                    >
                      {FAQ_STATUSES.map(([key, bn, en]) => (
                        <option value={key} key={key}>
                          {t(bn, en)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ah2-actions">
                    <ActionButton
                      icon="fa-pen"
                      tone="primary-outline"
                      disabled={isBusy}
                      onClick={() => setEditing(article)}
                    >
                      {t('সম্পাদনা', 'Edit')}
                    </ActionButton>

                    <ActionButton
                      icon="fa-star"
                      tone={article.featured ? 'gold' : 'default'}
                      disabled={isBusy}
                      onClick={() => toggleFeatured(article)}
                    >
                      {article.featured
                        ? t('Featured সরান', 'Remove Featured')
                        : t('Featured করুন', 'Mark Featured')}
                    </ActionButton>

                    <ActionButton
                      icon="fa-trash"
                      tone="danger"
                      disabled={isBusy}
                      onClick={() => deleteArticle(article)}
                    >
                      {t('মুছুন', 'Delete')}
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          unit={t('টি FAQ', 'FAQs')}
        />
      )}

      {editing && (
        <FAQEditor
          key={editing === 'new' ? 'new' : editing._id}
          article={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </section>
  );
}

// ==========================================
// UNANSWERED QUESTION MANAGEMENT
// ==========================================

function UnansweredManagement({ onDataChanged }) {
  const { lang, t } = useLang();
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [form, setForm] = useState({
    status: 'reviewed',
    resolvedArticle: '',
    adminNote: ''
  });

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: String(PAGE_SIZE)
      });

      const result = await api(
        `/admin/help-center/unanswered?${params}`
      );

      setQuestions(safeArray(result.items));
      setTotal(result.total || 0);
      setTotalPages(Math.max(result.totalPages || 1, 1));
    } catch (err) {
      setQuestions([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, refreshKey]);

  const loadPublishedArticles = useCallback(async () => {
    try {
      const collected = [];
      let currentPage = 1;
      let pages = 1;

      do {
        const result = await api(
          `/admin/help-center/faqs?status=published&page=${currentPage}&limit=50`
        );

        collected.push(...safeArray(result.items));
        pages = Math.min(result.totalPages || 1, 20);
        currentPage++;
      } while (currentPage <= pages);

      setArticles(collected);
    } catch {
      setArticles([]);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    loadPublishedArticles();
  }, [loadPublishedArticles]);

  const refresh = () => {
    setRefreshKey((n) => n + 1);
    onDataChanged?.();
  };

  const openReview = (item) => {
    setEditing(item);
    setForm({
      status: item.status === 'pending' ? 'reviewed' : item.status,
      resolvedArticle:
        item.resolvedArticle?._id ||
        item.resolvedArticle ||
        '',
      adminNote: item.adminNote || ''
    });
  };

  const saveReview = async (e) => {
    e.preventDefault();

    if (!editing || saving) return;

    if (form.status === 'resolved' && !form.resolvedArticle) {
      toast(
        t(
          'Resolved করতে Published FAQ নির্বাচন করুন।',
          'Select a published FAQ before resolving.'
        ),
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      await api(
        `/admin/help-center/unanswered/${editing._id}`,
        {
          method: 'PATCH',
          body: {
            status: form.status,
            resolvedArticle:
              form.status === 'resolved'
                ? form.resolvedArticle
                : null,
            adminNote: form.adminNote.trim()
          }
        }
      );

      toast(
        t('প্রশ্নের review সংরক্ষণ হয়েছে।', 'Review saved.'),
        'success'
      );

      setEditing(null);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (item) => {
    if (busyId !== null) return;

    if (!window.confirm(
      t(
        `এই প্রশ্নটি স্থায়ীভাবে মুছবেন?\n\n${item.question}`,
        `Permanently delete this question?\n\n${item.question}`
      )
    )) return;

    setBusyId(item._id);

    try {
      await api(
        `/admin/help-center/unanswered/${item._id}`,
        { method: 'DELETE' }
      );

      toast(t('প্রশ্ন মুছে ফেলা হয়েছে।', 'Question deleted.'), 'success');

      if (questions.length === 1 && page > 1) {
        setPage((p) => p - 1);
        onDataChanged?.();
      } else {
        refresh();
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="ah2-panel">
      <header className="ah2-panel-header">
        <div>
          <h2>
            <i className="fa-solid fa-circle-question" />
            {t('উত্তর না পাওয়া প্রশ্ন', 'Unanswered Questions')}
          </h2>

          <p>
            {t(
              'নাগরিকদের প্রশ্ন পর্যালোচনা করুন এবং যাচাইকৃত FAQ-এর সঙ্গে যুক্ত করুন।',
              'Review citizen questions and link them with verified FAQs.'
            )}
          </p>
        </div>

        <ActionButton
          icon="fa-rotate-right"
          onClick={() => {
            refresh();
            loadPublishedArticles();
          }}
        >
          {t('রিফ্রেশ', 'Refresh')}
        </ActionButton>
      </header>

      <div className="ah2-filter-tabs">
        {QUESTION_STATUSES.map(([key, bn, en]) => (
          <button
            type="button"
            key={key}
            className={statusFilter === key ? 'active' : ''}
            onClick={() => {
              setPage(1);
              setStatusFilter(key);
            }}
          >
            {t(bn, en)}
          </button>
        ))}
      </div>

      {error && <ErrorBox message={error} />}

      {loading ? (
        <Loader />
      ) : questions.length === 0 ? (
        <EmptyState
          title={t(
            'এই বিভাগে কোনো প্রশ্ন নেই',
            'No Questions in This Category'
          )}
        />
      ) : (
        <div className="ah2-card-list">
          {questions.map((item) => (
            <article className="ah2-faq-card" key={item._id}>
              <div className="ah2-faq-top">
                <div className="ah2-faq-content">
                  <h3>{item.question}</h3>

                  {item.adminNote && (
                    <p>
                      <strong>{t('নোট:', 'Note:')}</strong>{' '}
                      {item.adminNote}
                    </p>
                  )}
                </div>

                <StatusBadge status={item.status} question />
              </div>

              <div className="ah2-meta">
                <span>
                  <i className="fa-solid fa-language" />
                  {item.language === 'bn' ? 'বাংলা' : 'English'}
                </span>

                <span>
                  <i className="fa-solid fa-comments" />
                  {t('প্রশ্ন করা হয়েছে:', 'Asked:')} {item.count || 1}
                </span>

                <span>
                  <i className="fa-regular fa-calendar" />
                  {displayDate(item.createdAt, lang)}
                </span>
              </div>

              <div className="ah2-faq-footer">
                <div className="ah2-actions">
                  <ActionButton
                    icon="fa-clipboard-check"
                    tone="primary-outline"
                    disabled={busyId !== null}
                    onClick={() => openReview(item)}
                  >
                    {t('প্রশ্ন পর্যালোচনা', 'Review Question')}
                  </ActionButton>

                  <ActionButton
                    icon="fa-trash"
                    tone="danger"
                    disabled={busyId !== null}
                    onClick={() => removeQuestion(item)}
                  >
                    {t('মুছুন', 'Delete')}
                  </ActionButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          unit={t('টি প্রশ্ন', 'questions')}
        />
      )}

      {editing && (
        <div
          className="ah2-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setEditing(null);
            }
          }}
        >
          <div
            className="ah2-modal ah2-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ah2-review-title"
          >
            <header className="ah2-modal-header">
              <div>
                <h2 id="ah2-review-title">
                  {t('প্রশ্ন পর্যালোচনা', 'Review Question')}
                </h2>
              </div>

              <button
                type="button"
                className="ah2-close"
                disabled={saving}
                onClick={() => setEditing(null)}
                aria-label={t('বন্ধ করুন', 'Close')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </header>

            <form onSubmit={saveReview}>
              <div className="ah2-modal-body">
                <div className="ah2-review-question">
                  <small>{t('নাগরিকের প্রশ্ন', 'Citizen Question')}</small>
                  <strong>{editing.question}</strong>
                </div>

                <label className="ah2-field">
                  <span>{t('পর্যালোচনার অবস্থা', 'Review Status')}</span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value
                      }))
                    }
                  >
                    {QUESTION_STATUSES.map(([key, bn, en]) => (
                      <option value={key} key={key}>
                        {t(bn, en)}
                      </option>
                    ))}
                  </select>
                </label>

                {form.status === 'resolved' && (
                  <label className="ah2-field">
                    <span>
                      {t(
                        'সংশ্লিষ্ট প্রকাশিত FAQ',
                        'Related Published FAQ'
                      )}
                    </span>

                    <select
                      required
                      value={form.resolvedArticle}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          resolvedArticle: e.target.value
                        }))
                      }
                    >
                      <option value="">
                        {t('FAQ নির্বাচন করুন', 'Select an FAQ')}
                      </option>

                      {articles.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.question?.[lang] ||
                            a.question?.en ||
                            a.question?.bn ||
                            'FAQ'}
                        </option>
                      ))}
                    </select>

                    <small>
                      {t(
                        'প্রথমে FAQ Management থেকে যাচাইকৃত উত্তর Publish করুন।',
                        'Publish a verified FAQ first.'
                      )}
                    </small>
                  </label>
                )}

                <label className="ah2-field">
                  <span>{t('অ্যাডমিন নোট', 'Admin Note')}</span>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={form.adminNote}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        adminNote: e.target.value
                      }))
                    }
                    placeholder={t(
                      'পর্যালোচনার নোট লিখুন...',
                      'Write a review note...'
                    )}
                  />
                </label>
              </div>

              <footer className="ah2-modal-footer">
                <ActionButton
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  {t('বাতিল', 'Cancel')}
                </ActionButton>

                <ActionButton
                  type="submit"
                  tone="primary"
                  icon="fa-floppy-disk"
                  disabled={saving}
                >
                  {saving
                    ? t('সংরক্ষণ হচ্ছে...', 'Saving...')
                    : t('পর্যালোচনা সংরক্ষণ', 'Save Review')}
                </ActionButton>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function AdminHelpCenter() {
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('faqs');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');

    try {
      const result = await api('/admin/help-center/stats');
      setStats(result.stats || {});
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    ['total', 'fa-book-open', 'মোট FAQ', 'Total FAQs'],
    ['published', 'fa-circle-check', 'প্রকাশিত', 'Published'],
    ['draft', 'fa-file-pen', 'খসড়া', 'Drafts'],
    ['featured', 'fa-star', 'জনপ্রিয় FAQ', 'Featured FAQs'],
    ['unanswered', 'fa-circle-question', 'উত্তরবিহীন প্রশ্ন', 'Unanswered'],
    ['resolved', 'fa-check-double', 'সমাধানকৃত', 'Resolved']
  ];

  return (
    <>
      <PageHeader
        icon="fa-headset"
        tone="dark"
        title={t(
          'হেল্প সেন্টার ব্যবস্থাপনা',
          'Help Center Management'
        )}
        subtitle={t(
          'প্রশ্ন, উত্তর এবং নাগরিকদের অনুরোধ পরিচালনা করুন',
          'Manage FAQs, answers and citizen questions'
        )}
      />

      <div className="container section">
        <div className="ah2-root">
          <div className="ah2-topbar">
            <div>
              <h2>{t('Admin Control Panel', 'Admin Control Panel')}</h2>
              <p>
                {t(
                  'প্রকাশিত FAQ সাধারণ ব্যবহারকারীর Help Center-এ দেখানো হবে।',
                  'Published FAQs are available in the public Help Center.'
                )}
              </p>
            </div>

            <div className="ah2-top-actions">
              <Link to="/help-center" className="ah2-action">
                <i className="fa-solid fa-arrow-up-right-from-square" />
                {t('Public Help Center দেখুন', 'View Public Help Center')}
              </Link>

              <ActionButton
                icon="fa-rotate-right"
                onClick={loadStats}
              >
                {t('রিফ্রেশ', 'Refresh')}
              </ActionButton>
            </div>
          </div>

          {statsError && <ErrorBox message={statsError} />}

          {statsLoading ? (
            <Loader />
          ) : (
            <div className="ah2-stats">
              {statCards.map(([key, icon, bn, en]) => (
                <div className="ah2-stat" key={key}>
                  <div className="ah2-stat-icon">
                    <i className={`fa-solid ${icon}`} />
                  </div>

                  <div>
                    <strong>{stats?.[key] ?? 0}</strong>
                    <span>{t(bn, en)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ah2-info">
            <i className="fa-solid fa-shield-halved" />
            <p>
              {t(
                'FAQ Publish করার আগে বাংলা ও ইংরেজি উত্তর এবং তথ্যের উৎস যাচাই করুন। ভুল বা পুরোনো তথ্য Draft/Archived করুন।',
                'Verify bilingual answers and sources before publishing. Move inaccurate or outdated information to Draft or Archived.'
              )}
            </p>
          </div>

          <div className="ah2-main-tabs">
            <button
              type="button"
              className={activeTab === 'faqs' ? 'active' : ''}
              onClick={() => setActiveTab('faqs')}
            >
              <i className="fa-solid fa-book-open" />
              {t('FAQ ব্যবস্থাপনা', 'FAQ Management')}
            </button>

            <button
              type="button"
              className={activeTab === 'unanswered' ? 'active' : ''}
              onClick={() => setActiveTab('unanswered')}
            >
              <i className="fa-solid fa-circle-question" />
              {t('উত্তর না পাওয়া প্রশ্ন', 'Unanswered Questions')}
            </button>
          </div>

          {activeTab === 'faqs' ? (
            <FAQManagement onDataChanged={loadStats} />
          ) : (
            <UnansweredManagement onDataChanged={loadStats} />
          )}
        </div>
      </div>

      <style>{`
        .ah2-root {
          --green: #087a50;
          --green-dark: #05613e;
          --text: #1b3045;
          --muted: #556a7e;
          --border: #dce7e2;
          color: var(--text);
          width: 100%;
        }

        .ah2-root *,
        .ah2-overlay *,
        .ah2-root *::before,
        .ah2-root *::after {
          box-sizing: border-box;
        }

        .ah2-root button,
        .ah2-root input,
        .ah2-root select,
        .ah2-overlay input,
        .ah2-overlay select,
        .ah2-overlay textarea {
          font-family: inherit;
        }

        .ah2-topbar,
        .ah2-panel-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }

        .ah2-topbar h2 {
          margin: 0 0 6px;
          font-size: 23px;
          color: var(--text);
        }

        .ah2-topbar p,
        .ah2-panel-header p {
          margin: 0;
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
        }

        .ah2-top-actions,
        .ah2-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .ah2-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 15px;
          min-height: 42px;
          border-radius: 9px;
          border: 1px solid var(--border);
          background: #fff;
          color: #29465b;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          line-height: 1.4;
        }

        .ah2-action:hover {
          background: #eff8f3;
          color: var(--green-dark);
          text-decoration: none;
        }

        .ah2-action-primary {
          color: #fff;
          background: var(--green);
          border-color: var(--green);
        }

        .ah2-action-primary:hover {
          color: #fff;
          background: var(--green-dark);
        }

        .ah2-action-primary-outline {
          color: var(--green-dark);
          border-color: #a9d5be;
          background: #eff9f3;
        }

        .ah2-action-gold {
          color: #805600;
          border-color: #e9cb83;
          background: #fff7df;
        }

        .ah2-action-danger {
          color: #ac3434;
          border-color: #f0cece;
          background: #fff7f7;
        }

        .ah2-action-danger:hover {
          color: #942929;
          background: #ffeaea;
        }

        .ah2-action:disabled,
        .ah2-page-buttons button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .ah2-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .ah2-stat {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: white;
        }

        .ah2-stat-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 45px;
          height: 45px;
          background: #e9f6ee;
          color: var(--green);
          border-radius: 11px;
          font-size: 18px;
        }

        .ah2-stat strong {
          display: block;
          font-size: 26px;
          line-height: 1.2;
        }

        .ah2-stat span {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 13px;
        }

        .ah2-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
          padding: 14px 17px;
          background: #f0f8f3;
          border: 1px solid #cce5d5;
          border-radius: 11px;
          color: #24583e;
        }

        .ah2-info > i {
          font-size: 19px;
          margin-top: 2px;
        }

        .ah2-info p {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
        }

        .ah2-main-tabs,
        .ah2-filter-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 18px;
        }

        .ah2-main-tabs button,
        .ah2-filter-tabs button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 17px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: #fff;
          color: #344d61;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .ah2-filter-tabs button {
          padding: 9px 15px;
          font-size: 13px;
        }

        .ah2-main-tabs button.active,
        .ah2-filter-tabs button.active {
          background: var(--green);
          border-color: var(--green);
          color: #fff;
        }

        .ah2-panel {
          padding: 23px;
          border: 1px solid var(--border);
          border-radius: 15px;
          background: #fff;
          min-width: 0;
        }

        .ah2-panel-header h2 {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 0 0 8px;
          font-size: 20px;
          color: var(--text);
        }

        .ah2-panel-header h2 i {
          color: var(--green);
        }

        .ah2-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 15px;
        }

        .ah2-search {
          display: flex;
          align-items: center;
          flex: 1 1 250px;
          gap: 10px;
          min-width: 0;
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 5px 7px 5px 13px;
          background: #fbfdfc;
        }

        .ah2-search i {
          color: var(--green);
        }

        .ah2-search input {
          min-width: 0;
          flex: 1;
          padding: 9px 0;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--text);
          font-size: 14px;
        }

        .ah2-search button {
          background: var(--green);
          color: white;
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          font-size: 13px;
          cursor: pointer;
        }

        .ah2-toolbar > select {
          min-height: 43px;
          padding: 9px 12px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 9px;
          color: var(--text);
          font-size: 14px;
        }

        .ah2-card-list {
          display: flex;
          flex-direction: column;
          gap: 13px;
        }

        .ah2-faq-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 19px;
          background: #fff;
        }

        .ah2-faq-card:hover {
          border-color: #b4d9c4;
        }

        .ah2-faq-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .ah2-faq-content {
          flex: 1;
          min-width: 0;
        }

        .ah2-faq-content h3 {
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.6;
          color: var(--text);
          overflow-wrap: anywhere;
        }

        .ah2-faq-content p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .ah2-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          padding: 7px 11px;
          border-radius: 20px;
          background: #edf0f3;
          color: #536477;
          font-size: 12px;
          font-weight: 700;
        }

        .ah2-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .ah2-published,
        .ah2-resolved {
          background: #e6f5eb;
          color: #087647;
        }

        .ah2-draft,
        .ah2-pending {
          background: #fff3df;
          color: #946715;
        }

        .ah2-reviewed {
          background: #e9f0fd;
          color: #355fa6;
        }

        .ah2-archived,
        .ah2-dismissed {
          background: #edf0f2;
          color: #687480;
        }

        .ah2-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px 20px;
          margin-top: 13px;
          color: #566b7d;
          font-size: 13px;
        }

        .ah2-meta span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .ah2-meta i {
          color: #178354;
        }

        .ah2-featured-label {
          color: #946415;
          font-weight: 700;
        }

        .ah2-featured-label i {
          color: #bc870e;
        }

        .ah2-faq-footer {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 13px;
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #e8eeeb;
        }

        .ah2-status-control {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ah2-status-control label {
          font-size: 12px;
          font-weight: 700;
          color: #42576a;
        }

        .ah2-status-control select {
          min-width: 150px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          font-size: 13px;
          color: var(--text);
        }

        .ah2-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 20px;
          color: var(--muted);
          font-size: 13px;
        }

        .ah2-page-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ah2-page-buttons button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          background: white;
          font-size: 13px;
          cursor: pointer;
        }

        .ah2-empty {
          padding: 45px 15px;
          text-align: center;
          color: var(--muted);
        }

        .ah2-empty > i {
          font-size: 34px;
          margin-bottom: 15px;
          color: #9caea3;
        }

        .ah2-empty h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: var(--text);
        }

        .ah2-empty p {
          margin: 0;
          font-size: 14px;
        }

        /* MODAL */

        .ah2-overlay {
          position: fixed;
          inset: 0;
          z-index: 3000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15px;
          background: rgba(15, 28, 42, .68);
        }

        .ah2-modal {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 920px;
          max-height: 94vh;
          overflow: hidden;
          border-radius: 15px;
          background: #fff;
          color: #1b3045;
        }

        .ah2-review-modal {
          max-width: 610px;
        }

        .ah2-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 23px;
          border-bottom: 1px solid #dce7e2;
        }

        .ah2-modal-header h2 {
          margin: 0 0 6px;
          font-size: 21px;
        }

        .ah2-modal-header p {
          margin: 0;
          font-size: 13px;
          color: #556a7e;
        }

        .ah2-close {
          width: 38px;
          height: 38px;
          border: 1px solid #dce7e2;
          border-radius: 9px;
          background: #fff;
          color: #42576a;
          cursor: pointer;
        }

        .ah2-modal form {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .ah2-modal-body {
          display: flex;
          flex-direction: column;
          gap: 17px;
          padding: 22px 23px;
          overflow-y: auto;
        }

        .ah2-form-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 9px 0 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e1e9e5;
          font-size: 16px;
        }

        .ah2-form-heading i {
          color: #087a50;
        }

        .ah2-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .ah2-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          font-size: 13px;
          font-weight: 700;
          color: #354c60;
        }

        .ah2-field input,
        .ah2-field select,
        .ah2-field textarea {
          display: block;
          width: 100%;
          padding: 11px 12px;
          border: 1px solid #d5e2da;
          border-radius: 9px;
          background: #fff;
          color: #1b3045;
          font-size: 14px;
          font-weight: 400;
          resize: vertical;
          outline: none;
        }

        .ah2-field input:focus,
        .ah2-field select:focus,
        .ah2-field textarea:focus {
          border-color: #087a50;
          box-shadow: 0 0 0 3px rgba(8, 122, 80, .09);
        }

        .ah2-field small,
        .ah2-field-hint {
          font-size: 12px;
          color: #65798a;
          line-height: 1.6;
          font-weight: 400;
        }

        .ah2-field-hint {
          margin: -4px 0 0;
        }

        .ah2-checkbox-panel {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid #d5e2da;
          border-radius: 9px;
          background: #f7fbf8;
          cursor: pointer;
        }

        .ah2-checkbox-panel input {
          width: 18px;
          height: 18px;
          accent-color: #087a50;
        }

        .ah2-checkbox-panel strong,
        .ah2-checkbox-panel small {
          display: block;
        }

        .ah2-checkbox-panel strong {
          font-size: 13px;
          color: #1b3045;
        }

        .ah2-checkbox-panel small {
          margin-top: 5px;
          color: #65798a;
          font-size: 12px;
        }

        .ah2-note {
          display: flex;
          gap: 10px;
          padding: 13px;
          background: #fff8e8;
          border: 1px solid #eddfb6;
          border-radius: 9px;
          color: #775a20;
          font-size: 13px;
          line-height: 1.7;
        }

        .ah2-modal-footer {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          padding: 16px 23px;
          border-top: 1px solid #dce7e2;
          background: #fff;
        }

        .ah2-review-question {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 15px;
          border: 1px solid #cce5d5;
          border-radius: 9px;
          background: #f0f8f3;
        }

        .ah2-review-question small {
          color: #506c5c;
          font-size: 12px;
        }

        .ah2-review-question strong {
          line-height: 1.6;
          font-size: 16px;
          overflow-wrap: anywhere;
        }

        @media (max-width: 950px) {
          .ah2-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .ah2-panel {
            padding: 14px;
          }

          .ah2-stats {
            gap: 9px;
          }

          .ah2-stat {
            gap: 9px;
            padding: 12px;
          }

          .ah2-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 15px;
          }

          .ah2-stat strong {
            font-size: 21px;
          }

          .ah2-stat span {
            font-size: 11px;
          }

          .ah2-topbar h2 {
            font-size: 20px;
          }

          .ah2-panel-header h2 {
            font-size: 18px;
          }

          .ah2-main-tabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .ah2-main-tabs button {
            padding: 11px 8px;
            font-size: 12px;
          }

          .ah2-faq-card {
            padding: 14px;
          }

          .ah2-faq-top {
            flex-direction: column;
            gap: 9px;
          }

          .ah2-faq-content h3 {
            font-size: 15px;
          }

          .ah2-faq-content p {
            font-size: 13px;
          }

          .ah2-faq-footer {
            align-items: stretch;
          }

          .ah2-actions {
            width: 100%;
          }

          .ah2-action {
            font-size: 12px;
            padding: 10px 12px;
          }

          .ah2-form-grid {
            grid-template-columns: 1fr;
          }

          .ah2-modal {
            max-height: 97vh;
          }

          .ah2-modal-header,
          .ah2-modal-body,
          .ah2-modal-footer {
            padding-left: 14px;
            padding-right: 14px;
          }

          .ah2-modal-header h2 {
            font-size: 18px;
          }
        }
      `}</style>
    </>
  );
}
