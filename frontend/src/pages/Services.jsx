
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import { PageHeader } from '../components/ui.jsx';

// ==========================================
// SERVICES DATA
// ==========================================

const services = [
  {
    id: 'nid',
    icon: 'fa-id-card',
    href: 'https://services.nidw.gov.bd',
    ext: true,
    tag: 'official',
    bn: [
      'জাতীয় পরিচয়পত্র (NID)',
      'নতুন এনআইডি আবেদন, তথ্য সংশোধন এবং ডাউনলোড সেবা।',
      'সেবা নিন'
    ],
    en: [
      'National ID (NID)',
      'New NID application, data correction and download services.',
      'Access Service'
    ]
  },

  {
    id: 'passport',
    icon: 'fa-passport',
    href: 'https://www.epassport.gov.bd',
    ext: true,
    tag: 'official',
    bn: [
      'ই-পাসপোর্ট সেবা',
      'অনলাইন পাসপোর্ট আবেদন, ফি প্রদান ও স্ট্যাটাস চেক।',
      'সেবা নিন'
    ],
    en: [
      'E-Passport Services',
      'Online passport application, fee payment and status check.',
      'Access Service'
    ]
  },

  {
    id: 'birth-death',
    icon: 'fa-baby',
    href: 'https://bdris.gov.bd',
    ext: true,
    tag: 'official',
    bn: [
      'জন্ম ও মৃত্যু নিবন্ধন',
      'নতুন নিবন্ধন আবেদন ও অনলাইন সনদ যাচাই।',
      'সেবা নিন'
    ],
    en: [
      'Birth & Death Registration',
      'New registration and online certificate verification.',
      'Access Service'
    ]
  },

  {
    id: 'relief',
    icon: 'fa-hands-holding-child',
    href: '/relief-apply',
    adminHref: '/admin',
    ext: false,
    tag: 'portal',
    adminAction: [
      'আবেদন ব্যবস্থাপনা',
      'Manage Applications'
    ],
    adminDescription: [
      'নাগরিকদের ত্রাণ আবেদন পর্যালোচনা এবং অনুমোদন বা বাতিল করুন।',
      'Review and process relief applications submitted by citizens.'
    ],
    bn: [
      'ত্রাণ সহায়তা',
      'দুর্যোগপীড়িত এলাকার জন্য ত্রাণ সহায়তার আবেদন।',
      'আবেদন করুন'
    ],
    en: [
      'Relief Aid',
      'Relief aid application for disaster-affected people.',
      'Apply Now'
    ]
  },

  {
    id: 'blood',
    icon: 'fa-droplet',
    href: '/health',
    adminHref: '/admin',
    ext: false,
    tag: 'portal',
    adminAction: [
      'রক্তদান ব্যবস্থাপনা',
      'Manage Blood Requests'
    ],
    adminDescription: [
      'রক্তদাতা ও রক্তের অনুরোধ পর্যালোচনা এবং পরিচালনা করুন।',
      'Review donors and manage blood requests.'
    ],
    bn: [
      'রক্তদাতা ও রক্তের অনুরোধ',
      'রক্তদাতা খুঁজুন এবং জরুরি অনুরোধ পোস্ট করুন।',
      'দেখুন'
    ],
    en: [
      'Blood Donation',
      'Find donors and post emergency blood requests.',
      'Explore'
    ]
  },

  {
    id: 'disaster',
    icon: 'fa-triangle-exclamation',
    href: '/disaster-alerts',
    ext: false,
    tag: 'portal',
    bn: [
      'দুর্যোগ সতর্কতা',
      'আবহাওয়া ও প্রাকৃতিক দুর্যোগের আগাম সতর্কতা।',
      'বিস্তারিত'
    ],
    en: [
      'Disaster Alerts',
      'Early warnings about weather and natural disasters.',
      'View Alerts'
    ]
  },

  {
    id: 'welfare',
    icon: 'fa-people-group',
    href: '/welfare-programs',
    adminHref: '/admin',
    ext: false,
    tag: 'portal',
    adminAction: [
      'কল্যাণ কর্মসূচি ব্যবস্থাপনা',
      'Manage Welfare Programs'
    ],
    adminDescription: [
      'কল্যাণ কর্মসূচির তথ্য যোগ, সংশোধন ও পরিচালনা করুন।',
      'Create, edit and manage welfare program information.'
    ],
    bn: [
      'কল্যাণ কর্মসূচি',
      'সামাজিক নিরাপত্তা ভাতার যোগ্যতা ও আবেদন সংক্রান্ত তথ্য।',
      'দেখুন'
    ],
    en: [
      'Welfare Programs',
      'Social safety net eligibility and application information.',
      'Explore'
    ]
  },

  {
    id: 'emergency',
    icon: 'fa-phone-volume',
    href: '/emergency-contacts',
    ext: false,
    tag: 'portal',
    bn: [
      'জরুরি যোগাযোগ',
      'গুরুত্বপূর্ণ হটলাইন নম্বরগুলো খুঁজে নিন।',
      'দেখুন'
    ],
    en: [
      'Emergency Contacts',
      'Find important emergency hotline numbers.',
      'View'
    ]
  },

  {
    id: 'volunteer',
    icon: 'fa-hand-holding-heart',
    href: '/volunteer',
    adminHref: '/admin',
    ext: false,
    tag: 'portal',
    adminAction: [
      'অ্যাডমিন ড্যাশবোর্ড',
      'Admin Dashboard'
    ],
    adminDescription: [
      'অ্যাডমিন ড্যাশবোর্ডে স্বেচ্ছাসেবক ইভেন্ট ও সংশ্লিষ্ট তথ্য পরিচালনা করুন।',
      'Open the Admin Dashboard to manage volunteer events and related content.'
    ],
    bn: [
      'স্বেচ্ছাসেবক',
      'জনসেবামূলক কাজে স্বেচ্ছাসেবক হিসেবে যুক্ত হন।',
      'দেখুন'
    ],
    en: [
      'Volunteer',
      'Join community service activities as a volunteer.',
      'Explore'
    ]
  },

  {
    id: 'service-request',
    icon: 'fa-file-signature',
    href: '/service-apply/general',
    adminHref: '/admin',
    ext: false,
    tag: 'portal',
    adminAction: [
      'আবেদন ব্যবস্থাপনা',
      'Manage Applications'
    ],
    adminDescription: [
      'নাগরিকদের সেবার আবেদন পর্যালোচনা ও পরিচালনা করুন।',
      'Review and process citizen service requests.'
    ],
    bn: [
      'সাধারণ সেবার আবেদন',
      'নাগরিক সনদ, সহায়তা বা অন্যান্য সেবার জন্য আবেদন।',
      'আবেদন করুন'
    ],
    en: [
      'General Service Request',
      'Apply for certificates, support or other services.',
      'Apply Now'
    ]
  },

  {
    id: 'government',
    icon: 'fa-building-columns',
    href: '/gov-services',
    ext: false,
    tag: 'portal',
    bn: [
      'সরকারি ই-সেবা কেন্দ্র',
      'সরকারি সেবা, আবেদন নির্দেশনা ও অফিসিয়াল লিংক এক জায়গায়।',
      'সেবা দেখুন'
    ],
    en: [
      'Government E-Services Hub',
      'Browse official government service guides, categories and links in one place.',
      'Explore Services'
    ]
  },

  {
    id: 'complaints',
    icon: 'fa-clipboard-list',
    href: '/complaints',
    adminHref: '/admin/complaints',
    ext: false,
    tag: 'portal',
    adminAction: [
      'অভিযোগ ব্যবস্থাপনা',
      'Manage Complaints'
    ],
    adminDescription: [
      'নাগরিকদের অভিযোগ পর্যালোচনা, অগ্রাধিকার নির্ধারণ ও সমাধানের অগ্রগতি পরিচালনা করুন।',
      'Review citizen complaints, assign priorities and manage resolution progress.'
    ],
    bn: [
      'নাগরিক অভিযোগ ও সমাধান',
      'রাস্তা, পানি, বিদ্যুৎ ও অন্যান্য নাগরিক সমস্যা জানান এবং অভিযোগের অগ্রগতি দেখুন।',
      'অভিযোগ জানান'
    ],
    en: [
      'Citizen Complaint & Tracking',
      'Report road, water, electricity and other public issues and track their progress.',
      'Report an Issue'
    ]
  }
];

