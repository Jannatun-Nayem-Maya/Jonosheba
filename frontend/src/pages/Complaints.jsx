
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import './Complaints.css';

export const COMPLAINT_CATEGORIES = [
  ['road', 'রাস্তার সমস্যা', 'Damaged Road', 'fa-road'],
  ['water', 'পানির সমস্যা', 'Water Supply', 'fa-faucet-drip'],
  ['electricity', 'বিদ্যুৎ সমস্যা', 'Electricity', 'fa-bolt'],
  ['waste', 'ময়লা-আবর্জনা', 'Waste Management', 'fa-trash'],
  ['drainage', 'ড্রেনেজ সমস্যা', 'Drainage', 'fa-water'],
  ['street_light', 'রাস্তার বাতি', 'Street Light', 'fa-lightbulb'],
  ['other', 'অন্যান্য', 'Other Issue', 'fa-circle-exclamation']
];

export const COMPLAINT_STATUSES = {
  pending: ['অপেক্ষমাণ', 'Pending'],
  in_progress: ['কাজ চলছে', 'In Progress'],
  resolved: ['সমাধান হয়েছে', 'Resolved'],
  rejected: ['বাতিল', 'Rejected'],
  reopened: ['পুনরায় চালু', 'Reopened']
};

const initialForm = {
  category: 'road',
  title: '',
  description: '',
  district: '',
  address: ''
};

