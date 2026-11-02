import { useState, useEffect } from 'react';

import {
  Link,
  NavLink,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './ui.jsx';

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { user, logout } = useAuth();

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);

  // Close menus whenever the route changes
  useEffect(() => {
    setOpen(false);
    setDd(false);
  }, [location.pathname]);

  // Dashboard according to user role
  const dashboardPath =
    user?.role?.toLowerCase() === 'admin'
      ? '/admin'
      : '/dashboard';

  // Close all menus
  const closeMenus = () => {
    setOpen(false);
    setDd(false);
  };

  // Logout
  const handleLogout = () => {
    logout();

    toast(
      t('লগআউট করা হয়েছে।', 'Logged out successfully.'),
      'info'
    );

    closeMenus();
    navigate('/');
  };

  // Current Bangladesh date
  const today = new Date().toLocaleDateString(
    lang === 'bn' ? 'bn-BD' : 'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Dhaka'
    }
  );

  return (
    <>
      {/* Top Date Strip */}
      <div className="topstrip">
        <div className="container">
          {today}
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="container nav-inner">

          {/* Brand Logo */}
          <Link
            to="/"
            className="brand"
            onClick={closeMenus}
          >
            <span className="brand-icon">
              <i className="fa-solid fa-hand-holding-heart" />
            </span>

            <span className="brand-text">
              <span className="brand-name">
                <b className="r">{t('জন', 'Jono')}</b>
                <b className="g">{t('সেবা', 'seba')}</b>
              </span>

              <small>
                {t(
                  'এক ঠিকানায় নাগরিক সেবা',
                  'Citizen services in one place'
                )}
              </small>
            </span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen(prev => !prev)}
            aria-label={t('মেনু খুলুন', 'Toggle menu')}
            aria-expanded={open}
          >
            <i
              className={`fa-solid ${
                open ? 'fa-xmark' : 'fa-bars'
              }`}
            />
          </button>

          {/* Navigation Links */}
          <nav className={`nav-links ${open ? 'open' : ''}`}>

            {/* Home */}
            <NavLink
              to="/"
              end
              onClick={closeMenus}
            >
              {t('হোম', 'Home')}
            </NavLink>

            {/* Health & Blood */}
            <NavLink
              to="/health"
              onClick={closeMenus}
            >
              {t('স্বাস্থ্য ও রক্তদান', 'Health & Blood')}
            </NavLink>

            {/* Scholarships */}
            <NavLink
              to="/scholarship"
              onClick={closeMenus}
            >
              {t('শিক্ষা ও বৃত্তি', 'Scholarships')}
            </NavLink>

            {/* Citizen Services Dropdown */}
            <div className="dropdown">

              <button
                type="button"
                className="dd-toggle"
                onClick={() => setDd(prev => !prev)}
                aria-expanded={dd}
                aria-haspopup="true"
                aria-controls="jonoseba-services-menu"
              >
                {t('নাগরিক সেবা', 'Services')}

                {' '}

                <i
                  className={`fa-solid ${
                    dd
                      ? 'fa-chevron-up'
                      : 'fa-chevron-down'
                  }`}
                />
              </button>

              {dd && (
                <div
                  className="dd-menu"
                  id="jonoseba-services-menu"
                >

                  <Link
                    to="/services"
                    onClick={closeMenus}
                  >
                    {t('সকল সেবা', 'All Services')}
                  </Link>

                  <Link
                    to="/nearby-services"
                    onClick={closeMenus}
                  >
                    {t(
                      'নিকটস্থ প্রয়োজনীয় সেবা',
                      'Nearby Essential Services'
                    )}
                  </Link>

                  <Link
                    to="/blood-donors"
                    onClick={closeMenus}
                  >
                    {t('রক্তদাতা তালিকা', 'Blood Donors')}
                  </Link>

                  <Link
                    to="/disaster-alerts"
                    onClick={closeMenus}
                  >
                    {t('দুর্যোগ সতর্কতা', 'Disaster Alerts')}
                  </Link>

                  <Link
                    to="/emergency-contacts"
                    onClick={closeMenus}
                  >
                    {t('জরুরি যোগাযোগ', 'Emergency Contacts')}
                  </Link>

                  <Link
                    to="/relief-apply"
                    onClick={closeMenus}
                  >
                    {t('ত্রাণ আবেদন', 'Relief Apply')}
                  </Link>

                  <Link
                    to="/service-apply/general"
                    onClick={closeMenus}
                  >
                    {t('সেবার আবেদন', 'Service Apply')}
                  </Link>

                  <Link
                    to="/volunteer"
                    onClick={closeMenus}
                  >
                    {t(
                      'স্বেচ্ছাসেবক নিবন্ধন',
                      'Volunteer Registration'
                    )}
                  </Link>

                  <Link
                    to="/welfare-programs"
                    onClick={closeMenus}
                  >
                    {t(
                      'কল্যাণমূলক কর্মসূচি',
                      'Welfare Programs'
                    )}
                  </Link>

                  <Link
                    to="/gov-services"
                    onClick={closeMenus}
                  >
                    {t(
                      'সরকারি ই-সেবা কেন্দ্র',
                      'Government E-Services Hub'
                    )}
                  </Link>

                  <Link
                    to="/complaints"
                    onClick={closeMenus}
                  >
                    {t(
                      'নাগরিক অভিযোগ ও সমাধান',
                      'Citizen Complaint & Tracking'
                    )}
                  </Link>

                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div
              className="lang-toggle"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                className={lang === 'bn' ? 'on' : ''}
                onClick={() => setLang('bn')}
                aria-pressed={lang === 'bn'}
              >
                বাংলা
              </button>

              <button
                type="button"
                className={lang === 'en' ? 'on' : ''}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                English
              </button>
            </div>

            {/* Authentication */}
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="btn btn-light btn-sm"
                  onClick={closeMenus}
                >
                  <i className="fa-solid fa-user" />
                  {' '}
                  {user.name?.split(' ')[0] ||
                    t('প্রোফাইল', 'Profile')}
                </Link>

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleLogout}
                >
                  {t('লগআউট', 'Logout')}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-light btn-sm"
                onClick={closeMenus}
              >
                {t('লগইন', 'Login')}
              </Link>
            )}

          </nav>
        </div>
      </header>
    </>
  );
}