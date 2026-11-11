
import { useState } from 'react';

import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ui.jsx';

export default function Login() {
  const { t } = useLang();
  const { login } = useAuth();

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  // -----------------------------------------
  // Handle Login
  // -----------------------------------------

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    setBusy(true);

    try {
      const user = await login(email, password);

      toast(
        t(
          'সফলভাবে লগইন করেছেন!',
          'Logged in successfully!'
        )
      );

      const dashboardPath =
        user?.role?.toLowerCase() === 'admin'
          ? '/admin'
          : '/';

      const destination =
        location.state?.from || dashboardPath;

      navigate(destination, {
        replace: true
      });
    } catch (error) {
      toast(
        t(
          'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়!',
          error.message || 'Login failed.'
        ),
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section auth-wrap login-background">

      {/* Login Card */}
      <div className="card pad auth-card">

        {/* Login Heading - Icon Removed */}
        <div className="center">
          <h2>
            {t('লগইন করুন', 'Login')}
          </h2>

          <p className="muted">
            {t(
              'লগইন করলে রক্তদাতার ফোন নম্বর, বৃত্তি সংরক্ষণ ও জাতীয় ব্লাড ব্যাংক লিংক পাবেন।',
              'Log in to see donor phone numbers, save scholarships and open the national blood bank link.'
            )}
          </p>
        </div>

        {/* Login Form */}
        <form
          className="form"
          onSubmit={submit}
        >

          {/* Email Address */}
          <label htmlFor="login-email">
            {t('ইমেইল', 'Email address')}

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="user@example.com"
              autoComplete="email"
              required
              autoFocus
              disabled={busy}
            />
          </label>

          {/* Password */}
          <label htmlFor="login-password">
            {t('পাসওয়ার্ড', 'Password')}

            <div className="pw">
              <input
                id="login-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                disabled={busy}
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() =>
                  setShow((current) => !current)
                }
                aria-label={t(
                  'পাসওয়ার্ড দেখান বা লুকান',
                  'Show or hide password'
                )}
                aria-pressed={show}
                disabled={busy}
              >
                <i
                  className={`fa-solid ${
                    show ? 'fa-eye-slash' : 'fa-eye'
                  }`}
                />
              </button>
            </div>
          </label>

          {/* Login Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={busy}
          >
            {busy
              ? t(
                  'লগইন হচ্ছে...',
                  'Logging in...'
                )
              : t('লগইন', 'Login')}
          </button>

        </form>

        {/* Registration Link */}
        <p
          className="center muted"
          style={{
            marginTop: 16,
            marginBottom: 0
          }}
        >
          {t(
            'অ্যাকাউন্ট নেই?',
            'No account yet?'
          )}

          {' '}

          <Link
            to="/register"
            state={location.state}
          >
            <strong>
              {t(
                'রেজিস্ট্রেশন করুন',
                'Register'
              )}
            </strong>
          </Link>
        </p>

      </div>
    </div>
  );
}
