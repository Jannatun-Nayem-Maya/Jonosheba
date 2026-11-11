
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import {
  PageHeader,
  useApi,
  useToast,
  Loader,
  ErrorBox,
  Modal
} from '../components/ui.jsx';

import { STATUS } from './CitizenDashboard.jsx';

// ==========================================
// COMMON HELPERS
// ==========================================

const safeArray = (value) =>
  Array.isArray(value) ? value : [];

const dateValue = (value) =>
  value ? String(value).slice(0, 10) : '';

const LEVELS = [
  'secondary',
  'higher-secondary',
  'undergraduate',
  'masters',
  'phd'
];

const ALLOWED_USER_ROLES = [
  'user',
  'student',
  'volunteer'
];

// ==========================================
// CONTENT CONFIGURATION
// ==========================================

const CONTENT = {
  scholarships: {
    bn: 'বৃত্তি',
    en: 'Scholarships',
    icon: 'fa-graduation-cap',
    main: 'titleEn',
    sub: 'providerEn',
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true],
      ['titleBn', 'Title (Bangla)', 'text'],
      ['providerEn', 'Provider (English)', 'text'],
      ['providerBn', 'Provider (Bangla)', 'text'],
      ['category', 'Category', 'select',
        ['govt', 'international', 'university'], true],
      ['country', 'Country', 'text'],
      ['levels', 'Education Levels', 'levels'],
      ['minGpa', 'Minimum GPA', 'number'],
      ['gpaScale', 'GPA Scale', 'number'],
      ['fullyFunded', 'Fully Funded', 'checkbox'],
      ['deadline', 'Deadline', 'date'],
      ['link', 'Official Website', 'text'],
      ['descEn', 'Description (English)', 'textarea'],
      ['descBn', 'Description (Bangla)', 'textarea'],
      ['benefitsEn', 'Benefits (English)', 'text'],
      ['benefitsBn', 'Benefits (Bangla)', 'text']
    ],
    blank: {
      category: 'govt',
      levels: [],
      gpaScale: 4,
      fullyFunded: false
    }
  },

  alerts: {
    bn: 'দুর্যোগ সতর্কতা',
    en: 'Disaster Alerts',
    icon: 'fa-triangle-exclamation',
    main: 'titleEn',
    sub: 'district',
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true],
      ['titleBn', 'Title (Bangla)', 'text'],
      ['bodyEn', 'Details (English)', 'textarea'],
      ['bodyBn', 'Details (Bangla)', 'textarea'],
      ['district', 'District', 'text'],
      ['type', 'Type', 'select',
        ['flood', 'cyclone', 'erosion']],
      ['level', 'Severity', 'select',
        ['red', 'orange', 'yellow']],
      ['source', 'Source', 'text'],
      ['sourceUrl', 'Source URL', 'text']
    ],
    blank: {
      type: 'flood',
      level: 'yellow'
    }
  },

  shelters: {
    bn: 'আশ্রয়কেন্দ্র',
    en: 'Shelters',
    icon: 'fa-house-chimney-medical',
    main: 'nameEn',
    sub: 'district',
    fields: [
      ['nameEn', 'Name (English)', 'text', null, true],
      ['nameBn', 'Name (Bangla)', 'text'],
      ['addressEn', 'Address (English)', 'text'],
      ['addressBn', 'Address (Bangla)', 'text'],
      ['district', 'District', 'text'],
      ['capacity', 'Capacity', 'number'],
      ['occupied', 'Occupied', 'number'],
      ['officerEn', 'Officer (English)', 'text'],
      ['officerBn', 'Officer (Bangla)', 'text'],
      ['phone', 'Phone', 'text'],
      ['status', 'Status', 'select', ['open', 'closed']]
    ],
    blank: {
      status: 'open'
    }
  },

  hotlines: {
    bn: 'জরুরি নম্বর',
    en: 'Hotlines',
    icon: 'fa-phone-volume',
    main: 'nameEn',
    sub: 'number',
    fields: [
      ['nameEn', 'Name (English)', 'text', null, true],
      ['nameBn', 'Name (Bangla)', 'text'],
      ['number', 'Phone Number', 'text', null, true],
      ['descEn', 'Description (English)', 'textarea'],
      ['descBn', 'Description (Bangla)', 'textarea'],
      ['icon', 'Icon', 'text'],
      ['color', 'Color', 'text']
    ],
    blank: {}
  },

  welfare: {
    bn: 'কল্যাণ কর্মসূচি',
    en: 'Welfare Programs',
    icon: 'fa-people-group',
    main: 'titleEn',
    sub: 'monthly',
    fields: [
      ['key', 'Unique Key', 'text', null, true],
      ['titleEn', 'Title (English)', 'text', null, true],
      ['titleBn', 'Title (Bangla)', 'text'],
      ['descEn', 'Description (English)', 'textarea'],
      ['descBn', 'Description (Bangla)', 'textarea'],
      ['monthly', 'Monthly Allowance', 'number'],
      ['minAge', 'Minimum Age', 'number'],
      ['gender', 'Gender', 'select',
        ['any', 'male', 'female']],
      ['requires', 'Requirement', 'select',
        ['none', 'widow', 'disability']],
      ['ageNoteEn', 'Age Note (English)', 'text'],
      ['ageNoteBn', 'Age Note (Bangla)', 'text'],
      ['color', 'Color', 'text']
    ],
    blank: {
      gender: 'any',
      requires: 'none'
    }
  },

  events: {
    bn: 'স্বেচ্ছাসেবক ইভেন্ট',
    en: 'Volunteer Events',
    icon: 'fa-hand-holding-heart',
    main: 'titleEn',
    sub: 'locationEn',
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true],
      ['titleBn', 'Title (Bangla)', 'text'],
      ['locationEn', 'Location (English)', 'text'],
      ['locationBn', 'Location (Bangla)', 'text'],
      ['date', 'Event Date', 'date'],
      ['needed', 'Volunteers Needed', 'number'],
      ['urgent', 'Urgent', 'checkbox']
    ],
    blank: {
      urgent: false
    }
  }
};

// ==========================================
// CONTENT FORM
// ==========================================

