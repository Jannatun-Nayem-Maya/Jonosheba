
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  ComplaintPhoto
} from './Complaints.jsx';
import './Complaints.css';

const PRIORITIES = [
  ['low', 'কম', 'Low'],
  ['medium', 'মাঝারি', 'Medium'],
  ['high', 'বেশি', 'High'],
  ['critical', 'জরুরি', 'Critical']
];

const DEPARTMENTS = [
  ['unassigned', 'নির্ধারিত নয়', 'Unassigned'],
  ['roads', 'সড়ক বিভাগ', 'Roads'],
  ['water', 'পানি বিভাগ', 'Water'],
  ['electricity', 'বিদ্যুৎ বিভাগ', 'Electricity'],
  ['sanitation', 'পরিচ্ছন্নতা বিভাগ', 'Sanitation'],
  ['general', 'সাধারণ প্রশাসন', 'General Administration']
];

const STATUS_OPTIONS = [
  ['pending', 'অপেক্ষমাণ', 'Pending'],
  ['in_progress', 'কাজ চলছে', 'In Progress'],
  ['resolved', 'সমাধান হয়েছে', 'Resolved'],
  ['rejected', 'বাতিল', 'Rejected'],
  ['reopened', 'পুনরায় চালু', 'Reopened']
];

export default function AdminComplaints() {
  const { t, lang, fmtDate } = useLang();
  const bn = lang === 'bn';

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);

  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selected, setSelected] = useState(null);
  const [edit, setEdit] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const displayOption = (items, value) => {
    const item = items.find(i => i[0] === value);
    return item ? item[bn ? 1 : 2] : value;
  };

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();

      if (filter !== 'all') params.set('status', filter);
      if (category !== 'all') params.set('category', category);
      if (searchTerm.trim()) params.set('q', searchTerm.trim());

      const [list, summary] = await Promise.all([
        api(`/complaints/admin?${params}`),
        api('/complaints/admin/stats')
      ]);

      setComplaints(list);
      setStats(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filter, category, searchTerm]);

  async function viewComplaint(id) {
    setError('');
    setSuccess('');

    try {
      const complaint = await api(`/complaints/${id}`);
      setSelected(complaint);

      setEdit({
        status: complaint.status,
        priority: complaint.priority,
        department: complaint.department,
        adminResponse: complaint.adminResponse || ''
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveComplaint(event) {
    event.preventDefault();
    if (!selected || !edit || saving) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api(`/complaints/${selected._id}/admin`, {
        method: 'PATCH',
        body: edit
      });

      setSuccess(t(
        'অভিযোগের তথ্য আপডেট হয়েছে।',
        'Complaint updated successfully.'
      ));

      await viewComplaint(selected._id);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cmp-page">
      <header className="cmp-hero">
        <div className="container">
          <span className="cmp-eyebrow">
            <i className="fa-solid fa-shield-halved" />
            {' '}JONOSEBA ADMINISTRATION
          </span>

          <h1>{t(
            'অভিযোগ ব্যবস্থাপনা',
            'Complaint Management'
          )}</h1>

          <p>{t(
            'নাগরিক অভিযোগ পর্যালোচনা, দায়িত্ব নির্ধারণ ও অগ্রগতি আপডেট করুন।',
            'Review complaints, assign departments and update progress.'
          )}</p>
        </div>
      </header>

      <div className="container cmp-container">
        <div className="cmp-actions">
          <Link className="cmp-outline" to="/admin">
            <i className="fa-solid fa-arrow-left" />
            {t('অ্যাডমিন ড্যাশবোর্ড', 'Admin Dashboard')}
          </Link>

          <button className="cmp-outline" onClick={loadData}>
            <i className="fa-solid fa-rotate" />
            {t('রিফ্রেশ', 'Refresh')}
          </button>
        </div>

        <div className="cmp-stats">
          {[
            ['total', 'মোট অভিযোগ', 'Total'],
            ['pending', 'অপেক্ষমাণ', 'Pending'],
            ['in_progress', 'কাজ চলছে', 'In Progress'],
            ['resolved', 'সমাধান হয়েছে', 'Resolved'],
            ['reopened', 'পুনরায় চালু', 'Reopened']
          ].map(([key, nameBn, nameEn]) => (
            <div className="cmp-stat" key={key}>
              <strong>
                {key === 'total'
                  ? stats?.total ?? 0
                  : stats?.counts?.[key] ?? 0}
              </strong>
              <span>{bn ? nameBn : nameEn}</span>
            </div>
          ))}
        </div>

        <section className="cmp-card">
          <div className="cmp-section-head">
            <div>
              <h2>{t('সব অভিযোগ', 'All Complaints')}</h2>
              <p>{t(
                'সার্চ, ফিল্টার এবং অভিযোগ নির্বাচন করুন।',
                'Search, filter and select a complaint.'
              )}</p>
            </div>
          </div>

          <div className="cmp-filters">
            <form
              onSubmit={e => {
                e.preventDefault();
                setSearchTerm(query);
              }}
            >
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t(
                  'ID, শিরোনাম বা জেলা...',
                  'Tracking ID, title or district...'
                )}
              />
              <button className="cmp-primary">
                {t('খুঁজুন', 'Search')}
              </button>
            </form>

            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label={t('অবস্থা', 'Status')}
            >
              <option value="all">
                {t('সব অবস্থা', 'All Statuses')}
              </option>
              {STATUS_OPTIONS.map(item => (
                <option key={item[0]} value={item[0]}>
                  {bn ? item[1] : item[2]}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label={t('ক্যাটাগরি', 'Category')}
            >
              <option value="all">
                {t('সব ক্যাটাগরি', 'All Categories')}
              </option>

              {COMPLAINT_CATEGORIES.map(item => (
                <option key={item[0]} value={item[0]}>
                  {bn ? item[1] : item[2]}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="cmp-error">{error}</div>}
          {success && <div className="cmp-success">{success}</div>}

          {loading && <p>{t('লোড হচ্ছে...', 'Loading...')}</p>}

          {!loading && complaints.length === 0 && (
            <div className="cmp-empty">
              {t('কোনো অভিযোগ পাওয়া যায়নি।', 'No complaints found.')}
            </div>
          )}

          <div className="cmp-complaint-list">
            {complaints.map(item => (
              <button
                key={item._id}
                className={`cmp-list-item ${
                  selected?._id === item._id ? 'active' : ''
                }`}
                onClick={() => viewComplaint(item._id)}
              >
                <div>
                  <span className="cmp-id">{item.trackingId}</span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.district}
                    {' · '}{item.user?.name || 'Citizen'}
                    {' · '}{fmtDate(item.createdAt)}
                  </small>
                </div>

                <span className={`cmp-status ${item.status}`}>
                  {displayOption(STATUS_OPTIONS, item.status)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {selected && edit && (
          <section className="cmp-card" id="cmp-admin-editor">
            <div className="cmp-section-head">
              <div>
                <span className="cmp-id">{selected.trackingId}</span>
                <h2>{selected.title}</h2>
              </div>

              <button
                className="cmp-outline"
                onClick={() => {
                  setSelected(null);
                  setEdit(null);
                }}
              >
                {t('বন্ধ করুন', 'Close')}
              </button>
            </div>

            <div className="cmp-info-grid">
              <div>
                <strong>{t('নাগরিক', 'Citizen')}</strong>
                <p>{selected.user?.name || '—'}</p>
                <small>{selected.user?.email}</small>
              </div>

              <div>
                <strong>{t('অবস্থান', 'Location')}</strong>
                <p>{selected.address}, {selected.district}</p>
              </div>

              <div>
                <strong>{t('সমস্যার ধরন', 'Issue Category')}</strong>
                <p>{displayOption(
                  COMPLAINT_CATEGORIES,
                  selected.category
                )}</p>
              </div>

              <div>
                <strong>{t('জমার তারিখ', 'Submitted')}</strong>
                <p>{fmtDate(selected.createdAt)}</p>
              </div>
            </div>

            <div className="cmp-description">
              <strong>{t('বিবরণ', 'Description')}</strong>
              <p>{selected.description}</p>
            </div>

            {selected.photo?.mimeType && (
              <ComplaintPhoto id={selected._id} />
            )}

            <form onSubmit={saveComplaint}>
              <h3>{t('অ্যাডমিন অ্যাকশন', 'Administrative Actions')}</h3>

              <div className="cmp-form-grid">
                <label>
                  {t('অভিযোগের অবস্থা', 'Complaint Status')}
                  <select
                    value={edit.status}
                    onChange={e => setEdit(prev => ({
                      ...prev,
                      status: e.target.value
                    }))}
                  >
                    {STATUS_OPTIONS.map(item => (
                      <option key={item[0]} value={item[0]}>
                        {bn ? item[1] : item[2]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t('অগ্রাধিকার', 'Priority')}
                  <select
                    value={edit.priority}
                    onChange={e => setEdit(prev => ({
                      ...prev,
                      priority: e.target.value
                    }))}
                  >
                    {PRIORITIES.map(item => (
                      <option key={item[0]} value={item[0]}>
                        {bn ? item[1] : item[2]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="cmp-full">
                  {t('দায়িত্বপ্রাপ্ত বিভাগ', 'Assigned Department')}
                  <select
                    value={edit.department}
                    onChange={e => setEdit(prev => ({
                      ...prev,
                      department: e.target.value
                    }))}
                  >
                    {DEPARTMENTS.map(item => (
                      <option key={item[0]} value={item[0]}>
                        {bn ? item[1] : item[2]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="cmp-full">
                  {t('নাগরিকের জন্য উত্তর', 'Response to Citizen')}
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={edit.adminResponse}
                    onChange={e => setEdit(prev => ({
                      ...prev,
                      adminResponse: e.target.value
                    }))}
                    placeholder={t(
                      'কী ব্যবস্থা নেওয়া হয়েছে তা লিখুন...',
                      'Explain the action taken or next steps...'
                    )}
                  />
                </label>
              </div>

              <p className="cmp-helper">
                {t(
                  'Resolved বা Rejected করতে অন্তত ১০ অক্ষরের উত্তর দিতে হবে।',
                  'Resolved or Rejected status requires a response of at least 10 characters.'
                )}
              </p>

              <button
                className="cmp-primary cmp-submit"
                disabled={saving}
              >
                <i className="fa-solid fa-floppy-disk" />
                {saving
                  ? t('সংরক্ষণ হচ্ছে...', 'Saving...')
                  : t('পরিবর্তন সংরক্ষণ করুন', 'Save Changes')}
              </button>
            </form>

            <div className="cmp-timeline">
              <h3>{t('অ্যাকশন হিস্ট্রি', 'Action History')}</h3>
              {selected.history?.map((h, i) => (
                <div key={i}>
                  <strong>
                    {displayOption(STATUS_OPTIONS, h.status)}
                  </strong>
                  <small>{fmtDate(h.at)}</small>
                  <p>{h.message}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
