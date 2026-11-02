
import { useState, useEffect, useMemo, useRef } from 'react';

import { useLang } from '../context/LangContext.jsx';

import {
  PageHeader,
  useApi,
  Loader,
  ErrorBox
} from '../components/ui.jsx';

// ============================================
// CONSTANTS
// ============================================

const TYPES = [
  ['flood', 'বন্যা / ভারী বৃষ্টি', 'Flood / Heavy Rain'],
  ['cyclone', 'ঘূর্ণিঝড় / প্রবল বাতাস', 'Cyclone / Strong Wind']
];

const LEVEL_LABEL = {
  red: ['রেড অ্যালার্ট', 'RED ALERT'],
  orange: ['কমলা সতর্কতা', 'ORANGE'],
  yellow: ['হলুদ সতর্কতা', 'YELLOW']
};

const LEVEL_BADGE = {
  red: 'badge-danger',
  orange: 'badge-warning',
  yellow: 'badge-gold'
};

const SHELTER_TYPES = [
  {
    value: 'cyclone',
    query: 'cyclone shelter',
    bn: 'ঘূর্ণিঝড় আশ্রয়কেন্দ্র',
    en: 'Cyclone Shelter'
  },
  {
    value: 'flood',
    query: 'flood shelter',
    bn: 'বন্যা আশ্রয়কেন্দ্র',
    en: 'Flood Shelter'
  }
];

const GOVERNMENT_SHELTER_URL =
  'https://rapid.ddm.gov.bd/service/shelter_info';

// ============================================
// MAP HELPERS
// ============================================

