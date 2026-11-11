
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader } from '../components/ui.jsx';

// Feedback styles are already merged into style.css.
// Do not import Feedback.css here.

const EMPTY_SUMMARY = {
  total: 0,
  averageRating: 0,
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  }
};

export default function Feedback() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();

  const isAdmin =
    String(user?.role || '').toLowerCase() === 'admin';

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -----------------------------------------
  // Load approved reviews
  // -----------------------------------------

  useEffect(() => {
    if (authLoading || isAdmin) return undefined;

    let active = true;

    async function loadFeedback() {
      try {
        const [summaryData, reviewsData] =
          await Promise.all([
            api('/feedback/summary'),
            api('/feedback')
          ]);

        if (!active) return;

        setSummary(summaryData || EMPTY_SUMMARY);
        setReviews(
          Array.isArray(reviewsData) ? reviewsData : []
        );
      } catch (err) {
        if (active) {
          setError(
            err.message ||
            'Unable to load feedback.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFeedback();

    return () => {
      active = false;
    };
  }, [authLoading, isAdmin]);

  // -----------------------------------------
  // Submit feedback
  // -----------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (isAdmin) {
      setError('Admins cannot submit user feedback.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(
        t(
          '১ থেকে ৫ স্টার নির্বাচন করুন।',
          'Please select 1 to 5 stars.'
        )
      );
      return;
    }

    // Any non-empty comment is accepted:
    // "A", "Good", "Bad", etc.
    if (!comment.trim()) {
      setError(
        t(
          'অনুগ্রহ করে আপনার মতামত লিখুন।',
          'Please enter your feedback.'
        )
      );
      return;
    }

    if (comment.trim().length > 1000) {
      setError(
        t(
          'সর্বোচ্চ ১০০০ অক্ষর লিখতে পারবেন।',
          'Maximum 1000 characters allowed.'
        )
      );
      return;
    }

    setSubmitting(true);

    try {
      await api('/feedback', {
        method: 'POST',
        body: {
          name: name.trim() || 'Anonymous',
          rating,
          comment: comment.trim()
        }
      });

      setSuccess(
        t(
          'ধন্যবাদ! আপনার মতামত জমা হয়েছে। Admin approval-এর পরে প্রকাশিত হবে।',
          'Thank you! Your feedback has been submitted. It will appear after admin approval.'
        )
      );

      setName('');
      setRating(0);
      setHoverRating(0);
      setComment('');
    } catch (err) {
      setError(
        err.message ||
        t(
          'মতামত জমা দেওয়া যায়নি।',
          'Unable to submit feedback.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------------------
  // Star component
  // -----------------------------------------

  function renderStars(value, interactive = false) {
    return (
      <span
        className={`feedback-stars ${
          interactive ? 'feedback-stars-interactive' : ''
        }`}
        role={interactive ? 'group' : undefined}
        aria-label={
          interactive ? 'Select rating' : undefined
        }
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = interactive
            ? star <= (hoverRating || rating)
            : star <= Math.round(value);

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                className={`feedback-star-button ${
                  selected ? 'selected' : ''
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onFocus={() => setHoverRating(star)}
                onBlur={() => setHoverRating(0)}
                aria-label={`${star} stars`}
                aria-pressed={rating === star}
                disabled={submitting}
              >
                <i
                  className={
                    selected
                      ? 'fa-solid fa-star'
                      : 'fa-regular fa-star'
                  }
                />
              </button>
            );
          }

          return (
            <i
              key={star}
              aria-hidden="true"
              className={
                selected
                  ? 'fa-solid fa-star'
                  : 'fa-regular fa-star'
              }
            />
          );
        })}
      </span>
    );
  }

  function formatDate(value) {
    if (!value) return '';

    return new Date(value).toLocaleDateString(
      lang === 'bn' ? 'bn-BD' : 'en-GB',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  // -----------------------------------------
  // Restrict admin page access
  // -----------------------------------------

  if (authLoading) {
    return (
      <div className="container section">
        {t('লোড হচ্ছে...', 'Loading...')}
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // -----------------------------------------
  // Render
  // -----------------------------------------

  return (
    <>
      <PageHeader
        icon="fa-star"
        tone="success"
        title={t(
          'মতামত ও রেটিং',
          'Feedback & Ratings'
        )}
        subtitle={t(
          'জনসেবা সম্পর্কে আপনার অভিজ্ঞতা জানান।',
          'Share your experience with Jonoseba.'
        )}
      />

      <div className="container section feedback-page">

        <div className="feedback-intro">
          <h2>
            {t(
              'আপনার মতামত আমাদের কাছে গুরুত্বপূর্ণ',
              'Your Feedback Matters'
            )}
          </h2>

          <p>
            {t(
              'আপনার অভিজ্ঞতা আমাদের সেবা উন্নত করতে সাহায্য করবে।',
              'Tell us what works well and what we can improve.'
            )}
          </p>
        </div>

        <div className="feedback-main-grid">

          {/* Feedback Form */}

          <div className="card pad feedback-form-card">
            <h3>
              {t(
                'আপনার অভিজ্ঞতা মূল্যায়ন করুন',
                'Rate Your Experience'
              )}
            </h3>

            <p className="muted">
              {t(
                '১ থেকে ৫ স্টার নির্বাচন করুন।',
                'Select a rating between 1 and 5 stars.'
              )}
            </p>

            <form
              className="feedback-form"
              onSubmit={handleSubmit}
            >
              <div className="feedback-rating-input">
                {renderStars(rating, true)}

                <span className="feedback-rating-label">
                  {rating
                    ? `${rating} / 5`
                    : t(
                        'রেটিং নির্বাচন করুন',
                        'Choose a Rating'
                      )}
                </span>
              </div>

              <label htmlFor="feedback-name">
                {t(
                  'আপনার নাম (ঐচ্ছিক)',
                  'Your Name (Optional)'
                )}
              </label>

              <input
                id="feedback-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                disabled={submitting}
                placeholder={t(
                  'আপনার নাম লিখুন',
                  'Enter your name'
                )}
              />

              <label htmlFor="feedback-comment">
                {t('আপনার মতামত', 'Your Feedback')}
                {' *'}
              </label>

              <textarea
                id="feedback-comment"
                rows={5}
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                placeholder={t(
                  'আপনার অভিজ্ঞতা লিখুন...',
                  'Tell us about your experience...'
                )}
                maxLength={1000}
                required
                disabled={submitting}
              />

              <div className="feedback-character-count">
                {comment.length} / 1000
              </div>

              {error && (
                <div
                  className="feedback-message feedback-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="feedback-message feedback-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary feedback-submit"
                disabled={submitting}
              >
                {submitting
                  ? t(
                      'জমা দেওয়া হচ্ছে...',
                      'Submitting...'
                    )
                  : t(
                      'মতামত জমা দিন',
                      'Submit Feedback'
                    )}
              </button>

              <p className="feedback-form-note">
                {t(
                  'Admin যাচাইয়ের পরে আপনার মতামত প্রকাশিত হবে।',
                  'Your review will be published after admin approval.'
                )}
              </p>
            </form>
          </div>

          {/* Rating Summary */}

          <div className="card pad feedback-summary-card">
            <h3>
              {t(
                'ব্যবহারকারীদের রেটিং',
                'User Ratings'
              )}
            </h3>

            {loading ? (
              <p className="muted">
                {t('লোড হচ্ছে...', 'Loading...')}
              </p>
            ) : (
              <>
                <div className="feedback-average">
                  <strong>
                    {Number(
                      summary.averageRating || 0
                    ).toFixed(1)}
                  </strong>

                  {renderStars(
                    summary.averageRating || 0
                  )}

                  <p className="muted">
                    {t(
                      `${summary.total || 0} টি প্রকাশিত রিভিউ`,
                      `Based on ${summary.total || 0} published reviews`
                    )}
                  </p>
                </div>

                <div className="feedback-distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      summary.distribution?.[star] || 0;

                    const percent = summary.total
                      ? count / summary.total * 100
                      : 0;

                    return (
                      <div
                        className="feedback-rating-row"
                        key={star}
                      >
                        <span>{star} ★</span>

                        <div className="feedback-bar">
                          <div
                            className="feedback-bar-fill"
                            style={{
                              width: `${percent}%`
                            }}
                          />
                        </div>

                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>

        {/* Public Approved Reviews */}

        <div className="feedback-reviews-section">
          <h2>
            {t(
              'ব্যবহারকারীদের মতামত',
              'What Users Are Saying'
            )}
          </h2>

          {loading ? (
            <p className="muted">
              {t(
                'লোড হচ্ছে...',
                'Loading reviews...'
              )}
            </p>
          ) : reviews.length === 0 ? (
            <div className="card pad feedback-empty">
              <p>
                {t(
                  'এখনো কোনো প্রকাশিত রিভিউ নেই।',
                  'No published reviews yet.'
                )}
              </p>
            </div>
          ) : (
            <div className="feedback-review-grid">
              {reviews.map((review) => (
                <article
                  className="card pad feedback-review-card"
                  key={review._id}
                >
                  <div className="feedback-review-heading">
                    <strong>
                      {review.name || 'Anonymous'}
                    </strong>

                    <small className="muted">
                      {formatDate(review.createdAt)}
                    </small>
                  </div>

                  {renderStars(review.rating)}

                  <p className="feedback-review-text">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
