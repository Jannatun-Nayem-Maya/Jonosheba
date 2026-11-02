
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import './GovServices.css';

// ------------------------------------------
// Service Categories
// ------------------------------------------

const categories = [
  ['land', 'ভূমি সেবা', 'Land Services'],
  ['transport', 'বিআরটিএ', 'BRTA'],
  ['rail', 'রেলওয়ে', 'Railway'],
  ['police', 'পুলিশ সেবা', 'Police'],
  ['fees', 'সরকারি ফি', 'Government Fees'],
  ['grs', 'সরকারি অভিযোগ', 'GRS'],
  ['utility', 'ইউটিলিটি বিল', 'Utility Bills'],
  ['jobs', 'সরকারি চাকরি', 'Government Jobs']
];

// ------------------------------------------
// Automatically Generate Unique Slug
// ------------------------------------------

function generateSlug(title) {
  return String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

// ------------------------------------------
// Form Default Values
// ------------------------------------------

const emptyForm = {
  slug: '',
  category: 'land',
  titleBn: '',
  titleEn: '',
  summaryBn: '',
  summaryEn: '',
  officialUrl: '',
  stepsBn: '',
  stepsEn: '',
  documentsBn: '',
  documentsEn: '',
  published: false,
  sourceVerifiedAt: ''
};

const arrayFields = [
  'stepsBn',
  'stepsEn',
  'documentsBn',
  'documentsEn'
];

function prepareForm(item) {
  if (!item) {
    return { ...emptyForm };
  }

  const form = {
    ...emptyForm,
    ...item
  };

  arrayFields.forEach((field) => {
    form[field] = Array.isArray(form[field])
      ? form[field].join('\n')
      : String(form[field] || '');
  });

  form.sourceVerifiedAt = form.sourceVerifiedAt
    ? String(form.sourceVerifiedAt).slice(0, 10)
    : '';

  return form;
}

// ------------------------------------------
// Validate Official Government URL
// ------------------------------------------

function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === 'https:' &&
      (
        hostname === 'gov.bd' ||
        hostname.endsWith('.gov.bd')
      )
    );
  } catch {
    return false;
  }
}

// ------------------------------------------
// Main Admin Government Services Page
// ------------------------------------------

