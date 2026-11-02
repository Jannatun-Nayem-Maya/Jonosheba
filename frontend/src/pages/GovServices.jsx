
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';

import './GovServices.css';

const CATEGORIES = [
  ['all', 'fa-border-all', 'সব সেবা', 'All Services'],
  ['land', 'fa-map', 'ভূমি সেবা', 'Land Services'],
  ['transport', 'fa-car', 'বিআরটিএ', 'BRTA'],
  ['rail', 'fa-train', 'রেলওয়ে', 'Railway'],
  ['police', 'fa-shield-halved', 'পুলিশ', 'Police'],
  ['fees', 'fa-receipt', 'সরকারি ফি', 'Government Fees'],
  ['grs', 'fa-comments', 'অভিযোগ', 'GRS'],
  ['utility', 'fa-bolt', 'ইউটিলিটি বিল', 'Utility Bills'],
  ['jobs', 'fa-briefcase', 'সরকারি চাকরি', 'Government Jobs']
];

const REMOVED_SERVICES = new Set([
  'brta-fee',
  'learner-licence'
]);

const getCategory = (key) =>
  CATEGORIES.find(([value]) => value === key);

function localized(item, field, language) {
  const suffix = language === 'bn' ? 'Bn' : 'En';

  return (
    item[`${field}${suffix}`] ??
    item[`${field}En`] ??
    ''
  );
}

