
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import {
  PageHeader,
  useApi,
  useForm,
  useToast,
  Loader,
  ErrorBox,
  BLOOD_GROUPS
} from '../components/ui.jsx';

import BloodBankLink from '../components/BloodBankLink.jsx';

// ==========================================
// BLOOD COMPATIBILITY
// ==========================================

const CAN_DONATE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

const initialForm = {
  patientName: '',
  bloodGroup: '',
  hospital: '',
  contactNumber: '',
  location: '',
  urgency: 'Emergency',
  details: ''
};

function timeAgo(date, lang) {
  const minutes = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(date).getTime()) / 60000
    )
  );

  if (minutes < 60) {
    return lang === 'bn'
      ? `${minutes} মিনিট আগে`
      : `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return lang === 'bn'
      ? `${hours} ঘণ্টা আগে`
      : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return lang === 'bn'
    ? `${days} দিন আগে`
    : `${days}d ago`;
}

export default function Health() {
  const { t, lang, num, fmtDate } = useLang();
  const { user } = useAuth();
  const toast = useToast();

  const {
    data,
    loading,
    error,
    reload
  } = useApi('/blood/requests');

  const {
    data: myRequests,
    loading: myLoading,
    error: myError,
    reload: reloadMine
  } = useApi(
    user && user.role !== 'admin'
      ? '/blood/requests/mine'
      : null
  );

  const [form, bind, setForm] = useForm(initialForm);

  const [filter, setFilter] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [recipient, setRecipient] = useState('A+');

  const isCitizen = Boolean(
    user && user.role !== 'admin'
  );

  const urgencyLabel = {
    Emergency: t('জরুরি', 'Emergency'),
    'Within 24 Hours': t(
      '২৪ ঘণ্টার মধ্যে',
      'Within 24 Hours'
    ),
    Regular: t('সাধারণ', 'Regular')
  };

  const statusLabel = {
    open: t('চলমান', 'Open'),
    fulfilled: t('পূরণ হয়েছে', 'Fulfilled'),
    cancelled: t('বাতিল', 'Cancelled')
  };

  const statusClass = {
    open: 'badge-danger',
    fulfilled: 'badge-success',
    cancelled: 'badge-warning'
  };

  const refreshRequests = () => {
    reload();

    if (isCitizen) {
      reloadMine();
    }
  };

  // ==========================================
  // SUBMIT REQUEST
  // ==========================================

  const submit = async (event) => {
    event.preventDefault();

    if (!isCitizen || sending) return;

    setSending(true);

    try {
      await api('/blood/requests', {
        method: 'POST',
        body: form
      });

      toast(
        t(
          'রক্তের অনুরোধ সফলভাবে পোস্ট করা হয়েছে।',
          'Blood request posted successfully.'
        )
      );

      setForm({ ...initialForm });
      refreshRequests();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // MARK FULFILLED
  // ==========================================

  const fulfill = async (id) => {
    if (busyId) return;

    const confirmed = window.confirm(
      t(
        'রক্তের প্রয়োজন পূরণ হয়েছে বলে নিশ্চিত করছেন?',
        'Confirm that the blood requirement has been fulfilled?'
      )
    );

    if (!confirmed) return;

    setBusyId(id);

    try {
      await api(
        `/blood/requests/${id}/fulfill`,
        { method: 'PATCH' }
      );

      toast(
        t(
          'অনুরোধটি পূরণ হয়েছে হিসেবে চিহ্নিত করা হয়েছে।',
          'Request marked as fulfilled.'
        )
      );

      refreshRequests();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // CANCEL REQUEST
  // ==========================================

  const cancel = async (id) => {
    if (busyId) return;

    const confirmed = window.confirm(
      t(
        'আপনি কি এই রক্তের অনুরোধটি বাতিল করতে চান?',
        'Are you sure you want to cancel this blood request?'
      )
    );

    if (!confirmed) return;

    setBusyId(id);

    try {
      await api(
        `/blood/requests/${id}/cancel`,
        { method: 'PATCH' }
      );

      toast(
        t(
          'রক্তের অনুরোধটি বাতিল করা হয়েছে।',
          'Blood request cancelled.'
        )
      );

      refreshRequests();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // FILTER REQUESTS
  // ==========================================

  const requests = Array.isArray(data) ? data : [];

  const filteredRequests = requests.filter(
    (request) =>
      (!filter || request.bloodGroup === filter) &&
      (!onlyOpen || request.status === 'open')
  );

  const ownRequests = Array.isArray(myRequests)
    ? myRequests
    : [];

  const compatibleDonors = Object.keys(
    CAN_DONATE_TO
  ).filter((group) =>
    CAN_DONATE_TO[group].includes(recipient)
  );

  return (
    <>
      <PageHeader
        icon="fa-droplet"
        tone="danger"
        title={t(
          'স্বাস্থ্য ও রক্তদান কেন্দ্র',
          'Health & Blood Hub'
        )}
        subtitle={t(
          'জরুরি রক্তের অনুরোধ জানান, রক্তদাতা খুঁজুন এবং সচেতন হোন।',
          'Post emergency blood requests, find donors and learn the facts.'
        )}
      />

      <div className="container section">
        <BloodBankLink />

        <div className="split">

          {/* LEFT COLUMN */}
          <div>
            <div className="card pad">
              <h3 className="card-title">
                <i className="fa-solid fa-droplet text-danger" />
                {' '}
                {t(
                  'রক্তের অনুরোধ জানান',
                  'Post Blood Request'
                )}
              </h3>

              {isCitizen ? (
                <form
                  onSubmit={submit}
                  className="form"
                >
                  <label>
                    {t('রোগীর নাম', 'Patient Name')}
                    <input
                      name="patientName"
                      value={form.patientName}
                      onChange={bind}
                      maxLength={120}
                      required
                    />
                  </label>

                  <label>
                    {t('রক্তের গ্রুপ', 'Blood Group')}
                    <select
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={bind}
                      required
                    >
                      <option value="">
                        {t('নির্বাচন করুন', 'Select')}
                      </option>

                      {BLOOD_GROUPS.map((group) => (
                        <option
                          key={group}
                          value={group}
                        >
                          {group}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    {t(
                      'হাসপাতাল / ঠিকানা',
                      'Hospital / Address'
                    )}

                    <input
                      name="hospital"
                      value={form.hospital}
                      onChange={bind}
                      maxLength={180}
                      required
                    />
                  </label>

                  <label>
                    {t(
                      'যোগাযোগের নম্বর',
                      'Contact Number'
                    )}
                    <input
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={bind}
                      inputMode="tel"
                      maxLength={25}
                      required
                    />
                  </label>

                  <label>
                    {t('জেলা / এলাকা', 'Location')}
                    <input
                      name="location"
                      value={form.location}
                      onChange={bind}
                      maxLength={120}
                      required
                    />
                  </label>

                  <label>
                    {t('জরুরি অবস্থা', 'Urgency')}

                    <select
                      name="urgency"
                      value={form.urgency}
                      onChange={bind}
                    >
                      <option value="Emergency">
                        {urgencyLabel.Emergency}
                      </option>

                      <option value="Within 24 Hours">
                        {urgencyLabel['Within 24 Hours']}
                      </option>

                      <option value="Regular">
                        {urgencyLabel.Regular}
                      </option>
                    </select>
                  </label>

                  <label>
                    {t(
                      'বিস্তারিত (ঐচ্ছিক)',
                      'Details (optional)'
                    )}

                    <textarea
                      name="details"
                      rows={3}
                      maxLength={1000}
                      value={form.details}
                      onChange={bind}
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-accent btn-block"
                    disabled={sending}
                  >
                    {sending
                      ? t(
                          'জমা হচ্ছে...',
                          'Submitting...'
                        )
                      : t(
                          'অনুরোধ জমা দিন',
                          'Submit Request'
                        )}
                  </button>
                </form>
              ) : user ? (
                <div className="notice">
                  {t(
                    'অ্যাডমিন নতুন রক্তের অনুরোধ জমা দিতে পারবেন না।',
                    'Administrators cannot submit blood requests.'
                  )}
                  {' '}
                  <Link to="/admin">
                    {t(
                      'অ্যাডমিন ড্যাশবোর্ড',
                      'Admin Dashboard'
                    )}
                  </Link>
                </div>
              ) : (
                <div className="notice">
                  {t(
                    'রক্তের অনুরোধ জমা দিতে লগইন করুন।',
                    'Please log in to submit a blood request.'
                  )}
                  {' '}
                  <Link
                    to="/login"
                    state={{ from: '/health' }}
                  >
                    <strong>
                      {t('লগইন', 'Login')}
                    </strong>
                  </Link>
                </div>
              )}
            </div>

            {/* MY BLOOD REQUESTS */}
            {isCitizen && (
              <div className="card pad mt">
                <h3 className="card-title">
                  {t(
                    'আমার রক্তের অনুরোধসমূহ',
                    'My Blood Requests'
                  )}
                </h3>

                <p className="muted small">
                  {t(
                    'আপনার জমা দেওয়া অনুরোধগুলো দেখুন এবং চলমান অনুরোধ পরিচালনা করুন।',
                    'Track requests you submitted and manage open requests.'
                  )}
                </p>

                {myLoading && <Loader />}
                <ErrorBox message={myError} />

                {!myLoading &&
                  !myError &&
                  ownRequests.length === 0 && (
                    <div className="notice">
                      {t(
                        'আপনি এখনো কোনো রক্তের অনুরোধ জমা দেননি।',
                        'You have not submitted any blood requests.'
                      )}
                    </div>
                  )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    marginTop: 20
                  }}
                >
                  {ownRequests.map((request) => (
                    <div
                      key={request._id}
                      style={{
                        border: '1px solid #e1e7e5',
                        borderRadius: 15,
                        padding: 20
                      }}
                    >
                      {/* NEW: NAME FIRST, GROUP BADGE */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                          flexWrap: 'wrap'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap'
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 18,
                              color: '#182927'
                            }}
                          >
                            {request.patientName}
                          </strong>

                          <span className="badge badge-danger">
                            {request.bloodGroup}
                          </span>
                        </div>

                        <span
                          className={`badge ${
                            statusClass[request.status] ||
                            'badge-warning'
                          }`}
                        >
                          {statusLabel[request.status] ||
                            request.status}
                        </span>
                      </div>

                      <p
                        className="muted"
                        style={{
                          margin: '10px 0 0',
                          lineHeight: 1.6
                        }}
                      >
                        <i className="fa-solid fa-hospital" />
                        {' '}
                        {request.hospital}
                        {request.location &&
                          `, ${request.location}`}

                        <span
                          style={{
                            marginLeft: 8
                          }}
                        >
                          · {fmtDate(request.createdAt)}
                        </span>
                      </p>

                      {request.status === 'open' && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            marginTop: 16
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={busyId === request._id}
                            onClick={() =>
                              fulfill(request._id)
                            }
                          >
                            {t(
                              'পূরণ হয়েছে',
                              'Mark Fulfilled'
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={busyId === request._id}
                            onClick={() =>
                              cancel(request._id)
                            }
                          >
                            {t(
                              'অনুরোধ বাতিল',
                              'Cancel Request'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BLOOD COMPATIBILITY */}
            <div className="card pad mt">
              <h3 className="card-title">
                <i className="fa-solid fa-flask text-primary" />
                {' '}
                {t(
                  'রক্তের সামঞ্জস্য যাচাই',
                  'Blood Compatibility Checker'
                )}
              </h3>

              <p className="muted small">
                {t(
                  'রোগীর রক্তের গ্রুপ নির্বাচন করে সম্ভাব্য উপযুক্ত রক্তদাতার গ্রুপ দেখুন।',
                  'Select the patient blood group to see potentially compatible donor groups.'
                )}
              </p>

              <div className="chips">
                {BLOOD_GROUPS.map((group) => (
                  <button
                    type="button"
                    key={group}
                    className={`chip ${
                      recipient === group ? 'on' : ''
                    }`}
                    onClick={() => setRecipient(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <p className="mt-sm">
                {t(
                  'সম্ভাব্য উপযুক্ত দাতা:',
                  'Compatible donors:'
                )}
                {' '}

                {compatibleDonors.map((group) => (
                  <span
                    key={group}
                    className="badge badge-danger"
                    style={{ marginRight: 6 }}
                  >
                    {group}
                  </span>
                ))}
              </p>

              <p className="muted small">
                {t(
                  'চূড়ান্ত রক্তের সামঞ্জস্য পরীক্ষা অবশ্যই হাসপাতাল বা ব্লাড ব্যাংক করবে।',
                  'Final blood compatibility and crossmatching must be confirmed by the hospital or blood bank.'
                )}
              </p>

              <Link
                to="/blood-donors"
                className="btn btn-outline btn-sm"
              >
                {t(
                  'রক্তদাতা খুঁজুন',
                  'Find Donors'
                )}
                {' '}
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* AWARENESS VIDEO */}
            <div className="card pad">
              <h3 className="card-title">
                <i className="fa-brands fa-youtube text-danger" />
                {' '}
                {t(
                  'রক্তদান সম্পর্কে সচেতনতা',
                  'Awareness on Blood Donation'
                )}
              </h3>

              <div className="video">
                <iframe
                  src="https://www.youtube.com/embed/T4hUVf3Ux6I"
                  title="Blood donation awareness"
                  allow="encrypted-media"
                  allowFullScreen
                />
              </div>
            </div>

            {/* RECENT BLOOD REQUESTS */}
            <div className="toolbar mt">
              <h3 className="card-title nomargin">
                {t(
                  'সাম্প্রতিক রক্তের অনুরোধসমূহ',
                  'Recent Blood Requests'
                )}
              </h3>

              <div className="inline-controls">
                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                >
                  <option value="">
                    {t(
                      'সব গ্রুপ',
                      'All groups'
                    )}
                  </option>

                  {BLOOD_GROUPS.map((group) => (
                    <option
                      key={group}
                      value={group}
                    >
                      {group}
                    </option>
                  ))}
                </select>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={onlyOpen}
                    onChange={(event) =>
                      setOnlyOpen(event.target.checked)
                    }
                  />
                  {' '}
                  {t(
                    'শুধু চলমান',
                    'Open only'
                  )}
                </label>
              </div>
            </div>

            {loading && <Loader />}
            <ErrorBox message={error} />

            {!loading &&
              !error &&
              filteredRequests.length === 0 && (
                <div className="notice">
                  {t(
                    'বর্তমানে কোনো রক্তের অনুরোধ পাওয়া যায়নি।',
                    'No blood requests available right now.'
                  )}
                </div>
              )}

            {filteredRequests.map((request) => (
              <div
                className={`card pad req ${request.status}`}
                key={request._id}
              >
                <div className="req-group">
                  {request.bloodGroup}
                </div>

                <div className="req-body">
                  <h4>
                    {request.patientName}

                    {request.status === 'fulfilled' && (
                      <>
                        {' '}
                        <span className="badge badge-success">
                          {t(
                            'পূরণ হয়েছে',
                            'Fulfilled'
                          )}
                        </span>
                      </>
                    )}
                  </h4>

                  <p className="muted">
                    <i className="fa-solid fa-location-dot text-danger" />
                    {' '}
                    {request.hospital},
                    {' '}
                    {request.location}
                  </p>

                  <p>
                    <i className="fa-solid fa-phone" />
                    {' '}
                    <a href={`tel:${request.contactNumber}`}>
                      {request.contactNumber}
                    </a>
                    {' · '}
                    <small className="muted">
                      {timeAgo(
                        request.createdAt,
                        lang
                      )}
                    </small>
                  </p>

                  {request.details && (
                    <small className="muted">
                      {request.details}
                    </small>
                  )}
                </div>

                <div className="req-side">
                  <span
                    className={`badge ${
                      request.urgency === 'Emergency'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }`}
                  >
                    {urgencyLabel[request.urgency]}
                  </span>

                  {request.status === 'open' &&
                    user &&
                    (
                      String(request.createdBy) ===
                        String(user.id || user._id) ||
                      user.role === 'admin'
                    ) && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === request._id}
                        onClick={() =>
                          fulfill(request._id)
                        }
                      >
                        {t(
                          'পূরণ হয়েছে',
                          'Mark Fulfilled'
                        )}
                      </button>
                    )}
                </div>
              </div>
            ))}

            {!loading && !error && (
              <p className="muted small">
                {t(
                  `মোট ${num(filteredRequests.length)}টি অনুরোধ দেখানো হচ্ছে`,
                  `Showing ${filteredRequests.length} request(s)`
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
