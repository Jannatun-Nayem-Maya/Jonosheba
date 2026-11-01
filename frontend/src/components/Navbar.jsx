import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './ui.jsx';

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);

  useEffect(() => { setOpen(false); setDd(false); }, [loc.pathname]);

  const dash = user?.role === 'admin' ? '/admin' : '/dashboard';
  const handleLogout = () => {
    logout();
    toast(t('লগআউট করা হয়েছে।', 'Logged out successfully.'), 'info');
    nav('/');
  };

  // Today's date in Bangladesh time: Bangla when বাংলা is selected, English otherwise
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dhaka',
  });

  return (
    <>
    <div className="topstrip"><div className="container">{today}</div></div>
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-icon"><i className="fa-solid fa-hand-holding-heart" /></span>
          <span className="brand-text">
            <span className="brand-name"><b className="r">{t('জন', 'Jono')}</b><b className="g">{t('সেবা', 'seba')}</b></span>
            <small>{t('এক ঠিকানায় নাগরিক সেবা', 'Citizen services in one place')}</small>
          </span>
        </Link>
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} />
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end>{t('হোম', 'Home')}</NavLink>
          <NavLink to="/health">{t('স্বাস্থ্য ও রক্তদান', 'Health & Blood')}</NavLink>
          <NavLink to="/scholarship">{t('শিক্ষা ও বৃত্তি', 'Scholarships')}</NavLink>
          <div className="dropdown">
            <button className="dd-toggle" onClick={() => setDd(!dd)}>
              {t('নাগরিক সেবা', 'Services')} <i className="fa-solid fa-chevron-down" />
            </button>
            {dd && (
              <div className="dd-menu">
                <Link to="/services">{t('সকল সেবা', 'All Services')}</Link>
                <hr />
                <Link to="/blood-donors">{t('রক্তদাতা তালিকা', 'Blood Donors')}</Link>
                <Link to="/disaster-alerts">{t('দুর্যোগ সতর্কতা', 'Disaster Alerts')}</Link>
                <Link to="/emergency-contacts">{t('জরুরি যোগাযোগ', 'Emergency Contacts')}</Link>
                <Link to="/relief-apply">{t('ত্রাণ আবেদন', 'Relief Apply')}</Link>
                <Link to="/service-apply/general">{t('সেবার আবেদন', 'Service Apply')}</Link>
                <Link to="/volunteer">{t('স্বেচ্ছাসেবক নিবন্ধন', 'Volunteer Registration')}</Link>
                <Link to="/welfare-programs">{t('কল্যাণমূলক কর্মসূচি', 'Welfare Programs')}</Link>
              </div>
            )}
          </div>

          <div className="lang-toggle">
            <button className={lang === 'bn' ? 'on' : ''} onClick={() => setLang('bn')}>বাংলা</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>

          {user ? (
            <>
              <Link to={dash} className="btn btn-light btn-sm"><i className="fa-solid fa-user" /> {user.name.split(' ')[0]}</Link>
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>{t('লগআউট', 'Logout')}</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-light btn-sm">{t('লগইন', 'Login')}</Link>
          )}
        </nav>
      </div>
    </header>
    </>
  );
}