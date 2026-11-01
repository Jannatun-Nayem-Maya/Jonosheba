import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, useApi, useToast, Loader, ErrorBox, Modal } from '../components/ui.jsx';

const LEVELS = [
  ['undergraduate', 'স্নাতক', 'Undergraduate'],
  ['masters', 'স্নাতকোত্তর', "Master's"],
  ['phd', 'পিএইচডি', 'PhD'],
];
const CATS = [
  ['all', 'সব', 'All'],
  ['govt', 'সরকারি', 'Government'],
  ['international', 'আন্তর্জাতিক', 'International'],
  ['university', 'বিশ্ববিদ্যালয়', 'University'],
];
const CHECKLIST = [
  ['একাডেমিক সনদ ও ট্রান্সক্রিপ্ট প্রস্তুত', 'Academic certificates & transcripts ready'],
  ['পাসপোর্ট / এনআইডি কপি', 'Passport / NID copy'],
  ['সুপারিশপত্র (Recommendation letters)', 'Recommendation letters'],
  ['স্টেটমেন্ট অব পারপাস / এসে লেখা', 'Statement of purpose / essay written'],
  ['ভাষা দক্ষতার সনদ (প্রযোজ্য হলে)', 'Language test score (if required)'],
  ['অফিসিয়াল ওয়েবসাইটে আবেদন জমা', 'Application submitted on the official site'],
];

// Country name -> ISO code, used to show a small flag (images from flagcdn.com)
const FLAG_CODES = {
  bangladesh: 'bd', turkey: 'tr', türkiye: 'tr', turkiye: 'tr', uk: 'gb', 'united kingdom': 'gb', usa: 'us', 'united states': 'us',
  japan: 'jp', germany: 'de', china: 'cn', france: 'fr', australia: 'au', canada: 'ca', india: 'in', malaysia: 'my',
  'south korea': 'kr', korea: 'kr', singapore: 'sg', italy: 'it', netherlands: 'nl', sweden: 'se', switzerland: 'ch',
  'saudi arabia': 'sa', qatar: 'qa', uae: 'ae', russia: 'ru', 'new zealand': 'nz', ireland: 'ie', finland: 'fi',
  norway: 'no', denmark: 'dk', hungary: 'hu', taiwan: 'tw', pakistan: 'pk', egypt: 'eg', austria: 'at', belgium: 'be',
  spain: 'es', poland: 'pl', thailand: 'th', indonesia: 'id', brunei: 'bn',
};

