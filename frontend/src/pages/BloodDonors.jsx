import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PageHeader,
  useToast,
  Loader,
  ErrorBox,
  Modal,
  BLOOD_GROUPS
} from '../components/ui.jsx';
import BloodBankLink from '../components/BloodBankLink.jsx';

const BLANK = {
  name: '',
  bloodGroup: '',
  location: '',
  phone: '',
  lastDonation: '',
  available: true
};

const HISTORY_BLANK = {
  date: '',
  place: '',
  note: ''
};

const monthsSince = (date) =>
  date
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(date).getTime()) /
          (30.44 * 86400000)
        )
      )
    : null;

const today = () =>
  new Date(
    Date.now() + 6 * 3600000
  ).toISOString().slice(0, 10);

export default function BloodDonors() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const toast = useToast();

  const isAdmin = user?.role === 'admin';

  const [group, setGroup] = useState('');
  const [location, setLocation] = useState('');
  const [onlyReady, setOnlyReady] = useState(false);

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReg, setShowReg] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const [mine, setMine] = useState(null);
  const [history, setHistory] = useState([]);

  const [historyForm, setHistoryForm] =
    useState(HISTORY_BLANK);

  const [historySaving, setHistorySaving] =
    useState(false);

  // -----------------------------------------
  // Search blood donors
  // -----------------------------------------

  const search = useCallback(async () => {
    setLoading(true);

    try {
      const qs = new URLSearchParams();

      if (group) {
        qs.set('group', group);
      }

      if (location.trim()) {
        qs.set('location', location.trim());
      }

      const list = await api(`/blood/donors?${qs}`);

      setDonors(
        Array.isArray(list) ? list : []
      );

      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [group, location]);

  // -----------------------------------------
  // Load own profile and donation history
  // -----------------------------------------

  const loadMine = useCallback(async () => {
    if (!user || isAdmin) {
      setMine(null);
      setHistory([]);
      return;
    }

    try {
      const [profile, records] = await Promise.all([
        api('/blood/donors/mine'),
        api('/blood/donors/mine/history')
      ]);

      setMine(profile);

      setHistory(
        Array.isArray(records) ? records : []
      );
    } catch (e) {
      toast(e.message, 'error');
    }
  }, [user?.id, isAdmin]);

  useEffect(() => {
    const timer = setTimeout(search, 250);
    return () => clearTimeout(timer);
  }, [search, user?.id]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  // -----------------------------------------
  // Open register/edit profile modal
  // -----------------------------------------

  async function openRegister() {
    if (!user) {
      toast(
        t(
          'নিবন্ধনের জন্য লগইন করুন।',
          'Please login to register.'
        ),
        'info'
      );
      return;
    }

    if (isAdmin) return;

    try {
      const profile = await api('/blood/donors/mine');

      setMine(profile);

      setForm(
        profile
          ? {
              name: profile.name || '',
              bloodGroup: profile.bloodGroup || '',
              location: profile.location || '',
              phone: profile.phone || '',
              lastDonation:
                profile.lastDonation?.slice(0, 10) || '',
              available: profile.available !== false
            }
          : {
              ...BLANK,
              name: user.name || '',
              phone: user.phone || '',
              location: user.district || ''
            }
      );

      setShowReg(true);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  // -----------------------------------------
  // Save donor profile
  // -----------------------------------------

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await api('/blood/donors', {
        method: 'POST',
        body: form
      });

      toast(
        t(
          'দাতার তথ্য সংরক্ষণ হয়েছে।',
          'Donor profile saved.'
        )
      );

      setShowReg(false);

      await Promise.all([
        loadMine(),
        search()
      ]);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // Save donation history
  // -----------------------------------------

  async function saveHistory(e) {
    e.preventDefault();
    setHistorySaving(true);

    try {
      await api('/blood/donors/mine/history', {
        method: 'POST',
        body: historyForm
      });

      toast(
        t(
          'রক্তদানের ইতিহাস সংরক্ষণ হয়েছে।',
          'Donation record saved.'
        )
      );

      setHistoryForm(HISTORY_BLANK);

      await Promise.all([
        loadMine(),
        search()
      ]);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setHistorySaving(false);
    }
  }

  // -----------------------------------------
  // Filter by last donation interval
  // -----------------------------------------

  const shown = donors.filter((donor) => {
    if (!onlyReady) return true;

    const elapsed = monthsSince(
      donor.lastDonation
    );

    return elapsed !== null && elapsed >= 3;
  });

  return (
    <>
      <PageHeader
        icon="fa-droplet"
        tone="danger"
        title={t(
          'জরুরি রক্তদাতা অনুসন্ধান',
          'Emergency Donor Finder'
        )}
        subtitle={t(
          'রক্তদাতা খুঁজুন অথবা নিজে রক্তদাতা হিসেবে নিবন্ধন করুন।',
          'Find blood donors or register yourself as a donor.'
        )}
      />

      <div className="container section">

        <BloodBankLink />

        {/* Search filters */}
        <div className="card pad">
          <div className="toolbar">
            <div className="inline-controls grow">

              <select
                aria-label="Blood group"
                value={group}
                onChange={(e) =>
                  setGroup(e.target.value)
                }
              >
                <option value="">
                  {t(
                    'সব রক্তের গ্রুপ',
                    'All blood groups'
                  )}
                </option>

                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              <div className="search-box">
                <i className="fa-solid fa-location-dot" />

                <input
                  aria-label="Donor location"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder={t(
                    'জেলা / এলাকা',
                    'District / area'
                  )}
                />
              </div>

              <label className="check">
                <input
                  type="checkbox"
                  checked={onlyReady}
                  onChange={(e) =>
                    setOnlyReady(e.target.checked)
                  }
                />

                {' '}

                {t(
                  'শেষ রক্তদানের ৩+ মাস হয়েছে',
                  'Last donation was 3+ months ago'
                )}
              </label>

            </div>

            {!isAdmin && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={openRegister}
              >
                <i className="fa-solid fa-user-plus" />

                {' '}

                {t(
                  mine
                    ? 'আমার দাতা প্রোফাইল'
                    : 'দাতা নিবন্ধন',
                  mine
                    ? 'Edit My Donor Profile'
                    : 'Register as Donor'
                )}
              </button>
            )}
          </div>

          <p
            className="muted small"
            style={{ marginTop: 10 }}
          >
            {t(
              '৩ মাসের সময়সীমা শুধু আনুমানিক ফিল্টার; রক্তদানে উপযুক্ত কি না তা চিকিৎসক বা ব্লাড ব্যাংক যাচাই করবেন।',
              'The 3-month interval is only an approximate filter; a blood bank must confirm eligibility.'
            )}
          </p>
        </div>

        {/* Guest login notice */}
        {!user && (
          <div className="notice mt">
            {t(
              'দাতার ফোন নম্বর দেখতে লগইন করুন।',
              'Login to see donor phone numbers.'
            )}

            {' '}

            <Link
              to="/login"
              state={{
                from: '/blood-donors'
              }}
            >
              <strong>
                {t('লগইন', 'Login')}
              </strong>
            </Link>
          </div>
        )}

        {/* My donor profile and donation history */}
        {mine && !isAdmin && (
          <section className="card pad mt">

            <div className="toolbar">
              <h3 className="nomargin">
                {t(
                  'আমার রক্তদাতা প্রোফাইল',
                  'My Donor Profile'
                )}
              </h3>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={openRegister}
              >
                {t(
                  'তথ্য পরিবর্তন',
                  'Edit Profile'
                )}
              </button>
            </div>

            <p>
              {mine.name} · {mine.bloodGroup} · {mine.location}
            </p>

            <span
              className={`badge ${
                mine.available
                  ? 'badge-success'
                  : 'badge-warning'
              }`}
            >
              {mine.available
                ? t(
                    'যোগাযোগের জন্য উপলব্ধ',
                    'Available for contact'
                  )
                : t(
                    'সাময়িক অনুপলব্ধ',
                    'Temporarily unavailable'
                  )}
            </span>

            <h4 style={{ marginTop: 18 }}>
              {t(
                'আমার রক্তদানের ইতিহাস',
                'My Donation History'
              )}
            </h4>

            <p className="muted small">
              {t(
                'নিজে দেওয়া তথ্য; চিকিৎসাগতভাবে যাচাই করা নয়।',
                'Self-reported records, not medically verified.'
              )}
            </p>

            {/* Add donation record form */}
            <form
              className="form"
              onSubmit={saveHistory}
            >

              <div
                className="inline-controls"
                style={{ flexWrap: 'wrap' }}
              >

                <label>
                  {t(
                    'রক্তদানের তারিখ',
                    'Donation date'
                  )}

                  <input
                    type="date"
                    value={historyForm.date}
                    max={today()}
                    required
                    onChange={(e) =>
                      setHistoryForm((f) => ({
                        ...f,
                        date: e.target.value
                      }))
                    }
                  />
                </label>

                <label>
                  {t(
                    'হাসপাতাল / স্থান',
                    'Hospital / location'
                  )}

                  <input
                    value={historyForm.place}
                    maxLength={150}
                    required
                    onChange={(e) =>
                      setHistoryForm((f) => ({
                        ...f,
                        place: e.target.value
                      }))
                    }
                  />
                </label>

              </div>

              <label>
                {t(
                  'নোট (ঐচ্ছিক)',
                  'Note (optional)'
                )}

                <input
                  value={historyForm.note}
                  maxLength={300}
                  onChange={(e) =>
                    setHistoryForm((f) => ({
                      ...f,
                      note: e.target.value
                    }))
                  }
                />
              </label>

              <button
                className="btn btn-primary"
                disabled={historySaving}
              >
                {historySaving
                  ? '…'
                  : t(
                      'ইতিহাসে যোগ করুন',
                      'Add Donation Record'
                    )}
              </button>
            </form>

            {/* Donation history list */}
            {history.length === 0 ? (
              <p className="muted mt-sm">
                {t(
                  'এখনো কোনো রেকর্ড নেই।',
                  'No donation records yet.'
                )}
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 9,
                  marginTop: 16
                }}
              >
                {history.map((record) => (
                  <div
                    className="notice"
                    key={record._id}
                  >
                    <strong>
                      {new Date(
                        record.donatedAt
                      ).toLocaleDateString(
                        lang === 'bn'
                          ? 'bn-BD'
                          : 'en-GB'
                      )}
                    </strong>

                    {' · '}

                    {record.place}

                    {record.note && (
                      <div className="muted small">
                        {record.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Donor results */}
        <h3 className="section-title sm">
          {t(
            `উপলব্ধ রক্তদাতা (${shown.length})`,
            `Available donors (${shown.length})`
          )}
        </h3>

        {loading && <Loader />}

        <ErrorBox message={error} />

        {!loading && shown.length === 0 && (
          <div className="notice">
            {t(
              'কোনো রক্তদাতা পাওয়া যায়নি।',
              'No donors found.'
            )}
          </div>
        )}

        <div className="grid grid-3">
          {!loading &&
            shown.map((donor) => {
              const elapsed = monthsSince(
                donor.lastDonation
              );

              return (
                <div
                  className="card pad donor"
                  key={donor._id}
                >

                  <div className="donor-top">
                    <h4>{donor.name}</h4>

                    <span className="group-pill">
                      {donor.bloodGroup}
                    </span>
                  </div>

                  <p className="muted">
                    <i className="fa-solid fa-location-dot text-danger" />

                    {' '}

                    {donor.location}
                  </p>

                  <p className="muted">
                    {elapsed === null
                      ? t(
                          'শেষ রক্তদানের তথ্য নেই',
                          'Last donation date not recorded'
                        )
                      : t(
                          `শেষ রক্তদান: প্রায় ${elapsed} মাস আগে`,
                          `Last donation: about ${elapsed} month(s) ago`
                        )}
                  </p>

                  <span
                    className={`badge ${
                      elapsed !== null && elapsed >= 3
                        ? 'badge-success'
                        : 'badge-warning'
                    }`}
                  >
                    {elapsed === null
                      ? t(
                          'সময় যাচাই প্রয়োজন',
                          'Donation interval unknown'
                        )
                      : elapsed >= 3
                        ? t(
                            '৩+ মাস হয়েছে (যোগ্যতা যাচাই সাপেক্ষে)',
                            '3+ months (screening required)'
                          )
                        : t(
                            '৩ মাসের কম',
                            'Less than 3 months'
                          )}
                  </span>

                  {donor.phone ? (
                    <a
                      href={`tel:${donor.phone}`}
                      className="btn btn-outline btn-block mt-sm"
                    >
                      <i className="fa-solid fa-phone" />

                      {' '}

                      {donor.phone}
                    </a>
                  ) : (
                    <Link
                      to="/login"
                      state={{
                        from: '/blood-donors'
                      }}
                      className="btn btn-outline btn-block mt-sm"
                    >
                      {t(
                        'নম্বর দেখতে লগইন',
                        'Login to see number'
                      )}
                    </Link>
                  )}

                </div>
              );
            })}
        </div>
      </div>

      {/* Donor registration / edit modal */}
      {showReg && (
        <Modal onClose={() => setShowReg(false)}>

          <h3>
            {t(
              'দাতা নিবন্ধন / প্রোফাইল',
              'Donor Registration / Profile'
            )}
          </h3>

          <form
            className="form"
            onSubmit={saveProfile}
          >

            <label>
              {t('নাম', 'Name')}

              <input
                value={form.name}
                required
                maxLength={100}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value
                  }))
                }
              />
            </label>

            <label>
              {t(
                'রক্তের গ্রুপ',
                'Blood group'
              )}

              <select
                value={form.bloodGroup}
                required
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bloodGroup: e.target.value
                  }))
                }
              >
                <option value="">
                  {t(
                    'নির্বাচন করুন',
                    'Select'
                  )}
                </option>

                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t(
                'জেলা / এলাকা',
                'District / area'
              )}

              <input
                value={form.location}
                required
                maxLength={120}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    location: e.target.value
                  }))
                }
              />
            </label>

            <label>
              {t(
                'মোবাইল নম্বর',
                'Mobile number'
              )}

              <input
                value={form.phone}
                required
                inputMode="tel"
                maxLength={25}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phone: e.target.value
                  }))
                }
              />
            </label>

            <label>
              {t(
                'শেষ রক্তদানের তারিখ (ঐচ্ছিক)',
                'Last donation date (optional)'
              )}

              <input
                type="date"
                max={today()}
                value={form.lastDonation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    lastDonation: e.target.value
                  }))
                }
              />
            </label>

            <label className="check">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    available: e.target.checked
                  }))
                }
              />

              {' '}

              {t(
                'আমাকে দাতা তালিকায় দেখান (যোগাযোগের জন্য উপলব্ধ)',
                'Show me in donor search (available for contact)'
              )}
            </label>

            <p className="muted small">
              {t(
                'তালিকায় থাকলে লগইন করা ব্যবহারকারীরা আপনার নম্বর দেখতে পারবেন।',
                'Logged-in users will be able to see your phone number while your profile is available.'
              )}
            </p>

            <button
              type="submit"
              className="btn btn-accent btn-block"
              disabled={saving}
            >
              {saving
                ? '…'
                : t(
                    'সংরক্ষণ করুন',
                    'Save Profile'
                  )}
            </button>

          </form>
        </Modal>
      )}
    </>
  );
}