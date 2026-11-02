
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { PageHeader } from '../components/ui.jsx';

const services = [
  {
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
    icon: 'fa-hands-holding-child',
    href: '/relief-apply',
    tag: 'portal',
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
    icon: 'fa-droplet',
    href: '/health',
    tag: 'portal',
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
    icon: 'fa-triangle-exclamation',
    href: '/disaster-alerts',
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
    icon: 'fa-people-group',
    href: '/welfare-programs',
    tag: 'portal',
    bn: [
      'কল্যাণ কর্মসূচি',
      'সামাজিক নিরাপত্তা ভাতার যোগ্যতা ও আবেদন।',
      'দেখুন'
    ],
    en: [
      'Welfare Programs',
      'Social safety net eligibility and application.',
      'Explore'
    ]
  },
  {
    icon: 'fa-phone-volume',
    href: '/emergency-contacts',
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
    icon: 'fa-hand-holding-heart',
    href: '/volunteer',
    tag: 'portal',
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
    icon: 'fa-file-signature',
    href: '/service-apply/general',
    tag: 'portal',
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

  { icon:'fa-building-columns',href:'/gov-services',tag:'portal',bn:['সরকারি ই-সেবা কেন্দ্র','সরকারি সেবা, আবেদন নির্দেশনা ও অফিসিয়াল লিংক এক জায়গায়।','সেবা দেখুন'],en:['Government E-Services Hub','Browse official government service guides, categories and links in one place.','Explore services'] },
  // Citizen Complaint & Tracking
  {
    icon: 'fa-clipboard-list',
    href: '/complaints',
    tag: 'portal',
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

export default function Services() {
  const { t, lang } = useLang();

  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');

  const normalizedQuery = q.trim().toLowerCase();

  const list = services.filter((service) => {
    const content = lang === 'bn' ? service.bn : service.en;
    const [title, description] = content;

    const matchesTag =
      tag === 'all' || service.tag === tag;

    const matchesSearch =
      !normalizedQuery ||
      `${title} ${description}`
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesTag && matchesSearch;
  });

  return (
    <>
      <PageHeader
        icon="fa-building-columns"
        title={t(
          'নাগরিক সেবা ডিরেক্টরি',
          'Digital Citizen Services Directory'
        )}
        subtitle={t(
          'জনসেবা পোর্টালের মাধ্যমে আপনার প্রয়োজনীয় সরকারি সেবা গ্রহণ করুন।',
          'Access essential digital government services through Jonoseba Portal.'
        )}
      />

      <div className="container section">
        {/* Search and Filter Section */}
        <div className="toolbar">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass" />

            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t(
                'সেবা খুঁজুন…',
                'Search services…'
              )}
              aria-label={t(
                'সেবা খুঁজুন',
                'Search services'
              )}
            />
          </div>

          <div className="chips">
            {[
              ['all', t('সব', 'All')],
              ['official', t('সরকারি ওয়েবসাইট', 'Official sites')],
              ['portal', t('এই পোর্টাল', 'This portal')]
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={`chip ${tag === key ? 'on' : ''}`}
                onClick={() => setTag(key)}
                aria-pressed={tag === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* No Search Results */}
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

        {/* Services Grid */}
        <div className="grid grid-3">
          {list.map((service) => {
            const [title, description, buttonLabel] =
              lang === 'bn'
                ? service.bn
                : service.en;

            return (
              <div
                className="card feature"
                key={service.href}
              >
                {/* Service Icon */}
                <div className="icon-circle tone-primary">
                  <i
                    className={`fa-solid ${service.icon}`}
                    aria-hidden="true"
                  />
                </div>

                {/* Official Website Badge */}
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

                {/* Title */}
                <h3>{title}</h3>

                {/* Description */}
                <p className="muted">{description}</p>

                {/* Action Button */}
                {service.ext ? (
                  <a
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    {buttonLabel}
                    {' '}
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                ) : (
                  <Link
                    to={service.href}
                    className="btn btn-outline btn-sm"
                  >
                    {buttonLabel}
                    {' '}
                    <i className="fa-solid fa-arrow-right" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