function ContentForm({
  type,
  item,
  onSaved,
  onClose
}) {
  const { t } = useLang();
  const toast = useToast();
  const config = CONTENT[type];

  const [values, setValues] = useState(() => {
    const initial = item
      ? { ...item }
      : { ...config.blank };

    if (initial.deadline !== undefined) {
      initial.deadline = dateValue(initial.deadline);
    }

    if (initial.date !== undefined) {
      initial.date = dateValue(initial.date);
    }

    return initial;
  });

  const [saving, setSaving] = useState(false);

  const update = (name, value) => {
    setValues((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);

    try {
      const body = { ...values };

      config.fields.forEach(([name, , kind]) => {
        if (kind === 'number') {
          body[name] =
            values[name] === '' ||
            values[name] === undefined ||
            values[name] === null
              ? null
              : Number(values[name]);
        }

        if (kind === 'date' && !values[name]) {
          body[name] = null;
        }
      });

      if (item) {
        await api(
          `/admin/content/${type}/${item._id}`,
          {
            method: 'PUT',
            body
          }
        );
      } else {
        await api(
          `/admin/content/${type}`,
          {
            method: 'POST',
            body
          }
        );
      }

      toast(
        t('সংরক্ষণ করা হয়েছে', 'Saved successfully'),
        'success'
      );

      onSaved();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3>
        {item
          ? t('তথ্য সম্পাদনা', 'Edit Content')
          : t('নতুন তথ্য যোগ করুন', 'Add New Content')}
        {' — '}
        {t(config.bn, config.en)}
      </h3>

      <form className="form" onSubmit={save}>
        <div className="form-grid">
          {config.fields.map(
            ([name, label, kind, options, required]) => {
              if (kind === 'checkbox') {
                return (
                  <label key={name} className="check">
                    <input
                      type="checkbox"
                      checked={Boolean(values[name])}
                      onChange={(event) =>
                        update(name, event.target.checked)
                      }
                    />
                    {' '}
                    {label}
                  </label>
                );
              }

              if (kind === 'levels') {
                return (
                  <div
                    key={name}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    <strong>{label}</strong>

                    <div
                      className="chips"
                      style={{ marginTop: 10 }}
                    >
                      {LEVELS.map((level) => {
                        const selected =
                          safeArray(values.levels).includes(level);

                        return (
                          <button
                            type="button"
                            key={level}
                            className={`chip ${
                              selected ? 'on' : ''
                            }`}
                            onClick={() => {
                              const current =
                                safeArray(values.levels);

                              update(
                                'levels',
                                selected
                                  ? current.filter(
                                      (value) => value !== level
                                    )
                                  : [...current, level]
                              );
                            }}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <label
                  key={name}
                  style={
                    kind === 'textarea'
                      ? { gridColumn: '1 / -1' }
                      : undefined
                  }
                >
                  {label}
                  {required && ' *'}

                  {kind === 'select' ? (
                    <select
                      value={
                        values[name] ??
                        options?.[0] ??
                        ''
                      }
                      required={Boolean(required)}
                      onChange={(event) =>
                        update(name, event.target.value)
                      }
                    >
                      {options.map((option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : kind === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={values[name] ?? ''}
                      onChange={(event) =>
                        update(name, event.target.value)
                      }
                    />
                  ) : (
                    <input
                      type={kind}
                      required={Boolean(required)}
                      value={values[name] ?? ''}
                      onChange={(event) =>
                        update(name, event.target.value)
                      }
                    />
                  )}
                </label>
              );
            }
          )}
        </div>

        <div className="btn-row">
          <button
            type="submit"
            className="btn btn-success"
            disabled={saving}
          >
            <i className="fa-solid fa-floppy-disk" />
            {' '}
            {saving
              ? t('সংরক্ষণ হচ্ছে...', 'Saving...')
              : t('সংরক্ষণ', 'Save')}
          </button>

          <button
            type="button"
            className="btn btn-light"
            disabled={saving}
            onClick={onClose}
          >
            {t('বাতিল', 'Cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// CONTENT MANAGEMENT
// ==========================================

function ContentManager() {
  const { t } = useLang();
  const toast = useToast();

  const [type, setType] = useState('scholarships');
  const [editing, setEditing] = useState(null);

  const list = useApi(`/admin/content/${type}`);
  const config = CONTENT[type];

  const remove = async (id) => {
    const confirmed = window.confirm(
      t(
        'এই তথ্যটি স্থায়ীভাবে মুছে ফেলবেন?',
        'Delete this item permanently?'
      )
    );

    if (!confirmed) return;

    try {
      await api(
        `/admin/content/${type}/${id}`,
        { method: 'DELETE' }
      );

      toast(
        t('তথ্য মুছে ফেলা হয়েছে', 'Item deleted'),
        'info'
      );

      list.reload();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return (
    <div className="card pad">
      <div className="toolbar">
        <div className="chips">
          {Object.entries(CONTENT).map(
            ([key, value]) => (
              <button
                type="button"
                key={key}
                className={`chip ${
                  type === key ? 'on' : ''
                }`}
                onClick={() => {
                  setType(key);
                  setEditing(null);
                }}
              >
                <i className={`fa-solid ${value.icon}`} />
                {' '}
                {t(value.bn, value.en)}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={() => setEditing('new')}
        >
          <i className="fa-solid fa-plus" />
          {' '}
          {t('নতুন যোগ করুন', 'Add New')}
        </button>
      </div>

      {list.loading && <Loader />}
      <ErrorBox message={list.error} />

      {!list.loading &&
        !list.error &&
        safeArray(list.data).length === 0 && (
          <div className="notice">
            {t(
              'কোনো তথ্য পাওয়া যায়নি।',
              'No content found.'
            )}
          </div>
        )}

      {!list.loading &&
        !list.error &&
        safeArray(list.data).length > 0 && (
          <div
            className="table-wrap"
            style={{ marginTop: 14 }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('নাম', 'Title')}</th>
                  <th>{t('তথ্য', 'Information')}</th>
                  <th>{t('অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>

              <tbody>
                {list.data.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>

                    <td>
                      <strong>
                        {item[config.main] || '—'}
                      </strong>
                    </td>

                    <td>
                      {String(item[config.sub] ?? '—')}
                    </td>

                    <td>
                      <div className="btn-row">
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setEditing(item)}
                          aria-label={t('সম্পাদনা', 'Edit')}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(item._id)}
                          aria-label={t('মুছুন', 'Delete')}
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

      {editing && (
        <ContentForm
          key={`${type}-${
            editing === 'new'
              ? 'new'
              : editing._id
          }`}
          type={type}
          item={
            editing === 'new'
              ? null
              : editing
          }
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// BLOOD MANAGEMENT
// ==========================================

function BloodModeration({ onChange }) {
  const { t, fmtDate } = useLang();
  const toast = useToast();

  const [section, setSection] = useState('donors');
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('all');

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const isDonor = section === 'donors';

  const list = useApi(`/admin/blood/${section}`);
  const statistics = useApi('/admin/blood/stats');

  const bloodGroups = [
    'A+', 'A-', 'B+', 'B-',
    'AB+', 'AB-', 'O+', 'O-'
  ];

  const requestStatuses = [
    ['open', t('চলমান', 'Open')],
    ['fulfilled', t('পূরণ হয়েছে', 'Fulfilled')],
    ['cancelled', t('বাতিল', 'Cancelled')]
  ];

  const urgencyOptions = [
    ['Emergency', t('জরুরি', 'Emergency')],
    [
      'Within 24 Hours',
      t('২৪ ঘণ্টার মধ্যে', 'Within 24 Hours')
    ],
    ['Regular', t('সাধারণ', 'Regular')]
  ];

  const todayBD = () =>
    new Date(Date.now() + 6 * 3600000)
      .toISOString()
      .slice(0, 10);

  const refresh = () => {
    list.reload();
    statistics.reload();
    onChange?.();
  };

  const changeSection = (next) => {
    setSection(next);
    setSearch('');
    setBloodGroup('');
    setStatus('all');
    setEditing(null);
  };

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  const statusLabel = (value) =>
    requestStatuses.find(
      ([key]) => key === value
    )?.[1] || value;

  const urgencyLabel = (value) =>
    urgencyOptions.find(
      ([key]) => key === value
    )?.[1] || value;

  const requestIsOpen = (item) =>
    item?.status === 'open';

  const requestIsFinal = (item) =>
    item?.status === 'fulfilled' ||
    item?.status === 'cancelled';

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEdit = (item) => {
    if (!isDonor && !requestIsOpen(item)) {
      toast(
        t(
          'এই রক্তের অনুরোধ চূড়ান্ত হয়েছে। এটি আর পরিবর্তন করা যাবে না।',
          'This blood request is finalized and cannot be edited.'
        ),
        'info'
      );
      return;
    }

    setEditing(item);

    if (isDonor) {
      setForm({
        name: item.name || '',
        bloodGroup: item.bloodGroup || 'A+',
        location: item.location || '',
        phone: item.phone || '',
        lastDonation: dateValue(item.lastDonation),
        available: item.available === true
      });
    } else {
      setForm({
        patientName: item.patientName || '',
        bloodGroup: item.bloodGroup || 'A+',
        hospital: item.hospital || '',
        contactNumber: item.contactNumber || '',
        location: item.location || '',
        urgency: item.urgency || 'Emergency',
        status: item.status || 'open',
        details: item.details || ''
      });
    }
  };

  // ==========================================
  // SAVE EDIT
  // ==========================================

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!editing || saving) return;

    if (!isDonor && !requestIsOpen(editing)) {
      toast(
        t(
          'শুধু চলমান রক্তের অনুরোধ পরিবর্তন করা যাবে।',
          'Only open blood requests can be edited.'
        ),
        'error'
      );
      setEditing(null);
      return;
    }

    setSaving(true);

    try {
      await api(
        `/admin/blood/${section}/${editing._id}`,
        {
          method: 'PATCH',
          body: form
        }
      );

      toast(
        t(
          'তথ্য সফলভাবে আপডেট হয়েছে।',
          'Information updated successfully.'
        ),
        'success'
      );

      setEditing(null);
      setForm({});
      refresh();
    } catch (error) {
      toast(error.message, 'error');

      if (
        !isDonor &&
        (
          error.status === 409 ||
          error.message?.toLowerCase().includes('finaliz')
        )
      ) {
        setEditing(null);
        refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DONOR VERIFICATION
  // ==========================================

  const toggleVerification = async (donor) => {
    if (busyId !== null) return;

    const next = donor.verified !== true;

    const confirmed = window.confirm(
      next
        ? t(
            'দাতার নাম, রক্তের গ্রুপ ও যোগাযোগের তথ্য যাচাই করেছেন? এটি চিকিৎসাগত যোগ্যতার সনদ নয়।',
            'Have you checked the donor name, blood group and contact details? This is not medical eligibility certification.'
          )
        : t(
            'এই দাতার যাচাইকরণ বাতিল করবেন?',
            'Remove this donor verification?'
          )
    );

    if (!confirmed) return;

    setBusyId(donor._id);

    try {
      await api(
        `/admin/blood/donors/${donor._id}/verify`,
        {
          method: 'PATCH',
          body: { verified: next }
        }
      );

      toast(
        next
          ? t(
              'দাতার তথ্য যাচাই হয়েছে।',
              'Donor information verified.'
            )
          : t(
              'যাচাইকরণ বাতিল হয়েছে।',
              'Donor verification removed.'
            ),
        'success'
      );

      refresh();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // DONOR AVAILABILITY
  // ==========================================

  const toggleAvailability = async (donor) => {
    if (busyId !== null) return;

    const next = donor.available !== true;

    const confirmed = window.confirm(
      next
        ? t(
            'দাতার সম্মতি ও বর্তমান উপলব্ধতা নিশ্চিত করেছেন?',
            'Have you confirmed the donor consents and is currently available?'
          )
        : t(
            'দাতাকে পাবলিক তালিকা থেকে সরাবেন?',
            'Hide this donor from public search?'
          )
    );

    if (!confirmed) return;

    setBusyId(donor._id);

    try {
      await api(
        `/admin/blood/donors/${donor._id}`,
        {
          method: 'PATCH',
          body: { available: next }
        }
      );

      toast(
        t(
          'দাতার উপলব্ধতা আপডেট হয়েছে।',
          'Donor availability updated.'
        ),
        'success'
      );

      refresh();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // DELETE BLOOD RECORD
  // ==========================================

  const remove = async (item) => {
    if (busyId !== null) return;

    const confirmed = window.confirm(
      t(
        'এই রেকর্ড স্থায়ীভাবে মুছে ফেলবেন?',
        'Permanently delete this record?'
      )
    );

    if (!confirmed) return;

    setBusyId(item._id);

    try {
      await api(
        `/admin/blood/${section}/${item._id}`,
        { method: 'DELETE' }
      );

      toast(
        t(
          'রেকর্ড মুছে ফেলা হয়েছে।',
          'Record deleted successfully.'
        ),
        'info'
      );

      refresh();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredRows = safeArray(list.data).filter(
    (item) => {
      const searchableText = [
        item.name,
        item.patientName,
        item.location,
        item.hospital,
        item.phone,
        item.contactNumber
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          search.trim().toLowerCase()
        );

      const matchesGroup =
        !bloodGroup ||
        item.bloodGroup === bloodGroup;

      let matchesStatus = true;

      if (status !== 'all') {
        if (isDonor) {
          if (status === 'available') {
            matchesStatus = item.available === true;
          } else if (status === 'unavailable') {
            matchesStatus = item.available !== true;
          } else if (status === 'verified') {
            matchesStatus = item.verified === true;
          } else if (status === 'unverified') {
            matchesStatus = item.verified !== true;
          }
        } else {
          matchesStatus = item.status === status;
        }
      }

      return (
        matchesSearch &&
        matchesGroup &&
        matchesStatus
      );
    }
  );

  // ==========================================
  // FORM FIELD HELPERS
  // ==========================================

  const input = (
    key,
    bn,
    en,
    options = {}
  ) => (
    <label key={key}>
      {t(bn, en)}

      <input
        type={options.type || 'text'}
        value={form[key] ?? ''}
        required={options.required !== false}
        maxLength={options.maxLength}
        max={options.max}
        onChange={(event) =>
          updateField(key, event.target.value)
        }
      />
    </label>
  );

  const select = (
    key,
    bn,
    en,
    choices
  ) => (
    <label key={key}>
      {t(bn, en)}

      <select
        value={form[key] ?? ''}
        required
        onChange={(event) =>
          updateField(key, event.target.value)
        }
      >
        {choices.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );

  const groupChoices = bloodGroups.map(
    (group) => [group, group]
  );

  const stats = statistics.data || {};

  const summaryCards = [
    [
      t('মোট দাতা', 'Total Donors'),
      stats.totalDonors
    ],
    [
      t('উপলব্ধ দাতা', 'Available Donors'),
      stats.availableDonors
    ],
    [
      t('যাচাইকৃত দাতা', 'Verified Donors'),
      stats.verifiedDonors
    ],
    [
      t('চলমান রক্তের অনুরোধ', 'Open Blood Requests'),
      stats.openRequests
    ]
  ];

  return (
    <>
      <div className="card pad">

        <div className="toolbar">
          <div>
            <h3 className="card-title nomargin">
              <i className="fa-solid fa-droplet" />
              {' '}
              {t(
                'রক্তদান ব্যবস্থাপনা',
                'Blood Donation Management'
              )}
            </h3>

            <p className="muted small">
              {t(
                'রক্তদাতা ও রক্তের অনুরোধ পরিচালনা করুন।',
                'Manage blood donors and blood requests.'
              )}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={refresh}
          >
            <i className="fa-solid fa-rotate-right" />
            {' '}
            {t('রিফ্রেশ', 'Refresh')}
          </button>
        </div>

        <ErrorBox message={statistics.error} />

        {statistics.loading ? (
          <Loader />
        ) : (
          <div
            className="stat-row"
            style={{ marginTop: 18 }}
          >
            {summaryCards.map(([label, value]) => (
              <div className="stat" key={label}>
                <strong>
                  {statistics.error
                    ? '—'
                    : value ?? 0}
                </strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className="chips"
          style={{
            marginTop: 24,
            marginBottom: 18
          }}
        >
          <button
            type="button"
            className={`chip ${isDonor ? 'on' : ''}`}
            onClick={() => changeSection('donors')}
          >
            <i className="fa-solid fa-hand-holding-droplet" />
            {' '}
            {t('রক্তদাতা', 'Blood Donors')}
          </button>

          <button
            type="button"
            className={`chip ${!isDonor ? 'on' : ''}`}
            onClick={() => changeSection('requests')}
          >
            <i className="fa-solid fa-notes-medical" />
            {' '}
            {t('রক্তের অনুরোধ', 'Blood Requests')}
          </button>
        </div>

        {!isDonor && (
          <p className="muted small">
            <i className="fa-solid fa-circle-info" />
            {' '}
            {t(
              'শুধু চলমান অনুরোধ পরিবর্তন করা যাবে। পূরণ হয়েছে বা বাতিল হয়েছে এমন অনুরোধ চূড়ান্ত।',
              'Only open requests can be edited. Fulfilled and cancelled requests are finalized.'
            )}
          </p>
        )}

        <div
          className="inline-controls"
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 18,
            marginTop: 16
          }}
        >
          <input
            type="search"
            value={search}
            placeholder={t(
              'নাম, জেলা, হাসপাতাল বা ফোন',
              'Name, district, hospital or phone'
            )}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            style={{
              flex: '1 1 200px',
              minWidth: 150
            }}
          />

          <select
            value={bloodGroup}
            onChange={(event) =>
              setBloodGroup(event.target.value)
            }
            aria-label={t(
              'রক্তের গ্রুপ',
              'Blood Group'
            )}
          >
            <option value="">
              {t(
                'সব রক্তের গ্রুপ',
                'All Blood Groups'
              )}
            </option>

            {bloodGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            aria-label={t('অবস্থা', 'Status')}
          >
            <option value="all">
              {t('সব অবস্থা', 'All Statuses')}
            </option>

            {isDonor ? (
              <>
                <option value="available">
                  {t('উপলব্ধ', 'Available')}
                </option>
                <option value="unavailable">
                  {t('অনুপলব্ধ', 'Unavailable')}
                </option>
                <option value="verified">
                  {t('যাচাইকৃত', 'Verified')}
                </option>
                <option value="unverified">
                  {t('যাচাই হয়নি', 'Unverified')}
                </option>
              </>
            ) : (
              requestStatuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))
            )}
          </select>
        </div>

        <p className="muted small">
          {t(
            `${filteredRows.length}টি রেকর্ড দেখানো হচ্ছে`,
            `Showing ${filteredRows.length} records`
          )}
        </p>

        {list.loading && <Loader />}
        <ErrorBox message={list.error} />

        {!list.loading &&
          !list.error &&
          filteredRows.length === 0 && (
            <div className="notice">
              {t(
                'কোনো রেকর্ড পাওয়া যায়নি।',
                'No matching records found.'
              )}
            </div>
          )}

        {!list.loading &&
          !list.error &&
          filteredRows.length > 0 && (
            <div
              className="table-wrap"
              style={{ marginTop: 14 }}
            >
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('নাম', 'Name')}</th>
                    <th>{t('রক্তের গ্রুপ', 'Blood Group')}</th>
                    <th>{t('অবস্থান', 'Location')}</th>
                    <th>{t('ফোন', 'Phone')}</th>
                    <th>{t('অবস্থা', 'Status')}</th>

                    {isDonor ? (
                      <>
                        <th>
                          {t(
                            'শেষ রক্তদান',
                            'Last Donation'
                          )}
                        </th>
                        <th>
                          {t(
                            'যাচাই',
                            'Verification'
                          )}
                        </th>
                        <th>
                          {t(
                            'যাচাই করেছেন',
                            'Verified By'
                          )}
                        </th>
                      </>
                    ) : (
                      <th>
                        {t('জরুরি অবস্থা', 'Urgency')}
                      </th>
                    )}

                    <th>
                      {t('অ্যাকশন', 'Actions')}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <strong>
                          {isDonor
                            ? item.name
                            : item.patientName}
                        </strong>
                      </td>

                      <td>
                        <span className="badge badge-danger">
                          {item.bloodGroup}
                        </span>
                      </td>

                      <td>
                        {!isDonor && (
                          <>
                            {item.hospital}
                            <br />
                          </>
                        )}

                        <small className="muted">
                          {item.location}
                        </small>
                      </td>

                      <td>
                        {isDonor
                          ? item.phone
                          : item.contactNumber}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            isDonor
                              ? item.available
                                ? 'badge-success'
                                : 'badge-warning'
                              : item.status === 'fulfilled'
                                ? 'badge-success'
                                : item.status === 'cancelled'
                                  ? 'badge-warning'
                                  : 'badge-danger'
                          }`}
                        >
                          {isDonor
                            ? item.available
                              ? t('উপলব্ধ', 'Available')
                              : t('অনুপলব্ধ', 'Unavailable')
                            : statusLabel(item.status)}
                        </span>
                      </td>

                      {isDonor ? (
                        <>
                          <td>
                            {item.lastDonation
                              ? fmtDate(item.lastDonation)
                              : '—'}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                item.verified
                                  ? 'badge-success'
                                  : 'badge-warning'
                              }`}
                            >
                              {item.verified
                                ? t('যাচাইকৃত', 'Verified')
                                : t('যাচাই হয়নি', 'Unverified')}
                            </span>
                          </td>

                          <td>
                            {item.verified
                              ? t('অ্যাডমিন', 'Admin')
                              : '—'}
                          </td>
                        </>
                      ) : (
                        <td>
                          {urgencyLabel(item.urgency)}
                        </td>
                      )}

                      <td>
                        <div
                          className="btn-row"
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 7
                          }}
                        >
                          {(isDonor || requestIsOpen(item)) && (
                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              disabled={busyId !== null}
                              onClick={() => openEdit(item)}
                            >
                              <i className="fa-solid fa-pen" />
                              {' '}
                              {t('এডিট', 'Edit')}
                            </button>
                          )}

                          {!isDonor && requestIsFinal(item) && (
                            <span className="badge badge-soft">
                              <i className="fa-solid fa-lock" />
                              {' '}
                              {t(
                                'চূড়ান্ত / শুধু দেখুন',
                                'Finalized / View Only'
                              )}
                            </span>
                          )}

                          {isDonor && (
                            <>
                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                disabled={busyId !== null}
                                onClick={() =>
                                  toggleAvailability(item)
                                }
                              >
                                {item.available
                                  ? t(
                                      'অনুপলব্ধ করুন',
                                      'Set Unavailable'
                                    )
                                  : t(
                                      'উপলব্ধ করুন',
                                      'Set Available'
                                    )}
                              </button>

                              <button
                                type="button"
                                className="btn btn-light btn-sm"
                                disabled={busyId !== null}
                                onClick={() =>
                                  toggleVerification(item)
                                }
                              >
                                <i
                                  className={`fa-solid ${
                                    item.verified
                                      ? 'fa-xmark'
                                      : 'fa-check'
                                  }`}
                                />
                                {' '}
                                {item.verified
                                  ? t('যাচাই বাতিল', 'Unverify')
                                  : t('যাচাই করুন', 'Verify')}
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId !== null}
                            onClick={() => remove(item)}
                          >
                            <i className="fa-solid fa-trash" />
                            {' '}
                            {t('মুছুন', 'Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* EDIT MODAL */}
      {editing &&
        (
          isDonor ||
          editing.status === 'open'
        ) && (
          <Modal
            onClose={() => {
              if (!saving) setEditing(null);
            }}
          >
            <h3>
              {isDonor
                ? t(
                    'রক্তদাতার তথ্য সংশোধন',
                    'Edit Donor'
                  )
                : t(
                    'রক্তের অনুরোধ সংশোধন',
                    'Edit Blood Request'
                  )}
            </h3>

            <form
              className="form"
              onSubmit={saveEdit}
            >
              <div className="form-grid">
                {isDonor ? (
                  <>
                    {input(
                      'name',
                      'দাতার নাম',
                      'Donor Name',
                      { maxLength: 100 }
                    )}

                    {select(
                      'bloodGroup',
                      'রক্তের গ্রুপ',
                      'Blood Group',
                      groupChoices
                    )}

                    {input(
                      'location',
                      'জেলা / এলাকা',
                      'District / Location',
                      { maxLength: 120 }
                    )}

                    {input(
                      'phone',
                      'ফোন নম্বর',
                      'Phone Number',
                      { maxLength: 25 }
                    )}

                    {input(
                      'lastDonation',
                      'শেষ রক্তদানের তারিখ',
                      'Last Donation Date',
                      {
                        type: 'date',
                        required: false,
                        max: todayBD()
                      }
                    )}

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={form.available === true}
                        onChange={(event) =>
                          updateField(
                            'available',
                            event.target.checked
                          )
                        }
                      />
                      {' '}
                      {t(
                        'পাবলিক দাতা তালিকায় দেখান',
                        'Show in Public Donor List'
                      )}
                    </label>
                  </>
                ) : (
                  <>
                    {input(
                      'patientName',
                      'রোগীর নাম',
                      'Patient Name',
                      { maxLength: 120 }
                    )}

                    {select(
                      'bloodGroup',
                      'রক্তের গ্রুপ',
                      'Blood Group',
                      groupChoices
                    )}

                    {input(
                      'hospital',
                      'হাসপাতাল',
                      'Hospital',
                      { maxLength: 180 }
                    )}

                    {input(
                      'contactNumber',
                      'যোগাযোগের নম্বর',
                      'Contact Number',
                      { maxLength: 25 }
                    )}

                    {input(
                      'location',
                      'জেলা / এলাকা',
                      'Location',
                      { maxLength: 120 }
                    )}

                    {select(
                      'urgency',
                      'জরুরি অবস্থা',
                      'Urgency',
                      urgencyOptions
                    )}

                    {select(
                      'status',
                      'অনুরোধের অবস্থা',
                      'Request Status',
                      requestStatuses
                    )}

                    <label
                      style={{ gridColumn: '1 / -1' }}
                    >
                      {t('বিস্তারিত', 'Details')}

                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={form.details ?? ''}
                        onChange={(event) =>
                          updateField(
                            'details',
                            event.target.value
                          )
                        }
                      />
                    </label>
                  </>
                )}
              </div>

              <div
                className="btn-row"
                style={{ marginTop: 20 }}
              >
                <button
                  type="submit"
                  className="btn btn-success"
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
                        'পরিবর্তন সংরক্ষণ',
                        'Save Changes'
                      )}
                </button>

                <button
                  type="button"
                  className="btn btn-light"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  {t('বাতিল', 'Cancel')}
                </button>
              </div>
            </form>
          </Modal>
        )}
    </>
  );
}

// ==========================================
// USER MANAGEMENT
// ==========================================

function UserManager({ onChange }) {
  const { t, fmtDate } = useLang();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  const list = useApi(
    `/admin/users?q=${encodeURIComponent(query)}`
  );

  // ==========================================
  // USER PROTECTION
  // ==========================================

  const isCurrentUser = (userId) =>
    String(userId) === String(
      currentUser?.id || currentUser?._id
    );

  const getTarget = (userId) =>
    safeArray(list.data).find(
      (user) => String(user._id) === String(userId)
    );

  const isProtected = (user) =>
    !user ||
    user.role === 'admin' ||
    isCurrentUser(user._id);

  // ==========================================
  // UPDATE USER
  // ==========================================

  const updateUser = async (id, body) => {
    if (busyId !== null) return;

    const target = getTarget(id);

    // Do not allow changes to admin accounts.
    if (isProtected(target)) {
      toast(
        t(
          'অ্যাডমিন অ্যাকাউন্ট পরিবর্তন করা যাবে না।',
          'Admin accounts cannot be modified here.'
        ),
        'error'
      );
      return;
    }

    // Only regular non-admin roles are permitted.
    if (
      body.role !== undefined &&
      !ALLOWED_USER_ROLES.includes(body.role)
    ) {
      toast(
        t(
          'অ্যাডমিন ভূমিকা দেওয়ার অনুমতি নেই।',
          'Assigning the admin role is not permitted.'
        ),
        'error'
      );
      return;
    }

    setBusyId(id);

    try {
      await api(
        `/admin/users/${id}`,
        {
          method: 'PATCH',
          body
        }
      );

      toast(
        t(
          'ব্যবহারকারী আপডেট হয়েছে',
          'User updated'
        ),
        'success'
      );

      list.reload();
      onChange?.();

    } catch (error) {
      toast(error.message, 'error');

      list.reload();

    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const deleteUser = async (id) => {
    if (busyId !== null) return;

    const target = getTarget(id);

    if (isProtected(target)) {
      toast(
        t(
          'অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না।',
          'Admin accounts cannot be deleted here.'
        ),
        'error'
      );
      return;
    }

    const confirmed = window.confirm(
      t(
        'এই ব্যবহারকারীকে স্থায়ীভাবে মুছে ফেলবেন?',
        'Permanently delete this user?'
      )
    );

    if (!confirmed) return;

    setBusyId(id);

    try {
      await api(
        `/admin/users/${id}`,
        {
          method: 'DELETE'
        }
      );

      toast(
        t(
          'ব্যবহারকারী মুছে ফেলা হয়েছে',
          'User deleted'
        ),
        'info'
      );

      list.reload();
      onChange?.();

    } catch (error) {
      toast(error.message, 'error');

    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card pad">

      {/* SEARCH USERS */}
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search);
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={t(
            'নাম, ইমেইল বা ফোন খুঁজুন',
            'Search by name, email or phone'
          )}
          style={{ maxWidth: 350 }}
        />

        <button
          type="submit"
          className="btn btn-light btn-sm"
        >
          <i className="fa-solid fa-magnifying-glass" />
          {' '}
          {t('খুঁজুন', 'Search')}
        </button>
      </form>

      {/* INFORMATION */}
      <p
        className="muted small"
        style={{ marginTop: 12 }}
      >
        <i className="fa-solid fa-shield-halved" />
        {' '}
        {t(
          'অ্যাডমিন অ্যাকাউন্ট সুরক্ষিত। শুধু সাধারণ নাগরিক, শিক্ষার্থী ও স্বেচ্ছাসেবকের ভূমিকা পরিবর্তন করা যাবে।',
          'Admin accounts are protected. Only Citizen, Student and Volunteer roles can be assigned.'
        )}
      </p>

      {/* LOADING AND ERRORS */}
      {list.loading && <Loader />}
      <ErrorBox message={list.error} />

      {!list.loading &&
        !list.error &&
        safeArray(list.data).length === 0 && (
          <div className="notice">
            {t(
              'কোনো ব্যবহারকারী পাওয়া যায়নি।',
              'No users found.'
            )}
          </div>
        )}

      {/* USERS TABLE */}
      {!list.loading &&
        !list.error &&
        safeArray(list.data).length > 0 && (
          <div
            className="table-wrap"
            style={{ marginTop: 15 }}
          >
            <table className="table">
              <thead>
                <tr>
                  <th>{t('নাম', 'Name')}</th>
                  <th>{t('ইমেইল', 'Email')}</th>
                  <th>{t('ফোন', 'Phone')}</th>
                  <th>{t('ভূমিকা', 'Role')}</th>
                  <th>{t('যোগদান', 'Joined')}</th>
                  <th>{t('অবস্থা', 'Status')}</th>
                  <th>{t('অ্যাকশন', 'Actions')}</th>
                </tr>
              </thead>

              <tbody>
                {list.data.map((user) => {
                  const self = isCurrentUser(user._id);

                  const protectedAdmin =
                    user.role === 'admin';

                  const protectedAccount =
                    self || protectedAdmin;

                  return (
                    <tr key={user._id}>

                      {/* NAME */}
                      <td>
                        <strong>{user.name}</strong>
                      </td>

                      {/* EMAIL */}
                      <td>{user.email}</td>

                      {/* PHONE */}
                      <td>{user.phone || '—'}</td>

                      {/* ROLE */}
                      <td>
                        {protectedAdmin ? (
                          <span
                            className="badge badge-success"
                            title={t(
                              'অ্যাডমিনের ভূমিকা পরিবর্তন করা যাবে না',
                              'Admin role cannot be changed'
                            )}
                          >
                            <i className="fa-solid fa-shield-halved" />
                            {' '}
                            {t(
                              'অ্যাডমিন (সুরক্ষিত)',
                              'Admin (Protected)'
                            )}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            disabled={
                              protectedAccount ||
                              busyId !== null
                            }
                            aria-label={t(
                              'ব্যবহারকারীর ভূমিকা',
                              'User Role'
                            )}
                            onChange={(event) => {
                              const nextRole =
                                event.target.value;

                              if (
                                ALLOWED_USER_ROLES.includes(
                                  nextRole
                                )
                              ) {
                                updateUser(user._id, {
                                  role: nextRole
                                });
                              }
                            }}
                          >
                            {ALLOWED_USER_ROLES.map(
                              (role) => (
                                <option
                                  key={role}
                                  value={role}
                                >
                                  {role}
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </td>

                      {/* JOINED */}
                      <td>
                        {fmtDate(user.createdAt)}
                      </td>

                      {/* STATUS */}
                      <td>
                        <span
                          className={`badge ${
                            user.blocked
                              ? 'badge-danger'
                              : 'badge-success'
                          }`}
                        >
                          {user.blocked
                            ? t('ব্লকড', 'Blocked')
                            : t('সক্রিয়', 'Active')}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        {self ? (
                          <small className="muted">
                            {t('আপনি', 'You')}
                          </small>
                        ) : protectedAdmin ? (
                          <small className="muted">
                            <i className="fa-solid fa-lock" />
                            {' '}
                            {t('সুরক্ষিত', 'Protected')}
                          </small>
                        ) : (
                          <div className="btn-row">

                            {/* BLOCK / UNBLOCK */}
                            <button
                              type="button"
                              className="btn btn-light btn-sm"
                              disabled={busyId !== null}
                              onClick={() =>
                                updateUser(
                                  user._id,
                                  {
                                    blocked: !user.blocked
                                  }
                                )
                              }
                            >
                              <i
                                className={`fa-solid ${
                                  user.blocked
                                    ? 'fa-lock-open'
                                    : 'fa-ban'
                                }`}
                              />

                              {' '}

                              {user.blocked
                                ? t('আনব্লক', 'Unblock')
                                : t('ব্লক', 'Block')}
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={busyId !== null}
                              onClick={() =>
                                deleteUser(user._id)
                              }
                              aria-label={t(
                                'ব্যবহারকারী মুছুন',
                                'Delete User'
                              )}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>

                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

    </div>
  );
}

// ==========================================
// APPLICATION VERIFICATION
// ==========================================

function Applications({ onChange }) {
  const { t, fmtDate, lang } = useLang();
  const toast = useToast();

  const [filter, setFilter] = useState('pending');

  const apps = useApi(
    `/admin/applications?status=${filter}`
  );

  const decide = async (id, status) => {
    let note = '';

    if (status === 'rejected') {
      const answer = window.prompt(
        t(
          'আবেদন বাতিলের কারণ লিখুন (ঐচ্ছিক)',
          'Reason for rejection (optional)'
        )
      );

      if (answer === null) return;
      note = answer.trim();
    }

    try {
      await api(
        `/admin/applications/${id}`,
        {
          method: 'PATCH',
          body: {
            status,
            note
          }
        }
      );

      toast(
        status === 'approved'
          ? t(
              'আবেদন অনুমোদিত হয়েছে',
              'Application approved'
            )
          : t(
              'আবেদন বাতিল করা হয়েছে',
              'Application rejected'
            ),
        'success'
      );

      apps.reload();
      onChange?.();

    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const filters = [
    ['pending', 'যাচাইাধীন', 'Pending'],
    ['approved', 'অনুমোদিত', 'Approved'],
    ['rejected', 'বাতিল', 'Rejected'],
    ['', 'সব', 'All']
  ];

  return (
    <div className="card pad">

      <div className="toolbar">
        <h3 className="card-title nomargin">
          <i className="fa-solid fa-list-check text-success" />
          {' '}
          {t(
            'আবেদন যাচাই ও ব্যবস্থাপনা',
            'Application Verification'
          )}
        </h3>

        <div className="chips">
          {filters.map(([key, bn, en]) => (
            <button
              type="button"
              key={key}
              className={`chip ${
                filter === key ? 'on' : ''
              }`}
              onClick={() => setFilter(key)}
            >
              {lang === 'bn' ? bn : en}
            </button>
          ))}
        </div>
      </div>

      {apps.loading && <Loader />}
      <ErrorBox message={apps.error} />

      {!apps.loading &&
        !apps.error &&
        safeArray(apps.data).length === 0 && (
          <div className="notice">
            {t(
              'কোনো আবেদন নেই।',
              'No applications found.'
            )}
          </div>
        )}

      {!apps.loading &&
        !apps.error &&
        safeArray(apps.data).length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('নাম', 'Name')}</th>
                  <th>NID</th>
                  <th>{t('সেবা', 'Service')}</th>
                  <th>{t('জেলা', 'District')}</th>
                  <th>{t('তারিখ', 'Date')}</th>
                  <th>{t('প্রমাণ', 'Evidence')}</th>
                  <th>
                    {t(
                      'অবস্থা / অ্যাকশন',
                      'Status / Action'
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                {apps.data.map((application) => {
                  const statusInfo =
                    STATUS[application.status] || [
                      application.status,
                      application.status,
                      'badge-soft'
                    ];

                  return (
                    <tr key={application._id}>
                      <td>
                        <strong>
                          {application.trackingId}
                        </strong>
                      </td>

                      <td>
                        {application.applicantName || '—'}
                        <br />

                        <small className="muted">
                          {application.phone || ''}
                        </small>
                      </td>

                      <td>
                        {application.nid || '—'}
                      </td>

                      <td>
                        {application.service ||
                          t(
                            'ত্রাণ আবেদন',
                            'Relief Application'
                          )}
                      </td>

                      <td>
                        {application.district || '—'}
                      </td>

                      <td>
                        {fmtDate(application.createdAt)}
                      </td>

                      <td>
                        {application.evidence ? (
                          <a
                            href={`${
                              import.meta.env.VITE_API_URL
                                ? import.meta.env.VITE_API_URL.replace(
                                    /\/api\/?$/,
                                    ''
                                  )
                                : ''
                            }${application.evidence}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fa-solid fa-paperclip" />
                            {' '}
                            {t('দেখুন', 'View')}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>
                        {application.status === 'pending' ? (
                          <div className="btn-row">

                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() =>
                                decide(
                                  application._id,
                                  'approved'
                                )
                              }
                              title={t(
                                'অনুমোদন',
                                'Approve'
                              )}
                            >
                              <i className="fa-solid fa-check" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                decide(
                                  application._id,
                                  'rejected'
                                )
                              }
                              title={t(
                                'বাতিল',
                                'Reject'
                              )}
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>

                          </div>
                        ) : (
                          <span
                            className={`badge ${
                              statusInfo[2]
                            }`}
                          >
                            {statusInfo[
                              lang === 'bn' ? 0 : 1
                            ]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

    </div>
  );
}

// ==========================================
// MAIN ADMIN DASHBOARD
// ==========================================

export default function AdminDashboard() {
  const { t, num } = useLang();

  const [tab, setTab] = useState('apps');

  const stats = useApi('/admin/stats');

  const complaintStats = useApi(
    '/complaints/admin/stats'
  );

  const data = stats.data || {};
  const complaintData = complaintStats.data || {};
  const complaintCounts = complaintData.counts || {};

  const cards = [
    [
      'fa-users',
      data.users,
      t(
        'মোট ব্যবহারকারী',
        'Registered Users'
      ),
      ''
    ],
    [
      'fa-inbox',
      data.pending,
      t(
        'অপেক্ষমাণ আবেদন',
        'Pending Applications'
      ),
      'warn'
    ],
    [
      'fa-circle-check',
      data.approved,
      t(
        'অনুমোদিত আবেদন',
        'Approved Applications'
      ),
      'ok'
    ],
    [
      'fa-house-chimney-medical',
      data.shelters,
      t(
        'সক্রিয় আশ্রয়কেন্দ্র',
        'Active Shelters'
      ),
      ''
    ],
    [
      'fa-droplet',
      data.openBlood,
      t(
        'চলমান রক্তের অনুরোধ',
        'Open Blood Requests'
      ),
      'warn'
    ],
    [
      'fa-hand-holding-droplet',
      data.donors,
      t(
        'নিবন্ধিত রক্তদাতা',
        'Registered Donors'
      ),
      ''
    ]
  ];

  const tabs = [
    [
      'apps',
      'fa-list-check',
      t('আবেদন', 'Applications')
    ],
    [
      'content',
      'fa-pen-to-square',
      t(
        'কনটেন্ট ম্যানেজমেন্ট',
        'Content Management'
      )
    ],
    [
      'blood',
      'fa-droplet',
      t(
        'রক্ত মডারেশন',
        'Blood Moderation'
      )
    ],
    [
      'users',
      'fa-users-gear',
      t(
        'ব্যবহারকারী',
        'Users'
      )
    ]
  ];

  return (
    <>
      <PageHeader
        icon="fa-user-shield"
        tone="dark"
        title={t(
          'প্রশাসক ড্যাশবোর্ড',
          'Admin Control Panel'
        )}
        subtitle={t(
          'আবেদন যাচাই, অভিযোগ ব্যবস্থাপনা, কনটেন্ট ও ব্যবহারকারী নিয়ন্ত্রণ',
          'Manage applications, complaints, content and users'
        )}
      />

      <div className="container section">

        {/* GENERAL STATISTICS */}
        <ErrorBox message={stats.error} />

        {stats.loading && <Loader />}

        <div className="stat-row">
          {cards.map(
            ([icon, value, label, tone]) => (
              <div
                className={`stat ${tone}`}
                key={label}
              >
                <i className={`fa-solid ${icon}`} />
                <strong>
                  {num(value ?? 0)}
                </strong>
                <span>{label}</span>
              </div>
            )
          )}
        </div>

        {/* COMPLAINT MANAGEMENT */}
        <div
          className="card pad"
          style={{
            marginTop: 22,
            marginBottom: 22
          }}
        >
          <div
            className="toolbar"
            style={{
              alignItems: 'center',
              gap: 16
            }}
          >
            <div>
              <h3 className="card-title nomargin">
                <i className="fa-solid fa-clipboard-list text-primary" />
                {' '}
                {t(
                  'নাগরিক অভিযোগ ব্যবস্থাপনা',
                  'Citizen Complaint Management'
                )}
              </h3>

              <p
                className="muted"
                style={{ margin: '10px 0 0' }}
              >
                {t(
                  'নাগরিকদের অভিযোগ দেখুন, অগ্রাধিকার নির্ধারণ করুন, বিভাগ নির্বাচন করুন এবং সমাধানের অগ্রগতি আপডেট করুন।',
                  'Review citizen complaints, assign priority and departments, and update resolution progress.'
                )}
              </p>
            </div>

            <Link
              to="/admin/complaints"
              className="btn btn-primary"
            >
              <i className="fa-solid fa-arrow-right" />
              {' '}
              {t(
                'অভিযোগ ব্যবস্থাপনা',
                'Manage Complaints'
              )}
            </Link>
          </div>

          <ErrorBox message={complaintStats.error} />

          {complaintStats.loading ? (
            <Loader />
          ) : !complaintStats.error ? (
            <div
              className="stat-row"
              style={{ marginTop: 20 }}
            >
              {[
                [
                  complaintData.total || 0,
                  t(
                    'মোট অভিযোগ',
                    'Total Complaints'
                  ),
                  ''
                ],
                [
                  complaintCounts.pending || 0,
                  t('অপেক্ষমাণ', 'Pending'),
                  'warn'
                ],
                [
                  (complaintCounts.in_progress || 0) +
                    (complaintCounts.reopened || 0),
                  t(
                    'চলমান অভিযোগ',
                    'Active Complaints'
                  ),
                  ''
                ],
                [
                  complaintCounts.resolved || 0,
                  t(
                    'সমাধান হয়েছে',
                    'Resolved'
                  ),
                  'ok'
                ]
              ].map(([value, label, tone]) => (
                <div
                  className={`stat ${tone}`}
                  key={label}
                >
                  <strong>{num(value)}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* GOVERNMENT E-SERVICES */}
        <div
          className="card pad"
          style={{ marginBottom: 22 }}
        >
          <div
            className="toolbar"
            style={{
              alignItems: 'center',
              gap: 14
            }}
          >
            <div>
              <h3 className="card-title nomargin">
                <i className="fa-solid fa-building-columns text-primary" />
                {' '}
                {t(
                  'সরকারি ই-সেবা ব্যবস্থাপনা',
                  'Government E-Services Management'
                )}
              </h3>

              <p
                className="muted"
                style={{ margin: '8px 0 0' }}
              >
                {t(
                  'সরকারি সেবার লিংক, নির্দেশনা ও প্রকাশনা পরিচালনা করুন।',
                  'Manage official service links, guides and publishing.'
                )}
              </p>
            </div>

            <Link
              to="/admin/gov-services"
              className="btn btn-primary"
            >
              {t(
                'সেবা পরিচালনা',
                'Manage E-Services'
              )}
              {' '}
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>

        {/* MANAGEMENT TABS */}
        <div
          className="chips"
          style={{ marginBottom: 16 }}
        >
          {tabs.map(([key, icon, label]) => (
            <button
              type="button"
              key={key}
              className={`chip ${
                tab === key ? 'on' : ''
              }`}
              onClick={() => setTab(key)}
            >
              <i className={`fa-solid ${icon}`} />
              {' '}
              {label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {tab === 'apps' && (
          <Applications onChange={stats.reload} />
        )}

        {tab === 'content' && (
          <ContentManager />
        )}

        {tab === 'blood' && (
          <BloodModeration onChange={stats.reload} />
        )}

        {tab === 'users' && (
          <UserManager onChange={stats.reload} />
        )}

      </div>
    </>
  );
}
