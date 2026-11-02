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

// ----------------------------------------
// Content Management Configuration
// ----------------------------------------

const LEVELS = [
  'secondary',
  'higher-secondary',
  'undergraduate',
  'masters',
  'phd'
];

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
      ['category', 'Category', 'select', ['govt', 'international', 'university'], true],
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
      ['type', 'Type', 'select', ['flood', 'cyclone', 'erosion']],
      ['level', 'Severity', 'select', ['red', 'orange', 'yellow']],
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
      ['gender', 'Gender', 'select', ['any', 'male', 'female']],
      ['requires', 'Requirement', 'select', ['none', 'widow', 'disability']],
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

const dateValue = (value) =>
  value ? String(value).slice(0, 10) : '';

// ----------------------------------------
// Content Add / Edit Form
// ----------------------------------------

function ContentForm({ type, item, onSaved, onClose }) {
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
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const save = async (event) => {
    event.preventDefault();
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

      toast(t('সংরক্ষণ করা হয়েছে', 'Saved successfully'));
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
                      onChange={(e) =>
                        update(name, e.target.checked)
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
                        const selected = (
                          values.levels || []
                        ).includes(level);

                        return (
                          <button
                            type="button"
                            key={level}
                            className={`chip ${
                              selected ? 'on' : ''
                            }`}
                            onClick={() => {
                              const current =
                                values.levels || [];

                              update(
                                'levels',
                                selected
                                  ? current.filter(
                                      (x) => x !== level
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
                      onChange={(e) =>
                        update(name, e.target.value)
                      }
                      required={Boolean(required)}
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
                      onChange={(e) =>
                        update(name, e.target.value)
                      }
                    />
                  ) : (
                    <input
                      type={kind}
                      value={values[name] ?? ''}
                      required={Boolean(required)}
                      onChange={(e) =>
                        update(name, e.target.value)
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
            onClick={onClose}
          >
            {t('বাতিল', 'Cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ----------------------------------------
// Content Management
// ----------------------------------------

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

      toast(t('তথ্য মুছে ফেলা হয়েছে', 'Item deleted'), 'info');
      list.reload();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return (
    <div className="card pad">
      <div className="toolbar">
        <div className="chips">
          {Object.entries(CONTENT).map(([key, value]) => (
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
          ))}
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
        (list.data || []).length === 0 && (
          <div className="notice">
            {t(
              'কোনো তথ্য পাওয়া যায়নি।',
              'No content found.'
            )}
          </div>
        )}

      {(list.data || []).length > 0 && (
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
                        aria-label="Edit"
                      >
                        <i className="fa-solid fa-pen" />
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => remove(item._id)}
                        aria-label="Delete"
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
          key={`${type}-${editing === 'new'
            ? 'new'
            : editing._id}`}
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

// ----------------------------------------
// Blood Moderation
// ----------------------------------------

function BloodModeration({ onChange }) {
  const { t, fmtDate } = useLang();
  const toast = useToast();

  const [section, setSection] = useState('requests');

  const list = useApi(`/admin/blood/${section}`);

  const remove = async (id) => {
    const confirmed = window.confirm(
      t(
        'এই তথ্যটি মুছে ফেলবেন?',
        'Delete this record?'
      )
    );

    if (!confirmed) return;

    try {
      await api(
        `/admin/blood/${section}/${id}`,
        { method: 'DELETE' }
      );

      toast(t('মুছে ফেলা হয়েছে', 'Deleted'), 'info');

      list.reload();
      onChange();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return (
    <div className="card pad">
      <div className="chips">
        <button
          type="button"
          className={`chip ${
            section === 'requests' ? 'on' : ''
          }`}
          onClick={() => setSection('requests')}
        >
          {t('রক্তের অনুরোধ', 'Blood Requests')}
        </button>

        <button
          type="button"
          className={`chip ${
            section === 'donors' ? 'on' : ''
          }`}
          onClick={() => setSection('donors')}
        >
          {t('রক্তদাতা', 'Blood Donors')}
        </button>
      </div>

      {list.loading && <Loader />}
      <ErrorBox message={list.error} />

      {!list.loading &&
        !list.error &&
        (list.data || []).length === 0 && (
          <div className="notice">
            {t('কোনো তথ্য নেই।', 'No records found.')}
          </div>
        )}

      {(list.data || []).length > 0 && (
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
                <th>{t('তারিখ', 'Date')}</th>
                <th>{t('অ্যাকশন', 'Actions')}</th>
              </tr>
            </thead>

            <tbody>
              {list.data.map((item) => (
                <tr key={item._id}>
                  <td>
                    {section === 'requests'
                      ? item.patientName
                      : item.name}
                  </td>

                  <td>
                    <span className="badge badge-danger">
                      {item.bloodGroup}
                    </span>
                  </td>

                  <td>
                    {section === 'requests' && (
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
                    {section === 'requests'
                      ? item.contactNumber
                      : item.phone}
                  </td>

                  <td>{fmtDate(item.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(item._id)}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------
// User Management
// ----------------------------------------

function UserManager({ onChange }) {
  const { t, fmtDate } = useLang();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const list = useApi(
    `/admin/users?q=${encodeURIComponent(query)}`
  );

  const updateUser = async (id, body) => {
    try {
      await api(`/admin/users/${id}`, {
        method: 'PATCH',
        body
      });

      toast(
        t('ব্যবহারকারী আপডেট হয়েছে', 'User updated'),
        'success'
      );

      list.reload();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const deleteUser = async (id) => {
    const confirmed = window.confirm(
      t(
        'এই ব্যবহারকারীকে স্থায়ীভাবে মুছে ফেলবেন?',
        'Permanently delete this user?'
      )
    );

    if (!confirmed) return;

    try {
      await api(`/admin/users/${id}`, {
        method: 'DELETE'
      });

      toast(
        t('ব্যবহারকারী মুছে ফেলা হয়েছে', 'User deleted'),
        'info'
      );

      list.reload();
      onChange();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  return (
    <div className="card pad">
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search);
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {list.loading && <Loader />}
      <ErrorBox message={list.error} />

      {(list.data || []).length > 0 && (
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
                const self =
                  String(user._id) ===
                  String(currentUser?.id || currentUser?._id);

                return (
                  <tr key={user._id}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>

                    <td>{user.email}</td>

                    <td>{user.phone || '—'}</td>

                    <td>
                      <select
                        value={user.role}
                        disabled={self}
                        onChange={(event) =>
                          updateUser(user._id, {
                            role: event.target.value
                          })
                        }
                      >
                        {[
                          'user',
                          'student',
                          'volunteer',
                          'admin'
                        ].map((role) => (
                          <option
                            key={role}
                            value={role}
                          >
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{fmtDate(user.createdAt)}</td>

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

                    <td>
                      {self ? (
                        <small className="muted">
                          {t('আপনি', 'You')}
                        </small>
                      ) : (
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() =>
                              updateUser(user._id, {
                                blocked: !user.blocked
                              })
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

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              deleteUser(user._id)
                            }
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

// ----------------------------------------
// Application Verification
// ----------------------------------------

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
      await api(`/admin/applications/${id}`, {
        method: 'PATCH',
        body: {
          status,
          note
        }
      });

      toast(
        status === 'approved'
          ? t('আবেদন অনুমোদিত হয়েছে', 'Application approved')
          : t('আবেদন বাতিল করা হয়েছে', 'Application rejected'),
        'success'
      );

      apps.reload();
      onChange();
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
        (apps.data || []).length === 0 && (
          <div className="notice">
            {t('কোনো আবেদন নেই।', 'No applications found.')}
          </div>
        )}

      {(apps.data || []).length > 0 && (
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
                <th>{t('অবস্থা / অ্যাকশন', 'Status / Action')}</th>
              </tr>
            </thead>

            <tbody>
              {apps.data.map((application) => {
                const statusInfo = STATUS[application.status] || [
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

                    <td>{application.nid || '—'}</td>

                    <td>
                      {application.service ||
                        t('ত্রাণ আবেদন', 'Relief Application')}
                    </td>

                    <td>{application.district || '—'}</td>

                    <td>{fmtDate(application.createdAt)}</td>

                    <td>
                      {application.evidence ? (
                        <a
                          href={
                            `${import.meta.env.VITE_API_URL
                              ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
                              : ''}${application.evidence}`
                          }
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
                              decide(application._id, 'approved')
                            }
                            title={t('অনুমোদন', 'Approve')}
                          >
                            <i className="fa-solid fa-check" />
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              decide(application._id, 'rejected')
                            }
                            title={t('বাতিল', 'Reject')}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`badge ${statusInfo[2]}`}
                        >
                          {statusInfo[lang === 'bn' ? 0 : 1]}
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

// ----------------------------------------
// Main Admin Dashboard
// ----------------------------------------

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
      t('মোট ব্যবহারকারী', 'Registered Users'),
      ''
    ],
    [
      'fa-inbox',
      data.pending,
      t('অপেক্ষমাণ আবেদন', 'Pending Applications'),
      'warn'
    ],
    [
      'fa-circle-check',
      data.approved,
      t('অনুমোদিত আবেদন', 'Approved Applications'),
      'ok'
    ],
    [
      'fa-house-chimney-medical',
      data.shelters,
      t('সক্রিয় আশ্রয়কেন্দ্র', 'Active Shelters'),
      ''
    ],
    [
      'fa-droplet',
      data.openBlood,
      t('চলমান রক্তের অনুরোধ', 'Open Blood Requests'),
      'warn'
    ],
    [
      'fa-hand-holding-droplet',
      data.donors,
      t('নিবন্ধিত রক্তদাতা', 'Registered Donors'),
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
      t('কনটেন্ট ম্যানেজমেন্ট', 'Content Management')
    ],
    [
      'blood',
      'fa-droplet',
      t('রক্ত মডারেশন', 'Blood Moderation')
    ],
    [
      'users',
      'fa-users-gear',
      t('ব্যবহারকারী', 'Users')
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

        {/* General Statistics */}

        <ErrorBox message={stats.error} />

        {stats.loading && <Loader />}

        <div className="stat-row">
          {cards.map(([icon, value, label, tone]) => (
            <div
              className={`stat ${tone}`}
              key={label}
            >
              <i className={`fa-solid ${icon}`} />

              <strong>{num(value ?? 0)}</strong>

              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Citizen Complaint Management */}

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
                  t('মোট অভিযোগ', 'Total Complaints'),
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
                  t('চলমান অভিযোগ', 'Active Complaints'),
                  ''
                ],
                [
                  complaintCounts.resolved || 0,
                  t('সমাধান হয়েছে', 'Resolved'),
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

        <div className="card pad" style={{marginBottom:22}}><div className="toolbar" style={{alignItems:'center',gap:14}}><div><h3 className="card-title nomargin"><i className="fa-solid fa-building-columns text-primary" />{' '}{t('সরকারি ই-সেবা ব্যবস্থাপনা','Government E-Services Management')}</h3><p className="muted" style={{margin:'8px 0 0'}}>{t('সরকারি সেবার লিংক, নির্দেশনা ও প্রকাশনা পরিচালনা করুন।','Manage official service links, guides and publishing.')}</p></div><Link className="btn btn-primary" to="/admin/gov-services">{t('সেবা পরিচালনা','Manage E-Services')} <i className="fa-solid fa-arrow-right" /></Link></div></div>
        {/* Existing Management Tabs */}

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

        {/* Tab Contents */}

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