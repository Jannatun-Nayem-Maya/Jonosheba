import { Router } from 'express';

// Live weather-based hazard alerts for Bangladesh.
// Data source: Open-Meteo forecast API (free, no API key): https://open-meteo.com
// Thresholds follow the BMD rainfall / wind classes (heavy rain 44mm+, very heavy 88mm+).
const r = Router();

const PLACES = [
  ['Dhaka', 'ঢাকা', 23.81, 90.41], ['Chattogram', 'চট্টগ্রাম', 22.36, 91.78],
  ['Sylhet', 'সিলেট', 24.9, 91.87], ['Sunamganj', 'সুনামগঞ্জ', 25.07, 91.4],
  ['Rajshahi', 'রাজশাহী', 24.37, 88.6], ['Khulna', 'খুলনা', 22.85, 89.54],
  ['Barishal', 'বরিশাল', 22.7, 90.37], ['Rangpur', 'রংপুর', 25.75, 89.25],
  ['Mymensingh', 'ময়মনসিংহ', 24.75, 90.4], ['Kurigram', 'কুড়িগ্রাম', 25.81, 89.65],
  ['Noakhali', 'নোয়াখালী', 22.82, 91.1], ["Cox's Bazar", 'কক্সবাজার', 21.43, 91.98],
  ['Barguna', 'বরগুনা', 22.15, 90.12], ['Cumilla', 'কুমিল্লা', 23.46, 91.18],
  ['Gazipur', 'গাজীপুর', 24.0, 90.42], ['Narayanganj', 'নারায়ণগঞ্জ', 23.62, 90.5],
  ['Bogura', 'বগুড়া', 24.85, 89.37], ['Jashore', 'যশোর', 23.17, 89.21],
].map(([name, bn, lat, lng]) => ({ name, bn, lat, lng }));

const RAIN = [44, 88, 150]; // mm/day: yellow, orange, red
const WIND = [62, 89, 118]; // km/h gusts: yellow, orange, red
const RANK = { red: 3, orange: 2, yellow: 1 };

const level = (v, [y, o, rd]) => (v >= rd ? 'red' : v >= o ? 'orange' : v >= y ? 'yellow' : null);
const worst = (a, b) => ((RANK[a] || 0) >= (RANK[b] || 0) ? a : b) || null;
const toBn = (s) => String(s).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const max = (arr) => Math.max(0, ...arr.map((x) => Number(x) || 0));
const sum = (arr) => arr.reduce((a, x) => a + (Number(x) || 0), 0);

let cache = { at: 0, data: null };
const TTL = 15 * 60 * 1000; // refresh from the weather service at most every 15 minutes

