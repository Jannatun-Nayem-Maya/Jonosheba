
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import {
  PageHeader,
  Loader,
  ErrorBox
} from '../components/ui.jsx';

const FILTERS = [
  ['pending', 'অপেক্ষমাণ', 'Pending'],
  ['approved', 'অনুমোদিত', 'Approved'],
  ['hidden', 'লুকানো', 'Hidden'],
  ['all', 'সব', 'All']
];

export default function AdminFeedback() {
  const { t, lang } = useLang();

  const [filter, setFilter] = useState('pending');
  const [items, setItems] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    hidden: 0
  });

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // -----------------------------------------
  // Load admin feedback
  // -----------------------------------------

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError('');

      try {
        const [feedbackData, statsData] =
          await Promise.all([
            api(
              `/feedback/admin?status=${encodeURIComponent(filter)}`
            ),
            api('/feedback/admin/stats')
          ]);

        if (!active) return;

        setItems(
          Array.isArray(feedbackData)
            ? feedbackData
            : []
        );

        setStats(statsData);
      } catch (err) {
        if (active) {
          setError(
            err.message || 'Unable to load feedback.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [filter, refreshKey]);

  // -----------------------------------------
  // Update status
  // -----------------------------------------

  async function updateStatus(id, status) {
    setSavingId(id);
    setError('');
    setMessage('');

    try {
      await api(`/feedback/admin/${id}`, {
        method: 'PATCH',
        body: { status }
      });

      setMessage(
        t(
          'ফিডব্যাকের অবস্থা আপডেট হয়েছে।',
          'Feedback status updated successfully.'
        )
      );

      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err.message ||
        'Unable to update feedback.'
      );
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(date) {
    if (!date) return '';

    return new Date(date).toLocaleDateString(
      lang === 'bn' ? 'bn-BD' : 'en-GB',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  const statCards = [
    ['total', 'মোট রিভিউ', 'Total Reviews'],
    ['pending', 'অপেক্ষমাণ', 'Pending'],
    ['approved', 'অনুমোদিত', 'Approved'],
    ['hidden', 'লুকানো', 'Hidden']
  ];

  return (
    <>
      <PageHeader
        icon="fa-star"
        tone="dark"
        title={t(
          'ফিডব্যাক ব্যবস্থাপনা',
          'Feedback Management'
        )}
        subtitle={t(
          'ব্যবহারকারীদের রেটিং ও মতামত যাচাই এবং পরিচালনা করুন।',
          'Review, approve and manage citizen feedback.'
        )}
      />

      <div className="container section">

        <div className="toolbar" style={{ marginBottom: 22 }}>
          <h2 className="nomargin">
            {t(
              'ফিডব্যাক ও রেটিং',
              'Feedback & Ratings'
            )}
          </h2>

          <Link
            className="btn btn-outline btn-sm"
            to="/admin"
          >
            {t(
              'অ্যাডমিন ড্যাশবোর্ড',
              'Back to Dashboard'
            )}
          </Link>
        </div>

        <div className="stat-row">
          {statCards.map(([key, bn, en]) => (
            <div className="stat" key={key}>
              <strong>{stats[key] || 0}</strong>
              <span>{t(bn, en)}</span>
            </div>
          ))}
        </div>

        <div
          className="card pad"
          style={{ marginTop: 22 }}
        >
          <div
            className="toolbar"
            style={{ marginBottom: 20 }}
          >
            <h3 className="nomargin">
              {t(
                'রিভিউ পরিচালনা',
                'Manage Reviews'
              )}
            </h3>

            <div className="chips">
              {FILTERS.map(([key, bn, en]) => (
                <button
                  type="button"
                  key={key}
                  className={`chip ${
                    filter === key ? 'on' : ''
                  }`}
                  onClick={() => {
                    setFilter(key);
                    setMessage('');
                  }}
                >
                  {t(bn, en)}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div
              className="notice notice-success"
              role="status"
            >
              {message}
            </div>
          )}

          <ErrorBox message={error} />

          {loading && <Loader />}

          {!loading && items.length === 0 && (
            <div className="notice">
              {t(
                'এই বিভাগে কোনো ফিডব্যাক নেই।',
                'No feedback found for this filter.'
              )}
            </div>
          )}

          <div className="admin-feedback-list">
            {!loading && items.map((item) => (
              <article
                key={item._id}
                className="admin-feedback-item"
              >
                <div
                  className="toolbar"
                  style={{
                    alignItems: 'flex-start',
                    gap: 14
                  }}
                >
                  <div>
                    <strong>
                      {item.name || 'Anonymous'}
                    </strong>

                    <div
                      style={{
                        color: 'var(--gold)',
                        marginTop: 7,
                        fontSize: 18
                      }}
                      aria-label={`${item.rating} out of 5`}
                    >
                      {'★'.repeat(item.rating)}
                      {'☆'.repeat(5 - item.rating)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-soft">
                      {item.status}
                    </span>

                    <div
                      className="muted small"
                      style={{ marginTop: 8 }}
                    >
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </div>

                <p className="admin-feedback-comment">
                  {item.comment}
                </p>

                <div className="btn-row">
                  {item.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      disabled={savingId === item._id}
                      onClick={() =>
                        updateStatus(item._id, 'approved')
                      }
                    >
                      {t('অনুমোদন', 'Approve')}
                    </button>
                  )}

                  {item.status !== 'hidden' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={savingId === item._id}
                      onClick={() =>
                        updateStatus(item._id, 'hidden')
                      }
                    >
                      {t('লুকান', 'Hide')}
                    </button>
                  )}

                  {item.status !== 'pending' && (
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      disabled={savingId === item._id}
                      onClick={() =>
                        updateStatus(item._id, 'pending')
                      }
                    >
                      {t(
                        'পুনরায় যাচাই',
                        'Mark Pending'
                      )}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