function Flag({ country }) {
  const code = FLAG_CODES[String(country || '').trim().toLowerCase()];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={country}
      title={country}
      width="20"
      height="14"
      style={{ borderRadius: 2, verticalAlign: 'middle', marginRight: 6, boxShadow: '0 0 0 1px rgba(0,0,0,.15)', objectFit: 'cover' }}
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

const LEVEL_KEYS = LEVELS.map((l) => l[0]);
const daysLeft = (d) => (d ? Math.ceil((new Date(d) - Date.now()) / 86400000) : null);

function loadChecks(id) {
  try { return JSON.parse(localStorage.getItem('checks:' + id)) || []; } catch { return []; }
}

export default function Scholarship() {
  const { t, L, num, fmtDate, lang } = useLang();
  const { user, setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data, loading, error } = useApi('/scholarships');

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [level, setLevel] = useState('');
  const [country, setCountry] = useState('');
  const [fundedOnly, setFundedOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState('deadline');
  const [gpa, setGpa] = useState('');
  const [scale, setScale] = useState(4);
  const [selected, setSelected] = useState(null);

  const saved = user?.savedScholarships || [];

  // Only undergraduate / master's / PhD scholarships are shown (SSC/HSC removed)
  const visible = useMemo(
    () => (data || []).filter((s) => (s.levels || []).some((l) => LEVEL_KEYS.includes(l))),
    [data]
  );
  const countries = useMemo(() => [...new Set(visible.map((s) => s.country).filter(Boolean))].sort(), [visible]);

  const eligible = (s) => {
    if (gpa === '' || !s.minGpa) return true;
    return Number(gpa) / scale >= s.minGpa / (s.gpaScale || 4);
  };

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    let r = visible.filter((s) => {
      const text = [s.titleBn, s.titleEn, s.descBn, s.descEn, s.providerEn, s.country].join(' ').toLowerCase();
      const dl = daysLeft(s.deadline);
      return (
        (!ql || text.includes(ql)) &&
        (cat === 'all' || s.category === cat) &&
        (!level || s.levels.includes(level)) &&
        (!country || s.country === country) &&
        (!fundedOnly || s.fullyFunded) &&
        (!openOnly || dl === null || dl >= 0) &&
        (!savedOnly || saved.includes(s._id)) &&
        eligible(s)
      );
    });
    r = [...r].sort((a, b) => {
      if (sort === 'name') return L(a, 'title').localeCompare(L(b, 'title'));
      const da = daysLeft(a.deadline), db = daysLeft(b.deadline);
      // Upcoming first, rolling next, closed last
      const key = (d) => (d === null ? 9998 : d < 0 ? 9999 + Math.abs(d) : d);
      return key(da) - key(db);
    });
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, q, cat, level, country, fundedOnly, openOnly, savedOnly, sort, gpa, scale, saved.join(','), lang]);

  const toggleSave = async (s) => {
    if (!user) {
      toast(t('বৃত্তি সংরক্ষণ করতে লগইন করুন', 'Please log in to save scholarships'), 'info');
      return nav('/login', { state: { from: '/scholarship' } });
    }
    try {
      const r = await api(`/scholarships/${s._id}/save`, { method: 'POST' });
      setUser({ ...user, savedScholarships: r.savedScholarships });
      toast(r.saved ? t('সংরক্ষিত হয়েছে', 'Saved to your list') : t('তালিকা থেকে সরানো হয়েছে', 'Removed from your list'), 'info');
    } catch (e) { toast(e.message, 'error'); }
  };

  const closingSoon = visible.filter((s) => { const d = daysLeft(s.deadline); return d !== null && d >= 0 && d <= 30; }).length;

  const reset = () => { setQ(''); setCat('all'); setLevel(''); setCountry(''); setFundedOnly(false); setOpenOnly(false); setSavedOnly(false); setGpa(''); };

  return (
    <>
      <PageHeader icon="fa-graduation-cap" tone="gold" title={t('শিক্ষা ও বৃত্তি পোর্টাল', 'Education & Scholarship Portal')}
        subtitle={t('সরকারি, বিশ্ববিদ্যালয় ও আন্তর্জাতিক বৃত্তির তথ্য, যোগ্যতা যাচাই ও আবেদনের চেকলিস্ট।', 'Government, university and international scholarships with an eligibility finder and application checklist.')} />
      <div className="container section">
        <div className="stat-row">
          <div className="stat"><strong>{num(visible.length)}</strong><span>{t('মোট বৃত্তি', 'Total scholarships')}</span></div>
          <div className="stat warn"><strong>{num(closingSoon)}</strong><span>{t('৩০ দিনের মধ্যে শেষ', 'Closing in 30 days')}</span></div>
          <div className="stat ok"><strong>{num(saved.length)}</strong><span>{t('আপনার সংরক্ষিত', 'Your saved')}</span></div>
        </div>

        <div className="notice notice-info"><i className="fa-solid fa-circle-info" /> {t(
          'ডেডলাইনগুলো উদাহরণস্বরূপ — আবেদনের আগে অফিসিয়াল ওয়েবসাইটে সর্বশেষ তারিখ ও যোগ্যতা অবশ্যই যাচাই করুন।',
          'Deadlines shown are sample data — always confirm the latest dates and requirements on the official website before applying.')}</div>

        <div className="card pad">
          <div className="filters">
            <div className="search-box wide">
              <i className="fa-solid fa-magnifying-glass" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('বৃত্তির নাম, দেশ বা কীওয়ার্ড…', 'Scholarship name, country or keyword…')} />
            </div>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">{t('সব স্তর', 'All levels')}</option>
              {LEVELS.map(([v, bn, en]) => <option key={v} value={v}>{t(bn, en)}</option>)}
            </select>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t('সব দেশ', 'All countries')}</option>
              {countries.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="deadline">{t('ডেডলাইন অনুযায়ী', 'Sort: deadline')}</option>
              <option value="name">{t('নাম অনুযায়ী', 'Sort: name')}</option>
            </select>
          </div>
          <div className="chips mt-sm">
            {CATS.map(([k, bn, en]) => <button key={k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{t(bn, en)}</button>)}
            <label className="check"><input type="checkbox" checked={fundedOnly} onChange={(e) => setFundedOnly(e.target.checked)} /> {t('সম্পূর্ণ অর্থায়িত', 'Fully funded')}</label>
            <label className="check"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> {t('শুধু চলমান', 'Open only')}</label>
            <label className="check"><input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} /> {t('সংরক্ষিত', 'Saved only')}</label>
          </div>

          <div className="finder">
            <strong><i className="fa-solid fa-wand-magic-sparkles" /> {t('যোগ্যতা যাচাই', 'Eligibility finder')}</strong>
            <span className="muted small">{t('আপনার জিপিএ দিন — যোগ্য বৃত্তিগুলো দেখুন', 'Enter your GPA to see scholarships you qualify for')}</span>
            <div className="inline-controls">
              <input type="number" step="0.01" min="0" max="5" value={gpa} onChange={(e) => setGpa(e.target.value)} placeholder="3.75" style={{ width: 90 }} />
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={4}>{t('৪.০০ স্কেল', 'out of 4.00')}</option>
                <option value={5}>{t('৫.০০ স্কেল', 'out of 5.00')}</option>
              </select>
              <button className="btn btn-outline btn-sm" onClick={reset}>{t('রিসেট', 'Reset')}</button>
            </div>
          </div>
        </div>

        <h3 className="section-title sm">{t(`${num(list.length)} টি বৃত্তি পাওয়া গেছে`, `${list.length} scholarship(s) found`)}</h3>
        {loading && <Loader />}
        <ErrorBox message={error} />
        {!loading && list.length === 0 && <div className="notice">{t('কোনো বৃত্তি মেলেনি। ফিল্টার পরিবর্তন করে দেখুন।', 'No scholarships match. Try changing the filters.')}</div>}

        <div className="grid grid-3">
          {list.map((s) => {
            const dl = daysLeft(s.deadline);
            const isSaved = saved.includes(s._id);
            const checks = loadChecks(s._id).length;
            return (
              <div className="card sch" key={s._id}>
                <div className="sch-top">
                  <span className={`badge cat-${s.category}`}><Flag country={s.country} />{CATS.find((c) => c[0] === s.category)?.[lang === 'bn' ? 1 : 2]} · {s.country}</span>
                  <button className={`heart ${isSaved ? 'on' : ''}`} onClick={() => toggleSave(s)} aria-label="Save"><i className={`fa-${isSaved ? 'solid' : 'regular'} fa-heart`} /></button>
                </div>
                <h3>{L(s, 'title')}</h3>
                <p className="muted small">{L(s, 'provider')}</p>
                <p className="small">{L(s, 'desc')}</p>
                <div className="tags">
                  {s.fullyFunded && <span className="badge badge-success"><i className="fa-solid fa-coins" /> {t('সম্পূর্ণ অর্থায়িত', 'Fully funded')}</span>}
                  {s.minGpa && <span className="badge badge-soft">GPA {s.minGpa}+/{s.gpaScale}</span>}
                </div>
                <div className="sch-bottom">
                  {dl === null && <span className="badge badge-gold"><i className="fa-solid fa-infinity" /> {t('চলমান', 'Rolling')}</span>}
                  {dl !== null && dl < 0 && <span className="badge badge-muted">{t('শেষ হয়েছে', 'Closed')}</span>}
                  {dl !== null && dl >= 0 && (
                    <span className={`badge ${dl <= 14 ? 'badge-danger' : 'badge-gold'}`}>
                      <i className="fa-regular fa-clock" /> {dl === 0 ? t('আজ শেষ!', 'Last day!') : t(`${num(dl)} দিন বাকি`, `${dl} days left`)}
                    </span>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => setSelected(s)}>
                    {t('বিস্তারিত', 'Details')}{checks > 0 && ` (${num(checks)}/${num(CHECKLIST.length)})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && <Detail s={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Detail({ s, onClose }) {
  const { t, L, fmtDate, num, lang } = useLang();
  const [checks, setChecks] = useState(() => loadChecks(s._id));
  useEffect(() => { localStorage.setItem('checks:' + s._id, JSON.stringify(checks)); }, [checks, s._id]);
  const toggle = (i) => setChecks((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));
  const pct = Math.round((checks.length / CHECKLIST.length) * 100);

  return (
    <Modal onClose={onClose}>
      <h3>{L(s, 'title')}</h3>
      <p className="muted"><Flag country={s.country} />{L(s, 'provider')} · {s.country}</p>
      <p>{L(s, 'desc')}</p>
      <ul className="facts">
        <li><i className="fa-solid fa-gift" /> <strong>{t('সুবিধা', 'Benefits')}:</strong> {L(s, 'benefits')}</li>
        <li><i className="fa-solid fa-layer-group" /> <strong>{t('স্তর', 'Levels')}:</strong> {s.levels.filter((l) => LEVEL_KEYS.includes(l)).map((l) => LEVELS.find((x) => x[0] === l)?.[lang === 'bn' ? 1 : 2]).join(', ')}</li>
        {s.minGpa && <li><i className="fa-solid fa-chart-line" /> <strong>{t('ন্যূনতম জিপিএ', 'Minimum GPA')}:</strong> {s.minGpa} / {s.gpaScale}</li>}
        <li><i className="fa-regular fa-calendar" /> <strong>{t('ডেডলাইন', 'Deadline')}:</strong> {s.deadline ? fmtDate(s.deadline) : t('চলমান / বিশ্ববিদ্যালয়ের নোটিশ অনুযায়ী', 'Rolling / per university notice')}</li>
      </ul>

      <h4>{t('আবেদন চেকলিস্ট', 'Application checklist')} <span className="muted small">({num(pct)}%)</span></h4>
      <div className="progress"><div style={{ width: pct + '%' }} /></div>
      <div className="checklist">
        {CHECKLIST.map(([bn, en], i) => (
          <label key={i} className="check"><input type="checkbox" checked={checks.includes(i)} onChange={() => toggle(i)} /> {t(bn, en)}</label>
        ))}
      </div>
      <a href={s.link} target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-block">
        {t('অফিসিয়াল ওয়েবসাইটে আবেদন করুন', 'Apply on the official website')} <i className="fa-solid fa-arrow-up-right-from-square" />
      </a>
    </Modal>
  );
}