import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useLang } from '../context/LangContext.jsx';
import { PageHeader, useApi, Loader, ErrorBox } from '../components/ui.jsx';

const TYPES = [['flood', 'বন্যা / ভারী বৃষ্টি', 'Flood / heavy rain'], ['cyclone', 'ঘূর্ণিঝড় / প্রবল বাতাস', 'Cyclone / strong wind']];
const LEVEL_LABEL = { red: ['রেড অ্যালার্ট', 'RED ALERT'], orange: ['কমলা সতর্কতা', 'ORANGE'], yellow: ['হলুদ সতর্কতা', 'YELLOW'] };
const LEVEL_BADGE = { red: 'badge-danger', orange: 'badge-warning', yellow: 'badge-gold' };

export default function DisasterAlerts() {
  const { t, L, num, lang } = useLang();
  const live = useApi('/live/weather'); // 100% live forecast data (Open-Meteo, via our backend)
  const [district, setDistrict] = useState('');
  const [type, setType] = useState('');

  // ----- shelters: real places from OpenStreetMap near a chosen point -----
  const [origin, setOrigin] = useState(null); // { lat, lng, label }
  const [sh, setSh] = useState({ data: null, loading: false, error: '' });
  const [locating, setLocating] = useState(false);

  // Auto-refresh live weather every 10 minutes
  useEffect(() => {
    const id = setInterval(() => live.reload(), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [live.reload]);

  // Default shelter search point = Dhaka (until the user picks a district or uses GPS)
  useEffect(() => {
    if (!origin && live.data?.places?.length) {
      const p = live.data.places.find((x) => x.district === 'Dhaka') || live.data.places[0];
      setOrigin({ lat: p.lat, lng: p.lng, label: p.district });
    }
  }, [live.data, origin]);

  useEffect(() => {
    if (!origin) return undefined;
    let off = false;
    setSh({ data: null, loading: true, error: '' });
    api(`/live/shelters?lat=${origin.lat}&lng=${origin.lng}`)
      .then((d) => !off && setSh({ data: d, loading: false, error: '' }))
      .catch((e) => !off && setSh({ data: null, loading: false, error: e.message }));
    return () => { off = true; };
  }, [origin?.lat, origin?.lng]);

  const pickDistrict = (d) => {
    setDistrict(d);
    const p = live.data?.places?.find((x) => x.district === d);
    if (p) setOrigin({ lat: p.lat, lng: p.lng, label: p.district });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert(t('আপনার ব্রাউজার লোকেশন সাপোর্ট করে না।', 'Your browser does not support location.'));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: t('আপনার অবস্থান', 'your location') });
      },
      () => {
        setLocating(false);
        alert(t('লোকেশন পাওয়া যায়নি। ব্রাউজারে লোকেশন অনুমতি দিন অথবা জেলা বেছে নিন।', 'Could not get your location. Allow location access or choose a district.'));
      },
      { timeout: 10000 }
    );
  };

  const aList = (live.data?.alerts || []).filter((a) => (!district || a.district === district) && (!type || a.type === type));
  const places = (live.data?.places || []).filter((p) => !district || p.district === district);
  const districts = (live.data?.places || []).map((p) => p.district).sort();
  const top = aList.find((a) => a.level === 'red') || aList.find((a) => a.level === 'orange') || aList[0];
  const updated = live.data?.updatedAt
    ? new Date(live.data.updatedAt).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      <PageHeader icon="fa-triangle-exclamation" tone="danger" title={t('দুর্যোগ সতর্কতা ও আশ্রয়কেন্দ্র', 'Disaster Alerts & Emergency Shelters')}
        subtitle={t('লাইভ আবহাওয়া পূর্বাভাস থেকে বন্যা ও ঘূর্ণিঝড়ের সতর্কতা এবং আপনার কাছের আশ্রয়কেন্দ্র।', 'Live forecast-based flood and cyclone alerts, and shelters near you.')} />
      <div className="container section">
        <div className="notice notice-info">
          <i className="fa-solid fa-satellite-dish" />{' '}
          {updated
            ? t(`লাইভ পূর্বাভাস (Open-Meteo) · সর্বশেষ আপডেট ${updated}${live.data?.stale ? ' (পুরোনো তথ্য)' : ''}.`, `Live forecast (Open-Meteo) · last updated ${updated}${live.data?.stale ? ' (cached)' : ''}.`)
            : t('লাইভ তথ্য লোড হচ্ছে…', 'Loading live data…')}{' '}
          {t('সরকারি বন্যা তথ্যের জন্য দেখুন:', 'Official flood information:')}{' '}
          <a href="https://www.ffwc.gov.bd" target="_blank" rel="noopener noreferrer">FFWC (BWDB)</a> · <a href="https://www.bmd.gov.bd" target="_blank" rel="noopener noreferrer">BMD</a>
          {' '}<button className="btn btn-outline btn-sm" onClick={() => live.reload()}><i className="fa-solid fa-rotate" /> {t('রিফ্রেশ', 'Refresh')}</button>
        </div>
        <ErrorBox message={live.error} />

        {top ? (
          <div className={`alert-banner level-${top.level}`}>
            <i className="fa-solid fa-bullhorn" />
            <div>
              <h3>{LEVEL_LABEL[top.level][lang === 'bn' ? 0 : 1]}: {L(top, 'title')}</h3>
              <p>{L(top, 'body')}</p>
            </div>
          </div>
        ) : (
          !live.loading && !live.error && (
            <div className="notice notice-success"><i className="fa-solid fa-circle-check" /> {t('এই মুহূর্তে পূর্বাভাসে কোনো সতর্কতা নেই — সব জেলার অবস্থা স্বাভাবিক।', 'No active alerts in the current forecast — all districts are normal.')}</div>
          )
        )}

        <div className="card pad">
          <div className="inline-controls">
            <select value={district} onChange={(e) => pickDistrict(e.target.value)}>
              <option value="">{t('সকল জেলা', 'All districts')}</option>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">{t('সকল ধরন', 'All types')}</option>
              {TYPES.map(([v, bn, en]) => <option key={v} value={v}>{t(bn, en)}</option>)}
            </select>
          </div>
        </div>

        <h3 className="section-title sm">{t('সক্রিয় সতর্কতা', 'Active alerts')}</h3>
        {live.loading && <Loader />}
        {!live.loading && !live.error && aList.length === 0 && <div className="notice">{t('এই ফিল্টারে কোনো সতর্কতা নেই।', 'No alerts for this filter.')}</div>}
        <div className="grid grid-3">
          {aList.map((a) => (
            <div key={a._id} className={`card pad alert-card level-${a.level}`}>
              <span className="badge level-badge">{LEVEL_LABEL[a.level][lang === 'bn' ? 0 : 1]}</span>
              <span className="badge badge-success"><i className="fa-solid fa-satellite-dish" /> LIVE</span>
              <h4>{L(a, 'title')}</h4>
              <p className="small">{L(a, 'body')}</p>
              <small className="muted"><i className="fa-solid fa-location-dot" /> {a.district} · <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer">{a.source}</a></small>
            </div>
          ))}
        </div>

        <h3 className="section-title sm">{t('জেলাভিত্তিক লাইভ অবস্থা (আগামী ৩ দিন)', 'District conditions (next 3 days)')}</h3>
        {places.length > 0 && (
          <div className="card pad">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('জেলা', 'District')}</th>
                    <th>{t('সর্বোচ্চ দৈনিক বৃষ্টি', 'Peak daily rain')}</th>
                    <th>{t('৩ দিনে মোট', '3-day total')}</th>
                    <th>{t('সর্বোচ্চ দমকা হাওয়া', 'Peak wind gust')}</th>
                    <th>{t('সর্বোচ্চ তাপমাত্রা', 'Max temp')}</th>
                    <th>{t('অবস্থা', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((p) => (
                    <tr key={p.district}>
                      <td><strong>{lang === 'bn' ? p.districtBn : p.district}</strong></td>
                      <td>{num(p.rainPeak)} {t('মিমি', 'mm')}</td>
                      <td>{num(p.rain3)} {t('মিমি', 'mm')}</td>
                      <td>{num(p.gustPeak)} {t('কিমি/ঘণ্টা', 'km/h')}</td>
                      <td>{num(p.tempMax)}°C</td>
                      <td>
                        {p.level
                          ? <span className={`badge ${LEVEL_BADGE[p.level]}`}>{LEVEL_LABEL[p.level][lang === 'bn' ? 0 : 1]}</span>
                          : <span className="badge badge-success">{t('স্বাভাবিক', 'Normal')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="toolbar" style={{ marginTop: 28 }}>
          <h3 className="section-title sm nomargin">
            {t('আশ্রয়কেন্দ্র', 'Shelters')}{origin && <> — <span className="muted">{t(`${origin.label} এর ${num(sh.data?.radiusKm ?? 30)} কিমির মধ্যে`, `within ${sh.data?.radiusKm ?? 30} km of ${origin.label}`)}</span></>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={useMyLocation} disabled={locating}>
            <i className="fa-solid fa-location-crosshairs" /> {locating ? t('খোঁজা হচ্ছে…', 'Locating…') : t('আমার কাছের আশ্রয়কেন্দ্র', 'Shelters near me')}
          </button>
        </div>
        <div className="notice notice-info">
          <i className="fa-solid fa-map" /> {t(
            'আশ্রয়কেন্দ্রের তথ্য OpenStreetMap-এর বাস্তব ম্যাপ ডেটা থেকে আসছে। ধারণক্ষমতা বা বর্তমান ভিড়ের কোনো পাবলিক তথ্য নেই, তাই দেখানো হচ্ছে না।',
            'Shelters come from real OpenStreetMap data. Capacity and current occupancy are not publicly available, so they are not shown.')}{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
        </div>
        {sh.loading && <Loader text={t('আশ্রয়কেন্দ্র খোঁজা হচ্ছে…', 'Searching for shelters…')} />}
        <ErrorBox message={sh.error} />
        {!sh.loading && !sh.error && sh.data && sh.data.shelters.length === 0 && (
          <div className="notice">{t(
            'এই এলাকার কাছে ম্যাপে কোনো আশ্রয়কেন্দ্র চিহ্নিত নেই। ম্যাপ অসম্পূর্ণ হতে পারে — স্থানীয় ইউনিয়ন পরিষদ বা উপজেলা প্রশাসনের সাথে যোগাযোগ করুন, জরুরি অবস্থায় ৯৯৯।',
            'No shelters are mapped near this area. The map may be incomplete — contact your local union parishad or upazila administration, or call 999 in an emergency.')}</div>
        )}
        <div className="grid grid-2">
          {(sh.data?.shelters || []).map((s) => (
            <div className="card pad" key={s.id}>
              <div className="toolbar">
                <h4 className="nomargin">{lang === 'bn' && s.nameBn ? s.nameBn : s.name}</h4>
                <span className="badge badge-soft"><i className="fa-solid fa-route" /> {num(s.distanceKm)} {t('কিমি', 'km')}</span>
              </div>
              {s.operator && <p className="muted small">{s.operator}</p>}
              <p className="muted small"><i className="fa-solid fa-location-dot text-danger" /> {s.lat.toFixed(4)}, {s.lng.toFixed(4)}</p>
              <div className="btn-row">
                <a className="btn btn-outline btn-sm" href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer">
                  <i className="fa-solid fa-diamond-turn-right" /> {t('ম্যাপে দেখুন', 'View on map')}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}