function ComplaintPhoto({ id }) {
  const { t } = useLang();
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    let objectUrl = '';

    const base = import.meta.env.VITE_API_URL || '/api';

    fetch(`${base}/complaints/${id}/photo`, {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('No image');
        return response.blob();
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        if (mounted) setUrl(objectUrl);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (!url) return null;

  return (
    <div className="cmp-photo">
      <strong>{t('সমস্যার ছবি', 'Problem Photo')}</strong>
      <img src={url} alt={t('অভিযোগের ছবি', 'Complaint evidence')} />
    </div>
  );
}

export { ComplaintPhoto };

export default function Complaints() {
  const { user } = useAuth();
  const { t, lang, fmtDate } = useLang();
  const bn = lang === 'bn';

  const [tab, setTab] = useState('submit');
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const statusLabel = status =>
    (COMPLAINT_STATUSES[status] || [status, status])[bn ? 0 : 1];

  const categoryLabel = category =>
    (COMPLAINT_CATEGORIES.find(c => c[0] === category) ||
      ['other', 'অন্যান্য', 'Other'])[bn ? 1 : 2];

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function loadMine() {
    if (!user || user.role === 'admin') return;

    setLoading(true);
    setError('');

    try {
      const result = await api('/complaints/mine');
      setComplaints(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'mine' && user?.role !== 'admin') {
      loadMine();
    }
  }, [tab, user?.id, user?.role]);

  async function submitComplaint(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        data.append(key, value.trim());
      });

      if (photo) data.append('photo', photo);

      const result = await api('/complaints', {
        method: 'POST',
        form: data
      });

      setSuccess(result.complaint.trackingId);
      setForm(initialForm);
      setPhoto(null);
      event.currentTarget.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openComplaint(id) {
    setLoading(true);
    setError('');

    try {
      const result = await api(`/complaints/${id}`);
      setSelected(result);
      setReopenReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function reopenComplaint() {
    if (!selected || busy) return;

    setBusy(true);
    setError('');

    try {
      await api(`/complaints/${selected._id}/reopen`, {
        method: 'POST',
        body: { reason: reopenReason }
      });

      await openComplaint(selected._id);
      await loadMine();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cmp-page">
      <header className="cmp-hero">
        <div className="container">
          <span className="cmp-eyebrow">
            <i className="fa-solid fa-shield-heart" />
            {' '}JONOSEBA · CITIZEN SUPPORT
          </span>

          <h1>{t(
            'নাগরিক অভিযোগ ও সমাধান',
            'Citizen Complaint & Tracking'
          )}</h1>

          <p>{t(
            'আপনার এলাকার সমস্যা জানান এবং সমাধানের অগ্রগতি দেখুন।',
            'Report a public issue and track its progress.'
          )}</p>
        </div>
      </header>

      <div className="container cmp-container">
        {!user ? (
          <section className="cmp-card cmp-login">
            <i className="fa-solid fa-lock" />
            <h2>{t(
              'অভিযোগ জমা দিতে লগইন করুন',
              'Login to Submit a Complaint'
            )}</h2>

            <p>{t(
              'অভিযোগের তথ্য নিরাপদ রাখতে Jonoseba account প্রয়োজন।',
              'A Jonoseba account is required to securely manage complaints.'
            )}</p>

            <div className="cmp-actions">
              <Link
                to="/login"
                state={{ from: '/complaints' }}
                className="cmp-primary"
              >
                {t('লগইন করুন', 'Login')}
              </Link>

              <Link to="/register" className="cmp-outline">
                {t('নতুন অ্যাকাউন্ট', 'Create Account')}
              </Link>
            </div>
          </section>
        ) : user.role === 'admin' ? (
          <section className="cmp-card cmp-login">
            <h2>{t('অ্যাডমিন প্যানেল', 'Administrator Panel')}</h2>
            <p>{t(
              'অভিযোগ ব্যবস্থাপনার জন্য Admin Panel ব্যবহার করুন।',
              'Use the Admin Panel to manage citizen complaints.'
            )}</p>

            <Link className="cmp-primary" to="/admin/complaints">
              {t('অভিযোগ ব্যবস্থাপনা', 'Manage Complaints')}
            </Link>
          </section>
        ) : (
          <>
            <div className="cmp-tabs">
              <button
                className={tab === 'submit' ? 'active' : ''}
                onClick={() => {
                  setTab('submit');
                  setSelected(null);
                  setError('');
                }}
              >
                <i className="fa-solid fa-plus" />
                {t('অভিযোগ জমা দিন', 'Submit Complaint')}
              </button>

              <button
                className={tab === 'mine' ? 'active' : ''}
                onClick={() => {
                  setTab('mine');
                  setSelected(null);
                  setError('');
                }}
              >
                <i className="fa-solid fa-clock-rotate-left" />
                {t('আমার অভিযোগ', 'My Complaints')}
              </button>
            </div>

            {error && <div className="cmp-error" role="alert">{error}</div>}

            {tab === 'submit' && (
              <section className="cmp-card">
                <div className="cmp-section-head">
                  <div>
                    <h2>{t('সমস্যার বিবরণ দিন', 'Report a Public Issue')}</h2>
                    <p>{t(
                      'নিচের তথ্যগুলো পূরণ করুন। * চিহ্নিত তথ্য আবশ্যক।',
                      'Fill in the details below. Fields marked * are required.'
                    )}</p>
                  </div>
                </div>

                {success && (
                  <div className="cmp-success">
                    <i className="fa-solid fa-circle-check" />
                    <div>
                      <strong>{t(
                        'অভিযোগ সফলভাবে জমা হয়েছে!',
                        'Complaint Submitted Successfully!'
                      )}</strong>

                      <p>{t('আপনার Tracking ID:', 'Your Tracking ID:')}</p>
                      <strong className="cmp-tracking-id">{success}</strong>

                      <button onClick={() => {
                        setTab('mine');
                        setSuccess('');
                      }}>
                        {t('অভিযোগের অবস্থা দেখুন', 'View My Complaints')}
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={submitComplaint}>
                  <h3 className="cmp-subheading">
                    {t('১. সমস্যার ধরন', '1. Choose Issue Category')}
                  </h3>

                  <div className="cmp-categories">
                    {COMPLAINT_CATEGORIES.map(c => (
                      <button
                        type="button"
                        key={c[0]}
                        className={
                          form.category === c[0] ? 'active' : ''
                        }
                        onClick={() => update('category', c[0])}
                      >
                        <i className={`fa-solid ${c[3]}`} />
                        <span>{bn ? c[1] : c[2]}</span>
                      </button>
                    ))}
                  </div>

                  <h3 className="cmp-subheading">
                    {t('২. সমস্যার তথ্য', '2. Issue Details')}
                  </h3>

                  <div className="cmp-form-grid">
                    <label className="cmp-full">
                      {t('সমস্যার শিরোনাম', 'Problem Title')} *
                      <input
                        required
                        minLength={5}
                        maxLength={120}
                        value={form.title}
                        onChange={e => update('title', e.target.value)}
                        placeholder={t(
                          'যেমন: এলাকায় রাস্তা ভেঙে গেছে',
                          'e.g. Road damaged near the market'
                        )}
                      />
                    </label>

                    <label>
                      {t('জেলা', 'District')} *
                      <input
                        required
                        maxLength={100}
                        value={form.district}
                        onChange={e => update('district', e.target.value)}
                        placeholder={t('যেমন: ঢাকা', 'e.g. Dhaka')}
                      />
                    </label>

                    <label>
                      {t('এলাকা ও ঠিকানা', 'Area & Address')} *
                      <input
                        required
                        maxLength={250}
                        value={form.address}
                        onChange={e => update('address', e.target.value)}
                        placeholder={t(
                          'রোড নম্বর, এলাকা, কাছের স্থান',
                          'Road, area, nearby landmark'
                        )}
                      />
                    </label>

                    <label className="cmp-full">
                      {t('বিস্তারিত বিবরণ', 'Description')} *
                      <textarea
                        required
                        minLength={15}
                        maxLength={2000}
                        rows={5}
                        value={form.description}
                        onChange={e => update('description', e.target.value)}
                        placeholder={t(
                          'সমস্যাটি কোথায়, কী হয়েছে এবং কতদিন ধরে হচ্ছে লিখুন।',
                          'Explain where the problem is and what happened.'
                        )}
                      />
                    </label>

                    <label className="cmp-full">
                      {t('সমস্যার ছবি (ঐচ্ছিক)', 'Photo (Optional)')}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => {
                          const file = e.target.files?.[0] || null;

                          if (file && file.size > 2 * 1024 * 1024) {
                            setError(t(
                              'ছবি সর্বোচ্চ ২ MB হতে পারবে।',
                              'Image must be 2 MB or smaller.'
                            ));
                            e.target.value = '';
                            setPhoto(null);
                            return;
                          }

                          setError('');
                          setPhoto(file);
                        }}
                      />
                      <small>JPG, PNG, WebP · Max 2 MB</small>
                    </label>
                  </div>

                  <button
                    className="cmp-primary cmp-submit"
                    type="submit"
                    disabled={busy}
                  >
                    <i className={`fa-solid ${
                      busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'
                    }`} />
                    {busy
                      ? t('জমা হচ্ছে...', 'Submitting...')
                      : t('অভিযোগ জমা দিন', 'Submit Complaint')}
                  </button>
                </form>
              </section>
            )}

            {tab === 'mine' && (
              <section className="cmp-card">
                <div className="cmp-section-head">
                  <div>
                    <h2>{t('আমার অভিযোগসমূহ', 'My Complaints')}</h2>
                    <p>{t(
                      'অভিযোগের অবস্থা ও Admin-এর উত্তর দেখুন।',
                      'Track statuses and administrator responses.'
                    )}</p>
                  </div>
                  <button className="cmp-outline" onClick={loadMine}>
                    <i className="fa-solid fa-rotate" />
                    {t('রিফ্রেশ', 'Refresh')}
                  </button>
                </div>

                {loading && <p>{t('লোড হচ্ছে...', 'Loading...')}</p>}

                {!loading && complaints.length === 0 && (
                  <div className="cmp-empty">
                    <i className="fa-solid fa-inbox" />
                    <p>{t(
                      'আপনি এখনও কোনো অভিযোগ জমা দেননি।',
                      'You have not submitted any complaints yet.'
                    )}</p>
                  </div>
                )}

                <div className="cmp-complaint-list">
                  {complaints.map(item => (
                    <button
                      key={item._id}
                      className="cmp-list-item"
                      onClick={() => openComplaint(item._id)}
                    >
                      <div>
                        <span className="cmp-id">{item.trackingId}</span>
                        <strong>{item.title}</strong>
                        <small>
                          {categoryLabel(item.category)}
                          {' · '}{fmtDate(item.createdAt)}
                        </small>
                      </div>
                      <span className={`cmp-status ${item.status}`}>
                        {statusLabel(item.status)}
                      </span>
                    </button>
                  ))}
                </div>

                {selected && (
                  <div className="cmp-detail">
                    <div className="cmp-section-head">
                      <div>
                        <span className="cmp-id">{selected.trackingId}</span>
                        <h2>{selected.title}</h2>
                      </div>
                      <button
                        className="cmp-outline"
                        onClick={() => setSelected(null)}
                      >
                        {t('বন্ধ করুন', 'Close')}
                      </button>
                    </div>

                    <span className={`cmp-status ${selected.status}`}>
                      {statusLabel(selected.status)}
                    </span>

                    <p><strong>{t('অবস্থান', 'Location')}:</strong>
                      {' '}{selected.address}, {selected.district}</p>

                    <p>{selected.description}</p>

                    {selected.photo?.mimeType && (
                      <ComplaintPhoto id={selected._id} />
                    )}

                    <div className="cmp-admin-message">
                      <strong>{t('অ্যাডমিনের উত্তর', 'Admin Response')}</strong>
                      <p>{selected.adminResponse || t(
                        'এখনও কোনো উত্তর দেওয়া হয়নি।',
                        'No response yet.'
                      )}</p>
                      <p>{t('দায়িত্বপ্রাপ্ত বিভাগ', 'Assigned Department')}:
                        {' '}{selected.department}</p>
                    </div>

                    <h3>{t('অগ্রগতির ইতিহাস', 'Progress Timeline')}</h3>

                    <div className="cmp-timeline">
                      {selected.history?.map((h, index) => (
                        <div key={index}>
                          <strong>{statusLabel(h.status)}</strong>
                          <small>{fmtDate(h.at)}</small>
                          <p>{h.message}</p>
                        </div>
                      ))}
                    </div>

                    {selected.status === 'resolved' && (
                      <div className="cmp-reopen">
                        <h3>{t(
                          'সমস্যা এখনও সমাধান হয়নি?',
                          'Issue Not Actually Resolved?'
                        )}</h3>

                        <textarea
                          value={reopenReason}
                          minLength={10}
                          maxLength={500}
                          onChange={e => setReopenReason(e.target.value)}
                          placeholder={t(
                            'কেন আবার চালু করতে চান লিখুন...',
                            'Explain why the issue needs reopening...'
                          )}
                        />

                        <button
                          className="cmp-outline"
                          disabled={busy || reopenReason.trim().length < 10}
                          onClick={reopenComplaint}
                        >
                          {t('আবার চালু করার অনুরোধ', 'Request Reopening')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
