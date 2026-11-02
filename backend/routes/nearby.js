
import { Router } from 'express';

const router = Router();

const OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];

const VALHALLA = 'https://valhalla1.openstreetmap.de/route';

const TYPES = {
  hospital: ['amenity=hospital'],
  pharmacy: ['amenity=pharmacy'],
  clinic: ['amenity=clinic', 'healthcare=clinic'],
  library: ['amenity=library'],
  atm: ['amenity=atm', 'atm=yes'],
  bus_stop: ['highway=bus_stop', 'amenity=bus_station'],
  police: ['amenity=police'],
  fire_station: ['amenity=fire_station'],
  bank: ['amenity=bank'],
  restaurant: ['amenity=restaurant'],
  fuel: ['amenity=fuel'],
  school: ['amenity=school'],
  post_office: ['amenity=post_office'],
  market: ['shop=supermarket', 'amenity=marketplace']
};

const placesCache = new Map();
const routesCache = new Map();

const validPoint = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) &&
  lat > 20.4 && lat < 26.8 && lon > 87.8 && lon < 92.9;

function distance(a, b, c, d) {
  const rad = x => x * Math.PI / 180;
  const x = rad(c - a), y = rad(d - b);
  const h = Math.sin(x / 2) ** 2 +
    Math.cos(rad(a)) * Math.cos(rad(c)) *
    Math.sin(y / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function getOverpass(query) {
  let lastError;

  for (const endpoint of OVERPASS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!Array.isArray(json.elements)) {
        throw new Error('Invalid Overpass response');
      }
      return json.elements;
    } catch (error) {
      lastError = error;
      console.warn('Overpass failed:', endpoint, error.message);
    }
  }

  throw lastError || new Error('Overpass unavailable');
}

function getAddress(tags) {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city']
  ].filter(Boolean).join(', ') || tags['addr:full'] || '';
}

router.get('/places', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Number(req.query.radius || 3000);
  const category = String(req.query.category || '');

  if (!validPoint(lat, lon) ||
      !TYPES[category] ||
      ![1000, 3000, 5000, 10000].includes(radius)) {
    return res.status(400).json({
      code: 'INVALID_SEARCH',
      message: 'Invalid location, category or radius'
    });
  }

  const key = `${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}:${category}`;
  const cached = placesCache.get(key);

  if (cached && Date.now() - cached.time < 600000) {
    return res.json(cached.data);
  }

  const clauses = TYPES[category].map(tag => {
    const [k, v] = tag.split('=');
    return `nwr["${k}"="${v}"](around:${radius},${lat},${lon});`;
  }).join('\n');

  const query = `
    [out:json][timeout:15];
    (${clauses});
    out center 120;
  `;

  try {
    const elements = await getOverpass(query);

    const places = elements.map(item => {
      const pLat = item.lat ?? item.center?.lat;
      const pLon = item.lon ?? item.center?.lon;
      if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) {
        return null;
      }

      const tags = item.tags || {};
      return {
        id: `${item.type}-${item.id}`,
        name: tags['name:en'] || tags.name ||
              tags['name:bn'] || '',
        nameBn: tags['name:bn'] || '',
        nameEn: tags['name:en'] || '',
        address: getAddress(tags),
        lat: pLat,
        lon: pLon,
        phone: tags['contact:phone'] || tags.phone || '',
        website: tags['contact:website'] || tags.website || '',
        openingHours: tags.opening_hours || '',
        distanceKm: Number(distance(lat, lon, pLat, pLon).toFixed(2))
      };
    }).filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 60);

    const data = { places, source: 'OpenStreetMap' };

    if (placesCache.size > 100) placesCache.clear();
    placesCache.set(key, { data, time: Date.now() });

    res.json(data);
  } catch (error) {
    console.error('Nearby search error:', error.message);

    if (cached) return res.json({ ...cached.data, stale: true });

    res.status(503).json({
      code: 'SEARCH_UNAVAILABLE',
      message: 'Nearby search server unavailable'
    });
  }
});

function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lon = 0;

  while (index < encoded.length) {
    const values = [];

    for (let i = 0; i < 2; i++) {
      let result = 0, shift = 0, byte;
      do {
        if (index >= encoded.length) throw new Error('Invalid geometry');
        byte = encoded.charCodeAt(index++) - 63;
        result += (byte & 31) * 2 ** shift;
        shift += 5;
      } while (byte >= 32);

      values.push(result % 2
        ? -(Math.floor(result / 2) + 1)
        : Math.floor(result / 2));
    }

    lat += values[0];
    lon += values[1];
    points.push([lat / 1e6, lon / 1e6]);
  }

  return points;
}

router.get('/route', async (req, res) => {
  const fromLat = Number(req.query.fromLat);
  const fromLon = Number(req.query.fromLon);
  const toLat = Number(req.query.toLat);
  const toLon = Number(req.query.toLon);
  const mode = String(req.query.mode || 'pedestrian');

  if (!validPoint(fromLat, fromLon) ||
      !validPoint(toLat, toLon) ||
      !['pedestrian', 'auto'].includes(mode)) {
    return res.status(400).json({ message: 'Invalid route' });
  }

  const key = [fromLat, fromLon, toLat, toLon, mode]
    .map(x => typeof x === 'number' ? x.toFixed(5) : x)
    .join(':');

  const cached = routesCache.get(key);
  if (cached && Date.now() - cached.time < 1800000) {
    return res.json(cached.data);
  }

  try {
    const response = await fetch(VALHALLA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lat: fromLat, lon: fromLon },
          { lat: toLat, lon: toLon }
        ],
        costing: mode,
        units: 'kilometers'
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    if (!json.trip?.legs?.length || !json.trip.summary) {
      throw new Error('No route found');
    }

    const data = {
      distanceKm: Number(json.trip.summary.length.toFixed(2)),
      durationMinutes: Math.ceil(json.trip.summary.time / 60),
      coordinates: json.trip.legs.flatMap(l => decodePolyline(l.shape)),
      mode
    };

    if (routesCache.size > 150) routesCache.clear();
    routesCache.set(key, { data, time: Date.now() });

    res.json(data);
  } catch (error) {
    console.error('Routing error:', error.message);
    if (cached) return res.json(cached.data);
    res.status(503).json({
      code: 'ROUTE_UNAVAILABLE',
      message: 'Walking/driving route is currently unavailable'
    });
  }
});

export default router;
