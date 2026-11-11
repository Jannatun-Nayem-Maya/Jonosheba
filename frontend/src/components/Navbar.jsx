
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

// ==========================================
// JONOSEBA NAVBAR
// ==========================================

export default function Navbar() {
  const { t, lang, setLang } = useLang();

  const { user, logout } = useAuth();

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // ========================================
  // NAVIGATION STATES
  // ========================================

  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);

  // ========================================
  // USER ROLE
  // ========================================

  const isAdmin =
    String(user?.role || '').toLowerCase() === 'admin';

  const dashboardPath = isAdmin
    ? '/admin'
    : '/dashboard';

  // ========================================
  // CLOSE MENUS ON PAGE CHANGE
  // ========================================

  useEffect(() => {
    setOpen(false);
    setDd(false);
  }, [location.pathname]);

  const closeMenus = () => {
    setOpen(false);
    setDd(false);
  };

  // ========================================
  // LOGOUT HANDLER
  // ========================================

  const handleLogout = () => {
    logout();

    closeMenus();

    toast(
      t(
        'লগআউট করা হয়েছে।',
        'Logged out successfully.'
      ),
      'info'
    );

    navigate('/', {
      replace: true
    });
  };

  // ========================================
  // CURRENT DATE
  // ========================================

  const today = new Date().toLocaleDateString(
    lang === 'bn' ? 'bn-BD' : 'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Dhaka'
    }
  );

  // ========================================
  // NAVBAR UI
  // ========================================

  return (
    <>

      {/* ================================= */}
      {/* TOP DATE STRIP                    */}
      {/* ================================= */}

      <div className="topstrip">
        <div className="container">
          {today}
        </div>
      </div>

      {/* ================================= */}
      {/* MAIN NAVBAR                       */}
      {/* ================================= */}

      <header className="navbar">
        <div className="container nav-inner">

          {/* ============================= */}
          {/* LOGO AND BRAND                */}
          {/* ============================= */}

          <Link
            to="/"
            className="brand"
            onClick={closeMenus}
          >
            <span
              className="brand-icon"
              style={{
                width: 54,
                height: 54,
                minWidth: 54,
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                background: 'transparent',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src="/images/jonoseba-logo.png"
                alt="Jonoseba"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            </span>

            <span className="brand-text">
              <span className="brand-name">
                <b className="r">
                  {t('জন', 'Jono')}
                </b>

                <b className="g">
                  {t('সেবা', 'seba')}
                </b>
              </span>

              <small>
                {t(
                  'এক ঠিকানায় নাগরিক সেবা',
                  'Citizen services in one place'
                )}
              </small>
            </span>
          </Link>

          {/* ============================= */}
          {/* MOBILE MENU TOGGLE            */}
          {/* ============================= */}

          <button
            type="button"
            className="nav-toggle"
            onClick={() =>
              setOpen((value) => !value)
            }
            aria-label={t(
              'মেনু খুলুন',
              'Toggle menu'
            )}
            aria-expanded={open}
          >
            <i
              className={`fa-solid ${
                open
                  ? 'fa-xmark'
                  : 'fa-bars'
              }`}
            />
          </button>

          {/* ============================= */}
          {/* NAVIGATION LINKS              */}
          {/* ============================= */}

          <nav
            className={`nav-links ${
              open ? 'open' : ''
            }`}
          >

            {/* HOME */}

            <NavLink
              to="/"
              end
              onClick={closeMenus}
            >
              {t('হোম', 'Home')}
            </NavLink>

            {/* HEALTH & BLOOD */}

            <NavLink
              to="/health"
              onClick={closeMenus}
            >
              {t(
                'স্বাস্থ্য ও রক্তদান',
                'Health & Blood'
              )}
            </NavLink>

            {/* SCHOLARSHIPS */}

            <NavLink
              to="/scholarship"
              onClick={closeMenus}
            >
              {t(
                'শিক্ষা ও বৃত্তি',
                'Scholarships'
              )}
            </NavLink>

            {/* ============================= */}
            {/* SERVICES DROPDOWN            */}
            {/* ============================= */}

            <div className="dropdown">
              <button
                type="button"
                className="dd-toggle"
                onClick={() =>
                  setDd((value) => !value)
                }
                aria-expanded={dd}
                aria-haspopup="true"
                aria-controls="jonoseba-services-menu"
              >
                {t(
                  'নাগরিক সেবা',
                  'Services'
                )}{' '}

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

                  {/* ALL SERVICES */}

                  <Link
                    to="/services"
                    onClick={closeMenus}
                  >
                    {t(
                      'সকল সেবা',
                      'All Services'
                    )}
                  </Link>

                  {/* ================================= */}
                  {/* PUBLIC HELP CENTER (NEW)          */}
                  {/* NO ICON BEFORE TEXT               */}
                  {/* ================================= */}

                  <Link
                    to="/help-center"
                    onClick={closeMenus}
                  >
                    {t(
                      'সহায়তা কেন্দ্র',
                      'Help Center'
                    )}
                  </Link>

                  {/* NEARBY SERVICES */}

                  <Link
                    to="/nearby-services"
                    onClick={closeMenus}
                  >
                    {t(
                      'নিকটস্থ প্রয়োজনীয় সেবা',
                      'Nearby Essential Services'
                    )}
                  </Link>

                  {/* BLOOD DONORS */}

                  <Link
                    to="/blood-donors"
                    onClick={closeMenus}
                  >
                    {t(
                      'রক্তদাতা তালিকা',
                      'Blood Donors'
                    )}
                  </Link>

                  {/* DISASTER ALERTS */}

                  <Link
                    to="/disaster-alerts"
                    onClick={closeMenus}
                  >
                    {t(
                      'দুর্যোগ সতর্কতা',
                      'Disaster Alerts'
                    )}
                  </Link>

                  {/* EMERGENCY CONTACTS */}

                  <Link
                    to="/emergency-contacts"
                    onClick={closeMenus}
                  >
                    {t(
                      'জরুরি যোগাযোগ',
                      'Emergency Contacts'
                    )}
                  </Link>

                  {/* ======================= */}
                  {/* CITIZEN SERVICES        */}
                  {/* ======================= */}

                  {!isAdmin && (
                    <>

                      {/* RELIEF APPLICATION */}

                      <Link
                        to="/relief-apply"
                        onClick={closeMenus}
                      >
                        {t(
                          'ত্রাণ আবেদন',
                          'Relief Apply'
                        )}
                      </Link>

                      {/* SERVICE APPLICATION */}

                      <Link
                        to="/service-apply/general"
                        onClick={closeMenus}
                      >
                        {t(
                          'সেবার আবেদন',
                          'Service Apply'
                        )}
                      </Link>

                      {/* VOLUNTEER */}

                      <Link
                        to="/volunteer"
                        onClick={closeMenus}
                      >
                        {t(
                          'স্বেচ্ছাসেবক নিবন্ধন',
                          'Volunteer Registration'
                        )}
                      </Link>

                      {/* WELFARE */}

                      <Link
                        to="/welfare-programs"
                        onClick={closeMenus}
                      >
                        {t(
                          'কল্যাণমূলক কর্মসূচি',
                          'Welfare Programs'
                        )}
                      </Link>

                    </>
                  )}

                  {/* ======================= */}
                  {/* ADMIN SERVICES          */}
                  {/* ======================= */}

                  {isAdmin && (
                    <>

                      {/* RELIEF MANAGEMENT */}

                      <Link
                        to="/admin"
                        onClick={closeMenus}
                      >
                        {t(
                          'ত্রাণ ও সেবার আবেদন ব্যবস্থাপনা',
                          'Manage Relief & Service Applications'
                        )}
                      </Link>

                      {/* VOLUNTEER MANAGEMENT */}

                      <Link
                        to="/admin"
                        onClick={closeMenus}
                      >
                        {t(
                          'স্বেচ্ছাসেবক ব্যবস্থাপনা',
                          'Volunteer Management'
                        )}
                      </Link>

                      {/* WELFARE MANAGEMENT */}

                      <Link
                        to="/admin"
                        onClick={closeMenus}
                      >
                        {t(
                          'কল্যাণ কর্মসূচি ব্যবস্থাপনা',
                          'Manage Welfare Programs'
                        )}
                      </Link>

                    </>
                  )}

                  {/* ======================= */}
                  {/* GOVERNMENT E-SERVICES   */}
                  {/* ======================= */}

                  <Link
                    to="/gov-services"
                    onClick={closeMenus}
                  >
                    {t(
                      'সরকারি ই-সেবা কেন্দ্র',
                      'Government E-Services Hub'
                    )}
                  </Link>

                  {/* ======================= */}
                  {/* COMPLAINT SYSTEM        */}
                  {/* ======================= */}

                  <Link
                    to={
                      isAdmin
                        ? '/admin/complaints'
                        : '/complaints'
                    }
                    onClick={closeMenus}
                  >
                    {isAdmin
                      ? t(
                          'অভিযোগ ব্যবস্থাপনা',
                          'Manage Complaints'
                        )
                      : t(
                          'নাগরিক অভিযোগ ও সমাধান',
                          'Citizen Complaint & Tracking'
                        )}
                  </Link>

                  {/* ======================= */}
                  {/* FEEDBACK SYSTEM         */}
                  {/* ======================= */}

                  <Link
                    to={
                      isAdmin
                        ? '/admin/feedback'
                        : '/feedback'
                    }
                    onClick={closeMenus}
                  >
                    {isAdmin
                      ? t(
                          'ফিডব্যাক ব্যবস্থাপনা',
                          'Manage Feedback'
                        )
                      : t(
                          'মতামত ও রেটিং',
                          'Feedback & Ratings'
                        )}
                  </Link>

                  {/* ======================= */}
                  {/* ADMIN HELP CENTER       */}
                  {/* MANAGEMENT (NEW)        */}
                  {/* ======================= */}

                  {isAdmin && (
                    <Link
                      to="/admin/help-center"
                      onClick={closeMenus}
                    >
                      {t(
                        'সহায়তা কেন্দ্র ব্যবস্থাপনা',
                        'Help Center Management'
                      )}
                    </Link>
                  )}

                </div>
              )}
            </div>

            {/* ============================= */}
            {/* ROLE-SPECIFIC DASHBOARD      */}
            {/* ============================= */}

            {user && (
              <NavLink
                to={dashboardPath}
                end
                onClick={closeMenus}
                className={({ isActive }) =>
                  isActive
                    ? 'btn btn-success btn-sm'
                    : 'btn btn-light btn-sm'
                }
              >
                {isAdmin
                  ? t(
                      'অ্যাডমিন ড্যাশবোর্ড',
                      'Admin Dashboard'
                    )
                  : t(
                      'আমার ড্যাশবোর্ড',
                      'My Dashboard'
                    )}
              </NavLink>
            )}

            {/* ============================= */}
            {/* LANGUAGE TOGGLE              */}
            {/* ============================= */}

            <div
              className="lang-toggle"
              role="group"
              aria-label="Language selection"
            >

              <button
                type="button"
                className={
                  lang === 'bn'
                    ? 'on'
                    : ''
                }
                onClick={() =>
                  setLang('bn')
                }
                aria-pressed={
                  lang === 'bn'
                }
              >
                বাংলা
              </button>

              <button
                type="button"
                className={
                  lang === 'en'
                    ? 'on'
                    : ''
                }
                onClick={() =>
                  setLang('en')
                }
                aria-pressed={
                  lang === 'en'
                }
              >
                English
              </button>

            </div>

            {/* ============================= */}
            {/* LOGIN / LOGOUT               */}
            {/* ============================= */}

            {user ? (
              <>

                {/* USER PROFILE */}

                <Link
                  to={dashboardPath}
                  className="btn btn-light btn-sm"
                  onClick={closeMenus}
                >
                  {user.name
                    ?.trim()
                    .split(/\s+/)[0] ||
                    t(
                      'প্রোফাইল',
                      'Profile'
                    )}
                </Link>

                {/* LOGOUT */}

                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleLogout}
                >
                  {t(
                    'লগআউট',
                    'Logout'
                  )}
                </button>

              </>
            ) : (

              /* LOGIN */

              <Link
                to="/login"
                className="btn btn-light btn-sm"
                onClick={closeMenus}
              >
                {t(
                  'লগইন',
                  'Login'
                )}
              </Link>

            )}

          </nav>
        </div>
      </header>
    </>
  );
}