// ==========================================
// SERVICE CARD
// ==========================================

function ServiceCard({ service, isAdmin, lang, t }) {
  const content =
    lang === 'bn' ? service.bn : service.en;

  const [title, citizenDescription, citizenAction] =
    content;

  const adminMode =
    isAdmin &&
    !service.ext &&
    Boolean(service.adminHref);

  const description = adminMode
    ? service.adminDescription[
        lang === 'bn' ? 0 : 1
      ]
    : citizenDescription;

  const actionLabel = adminMode
    ? service.adminAction[
        lang === 'bn' ? 0 : 1
      ]
    : citizenAction;

  const destination = adminMode
    ? service.adminHref
    : service.href;

  return (
    <div className="card feature">

      {/* SERVICE ICON */}
      <div className="icon-circle tone-primary">
        <i
          className={`fa-solid ${service.icon}`}
          aria-hidden="true"
        />
      </div>

      {/* OFFICIAL WEBSITE BADGE */}
      {service.ext && (
        <span className="badge badge-soft">
          <i className="fa-solid fa-shield-halved" />
          {' '}

          {t(
            'অফিসিয়াল সরকারি সাইট',
            'Official gov site'
          )}
        </span>
      )}

      {/* TITLE */}
      <h3>{title}</h3>

      {/* DESCRIPTION */}
      <p className="muted">
        {description}
      </p>

      {/* ACTION */}
      {service.ext ? (
        <a
          href={destination}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
        >
          {actionLabel}
          {' '}

          <i
            className="fa-solid fa-arrow-up-right-from-square"
            aria-hidden="true"
          />
        </a>
      ) : (
        <Link
          to={destination}
          className="btn btn-outline btn-sm"
        >
          {actionLabel}
          {' '}

          <i
            className="fa-solid fa-arrow-right"
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}

// ==========================================
// MAIN SERVICES PAGE
// ==========================================

export default function Services() {
  const { t, lang } = useLang();
  const { user } = useAuth();

  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');

  const isAdmin =
    String(user?.role || '').toLowerCase() ===
    'admin';

  const normalizedQuery =
    q.trim().toLowerCase();

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const list = services.filter((service) => {
    const baseContent =
      lang === 'bn'
        ? service.bn
        : service.en;

    const adminMode =
      isAdmin &&
      Boolean(service.adminHref) &&
      !service.ext;

    const title = baseContent[0];

    const description = adminMode
      ? service.adminDescription[
          lang === 'bn' ? 0 : 1
        ]
      : baseContent[1];

    const buttonLabel = adminMode
      ? service.adminAction[
          lang === 'bn' ? 0 : 1
        ]
      : baseContent[2];

    const matchesTag =
      tag === 'all' ||
      service.tag === tag;

    const searchableText = [
      title,
      description,
      buttonLabel
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !normalizedQuery ||
      searchableText.includes(normalizedQuery);

    return matchesTag && matchesSearch;
  });

  return (
    <>
      {/* PAGE HEADER */}
      <PageHeader
        icon="fa-building-columns"
        title={t(
          'নাগরিক সেবা ডিরেক্টরি',
          'Digital Citizen Services Directory'
        )}
        subtitle={
          isAdmin
            ? t(
                'নাগরিক সেবা ও প্রশাসনিক ব্যবস্থাপনা এক জায়গায়।',
                'Access citizen services and administrative management tools in one place.'
              )
            : t(
                'জনসেবা পোর্টালের মাধ্যমে আপনার প্রয়োজনীয় সরকারি সেবা গ্রহণ করুন।',
                'Access essential digital government services through Jonoseba Portal.'
              )
        }
      />

      <div className="container section">

        {/* ADMIN INFORMATION */}
        {isAdmin && (
          <div
            className="notice"
            style={{
              marginBottom: 22
            }}
          >
            <i className="fa-solid fa-circle-info" />
            {' '}

            {t(
              'আপনি অ্যাডমিন হিসেবে লগইন করেছেন। আবেদন ও নিবন্ধনের পরিবর্তে সংশ্লিষ্ট ব্যবস্থাপনা অপশন দেখানো হচ্ছে।',
              'You are logged in as an administrator. Management options are shown instead of citizen application and registration actions.'
            )}
          </div>
        )}

        {/* SEARCH & FILTER */}
        <div className="toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />

            <input
              type="search"
              value={q}
              onChange={(event) =>
                setQ(event.target.value)
              }
              placeholder={t(
                'সেবা খুঁজুন...',
                'Search services...'
              )}
              aria-label={t(
                'সেবা খুঁজুন',
                'Search services'
              )}
            />
          </div>

          <div className="chips">
            {[
              [
                'all',
                t('সব', 'All')
              ],
              [
                'official',
                t(
                  'সরকারি ওয়েবসাইট',
                  'Official Sites'
                )
              ],
              [
                'portal',
                t(
                  'এই পোর্টাল',
                  'This Portal'
                )
              ]
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`chip ${
                  tag === key ? 'on' : ''
                }`}
                onClick={() =>
                  setTag(key)
                }
                aria-pressed={tag === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* NO SEARCH RESULTS */}
        {list.length === 0 && (
          <div className="notice">
            <i className="fa-solid fa-circle-info" />
            {' '}

            {t(
              'কোনো সেবা পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।',
              'No services found. Try another search term.'
            )}
          </div>
        )}

        {/* SERVICES GRID */}
        <div className="grid grid-3">
          {list.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isAdmin={isAdmin}
              lang={lang}
              t={t}
            />
          ))}
        </div>

      </div>
    </>
  );
}
