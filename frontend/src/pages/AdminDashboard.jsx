import { useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, useApi, useToast, Loader, ErrorBox, Modal } from '../components/ui.jsx';
import { STATUS } from './CitizenDashboard.jsx';

/* ---------------------------------------------------------------
   Content types the admin can add / edit / delete.
   f = [fieldName, label, inputType, options?]
---------------------------------------------------------------- */
const LEVELS = ['undergraduate', 'masters', 'phd'];
const CONTENT = {
  scholarships: {
    bn: 'বৃত্তি', en: 'Scholarships', icon: 'fa-graduation-cap',
    main: 'titleEn', sub: 'providerEn', extra: (x) => x.category,
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true], ['titleBn', 'Title (Bangla)', 'text'],
      ['providerEn', 'Provider (English)', 'text'], ['providerBn', 'Provider (Bangla)', 'text'],
      ['category', 'Category', 'select', ['govt', 'international', 'university'], true], ['country', 'Country', 'text'],
      ['levels', 'Levels', 'levels'], ['minGpa', 'Minimum GPA', 'number'], ['gpaScale', 'GPA scale (4 or 5)', 'number'],
      ['deadline', 'Deadline (empty = rolling)', 'date'], ['fullyFunded', 'Fully funded', 'checkbox'],
      ['link', 'Official link', 'text'],
      ['descEn', 'Description (English)', 'textarea'], ['descBn', 'Description (Bangla)', 'textarea'],
      ['benefitsEn', 'Benefits (English)', 'text'], ['benefitsBn', 'Benefits (Bangla)', 'text'],
    ],
    blank: { category: 'govt', levels: [], gpaScale: 4, fullyFunded: false },
  },
  alerts: {
    bn: 'দুর্যোগ সতর্কতা', en: 'Disaster alerts', icon: 'fa-triangle-exclamation',
    main: 'titleEn', sub: 'district', extra: (x) => x.level,
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true], ['titleBn', 'Title (Bangla)', 'text'],
      ['bodyEn', 'Details (English)', 'textarea'], ['bodyBn', 'Details (Bangla)', 'textarea'],
      ['district', 'District', 'text'], ['type', 'Type', 'select', ['flood', 'cyclone', 'erosion']],
      ['level', 'Severity', 'select', ['red', 'orange', 'yellow']],
      ['source', 'Source name', 'text'], ['sourceUrl', 'Source link', 'text'],
    ],
    blank: { type: 'flood', level: 'yellow' },
  },
  shelters: {
    bn: 'আশ্রয়কেন্দ্র', en: 'Shelters', icon: 'fa-house-chimney-medical',
    main: 'nameEn', sub: 'district', extra: (x) => `${x.occupied ?? 0}/${x.capacity ?? 0}`,
    fields: [
      ['nameEn', 'Name (English)', 'text', null, true], ['nameBn', 'Name (Bangla)', 'text'],
      ['addressEn', 'Address (English)', 'text'], ['addressBn', 'Address (Bangla)', 'text'],
      ['district', 'District', 'text'], ['capacity', 'Capacity', 'number'], ['occupied', 'Currently occupied', 'number'],
      ['officerEn', 'Officer (English)', 'text'], ['officerBn', 'Officer (Bangla)', 'text'],
      ['phone', 'Phone', 'text'], ['status', 'Status', 'select', ['open', 'closed']],
    ],
    blank: { status: 'open' },
  },
  hotlines: {
    bn: 'জরুরি নম্বর', en: 'Hotlines', icon: 'fa-phone-volume',
    main: 'nameEn', sub: 'number', extra: () => '',
    fields: [
      ['nameEn', 'Name (English)', 'text', null, true], ['nameBn', 'Name (Bangla)', 'text'],
      ['number', 'Number', 'text', null, true],
      ['descEn', 'Description (English)', 'text'], ['descBn', 'Description (Bangla)', 'text'],
      ['icon', 'Icon (e.g. fa-phone)', 'text'], ['color', 'Color (e.g. #c0392b)', 'text'],
    ],
    blank: {},
  },
  welfare: {
    bn: 'কল্যাণ কর্মসূচি', en: 'Welfare programs', icon: 'fa-people-group',
    main: 'titleEn', sub: 'monthly', extra: (x) => `${x.minAge ?? 0}+`,
    fields: [
      ['key', 'Unique key (e.g. old-age)', 'text', null, true],
      ['titleEn', 'Title (English)', 'text', null, true], ['titleBn', 'Title (Bangla)', 'text'],
      ['descEn', 'Description (English)', 'textarea'], ['descBn', 'Description (Bangla)', 'textarea'],
      ['monthly', 'Monthly amount (৳)', 'number'], ['minAge', 'Minimum age', 'number'],
      ['gender', 'Gender', 'select', ['any', 'male', 'female']],
      ['requires', 'Requires', 'select', ['none', 'widow', 'disability']],
      ['ageNoteEn', 'Age note (English)', 'text'], ['ageNoteBn', 'Age note (Bangla)', 'text'],
      ['color', 'Color', 'text'],
    ],
    blank: { gender: 'any', requires: 'none' },
  },
  events: {
    bn: 'স্বেচ্ছাসেবক ইভেন্ট', en: 'Volunteer events', icon: 'fa-hand-holding-heart',
    main: 'titleEn', sub: 'locationEn', extra: (x) => (x.joined ? `${x.joined.length}/${x.needed ?? 0}` : ''),
    fields: [
      ['titleEn', 'Title (English)', 'text', null, true], ['titleBn', 'Title (Bangla)', 'text'],
      ['locationEn', 'Location (English)', 'text'], ['locationBn', 'Location (Bangla)', 'text'],
      ['date', 'Date', 'date'], ['needed', 'Volunteers needed', 'number'], ['urgent', 'Urgent', 'checkbox'],
    ],
    blank: { urgent: false },
  },
};