export default function AdminGovServices() {
  const { t, lang, num } = useLang();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(prepareForm(null));

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // ----------------------------------------
  // Load All Government Services
  // ----------------------------------------

  const loadServices = useCallback(async () => {
    setError('');

    try {
      const result = await api('/gov-services/admin');

      setServices(
        Array.isArray(result) ? result : []
      );
    } catch (err) {
      setError(
        err.message || 'Unable to load services.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // ----------------------------------------
  // Dashboard Statistics
  // ----------------------------------------

  const stats = useMemo(() => {
    return {
      total: services.length,

      published: services.filter(
        (service) => service.published
      ).length,

      drafts: services.filter(
        (service) => !service.published
      ).length,

      categories: new Set(
        services.map((service) => service.category)
      ).size
    };
  }, [services]);

  // ----------------------------------------
  // Search and Filter
  // ----------------------------------------

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesStatus =
        filter === 'all' ||
        (
          filter === 'published' &&
          service.published
        ) ||
        (
          filter === 'draft' &&
          !service.published
        );

      const searchableText = [
        service.titleBn,
        service.titleEn,
        service.slug,
        service.category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchableText.includes(query))
      );
    });
  }, [services, search, filter]);

  // ----------------------------------------
  // Category Display
  // ----------------------------------------

  function categoryLabel(category) {
    const found = categories.find(
      ([key]) => key === category
    );

    return found
      ? t(found[1], found[2])
      : category;
  }

  // ----------------------------------------
  // Open Add / Edit Form
  // ----------------------------------------

  function openForm(service = null) {
    setEditingId(service ? service._id : 'new');
    setForm(prepareForm(service));
    setError('');
    setNotice('');
  }

  function closeForm() {
    if (saving) return;

    setEditingId(null);
    setError('');
  }

  // ----------------------------------------
  // Update Form Values
  // ----------------------------------------

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  // ----------------------------------------
  // Save Service
  // ----------------------------------------

  async function saveService(event) {
    event.preventDefault();

    if (saving) return;

    setError('');
    setNotice('');

    const titleEn = form.titleEn.trim();
    const titleBn = form.titleBn.trim();

    if (!titleEn || !titleBn) {
      setError(
        t(
          'বাংলা ও ইংরেজিতে সেবার নাম লিখুন।',
          'Please enter the service title in Bangla and English.'
        )
      );

      return;
    }

    // Automatically generate slug only for new services.
    // Existing records keep their original slug.
    const slug =
      editingId === 'new'
        ? generateSlug(titleEn)
        : form.slug;

    if (!slug) {
      setError(
        t(
          'ইংরেজি নাম থেকে একটি valid slug তৈরি করা যায়নি।',
          'Unable to generate a valid slug from the English title.'
        )
      );

      return;
    }

    // Check duplicate slug before sending.
    const duplicate = services.some(
      (service) =>
        service.slug === slug &&
        service._id !== editingId
    );

    if (duplicate) {
      setError(
        t(
          'এই নামে একটি সেবা আগে থেকেই আছে। অন্য ইংরেজি নাম ব্যবহার করুন।',
          'A service with this identifier already exists. Use a different English title.'
        )
      );

      return;
    }

    if (!isOfficialUrl(form.officialUrl)) {
      setError(
        t(
          'সঠিক HTTPS সরকারি ওয়েবসাইটের লিংক দিন (.gov.bd)।',
          'Enter a valid official HTTPS government URL (.gov.bd).'
        )
      );

      return;
    }

    setSaving(true);

    try {
      const body = {
        ...form,
        slug,
        titleBn,
        titleEn,
        officialUrl: form.officialUrl.trim(),
        sourceVerifiedAt:
          form.sourceVerifiedAt || null
      };

      // Remove MongoDB-generated fields.
      [
        '_id',
        '__v',
        'createdAt',
        'updatedAt'
      ].forEach((field) => {
        delete body[field];
      });

      // Convert multiline text into arrays.
      arrayFields.forEach((field) => {
        body[field] = String(form[field] || '')
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean);
      });

      await api(
        editingId === 'new'
          ? '/gov-services/admin'
          : `/gov-services/admin/${editingId}`,
        {
          method: editingId === 'new'
            ? 'POST'
            : 'PUT',
          body
        }
      );

      setEditingId(null);

      setNotice(
        t(
          'সেবা সফলভাবে সংরক্ষণ করা হয়েছে।',
          'Service saved successfully.'
        )
      );

      await loadServices();
    } catch (err) {
      setError(
        err.message || 'Unable to save service.'
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------
  // Publish / Unpublish
  // ----------------------------------------

  async function togglePublish(service) {
    setBusyId(service._id);
    setError('');
    setNotice('');

    try {
      await api(
        `/gov-services/admin/${service._id}`,
        {
          method: 'PUT',
          body: {
            published: !service.published
          }
        }
      );

      setNotice(
        service.published
          ? t(
              'সেবা অপ্রকাশিত করা হয়েছে।',
              'Service unpublished successfully.'
            )
          : t(
              'সেবা প্রকাশিত করা হয়েছে।',
              'Service published successfully.'
            )
      );

      await loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // ----------------------------------------
  // Delete Service
  // ----------------------------------------

  async function deleteService(service) {
    const confirmed = window.confirm(
      t(
        `আপনি কি "${service.titleBn}" সেবাটি মুছে ফেলতে চান?`,
        `Are you sure you want to delete "${service.titleEn}"?`
      )
    );

    if (!confirmed) return;

    setBusyId(service._id);
    setError('');
    setNotice('');

    try {
      await api(
        `/gov-services/admin/${service._id}`,
        {
          method: 'DELETE'
        }
      );

      setNotice(
        t(
          'সেবা সফলভাবে মুছে ফেলা হয়েছে।',
          'Service deleted successfully.'
        )
      );

      await loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // ----------------------------------------
  // Render
  // ----------------------------------------

  return (
    <div className="gov-page gov-admin-page">
      {/* Admin Header */}

      <section className="gov-admin-hero">
        <div className="container">
          <div className="gov-kicker">
            <i className="fa-solid fa-user-shield" />
            {' '}
            {t(
              'অ্যাডমিন কন্ট্রোল প্যানেল',
              'ADMIN CONTROL PANEL'
            )}
          </div>

          <h1>
            {t(
              'সরকারি ই-সেবা ব্যবস্থাপনা',
              'Government E-Services Management'
            )}
          </h1>

          <p>
            {t(
              'সরকারি সেবার তথ্য, নির্দেশনা, লিংক ও প্রকাশনার অবস্থা পরিচালনা করুন।',
              'Manage government service information, guides, official links and publishing status.'
            )}
          </p>

          <div className="gov-admin-hero-actions">
            <button
              type="button"
              className="gov-link"
              onClick={() => openForm()}
            >
              <i className="fa-solid fa-plus" />
              {' '}
              {t(
                'নতুন সেবা যোগ করুন',
                'Add New Service'
              )}
            </button>

            <Link
              to="/gov-services"
              className="gov-detail-button"
            >
              <i className="fa-solid fa-eye" />
              {' '}
              {t(
                'নাগরিক পেজ',
                'Citizen View'
              )}
            </Link>

            <Link
              to="/admin"
              className="gov-detail-button"
            >
              <i className="fa-solid fa-arrow-left" />
              {' '}
              {t(
                'ড্যাশবোর্ড',
                'Dashboard'
              )}
            </Link>
          </div>
        </div>
      </section>

      <main className="container gov-content">
        {/* Dashboard Statistics */}

        <div className="gov-admin-stats">
          {[
            [
              'fa-layer-group',
              stats.total,
              t('মোট সেবা', 'Total Services')
            ],
            [
              'fa-circle-check',
              stats.published,
              t('প্রকাশিত', 'Published')
            ],
            [
              'fa-file-pen',
              stats.drafts,
              t('খসড়া', 'Drafts')
            ],
            [
              'fa-folder-tree',
              stats.categories,
              t('বিভাগ', 'Categories')
            ]
          ].map(([icon, value, label]) => (
            <div
              className="gov-admin-stat"
              key={label}
            >
              <i className={`fa-solid ${icon}`} />

              <strong>{num(value)}</strong>

              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Service Management */}

        <section className="gov-admin-panel">
          <div className="gov-admin-panel-head">
            <div>
              <h2>
                {t(
                  'সেবার তালিকা',
                  'Manage Services'
                )}
              </h2>

              <p>
                {t(
                  'সেবা যোগ করুন, পরিবর্তন করুন অথবা প্রকাশ করুন।',
                  'Add, edit, delete and publish services.'
                )}
              </p>
            </div>

            <button
              type="button"
              className="gov-link"
              onClick={() => openForm()}
            >
              <i className="fa-solid fa-plus" />
              {' '}
              {t('সেবা যোগ করুন', 'Add Service')}
            </button>
          </div>

          {/* Search and Filters */}

          <div className="gov-admin-filters">
            <div className="gov-admin-search">
              <i className="fa-solid fa-magnifying-glass" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={t(
                  'সেবা খুঁজুন...',
                  'Search services...'
                )}
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >
              <option value="all">
                {t('সব সেবা', 'All Services')}
              </option>

              <option value="published">
                {t('প্রকাশিত', 'Published')}
              </option>

              <option value="draft">
                {t('খসড়া', 'Draft')}
              </option>
            </select>
          </div>

          {notice && (
            <div
              className="gov-admin-success"
              role="status"
            >
              <i className="fa-solid fa-circle-check" />
              {' '}
              {notice}
            </div>
          )}

          {!editingId && error && (
            <div
              className="gov-state gov-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="gov-state">
              <i className="fa-solid fa-spinner fa-spin" />
              {' '}
              {t('লোড হচ্ছে...', 'Loading...')}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="gov-state">
              <i className="fa-solid fa-folder-open" />

              <p>
                {t(
                  'কোনো সেবা পাওয়া যায়নি।',
                  'No services found.'
                )}
              </p>
            </div>
          ) : (
            <div className="gov-admin-table-wrap">
              <table className="gov-admin-table">
                <thead>
                  <tr>
                    <th>{t('সেবা', 'Service')}</th>
                    <th>{t('বিভাগ', 'Category')}</th>
                    <th>{t('অবস্থা', 'Status')}</th>
                    <th>{t('ওয়েবসাইট', 'Website')}</th>
                    <th>{t('অ্যাকশন', 'Actions')}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service._id}>
                      <td>
                        <strong>
                          {lang === 'bn'
                            ? service.titleBn
                            : service.titleEn}
                        </strong>

                        <small>{service.slug}</small>
                      </td>

                      <td>
                        {categoryLabel(
                          service.category
                        )}
                      </td>

                      <td>
                        <span
                          className={`gov-admin-status ${
                            service.published
                              ? 'published'
                              : 'draft'
                          }`}
                        >
                          {service.published
                            ? t(
                                'প্রকাশিত',
                                'Published'
                              )
                            : t(
                                'খসড়া',
                                'Draft'
                              )}
                        </span>
                      </td>

                      <td>
                        <a
                          href={service.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gov-admin-url"
                        >
                          {(() => {
                            try {
                              return new URL(
                                service.officialUrl
                              ).hostname;
                            } catch {
                              return service.officialUrl;
                            }
                          })()}

                          {' '}
                          <i className="fa-solid fa-arrow-up-right-from-square" />
                        </a>
                      </td>

                      <td>
                        <div className="gov-admin-row-actions">
                          <button
                            type="button"
                            title={t(
                              'সম্পাদনা',
                              'Edit'
                            )}
                            disabled={
                              busyId === service._id
                            }
                            onClick={() =>
                              openForm(service)
                            }
                          >
                            <i className="fa-solid fa-pen" />
                          </button>

                          <button
                            type="button"
                            title={
                              service.published
                                ? t(
                                    'অপ্রকাশ',
                                    'Unpublish'
                                  )
                                : t(
                                    'প্রকাশ',
                                    'Publish'
                                  )
                            }
                            disabled={
                              busyId === service._id
                            }
                            onClick={() =>
                              togglePublish(service)
                            }
                          >
                            <i
                              className={`fa-solid ${
                                service.published
                                  ? 'fa-eye-slash'
                                  : 'fa-eye'
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            className="danger"
                            title={t('মুছুন', 'Delete')}
                            disabled={
                              busyId === service._id
                            }
                            onClick={() =>
                              deleteService(service)
                            }
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Safety Notice */}

        <div className="gov-help">
          <i className="fa-solid fa-shield-halved" />

          <div>
            <strong>
              {t(
                'অ্যাডমিনের দায়িত্ব',
                'Administrator Responsibility'
              )}
            </strong>

            <p>
              {t(
                'Jonoseba Admin সরকারি সেবার তথ্য ও লিংক পরিচালনা করবে। সরকারি আবেদন অনুমোদন বা অর্থ গ্রহণ করবে না।',
                'Jonoseba administrators manage service information and links. Official approvals and payments are handled by government portals.'
              )}
            </p>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}

      {editingId !== null && (
        <div
          className="gov-admin-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="gov-admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gov-service-modal-title"
          >
            <form onSubmit={saveService}>
              <div className="gov-modal-header">
                <div>
                  <h2 id="gov-service-modal-title">
                    {editingId === 'new'
                      ? t(
                          'নতুন সেবা যোগ করুন',
                          'Add New Service'
                        )
                      : t(
                          'সেবা সম্পাদনা',
                          'Edit Service'
                        )}
                  </h2>

                  <p>
                    {t(
                      'বাংলা ও ইংরেজিতে সঠিক তথ্য লিখুন।',
                      'Enter accurate information in Bangla and English.'
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="gov-modal-close"
                  disabled={saving}
                  onClick={closeForm}
                  aria-label={t('বন্ধ করুন', 'Close')}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Error Inside Modal */}

              {error && (
                <div
                  className="gov-state gov-error"
                  role="alert"
                  style={{
                    padding: '12px 16px',
                    marginBottom: 18
                  }}
                >
                  {error}
                </div>
              )}

              <div className="gov-admin-fields">
                {/* No Unique Slug Input */}

                <label>
                  {t(
                    'সেবার নাম (ইংরেজি)',
                    'Service Title (English)'
                  )}

                  <input
                    type="text"
                    value={form.titleEn}
                    required
                    maxLength={160}
                    placeholder="e.g. Utility Bill Payment"
                    onChange={(event) =>
                      updateField(
                        'titleEn',
                        event.target.value
                      )
                    }
                  />

                  {editingId === 'new' &&
                    form.titleEn.trim() && (
                      <small
                        style={{
                          color: '#607c82',
                          fontWeight: 400,
                          marginTop: 3
                        }}
                      >
                        {t(
                          'স্বয়ংক্রিয় আইডি:',
                          'Automatic ID:'
                        )}
                        {' '}
                        <code>
                          {generateSlug(form.titleEn) ||
                            '—'}
                        </code>
                      </small>
                    )}
                </label>

                <label>
                  {t(
                    'সেবার নাম (বাংলা)',
                    'Service Title (Bangla)'
                  )}

                  <input
                    type="text"
                    value={form.titleBn}
                    required
                    maxLength={160}
                    placeholder="যেমন: ইউটিলিটি বিল পেমেন্ট"
                    onChange={(event) =>
                      updateField(
                        'titleBn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t('বিভাগ', 'Category')}

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        'category',
                        event.target.value
                      )
                    }
                  >
                    {categories.map(([key, bn, en]) => (
                      <option
                        key={key}
                        value={key}
                      >
                        {t(bn, en)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t(
                    'সরকারি ওয়েবসাইট',
                    'Official Website URL'
                  )}

                  <input
                    type="url"
                    value={form.officialUrl}
                    required
                    placeholder="https://example.gov.bd/"
                    onChange={(event) =>
                      updateField(
                        'officialUrl',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'সংক্ষিপ্ত বিবরণ (বাংলা)',
                    'Description (Bangla)'
                  )}

                  <textarea
                    rows={3}
                    required
                    value={form.summaryBn}
                    onChange={(event) =>
                      updateField(
                        'summaryBn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'সংক্ষিপ্ত বিবরণ (ইংরেজি)',
                    'Description (English)'
                  )}

                  <textarea
                    rows={3}
                    required
                    value={form.summaryEn}
                    onChange={(event) =>
                      updateField(
                        'summaryEn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'আবেদন পদ্ধতি (বাংলা)',
                    'Application Steps (Bangla)'
                  )}

                  <textarea
                    rows={5}
                    value={form.stepsBn}
                    placeholder={t(
                      'প্রতি লাইনে একটি করে ধাপ লিখুন',
                      'Enter one step per line'
                    )}
                    onChange={(event) =>
                      updateField(
                        'stepsBn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'আবেদন পদ্ধতি (ইংরেজি)',
                    'Application Steps (English)'
                  )}

                  <textarea
                    rows={5}
                    value={form.stepsEn}
                    placeholder="Enter one step per line"
                    onChange={(event) =>
                      updateField(
                        'stepsEn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'প্রয়োজনীয় কাগজপত্র (বাংলা)',
                    'Required Documents (Bangla)'
                  )}

                  <textarea
                    rows={3}
                    value={form.documentsBn}
                    placeholder={t(
                      'প্রতি লাইনে একটি তথ্য লিখুন',
                      'Enter one item per line'
                    )}
                    onChange={(event) =>
                      updateField(
                        'documentsBn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-field-wide">
                  {t(
                    'প্রয়োজনীয় কাগজপত্র (ইংরেজি)',
                    'Required Documents (English)'
                  )}

                  <textarea
                    rows={3}
                    value={form.documentsEn}
                    placeholder="Enter one item per line"
                    onChange={(event) =>
                      updateField(
                        'documentsEn',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  {t(
                    'তথ্য যাচাইয়ের তারিখ',
                    'Source Verification Date'
                  )}

                  <input
                    type="date"
                    value={form.sourceVerifiedAt}
                    onChange={(event) =>
                      updateField(
                        'sourceVerifiedAt',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="gov-admin-check">
                  <input
                    type="checkbox"
                    checked={Boolean(form.published)}
                    onChange={(event) =>
                      updateField(
                        'published',
                        event.target.checked
                      )
                    }
                  />

                  {t(
                    'নাগরিকদের জন্য প্রকাশ করুন',
                    'Publish for Citizens'
                  )}
                </label>
              </div>

              <div className="gov-modal-actions">
                <button
                  type="submit"
                  className="gov-link"
                  disabled={saving}
                >
                  <i className="fa-solid fa-floppy-disk" />
                  {' '}
                  {saving
                    ? t(
                        'সংরক্ষণ হচ্ছে...',
                        'Saving...'
                      )
                    : t(
                        'সংরক্ষণ করুন',
                        'Save Service'
                      )}
                </button>

                <button
                  type="button"
                  className="gov-detail-button"
                  disabled={saving}
                  onClick={closeForm}
                >
                  {t('বাতিল', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