function validOfficialUrl(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== 'https:') {
      return null;
    }

    if (
      hostname !== 'gov.bd' &&
      !hostname.endsWith('.gov.bd')
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export default function GovServices() {
  const { t, lang, num } = useLang();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchServices() {
      try {
        const result = await api('/gov-services');

        if (active) {
          setServices(
            Array.isArray(result) ? result : []
          );
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to load services.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchServices();

    return () => {
      active = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const search = query.trim().toLowerCase();

    return services.filter((service) => {
      if (REMOVED_SERVICES.has(service.slug)) {
        return false;
      }

      const matchesCategory =
        category === 'all' ||
        service.category === category;

      const searchable = [
        service.titleBn,
        service.titleEn,
        service.summaryBn,
        service.summaryEn,
        service.category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesCategory &&
        (!search || searchable.includes(search))
      );
    });
  }, [services, query, category]);

  const toggleGuide = (id) => {
    setExpandedId((current) =>
      current === id ? null : id
    );
  };

  return (
    <div className="gov-page gov-citizen-page">

      {/* Hero Section */}

      <section className="gov-hero">
        <div className="container gov-hero-inner">

          <div className="gov-kicker">
            <i className="fa-solid fa-building-columns" />
            <span>
              {t(
                'সরকারি ই-সেবা কেন্দ্র',
                'GOVERNMENT E-SERVICES HUB'
              )}
            </span>
          </div>

          <h1>
            {t(
              'আপনার প্রয়োজনীয় সরকারি সেবা খুঁজুন',
              'Find the Government Service You Need'
            )}
          </h1>

          <p>
            {t(
              'বিভিন্ন সরকারি সেবার তথ্য, আবেদন পদ্ধতি ও সংশ্লিষ্ট ওয়েবসাইট এক জায়গায় খুঁজে নিন।',
              'Find government service information, application guides and relevant official websites in one place.'
            )}
          </p>

          <div className="gov-search">
            <i className="fa-solid fa-magnifying-glass" />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder={t(
                'যেমন: চাকরি, বিদ্যুৎ বিল, খতিয়ান...',
                'Search jobs, utility bills, land records...'
              )}
              aria-label={t('সেবা খুঁজুন', 'Search services')}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('মুছুন', 'Clear search')}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="container gov-content">

        {/* Admin Shortcut - visible to admins only */}

        {isAdmin && (
          <div className="gov-admin-shortcut">
            <div className="gov-admin-shortcut-icon">
              <i className="fa-solid fa-user-shield" />
            </div>

            <div className="gov-admin-shortcut-text">
              <strong>
                {t(
                  'সেবা ব্যবস্থাপনা',
                  'Service Management'
                )}
              </strong>

              <p>
                {t(
                  'সরকারি সেবার তথ্য যোগ, সম্পাদনা ও প্রকাশ করুন।',
                  'Add, edit and publish government service information.'
                )}
              </p>
            </div>

            <Link
              className="gov-link"
              to="/admin/gov-services"
            >
              <i className="fa-solid fa-sliders" />
              {t('ম্যানেজ করুন', 'Manage Services')}
            </Link>
          </div>
        )}

        {/* Compact information note */}

        <div className="gov-disclaimer">
          <i className="fa-solid fa-circle-info" />

          <span>
            {t(
              'সরকারি সেবার তথ্য ও আবেদন নির্দেশনা। আবেদন ও পেমেন্ট সংশ্লিষ্ট সরকারি পোর্টালে সম্পন্ন করুন।',
              'Government service information and application guides. Applications and payments are completed through the relevant official portals.'
            )}
          </span>
        </div>

        {/* Service Heading */}

        <div className="gov-topline">
          <div>
            <h2>
              {t(
                'সরকারি সেবাসমূহ',
                'Explore Services'
              )}
            </h2>

            <p>
              {t(
                'আপনার প্রয়োজনীয় সেবাটি নির্বাচন করুন।',
                'Choose the service you need.'
              )}
            </p>
          </div>

          <div className="gov-count">
            {num(filteredServices.length)}
            {' '}
            {t('টি সেবা', 'Services')}
          </div>
        </div>

        {/* Category Navigation */}

        <div
          className="gov-cats"
          role="group"
          aria-label={t(
            'সেবার বিভাগ',
            'Service categories'
          )}
        >
          {CATEGORIES.map(([key, icon, bn, en]) => (
            <button
              key={key}
              type="button"
              className={
                category === key ? 'selected' : ''
              }
              aria-pressed={category === key}
              onClick={() => {
                setCategory(key);
                setExpandedId(null);
              }}
            >
              <i className={`fa-solid ${icon}`} />
              <span>{t(bn, en)}</span>
            </button>
          ))}
        </div>

        {/* States */}

        {loading ? (
          <div className="gov-state">
            <i className="fa-solid fa-spinner fa-spin" />
            <p>
              {t(
                'সেবা লোড হচ্ছে...',
                'Loading services...'
              )}
            </p>
          </div>
        ) : error ? (
          <div className="gov-state gov-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" />
            <p>{error}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="gov-state">
            <i className="fa-solid fa-magnifying-glass" />

            <h3>
              {t(
                'কোনো সেবা পাওয়া যায়নি',
                'No services found'
              )}
            </h3>

            <p>
              {t(
                'অন্য নাম বা বিভাগ দিয়ে খুঁজুন।',
                'Try another search or category.'
              )}
            </p>
          </div>
        ) : (

          /* Service Cards */

          <div className="gov-grid">
            {filteredServices.map((service) => {
              const group = getCategory(service.category);

              const title = localized(
                service,
                'title',
                lang
              );

              const summary = localized(
                service,
                'summary',
                lang
              );

              const rawSteps = localized(
                service,
                'steps',
                lang
              );

              const rawDocuments = localized(
                service,
                'documents',
                lang
              );

              const steps = Array.isArray(rawSteps)
                ? rawSteps
                : [];

              const documents = Array.isArray(rawDocuments)
                ? rawDocuments
                : [];

              const officialLink = validOfficialUrl(
                service.officialUrl
              );

              const expanded =
                expandedId === service._id;

              return (
                <article
                  key={service._id}
                  className={`gov-card ${
                    expanded ? 'gov-card-expanded' : ''
                  }`}
                >
                  <div className="gov-card-top">
                    <div className="gov-icon">
                      <i
                        className={`fa-solid ${
                          group?.[1] || 'fa-landmark'
                        }`}
                      />
                    </div>
                  </div>

                  <span className="gov-category-label">
                    {group
                      ? t(group[2], group[3])
                      : service.category}
                  </span>

                  <h3>{title}</h3>

                  <p className="gov-card-summary">
                    {summary}
                  </p>

                  <div className="gov-card-actions">
                    <button
                      type="button"
                      className="gov-detail-button"
                      aria-expanded={expanded}
                      onClick={() =>
                        toggleGuide(service._id)
                      }
                    >
                      <i
                        className={`fa-solid ${
                          expanded
                            ? 'fa-chevron-up'
                            : 'fa-book-open'
                        }`}
                      />

                      {expanded
                        ? t('বন্ধ করুন', 'Hide Guide')
                        : t('নির্দেশনা', 'View Guide')}
                    </button>

                    {officialLink ? (
                      <a
                        href={officialLink}
                        className="gov-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>
                          {t(
                            'সরকারি ওয়েবসাইট',
                            'Official Website'
                          )}
                        </span>

                        <i className="fa-solid fa-arrow-up-right-from-square" />
                      </a>
                    ) : (
                      <span
                        className="gov-link gov-link-disabled"
                      >
                        {t(
                          'লিংক পাওয়া যায়নি',
                          'Link Unavailable'
                        )}
                      </span>
                    )}
                  </div>

                  {/* Expandable Guide - no duplicated link */}

                  {expanded && (
                    <div className="gov-detail">
                      <h4>
                        <i className="fa-solid fa-list-ol" />
                        {t(
                          'কীভাবে সেবাটি পাবেন',
                          'How to Access This Service'
                        )}
                      </h4>

                      {steps.length > 0 ? (
                        <ol>
                          {steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      ) : (
                        <p>
                          {t(
                            'সংশ্লিষ্ট সরকারি পোর্টালে সেবার নির্দেশনা দেখুন।',
                            'Check the government portal for service instructions.'
                          )}
                        </p>
                      )}

                      {documents.length > 0 && (
                        <>
                          <h4>
                            <i className="fa-solid fa-folder-open" />
                            {t(
                              'প্রয়োজনীয় তথ্য ও কাগজপত্র',
                              'Required Information and Documents'
                            )}
                          </h4>

                          <ul>
                            {documents.map((document, index) => (
                              <li key={index}>{document}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Safety note */}

        <div className="gov-help">
          <i className="fa-solid fa-shield-halved" />

          <div>
            <strong>
              {t(
                'নিরাপত্তা নির্দেশনা',
                'Safety Reminder'
              )}
            </strong>

            <p>
              {t(
                'Jonoseba-তে সরকারি পোর্টালের পাসওয়ার্ড বা OTP লিখবেন না। কোনো পেমেন্টের আগে ওয়েবসাইটের ঠিকানা যাচাই করুন।',
                'Do not enter government portal passwords or OTPs on Jonoseba. Verify the website address before making a payment.'
              )}
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