const dateVal = (v) => (v ? String(v).slice(0, 10) : '');

/* ---------------- Add / edit form inside a modal ---------------- */
function ContentForm({ type, item, onSaved, onClose }) {
  const { t } = useLang();
  const toast = useToast();
  const cfg = CONTENT[type];
  const [v, setV] = useState(() => {
    const base = item ? { ...item } : { ...cfg.blank };
    if (base.deadline !== undefined) base.deadline = dateVal(base.deadline);
    if (base.date !== undefined) base.date = dateVal(base.date);
    return base;
  });
  const [busy, setBusy] = useState(false);

  const set = (name, val) => setV((x) => ({ ...x, [name]: val }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...v };
      cfg.fields.forEach(([name, , kind]) => {
        if (kind === 'number') body[name] = v[name] === '' || v[name] == null ? null : Number(v[name]);
      });
      if (item) await api(`/admin/content/${type}/${item._id}`, { method: 'PUT', body });
      else await api(`/admin/content/${type}`, { method: 'POST', body });
      toast(t('সংরক্ষণ করা হয়েছে', 'Saved'));
      onSaved();
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <h3>{item ? t('সম্পাদনা', 'Edit') : t('নতুন যোগ করুন', 'Add new')} — {t(cfg.bn, cfg.en)}</h3>
      <form className="form" onSubmit={save}>
        <div className="form-grid">
          {cfg.fields.map(([name, label, kind, opts, req]) => {
            if (kind === 'checkbox') {
              return <label key={name} className="check"><input type="checkbox" checked={!!v[name]} onChange={(e) => set(name, e.target.checked)} /> {label}</label>;
            }
            if (kind === 'levels') {
              return (
                <div key={name} style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ fontSize: '.92rem' }}>{label}</strong>
                  <div className="chips" style={{ marginTop: 6 }}>
                    {LEVELS.map((l) => {
                      const on = (v.levels || []).includes(l);
                      return (
                        <button type="button" key={l} className={`chip ${on ? 'on' : ''}`}
                          onClick={() => set('levels', on ? v.levels.filter((x) => x !== l) : [...(v.levels || []), l])}>{l}</button>
                      );
                    })}
                  </div>
                </div>
              );
            }
            const wide = kind === 'textarea' ? { gridColumn: '1 / -1' } : undefined;
            return (
              <label key={name} style={wide}>{label}{req && ' *'}
                {kind === 'select' ? (
                  <select value={v[name] ?? ''} onChange={(e) => set(name, e.target.value)}>
                    {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : kind === 'textarea' ? (
                  <textarea rows={3} value={v[name] ?? ''} onChange={(e) => set(name, e.target.value)} />
                ) : (
                  <input type={kind} value={v[name] ?? ''} required={!!req} onChange={(e) => set(name, e.target.value)} />
                )}
              </label>
            );
          })}
        </div>
        <div className="btn-row">
          <button className="btn btn-success" disabled={busy}><i className="fa-solid fa-floppy-disk" /> {t('সংরক্ষণ', 'Save')}</button>
          <button type="button" className="btn btn-light" onClick={onClose}>{t('বাতিল', 'Cancel')}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Content manager (scholarships, alerts, ...) ---------------- */
function ContentManager() {
  const { t } = useLang();
  const toast = useToast();
  const [type, setType] = useState('scholarships');
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const list = useApi(`/admin/content/${type}`, [type]);
  const cfg = CONTENT[type];

  const remove = async (id) => {
    if (!window.confirm(t('সত্যিই মুছে ফেলতে চান?', 'Delete this item permanently?'))) return;
    try {
      await api(`/admin/content/${type}/${id}`, { method: 'DELETE' });
      toast(t('মুছে ফেলা হয়েছে', 'Deleted'), 'info');
      list.reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="card pad">
      <div className="toolbar">
        <div className="chips">
          {Object.entries(CONTENT).map(([k, c]) => (
            <button key={k} className={`chip ${type === k ? 'on' : ''}`} onClick={() => setType(k)}>
              <i className={`fa-solid ${c.icon}`} /> {t(c.bn, c.en)}
            </button>
          ))}
        </div>
        <button className="btn btn-success btn-sm" onClick={() => setEditing('new')}><i className="fa-solid fa-plus" /> {t('নতুন যোগ করুন', 'Add new')}</button>
      </div>
      {list.loading && <Loader />}
      <ErrorBox message={list.error} />
      {!list.loading && (list.data || []).length === 0 && <div className="notice">{t('কিছু নেই। নতুন যোগ করুন।', 'Nothing here yet. Add the first one.')}</div>}
      {(list.data || []).length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead><tr><th>#</th><th>{t('নাম / শিরোনাম', 'Title')}</th><th>{t('বিবরণ', 'Info')}</th><th /><th>{t('অ্যাকশন', 'Actions')}</th></tr></thead>
            <tbody>
              {list.data.map((x, i) => (
                <tr key={x._id}>
                  <td>{i + 1}</td>
                  <td><strong>{x[cfg.main] || '—'}</strong></td>
                  <td>{String(x[cfg.sub] ?? '—')}</td>
                  <td>{cfg.extra(x) && <span className="badge">{cfg.extra(x)}</span>}</td>
                  <td>
                    <div className="btn-row">
                      <button className="btn btn-light btn-sm" onClick={() => setEditing(x)} aria-label="Edit"><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(x._id)} aria-label="Delete"><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <ContentForm type={type} item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); list.reload(); }} />
      )}
    </div>
  );
}

/* ---------------- Blood moderation ---------------- */
function BloodModeration({ onChange }) {
  const { t, fmtDate } = useLang();
  const toast = useToast();
  const [sub, setSub] = useState('requests');
  const list = useApi(`/admin/blood/${sub}`, [sub]);

  const remove = async (id) => {
    if (!window.confirm(t('মুছে ফেলবেন?', 'Delete this entry?'))) return;
    try {
      await api(`/admin/blood/${sub}/${id}`, { method: 'DELETE' });
      toast(t('মুছে ফেলা হয়েছে', 'Deleted'), 'info');
      list.reload();
      onChange();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="card pad">
      <div className="chips">
        <button className={`chip ${sub === 'requests' ? 'on' : ''}`} onClick={() => setSub('requests')}>{t('রক্তের অনুরোধ', 'Blood requests')}</button>
        <button className={`chip ${sub === 'donors' ? 'on' : ''}`} onClick={() => setSub('donors')}>{t('রক্তদাতা', 'Donors')}</button>
      </div>
      {list.loading && <Loader />}
      <ErrorBox message={list.error} />
      {!list.loading && (list.data || []).length === 0 && <div className="notice">{t('কিছু নেই।', 'Nothing here.')}</div>}
      {(list.data || []).length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            {sub === 'requests' ? (
              <>
                <thead><tr><th>{t('রোগী', 'Patient')}</th><th>{t('গ্রুপ', 'Group')}</th><th>{t('হাসপাতাল', 'Hospital')}</th><th>{t('যোগাযোগ', 'Contact')}</th><th>{t('অবস্থা', 'Status')}</th><th>{t('তারিখ', 'Date')}</th><th /></tr></thead>
                <tbody>
                  {list.data.map((x) => (
                    <tr key={x._id}>
                      <td>{x.patientName}</td><td><span className="badge badge-danger">{x.bloodGroup}</span></td>
                      <td>{x.hospital}<br /><small className="muted">{x.location}</small></td>
                      <td>{x.contactNumber}</td>
                      <td><span className={`badge ${x.status === 'open' ? 'badge-warning' : 'badge-success'}`}>{x.status}</span></td>
                      <td>{fmtDate(x.createdAt)}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => remove(x._id)} aria-label="Delete"><i className="fa-solid fa-trash" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead><tr><th>{t('নাম', 'Name')}</th><th>{t('গ্রুপ', 'Group')}</th><th>{t('এলাকা', 'Area')}</th><th>{t('ফোন', 'Phone')}</th><th>{t('তারিখ', 'Date')}</th><th /></tr></thead>
                <tbody>
                  {list.data.map((x) => (
                    <tr key={x._id}>
                      <td>{x.name}</td><td><span className="badge badge-danger">{x.bloodGroup}</span></td>
                      <td>{x.location}</td><td>{x.phone}</td><td>{fmtDate(x.createdAt)}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => remove(x._id)} aria-label="Delete"><i className="fa-solid fa-trash" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Users ---------------- */
function UserManager({ onChange }) {
  const { t, fmtDate } = useLang();
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const list = useApi('/admin/users?q=' + encodeURIComponent(query), [query]);

  const patch = async (id, body, msg) => {
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body });
      toast(msg, 'info');
      list.reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (id) => {
    if (!window.confirm(t('এই ব্যবহারকারীকে স্থায়ীভাবে মুছবেন?', 'Permanently delete this user?'))) return;
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      toast(t('মুছে ফেলা হয়েছে', 'Deleted'), 'info');
      list.reload();
      onChange();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="card pad">
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setQuery(q); }}>
        <input style={{ maxWidth: 340 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('নাম / ইমেইল / ফোন খুঁজুন', 'Search name / email / phone')} />
        <button className="btn btn-light btn-sm"><i className="fa-solid fa-magnifying-glass" /> {t('খুঁজুন', 'Search')}</button>
      </form>
      {list.loading && <Loader />}
      <ErrorBox message={list.error} />
      {(list.data || []).length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table className="table">
            <thead><tr><th>{t('নাম', 'Name')}</th><th>{t('ইমেইল', 'Email')}</th><th>{t('ফোন', 'Phone')}</th><th>{t('ভূমিকা', 'Role')}</th><th>{t('যোগদান', 'Joined')}</th><th>{t('অবস্থা', 'Status')}</th><th>{t('অ্যাকশন', 'Actions')}</th></tr></thead>
            <tbody>
              {list.data.map((u) => {
                const self = u._id === (me?.id || me?._id);
                return (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <select value={u.role} disabled={self} style={{ minWidth: 120 }}
                        onChange={(e) => patch(u._id, { role: e.target.value }, t('ভূমিকা পরিবর্তন হয়েছে', 'Role updated'))}>
                        {['user', 'student', 'volunteer', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td><span className={`badge ${u.blocked ? 'badge-danger' : 'badge-success'}`}>{u.blocked ? t('ব্লকড', 'Blocked') : t('সক্রিয়', 'Active')}</span></td>
                    <td>
                      {self ? <small className="muted">{t('আপনি', 'You')}</small> : (
                        <div className="btn-row">
                          <button className={`btn btn-sm ${u.blocked ? 'btn-success' : 'btn-light'}`}
                            onClick={() => patch(u._id, { blocked: !u.blocked }, u.blocked ? t('আনব্লক করা হয়েছে', 'Unblocked') : t('ব্লক করা হয়েছে', 'Blocked'))}>
                            <i className={`fa-solid ${u.blocked ? 'fa-lock-open' : 'fa-ban'}`} /> {u.blocked ? t('আনব্লক', 'Unblock') : t('ব্লক', 'Block')}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(u._id)} aria-label="Delete"><i className="fa-solid fa-trash" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Applications queue ---------------- */
function Applications({ onChange }) {
  const { t, fmtDate, lang } = useLang();
  const toast = useToast();
  const [filter, setFilter] = useState('pending');
  const apps = useApi('/admin/applications?status=' + filter, [filter]);

  const decide = async (id, status) => {
    const note = status === 'rejected' ? window.prompt(t('বাতিলের কারণ (ঐচ্ছিক):', 'Reason for rejection (optional):')) || '' : '';
    try {
      await api(`/admin/applications/${id}`, { method: 'PATCH', body: { status, note } });
      toast(status === 'approved' ? t('অনুমোদন করা হয়েছে', 'Approved') : t('বাতিল করা হয়েছে', 'Rejected'), 'info');
      apps.reload();
      onChange();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="card pad">
      <div className="toolbar">
        <h3 className="card-title nomargin"><i className="fa-solid fa-list-check text-success" /> {t('আবেদন ভেরিফিকেশন কিউ', 'Application verification queue')}</h3>
        <div className="chips">
          {['pending', 'approved', 'rejected', ''].map((f) => (
            <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
              {f ? STATUS[f][lang === 'bn' ? 0 : 1] : t('সব', 'All')}
            </button>
          ))}
        </div>
      </div>
      {apps.loading && <Loader />}
      <ErrorBox message={apps.error} />
      {!apps.loading && (apps.data || []).length === 0 && <div className="notice">{t('কোনো আবেদন নেই।', 'No applications.')}</div>}
      {(apps.data || []).length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>{t('নাম', 'Name')}</th><th>NID</th><th>{t('সেবা', 'Service')}</th><th>{t('জেলা', 'District')}</th><th>{t('তারিখ', 'Date')}</th><th>{t('প্রমাণ', 'Evidence')}</th><th>{t('অবস্থা / অ্যাকশন', 'Status / action')}</th></tr></thead>
            <tbody>
              {apps.data.map((a) => (
                <tr key={a._id}>
                  <td><strong>{a.trackingId}</strong></td>
                  <td>{a.applicantName}<br /><small className="muted">{a.phone}</small></td>
                  <td>{a.nid || '—'}</td>
                  <td>{a.service}</td>
                  <td>{a.district || '—'}</td>
                  <td>{fmtDate(a.createdAt)}</td>
                  <td>{a.evidence ? <a href={a.evidence} target="_blank" rel="noopener noreferrer"><i className="fa-solid fa-paperclip" /> {t('দেখুন', 'View')}</a> : '—'}</td>
                  <td>
                    {a.status === 'pending' ? (
                      <div className="btn-row">
                        <button className="btn btn-success btn-sm" onClick={() => decide(a._id, 'approved')}><i className="fa-solid fa-check" /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => decide(a._id, 'rejected')}><i className="fa-solid fa-xmark" /></button>
                      </div>
                    ) : <span className={`badge ${STATUS[a.status][2]}`}>{STATUS[a.status][lang === 'bn' ? 0 : 1]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function AdminDashboard() {
  const { t, num } = useLang();
  const [tab, setTab] = useState('apps');
  const stats = useApi('/admin/stats');

  const s = stats.data || {};
  const cards = [
    ['fa-users', s.users, t('মোট ব্যবহারকারী', 'Registered users'), ''],
    ['fa-inbox', s.pending, t('অপেক্ষমাণ আবেদন', 'Pending applications'), 'warn'],
    ['fa-circle-check', s.approved, t('অনুমোদিত', 'Approved'), 'ok'],
    ['fa-house-chimney-medical', s.shelters, t('সক্রিয় আশ্রয়কেন্দ্র', 'Active shelters'), ''],
    ['fa-droplet', s.openBlood, t('চলমান রক্তের অনুরোধ', 'Open blood requests'), 'warn'],
    ['fa-hand-holding-droplet', s.donors, t('নিবন্ধিত রক্তদাতা', 'Registered donors'), ''],
  ];
  const tabs = [
    ['apps', 'fa-list-check', t('আবেদন', 'Applications')],
    ['content', 'fa-pen-to-square', t('কনটেন্ট ম্যানেজমেন্ট', 'Content')],
    ['blood', 'fa-droplet', t('রক্ত মডারেশন', 'Blood moderation')],
    ['users', 'fa-users-gear', t('ব্যবহারকারী', 'Users')],
  ];

  return (
    <>
      <PageHeader icon="fa-user-shield" tone="dark" title={t('প্রশাসক ড্যাশবোর্ড', 'Admin Control Panel')}
        subtitle={t('আবেদন যাচাই, কনটেন্ট ও ব্যবহারকারী ম্যানেজমেন্ট', 'Verify applications, manage content and users')} />
      <div className="container section">
        <ErrorBox message={stats.error} />
        <div className="stat-row">
          {cards.map(([icon, val, label, tone]) => (
            <div className={`stat ${tone}`} key={label}><i className={`fa-solid ${icon}`} /><strong>{num(val ?? 0)}</strong><span>{label}</span></div>
          ))}
        </div>

        <div className="chips" style={{ marginBottom: 16 }}>
          {tabs.map(([k, icon, label]) => (
            <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
              <i className={`fa-solid ${icon}`} /> {label}
            </button>
          ))}
        </div>

        {tab === 'apps' && <Applications onChange={stats.reload} />}
        {tab === 'content' && <ContentManager />}
        {tab === 'blood' && <BloodModeration onChange={stats.reload} />}
        {tab === 'users' && <UserManager onChange={stats.reload} />}
      </div>
    </>
  );
}