function validCoordinates(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function buildShelterQuery(location, shelterType) {
  if (!location) return '';

  const selectedType = SHELTER_TYPES.find(
    (item) => item.value === shelterType
  );

  const phrase = selectedType?.query || 'cyclone shelter';

  if (location.mode === 'district') {
    return `${phrase} in ${location.label}, Bangladesh`;
  }

  if (location.mode === 'gps') {
    return `${phrase} near ${location.lat},${location.lng}`;
  }

  return '';
}

function buildGoogleSearchUrl(query) {
  if (!query) return '';

  return (
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(query)
  );
}

function buildGoogleEmbedUrl(query) {
  if (!query) return '';

  return (
    'https://maps.google.com/maps?q=' +
    encodeURIComponent(query) +
    '&z=12&output=embed'
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DisasterAlerts() {
  const { t, L, num, lang } = useLang();

  // Existing live weather source.
  const live = useApi('/live/weather');

  // Weather filters.
  const [district, setDistrict] = useState('');
  const [type, setType] = useState('');

  // Separate shelter search location.
  const [location, setLocation] = useState(null);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [shelterType, setShelterType] = useState('cyclone');
  const [showMap, setShowMap] = useState(true);

  const reloadRef = useRef(live.reload);

  // ==========================================
  // WEATHER AUTO REFRESH
  // ==========================================

  useEffect(() => {
    reloadRef.current = live.reload;
  }, [live.reload]);

  useEffect(() => {
    const timer = setInterval(() => {
      reloadRef.current?.();
    }, 10 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // DISTRICT DATA
  // ==========================================

  const allPlaces = live.data?.places || [];

  const districts = useMemo(() => {
    return [
      ...new Set(
        (live.data?.places || [])
          .map((place) => place.district)
          .filter(Boolean)
      )
    ].sort();
  }, [live.data?.places]);

  // ==========================================
  // DEFAULT SHELTER SEARCH LOCATION
  // ==========================================

  useEffect(() => {
    if (location || !live.data?.places?.length) return;

    const defaultPlace =
      live.data.places.find(
        (place) => place.district === 'Dhaka'
      ) || live.data.places[0];

    if (
      !defaultPlace ||
      !validCoordinates(defaultPlace.lat, defaultPlace.lng)
    ) {
      return;
    }

    setLocation({
      mode: 'district',
      label: defaultPlace.district,
      lat: Number(defaultPlace.lat),
      lng: Number(defaultPlace.lng)
    });
  }, [live.data, location]);

  // ==========================================
  // SELECT SHELTER DISTRICT
  // ==========================================

  function selectShelterDistrict(value) {
    if (!value) return;

    const selected = allPlaces.find(
      (place) => place.district === value
    );

    if (!selected) return;

    if (!validCoordinates(selected.lat, selected.lng)) {
      setLocationError(
        t(
          'নির্বাচিত জেলার অবস্থান পাওয়া যায়নি।',
          'The location for this district is unavailable.'
        )
      );
      return;
    }

    setLocation({
      mode: 'district',
      label: selected.district,
      lat: Number(selected.lat),
      lng: Number(selected.lng)
    });

    setLocationError('');
    setShowMap(true);
  }

  // ==========================================
  // GPS CURRENT LOCATION
  // ==========================================

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError(
        t(
          'আপনার ব্রাউজারে লোকেশন সাপোর্ট নেই। জেলা নির্বাচন করুন।',
          'Geolocation is not supported. Please select a district.'
        )
      );
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (!validCoordinates(lat, lng)) {
          setLocationError(
            t(
              'সঠিক GPS অবস্থান পাওয়া যায়নি।',
              'A valid GPS location could not be obtained.'
            )
          );
          return;
        }

        setLocation({
          mode: 'gps',
          label: 'Current Location',
          lat,
          lng
        });

        setShowMap(true);
      },

      (error) => {
        setLocating(false);

        if (error.code === 1) {
          setLocationError(
            t(
              'লোকেশন অনুমতি দেওয়া হয়নি। ব্রাউজারের Location Permission চালু করুন অথবা জেলা নির্বাচন করুন।',
              'Location permission was denied. Enable it in your browser or select a district.'
            )
          );
        } else if (error.code === 3) {
          setLocationError(
            t(
              'লোকেশন খুঁজতে সময় শেষ হয়েছে। আবার চেষ্টা করুন।',
              'Location request timed out. Please try again.'
            )
          );
        } else {
          setLocationError(
            t(
              'লোকেশন পাওয়া যায়নি। জেলা নির্বাচন করে চেষ্টা করুন।',
              'Unable to determine your location. Select a district instead.'
            )
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  }

  // ==========================================
  // WEATHER FILTERING
  // ==========================================

  const alerts = (live.data?.alerts || []).filter(
    (alert) =>
      (!district || alert.district === district) &&
      (!type || alert.type === type)
  );

  const places = allPlaces.filter(
    (place) => !district || place.district === district
  );

  const topAlert =
    alerts.find((alert) => alert.level === 'red') ||
    alerts.find((alert) => alert.level === 'orange') ||
    alerts[0];

  const updated = live.data?.updatedAt
    ? new Date(live.data.updatedAt).toLocaleTimeString(
        lang === 'bn' ? 'bn-BD' : 'en-GB',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      )
    : null;

  // ==========================================
  // GOOGLE MAPS SEARCH
  // ==========================================

  const shelterQuery = useMemo(
    () => buildShelterQuery(location, shelterType),
    [location, shelterType]
  );

  const googleSearchUrl = useMemo(
    () => buildGoogleSearchUrl(shelterQuery),
    [shelterQuery]
  );

  const googleEmbedUrl = useMemo(
    () => buildGoogleEmbedUrl(shelterQuery),
    [shelterQuery]
  );

  const locationName = location
    ? location.mode === 'gps'
      ? t('আমার বর্তমান অবস্থান', 'My Current Location')
      : location.label
    : '';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <PageHeader
        icon="fa-triangle-exclamation"
        tone="danger"
        title={t(
          'দুর্যোগ সতর্কতা ও আশ্রয়কেন্দ্র',
          'Disaster Alerts & Emergency Shelters'
        )}
        subtitle={t(
          'লাইভ আবহাওয়া পূর্বাভাস, দুর্যোগ সতর্কতা এবং কাছের আশ্রয়কেন্দ্র অনুসন্ধান।',
          'Live weather forecasts, disaster alerts and nearby shelter search.'
        )}
      />

      <div className="container section">

        {/* ======================================
            LIVE WEATHER INFORMATION
        ====================================== */}

        <div className="notice notice-info">
          <i className="fa-solid fa-satellite-dish" />
          {' '}

          {updated
            ? t(
                `লাইভ পূর্বাভাস (Open-Meteo) · সর্বশেষ আপডেট ${updated}${live.data?.stale ? ' (ক্যাশ করা তথ্য)' : ''}।`,
                `Live forecast (Open-Meteo) · last updated ${updated}${live.data?.stale ? ' (cached)' : ''}.`
              )
            : t(
                'লাইভ তথ্য লোড হচ্ছে…',
                'Loading live data…'
              )}

          {' '}

          {t(
            'সরকারি তথ্য:',
            'Official information:'
          )}

          {' '}

          <a
            href="https://www.ffwc.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
          >
            FFWC (BWDB)
          </a>

          {' · '}

          <a
            href="https://www.bmd.gov.bd"
            target="_blank"
            rel="noopener noreferrer"
          >
            BMD
          </a>

          {' '}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => live.reload()}
          >
            <i className="fa-solid fa-rotate" />
            {' '}
            {t('রিফ্রেশ', 'Refresh')}
          </button>
        </div>

        <ErrorBox message={live.error} />

        {/* ======================================
            TOP DISASTER ALERT
        ====================================== */}

        {topAlert ? (
          <div
            className={`alert-banner level-${topAlert.level}`}
          >
            <i className="fa-solid fa-bullhorn" />

            <div>
              <h3>
                {LEVEL_LABEL[topAlert.level]?.[
                  lang === 'bn' ? 0 : 1
                ] || topAlert.level}
                {': '}
                {L(topAlert, 'title')}
              </h3>

              <p>{L(topAlert, 'body')}</p>
            </div>
          </div>
        ) : (
          !live.loading &&
          !live.error && (
            <div className="notice notice-success">
              <i className="fa-solid fa-circle-check" />
              {' '}
              {t(
                'বর্তমান পূর্বাভাসভিত্তিক বিশ্লেষণে কোনো সক্রিয় সতর্কতা নেই।',
                'No active alerts were identified from the current forecast analysis.'
              )}
            </div>
          )
        )}

        {/* ======================================
            WEATHER FILTERS
        ====================================== */}

        <div className="card pad">
          <div className="inline-controls">
            <select
              value={district}
              onChange={(event) =>
                setDistrict(event.target.value)
              }
              aria-label={t(
                'আবহাওয়ার জেলা নির্বাচন',
                'Weather District'
              )}
            >
              <option value="">
                {t('সকল জেলা', 'All Districts')}
              </option>

              {districts.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              aria-label={t(
                'দুর্যোগের ধরন',
                'Disaster Type'
              )}
            >
              <option value="">
                {t('সকল ধরন', 'All Types')}
              </option>

              {TYPES.map(([value, bn, en]) => (
                <option key={value} value={value}>
                  {t(bn, en)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ======================================
            ACTIVE ALERTS
        ====================================== */}

        <h3 className="section-title sm">
          {t('সক্রিয় সতর্কতা', 'Active Alerts')}
        </h3>

        {live.loading && <Loader />}

        {!live.loading &&
          !live.error &&
          alerts.length === 0 && (
            <div className="notice">
              {t(
                'এই ফিল্টারে কোনো সতর্কতা নেই।',
                'No alerts match this filter.'
              )}
            </div>
          )}

        <div className="grid grid-3">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`card pad alert-card level-${alert.level}`}
            >
              <span className="badge level-badge">
                {LEVEL_LABEL[alert.level]?.[
                  lang === 'bn' ? 0 : 1
                ] || alert.level}
              </span>

              <span className="badge badge-success">
                <i className="fa-solid fa-satellite-dish" />
                {' '}LIVE
              </span>

              <h4>{L(alert, 'title')}</h4>

              <p className="small">{L(alert, 'body')}</p>

              <small className="muted">
                <i className="fa-solid fa-location-dot" />
                {' '}
                {alert.district}
                {' · '}

                {alert.sourceUrl ? (
                  <a
                    href={alert.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {alert.source}
                  </a>
                ) : (
                  alert.source
                )}
              </small>
            </div>
          ))}
        </div>

        {/* ======================================
            DISTRICT CONDITIONS
        ====================================== */}

        <h3 className="section-title sm">
          {t(
            'জেলাভিত্তিক লাইভ অবস্থা (আগামী ৩ দিন)',
            'District Conditions (Next 3 Days)'
          )}
        </h3>

        {places.length > 0 && (
          <div className="card pad">
            <div className="table-wrap">
              <table className="table">

                <thead>
                  <tr>
                    <th>{t('জেলা', 'District')}</th>

                    <th>
                      {t(
                        'সর্বোচ্চ দৈনিক বৃষ্টি',
                        'Peak Daily Rain'
                      )}
                    </th>

                    <th>
                      {t(
                        '৩ দিনে মোট',
                        '3-Day Total'
                      )}
                    </th>

                    <th>
                      {t(
                        'সর্বোচ্চ দমকা হাওয়া',
                        'Peak Wind Gust'
                      )}
                    </th>

                    <th>
                      {t(
                        'সর্বোচ্চ তাপমাত্রা',
                        'Max Temperature'
                      )}
                    </th>

                    <th>{t('অবস্থা', 'Status')}</th>
                  </tr>
                </thead>

                <tbody>
                  {places.map((place) => (
                    <tr key={place.district}>
                      <td>
                        <strong>
                          {lang === 'bn'
                            ? place.districtBn
                            : place.district}
                        </strong>
                      </td>

                      <td>
                        {num(place.rainPeak)}
                        {' '}
                        {t('মিমি', 'mm')}
                      </td>

                      <td>
                        {num(place.rain3)}
                        {' '}
                        {t('মিমি', 'mm')}
                      </td>

                      <td>
                        {num(place.gustPeak)}
                        {' '}
                        {t('কিমি/ঘণ্টা', 'km/h')}
                      </td>

                      <td>{num(place.tempMax)}°C</td>

                      <td>
                        {place.level ? (
                          <span
                            className={`badge ${
                              LEVEL_BADGE[place.level] ||
                              'badge-warning'
                            }`}
                          >
                            {LEVEL_LABEL[place.level]?.[
                              lang === 'bn' ? 0 : 1
                            ] || place.level}
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            {t('স্বাভাবিক', 'Normal')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}

        {/* ======================================
            GOOGLE MAPS SHELTER SEARCH
        ====================================== */}

        <section
          className="card pad"
          style={{
            marginTop: 36,
            borderRadius: 16,
            border: '1px solid #dce8e3'
          }}
        >

          {/* Section Heading */}

          <div
            className="toolbar"
            style={{
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 22
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3
                className="nomargin"
                style={{
                  color: '#153b45',
                  fontSize: 23,
                  lineHeight: 1.4
                }}
              >
                <i
                  className="fa-solid fa-map-location-dot"
                  style={{
                    color: '#07865a',
                    marginRight: 10
                  }}
                />

                {t(
                  'কাছের আশ্রয়কেন্দ্র খুঁজুন',
                  'Find Nearby Emergency Shelters'
                )}
              </h3>

              <p
                className="muted"
                style={{
                  margin: '8px 0 0',
                  fontSize: 15,
                  lineHeight: 1.7
                }}
              >
                {t(
                  'বর্তমান অবস্থান বা জেলা নির্বাচন করে Google Maps-এ ঘূর্ণিঝড় ও বন্যা আশ্রয়কেন্দ্র খুঁজুন।',
                  'Search Google Maps for cyclone and flood shelters using your location or a selected district.'
                )}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={useMyLocation}
              disabled={locating}
            >
              <i className="fa-solid fa-location-crosshairs" />
              {' '}

              {locating
                ? t(
                    'লোকেশন নেওয়া হচ্ছে...',
                    'Locating...'
                  )
                : t(
                    'আমার বর্তমান অবস্থান',
                    'Use My Current Location'
                  )}
            </button>
          </div>

          {/* Search Controls */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 15,
              marginBottom: 18
            }}
          >
            <label style={fieldLabelStyle}>
              {t(
                'জেলা নির্বাচন করুন',
                'Select District'
              )}

              <select
                value={
                  location?.mode === 'district'
                    ? location.label
                    : ''
                }
                onChange={(event) =>
                  selectShelterDistrict(event.target.value)
                }
                style={fieldInputStyle}
                aria-label={t(
                  'আশ্রয়কেন্দ্র অনুসন্ধানের জেলা',
                  'Shelter Search District'
                )}
              >
                <option value="">
                  {t(
                    'জেলা নির্বাচন করুন',
                    'Choose a District'
                  )}
                </option>

                {districts.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label style={fieldLabelStyle}>
              {t(
                'আশ্রয়কেন্দ্রের ধরন',
                'Shelter Type'
              )}

              <select
                value={shelterType}
                onChange={(event) => {
                  setShelterType(event.target.value);
                  setShowMap(true);
                }}
                style={fieldInputStyle}
                aria-label={t(
                  'আশ্রয়কেন্দ্রের ধরন',
                  'Shelter Type'
                )}
              >
                {SHELTER_TYPES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {t(item.bn, item.en)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Location Error */}

          {locationError && (
            <div
              className="notice"
              role="alert"
              style={{
                background: '#fff1ed',
                border: '1px solid #efcdc4',
                color: '#ac4432',
                marginBottom: 18
              }}
            >
              <i className="fa-solid fa-circle-exclamation" />
              {' '}
              {locationError}
            </div>
          )}

          {/* Selected Location */}

          {location && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 9,
                marginBottom: 17,
                color: '#146c4e',
                fontSize: 14
              }}
            >
              <i className="fa-solid fa-location-dot" />

              <strong>
                {t(
                  'নির্বাচিত অবস্থান:',
                  'Selected Location:'
                )}
              </strong>

              <span>{locationName}</span>
            </div>
          )}

          {/* Embedded Google Map */}

          {location && showMap && (
            <div
              style={{
                width: '100%',
                height: 440,
                overflow: 'hidden',
                borderRadius: 14,
                border: '1px solid #d7e6df',
                background: '#eff6f2'
              }}
            >
              <iframe
                key={googleEmbedUrl}
                src={googleEmbedUrl}
                title={t(
                  'আশ্রয়কেন্দ্রের Google Maps অনুসন্ধান',
                  'Google Maps Shelter Search'
                )}
                width="100%"
                height="100%"
                style={{
                  display: 'block',
                  border: 0
                }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {/* Search Actions */}

          {location ? (
            <div
              className="btn-row"
              style={{
                marginTop: 20,
                gap: 12,
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              {/* Google Maps Search */}

              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="fa-solid fa-arrow-up-right-from-square" />
                {' '}
                {t(
                  'Google Maps-এ ফলাফল দেখুন',
                  'View Results in Google Maps'
                )}
              </a>

              {/* Official Government Directory */}

              <a
                href={GOVERNMENT_SHELTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <i className="fa-solid fa-building-columns" />
                {' '}
                {t(
                  'সরকারি আশ্রয়কেন্দ্রের তালিকা',
                  'Government Shelter Directory'
                )}
              </a>

              {/* Show / Hide Map */}

              <button
                type="button"
                className="btn btn-outline"
                onClick={() =>
                  setShowMap((current) => !current)
                }
              >
                <i
                  className={`fa-solid ${
                    showMap
                      ? 'fa-eye-slash'
                      : 'fa-map'
                  }`}
                />
                {' '}

                {showMap
                  ? t('ম্যাপ লুকান', 'Hide Map')
                  : t('ম্যাপ দেখান', 'Show Map')}
              </button>
            </div>
          ) : (
            <div
              className="btn-row"
              style={{
                marginTop: 18,
                gap: 12,
                flexWrap: 'wrap'
              }}
            >
              <a
                href={GOVERNMENT_SHELTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <i className="fa-solid fa-building-columns" />
                {' '}

                {t(
                  'সরকারি আশ্রয়কেন্দ্রের তালিকা',
                  'Government Shelter Directory'
                )}
              </a>
            </div>
          )}

          {/* Safety Information */}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 11,
              marginTop: 22,
              padding: '14px 17px',
              border: '1px solid #d8e8df',
              borderRadius: 11,
              background: '#f0f8f4',
              color: '#416957',
              fontSize: 13,
              lineHeight: 1.8
            }}
          >
            <i
              className="fa-solid fa-circle-info"
              style={{ marginTop: 4 }}
            />

            <span>
              {t(
                'Google Maps-এর ফলাফল শুধু স্থান অনুসন্ধানের জন্য। কোনো স্থান প্রকৃত আশ্রয়কেন্দ্র বা বর্তমানে খোলা কি না, তা সরকারি তালিকা ও স্থানীয় প্রশাসনের মাধ্যমে নিশ্চিত করুন। জরুরি সহায়তার জন্য ৯৯৯-এ কল করুন।',
                'Google Maps results are for location discovery only. Verify actual shelter locations and current availability through the government directory and local authorities. Call 999 for immediate emergency assistance.'
              )}
            </span>
          </div>
        </section>

      </div>
    </>
  );
}

// ============================================
// INLINE FIELD STYLES
// ============================================

const fieldLabelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#284a51',
  fontSize: 14,
  fontWeight: 700
};

const fieldInputStyle = {
  width: '100%',
  minHeight: 48,
  padding: '10px 13px',
  border: '1px solid #d0e2d8',
  borderRadius: 10,
  background: '#ffffff',
  color: '#254a51',
  fontSize: 15,
  fontFamily: 'inherit'
};