async function build() {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', PLACES.map((p) => p.lat).join(','));
  url.searchParams.set('longitude', PLACES.map((p) => p.lng).join(','));
  url.searchParams.set('daily', 'precipitation_sum,wind_gusts_10m_max,temperature_2m_max');
  url.searchParams.set('forecast_days', '3');
  url.searchParams.set('timezone', 'Asia/Dhaka');

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Weather service returned ${res.status}`);
  const json = await res.json();
  const list = Array.isArray(json) ? json : [json];

  const places = [];
  const alerts = [];

  PLACES.forEach((p, i) => {
    const d = list[i]?.daily;
    if (!d) return;
    const rainPeak = Math.round(max(d.precipitation_sum));
    const rainDay = d.time?.[d.precipitation_sum.indexOf(Math.max(...d.precipitation_sum.map(Number)))] || '';
    const rain3 = Math.round(sum(d.precipitation_sum));
    const gustPeak = Math.round(max(d.wind_gusts_10m_max));
    const tempMax = Math.round(max(d.temperature_2m_max));
    const rainLvl = level(rainPeak, RAIN);
    const windLvl = level(gustPeak, WIND);

    places.push({ district: p.name, districtBn: p.bn, lat: p.lat, lng: p.lng, rainPeak, rain3, gustPeak, tempMax, level: worst(rainLvl, windLvl) });

    if (rainLvl) {
      alerts.push({
        _id: `live-${p.name}-flood`, live: true, type: 'flood', level: rainLvl, district: p.name,
        titleEn: `Heavy rain forecast: ${p.name}`,
        titleBn: `ভারী বৃষ্টির পূর্বাভাস: ${p.bn}`,
        bodyEn: `Up to ${rainPeak} mm of rain expected (${rainDay}); 3-day total ${rain3} mm. Possible waterlogging and local flooding in low-lying areas.`,
        bodyBn: `${toBn(rainPeak)} মিমি পর্যন্ত বৃষ্টির সম্ভাবনা (${toBn(rainDay)}); ৩ দিনে মোট ${toBn(rain3)} মিমি। নিচু এলাকায় জলাবদ্ধতা ও স্থানীয় বন্যার ঝুঁকি আছে।`,
        source: 'Open-Meteo forecast', sourceUrl: 'https://open-meteo.com',
      });
    }
    if (windLvl) {
      alerts.push({
        _id: `live-${p.name}-cyclone`, live: true, type: 'cyclone', level: windLvl, district: p.name,
        titleEn: `Strong wind warning: ${p.name}`,
        titleBn: `প্রবল বাতাসের সতর্কতা: ${p.bn}`,
        bodyEn: `Wind gusts up to ${gustPeak} km/h forecast. Secure loose objects and avoid rivers and open water; follow BMD signals.`,
        bodyBn: `ঘণ্টায় ${toBn(gustPeak)} কিমি পর্যন্ত দমকা হাওয়ার পূর্বাভাস। আলগা জিনিস সামলে রাখুন, নদী ও খোলা জলে যাবেন না এবং বিএমডির সংকেত অনুসরণ করুন।`,
        source: 'Open-Meteo forecast', sourceUrl: 'https://open-meteo.com',
      });
    }
  });

  alerts.sort((a, b) => RANK[b.level] - RANK[a.level]);
  return { updatedAt: new Date().toISOString(), source: 'Open-Meteo', places, alerts };
}

r.get('/weather', async (req, res) => {
  if (cache.data && Date.now() - cache.at < TTL) return res.json(cache.data);
  try {
    cache = { at: Date.now(), data: await build() };
    res.json(cache.data);
  } catch (e) {
    console.error('Live weather failed:', e.message);
    if (cache.data) return res.json({ ...cache.data, stale: true }); // serve the last good data
    res.status(502).json({ message: 'Live weather data is unavailable right now. Please try again later.' });
  }
});

// ---------------------------------------------------------------
// Real cyclone / flood shelters mapped in OpenStreetMap (Overpass API).
// No capacity / occupancy is shown because no public source provides it.
// ---------------------------------------------------------------
const shelterCache = new Map();
const SHELTER_TTL = 30 * 60 * 1000;
const RADIUS_M = 30000;

const rad = (d) => (d * Math.PI) / 180;
const km = (a, b, c, d) => {
  const x = rad(c - a), y = rad(d - b);
  const h = Math.sin(x / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(y / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

async function findShelters(lat, lng) {
  const q = `[out:json][timeout:25];
(
  nwr["emergency"="assembly_point"](around:${RADIUS_M},${lat},${lng});
  nwr["name"~"cyclone shelter|flood shelter|ঘূর্ণিঝড় আশ্রয়|বন্যা আশ্রয়|আশ্রয়কেন্দ্র|আশ্রয় কেন্দ্র",i](around:${RADIUS_M},${lat},${lng});
  nwr["name:en"~"cyclone shelter|flood shelter",i](around:${RADIUS_M},${lat},${lng});
);
out center 120;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'JonosebaPortal/1.0 (student project)' },
    body: 'data=' + encodeURIComponent(q),
    signal: AbortSignal.timeout(28000),
  });
  if (!res.ok) throw new Error(`Map service returned ${res.status}`);
  const json = await res.json();
  const seen = new Set();
  return (json.elements || [])
    .map((e) => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      if (la == null || lo == null) return null;
      const tags = e.tags || {};
      return {
        id: `${e.type}-${e.id}`,
        name: tags['name:en'] || tags.name || 'Unnamed shelter',
        nameBn: tags['name:bn'] || (/[\u0980-\u09FF]/.test(tags.name || '') ? tags.name : ''),
        operator: tags.operator || '',
        lat: la, lng: lo,
        distanceKm: Math.round(km(lat, lng, la, lo) * 10) / 10,
      };
    })
    .filter((x) => x && !seen.has(x.id) && seen.add(x.id))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
}

r.get('/shelters', async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng);
  // must be a valid point inside / near Bangladesh
  if (!(lat > 20.4 && lat < 26.8 && lng > 87.8 && lng < 92.9)) {
    return res.status(400).json({ message: 'Please choose a location inside Bangladesh' });
  }
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = shelterCache.get(key);
  if (hit && Date.now() - hit.at < SHELTER_TTL) return res.json(hit.data);
  try {
    const data = { radiusKm: RADIUS_M / 1000, source: 'OpenStreetMap', shelters: await findShelters(lat, lng) };
    if (shelterCache.size > 200) shelterCache.clear();
    shelterCache.set(key, { at: Date.now(), data });
    res.json(data);
  } catch (e) {
    console.error('Shelter lookup failed:', e.message);
    if (hit) return res.json({ ...hit.data, stale: true });
    res.status(502).json({ message: 'Shelter map service is busy or unavailable. Please try again in a minute.' });
  }
});

export default r;