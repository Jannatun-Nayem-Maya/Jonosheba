
import { useState } from 'react';
import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import {
  useForm,
  useToast,
  DISTRICTS
} from '../components/ui.jsx';

// ==========================================
// REGISTRATION ROLES
// ==========================================

const ROLES = [
  [
    'user',
    'fa-user',
    'সাধারণ নাগরিক',
    'Citizen'
  ],
  [
    'student',
    'fa-user-graduate',
    'শিক্ষার্থী',
    'Student'
  ],
  [
    'volunteer',
    'fa-hand-holding-heart',
    'স্বেচ্ছাসেবক',
    'Volunteer'
  ]
];

// ==========================================
// INITIAL REGISTRATION FORM
// ==========================================

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  district: '',
  password: '',
  role: 'user'
};

export default function Register() {
  const { t } = useLang();
  const { register } = useAuth();

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, bind] = useForm(INITIAL_FORM);

  // Confirm password is kept only in frontend.
  // It is not sent to the backend.

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [busy, setBusy] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================

  const passwordsMatch =
    form.password === confirmPassword;

  const passwordIsValid =
    form.password.length >= 6;

  const showMismatch =
    confirmPassword.length > 0 &&
    !passwordsMatch;

  const canSubmit =
    passwordIsValid &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    !busy;

  // ==========================================
  // REGISTRATION SUBMIT
  // ==========================================

  const submit = async (event) => {
    event.preventDefault();

    setSubmitted(true);

    if (busy) return;

    // Password must contain at least 6 characters.

    if (!passwordIsValid) {
      toast(
        t(
          'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
          'Password must contain at least 6 characters.'
        ),
        'error'
      );

      return;
    }

    // Confirm password is required.

    if (!confirmPassword) {
      toast(
        t(
          'পাসওয়ার্ড নিশ্চিত করুন।',
          'Please confirm your password.'
        ),
        'error'
      );

      return;
    }

    // Password and Confirm Password must match.

    if (!passwordsMatch) {
      toast(
        t(
          'পাসওয়ার্ড দুটি মিলছে না। আবার চেষ্টা করুন।',
          'Passwords do not match. Please try again.'
        ),
        'error'
      );

      return;
    }

    setBusy(true);

    try {
      // Send only original registration fields.
      // Confirm Password is never included.

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        district: form.district,
        password: form.password,
        role: form.role
      });

      toast(
        t(
          'রেজিস্ট্রেশন সফল হয়েছে!',
          'Registration successful!'
        ),
        'success'
      );

      navigate(
        location.state?.from || '/',
        { replace: true }
      );

    } catch (error) {
      toast(error.message, 'error');

    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section auth-wrap">

      <div className="card pad auth-card">

        {/* ==================================
            PAGE HEADER
            ================================== */}

        <div className="center">

          <div className="icon-circle tone-accent big">
            <i className="fa-solid fa-user-plus" />
          </div>

          <h2>
            {t(
              'নতুন অ্যাকাউন্ট',
              'Create Account'
            )}
          </h2>

          <p className="muted small">
            {t(
              'জনসেবার সকল সুবিধা ব্যবহার করতে অ্যাকাউন্ট তৈরি করুন।',
              'Create an account to access Jonoseba services.'
            )}
          </p>

        </div>

        {/* ==================================
            REGISTRATION FORM
            ================================== */}

        <form
          className="form"
          onSubmit={submit}
        >

          {/* ROLE SELECTION */}

          <div className="role-pick">

            {ROLES.map(
              ([value, icon, bn, en]) => (
                <button
                  type="button"
                  key={value}
                  className={`role ${
                    form.role === value ? 'on' : ''
                  }`}
                  onClick={() =>
                    bind({
                      target: {
                        name: 'role',
                        value
                      }
                    })
                  }
                >
                  <i
                    className={`fa-solid ${icon}`}
                  />

                  {' '}

                  {t(bn, en)}
                </button>
              )
            )}

          </div>

          {/* FULL NAME */}

          <label>
            {t('পূর্ণ নাম', 'Full Name')}

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={bind}
              autoComplete="name"
              maxLength={100}
              required
            />
          </label>

          {/* EMAIL */}

          <label>
            {t('ইমেইল', 'Email')}

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={bind}
              autoComplete="email"
              required
            />
          </label>

          {/* MOBILE + DISTRICT */}

          <div className="form-grid">

            <label>
              {t('মোবাইল', 'Mobile')}

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={bind}
                inputMode="tel"
                autoComplete="tel"
                pattern="01[3-9][0-9]{8}"
                title="01XXXXXXXXX"
              />
            </label>

            <label>
              {t('জেলা', 'District')}

              <select
                name="district"
                value={form.district}
                onChange={bind}
              >
                <option value="">
                  {t(
                    'নির্বাচন করুন',
                    'Select'
                  )}
                </option>

                {DISTRICTS.map((district) => (
                  <option
                    key={district}
                    value={district}
                  >
                    {district}
                  </option>
                ))}

              </select>
            </label>

          </div>

          {/* ==================================
              PASSWORD FIELD
              ================================== */}

          <label>
            {t(
              'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)',
              'Password (minimum 6 characters)'
            )}

            <div style={{ position: 'relative' }}>

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                value={form.password}
                onChange={bind}
                autoComplete="new-password"
                minLength={6}
                required
                style={{
                  width: '100%',
                  paddingRight: 75
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? t(
                        'পাসওয়ার্ড লুকান',
                        'Hide password'
                      )
                    : t(
                        'পাসওয়ার্ড দেখুন',
                        'Show password'
                      )
                }
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#53646a',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '4px 6px'
                }}
              >
                {showPassword
                  ? t('লুকান', 'Hide')
                  : t('দেখুন', 'Show')}
              </button>

            </div>
          </label>

          {/* ==================================
              CONFIRM PASSWORD FIELD
              ================================== */}

          <label>
            {t(
              'পাসওয়ার্ড নিশ্চিত করুন',
              'Confirm Password'
            )}

            <div style={{ position: 'relative' }}>

              <input
                type={
                  showConfirmPassword
                    ? 'text'
                    : 'password'
                }
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(
                    event.target.value
                  );
                }}
                autoComplete="new-password"
                minLength={6}
                required
                aria-invalid={
                  submitted && !passwordsMatch
                }
                aria-describedby="password-match-message"
                style={{
                  width: '100%',
                  paddingRight: 75,
                  borderColor: showMismatch
                    ? '#dc3545'
                    : undefined
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? t(
                        'পাসওয়ার্ড লুকান',
                        'Hide password'
                      )
                    : t(
                        'পাসওয়ার্ড দেখুন',
                        'Show password'
                      )
                }
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#53646a',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '4px 6px'
                }}
              >
                {showConfirmPassword
                  ? t('লুকান', 'Hide')
                  : t('দেখুন', 'Show')}
              </button>

            </div>

            {/* PASSWORD MATCH FEEDBACK */}

            <span
              id="password-match-message"
              role={
                showMismatch
                  ? 'alert'
                  : undefined
              }
              aria-live="polite"
              style={{
                display: 'block',
                marginTop: 7,
                fontSize: 13,
                fontWeight: 500,
                color: showMismatch
                  ? '#dc3545'
                  : '#218348',
                minHeight: 16
              }}
            >

              {confirmPassword.length > 0 &&
                (
                  passwordsMatch
                    ? t(
                        'পাসওয়ার্ড দুটি মিলেছে।',
                        'Passwords match.'
                      )
                    : t(
                        'পাসওয়ার্ড দুটি মিলছে না।',
                        'Passwords do not match.'
                      )
                )}

            </span>

          </label>

          {/* SUBMIT BUTTON */}

          <button
            type="submit"
            className="btn btn-accent btn-block btn-lg"
            disabled={!canSubmit}
          >
            {busy
              ? t(
                  'রেজিস্ট্রেশন হচ্ছে...',
                  'Registering...'
                )
              : t(
                  'রেজিস্টার',
                  'Register'
                )}
          </button>

        </form>

        {/* LOGIN LINK */}

        <p className="center muted">
          {t(
            'ইতিমধ্যে অ্যাকাউন্ট আছে?',
            'Already have an account?'
          )}

          {' '}

          <Link
            to="/login"
            state={location.state}
          >
            <strong>
              {t(
                'লগইন',
                'Login'
              )}
            </strong>
          </Link>
        </p>

      </div>
    </div>
  );
}
