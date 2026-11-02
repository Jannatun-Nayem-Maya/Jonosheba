
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import './NearbyServices.css';

const CATEGORIES = [
  ['hospital', 'হাসপাতাল', 'Hospital', 'hospitals', 'fa-hospital'],
  ['pharmacy', 'ফার্মেসি', 'Pharmacy', 'pharmacies', 'fa-prescription-bottle-medical'],
  ['clinic', 'ক্লিনিক', 'Clinic', 'clinics', 'fa-house-medical'],
  ['atm', 'এটিএম', 'ATM', 'ATMs', 'fa-money-bill-transfer'],
  ['bank', 'ব্যাংক', 'Bank', 'banks', 'fa-building-columns'],
  ['library', 'লাইব্রেরি', 'Library', 'libraries', 'fa-book-open'],
  ['bus', 'বাস স্টপ', 'Bus Stop', 'bus stops', 'fa-bus'],
  ['police', 'থানা', 'Police Station', 'police stations', 'fa-shield-halved'],
  ['fire', 'ফায়ার স্টেশন', 'Fire Station', 'fire stations', 'fa-fire-extinguisher'],
  ['restaurant', 'রেস্টুরেন্ট', 'Restaurant', 'restaurants', 'fa-utensils'],
  ['fuel', 'পেট্রোল পাম্প', 'Petrol Pump', 'petrol pumps', 'fa-gas-pump'],
  ['school', 'স্কুল', 'School', 'schools', 'fa-school'],
  ['market', 'বাজার', 'Market', 'markets', 'fa-store'],
  ['post', 'ডাকঘর', 'Post Office', 'post offices', 'fa-envelope']
];

const RECENTS_KEY = 'jonoseba_google_recent_v4';
const FAV_KEY = 'jonoseba_google_fav_v4';

function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function googleSearch(query) {
  return 'https://www.google.com/maps/search/?' +
    new URLSearchParams({ api: '1', query });
}

function googleDirections(origin, destination, mode) {
  return 'https://www.google.com/maps/dir/?' +
    new URLSearchParams({
      api: '1',
      origin,
      destination,
      travelmode: mode
    });
}

// Key-free legacy map embed, not the official Embed API.
// If Google restricts this URL, use the Google Maps link.
function googleEmbed(query) {
  return 'https://maps.google.com/maps?' +
    new URLSearchParams({
      q: query,
      z: '15',
      output: 'embed'
    });
}

export default function NearbyServices() {
  const { t, lang } = useLang();
  const bn = lang === 'bn';

  const [method, setMethod] = useState('gps');
  const [areaInput, setAreaInput] = useState('');
  const [location, setLocation] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState(null);

  const [category, setCategory] = useState('hospital');
  const [customService, setCustomService] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState('driving');
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState('');

  const [recents, setRecents] = useState(
    () => readStorage(RECENTS_KEY)
  );
  const [favourites, setFavourites] = useState(
    () => readStorage(FAV_KEY)
  );

  const currentCategory =
    CATEGORIES.find(c => c[0] === category) || CATEGORIES[0];

  useEffect(() => {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  }, [recents]);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favourites));
  }, [favourites]);

  const locationReady = Boolean(location);
  const searchReady = Boolean(activeSearch);

  const labelFor = item => bn ? item[1] : item[2];

  const searchQuery = useMemo(() => {
    if (!locationReady || !searchReady) return '';
    return `${activeSearch} near ${location}`;
  }, [activeSearch, location, locationReady, searchReady]);

  const mapUrl = useMemo(() => {
    if (!locationReady) return '';
    return googleEmbed(searchQuery || location);
  }, [location, searchQuery, locationReady]);

  function setChosenLocation(value, label, gpsAccuracy = null) {
    setLocation(value);
    setLocationLabel(label);
    setAccuracy(gpsAccuracy);
    setActiveSearch('');
    setDestination('');
    setMessage('');
  }

  function useGPS() {
    if (!navigator.geolocation) {
      setMessage(t(
        'এই ব্রাউজারে GPS লোকেশন ব্যবহার করা যাচ্ছে না।',
        'GPS location is not available in this browser.'
      ));
      return;
    }

    setLocating(true);
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMethod('gps');
        setChosenLocation(
          `${coords.latitude},${coords.longitude}`,
          t('আমার বর্তমান অবস্থান', 'My current location'),
          coords.accuracy
        );
        setLocating(false);
      },
      err => {
        setLocating(false);
        setMessage(err.code === 1
          ? t(
              'লোকেশনের অনুমতি দেওয়া হয়নি। Browser permission চালু করুন অথবা এলাকার নাম লিখুন।',
              'Location permission denied. Enable it or enter your area manually.'
            )
          : t(
              'GPS অবস্থান পাওয়া যায়নি। নিজের এলাকার নাম দিয়ে চেষ্টা করুন।',
              'Could not detect GPS location. Try entering your area.'
            ));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }

  function useManual() {
    const area = areaInput.trim();

    if (area.length < 3) {
      setMessage(t(
        'আপনার এলাকা বা ঠিকানা অন্তত ৩ অক্ষরে লিখুন।',
        'Enter an area or address of at least 3 characters.'
      ));
      return;
    }

    setMethod('manual');
    setChosenLocation(
      `${area}, Bangladesh`,
      area
    );
  }

  function addRecent(id) {
    setRecents(prev => [
      id,
      ...prev.filter(x => x !== id)
    ].slice(0, 7));
  }

  function chooseCategory(item) {
    setCategory(item[0]);
    setCustomService('');
    setMessage('');
    // Selection updates the pending service.
    // The main action below explicitly starts the search.
  }

  function showNearby() {
    if (!locationReady) {
      setMessage(t(
        'প্রথমে Step 1 থেকে আপনার অবস্থান নির্বাচন করুন।',
        'First choose your location in Step 1.'
      ));
      return;
    }

    const service = customService.trim() || currentCategory[3];

    setActiveSearch(service);
    setDestination(service);
    addRecent(customService.trim()
      ? `custom:${service}`
      : category
    );
    setMessage('');
  }

  function toggleFavourite(id) {
    setFavourites(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
    );
  }

  function restoreRecent(id) {
    if (id.startsWith('custom:')) {
      const value = id.slice(7);
      setCustomService(value);
      setActiveSearch(value);
      setDestination(value);
      return;
    }

    const item = CATEGORIES.find(c => c[0] === id);
    if (!item) return;
    setCategory(id);
    setCustomService('');
    setActiveSearch(item[3]);
    setDestination(item[3]);
  }

  const externalSearchUrl = locationReady
    ? googleSearch(searchQuery || location)
    : '';

  const directionsUrl = locationReady && searchReady
    ? googleDirections(
        location,
        destination.trim()
          ? `${destination.trim()} near ${location}`
          : searchQuery,
        travelMode
      )
    : '';

  return (
    <div className="jny-page">
      <section className="jny-hero">
        <div className="container">
          <span className="jny-kicker">
            <i className="fa-solid fa-location-dot" />
            {' '}
            {t('জনসেবা স্মার্ট লোকেশন', 'JONOSEBA SMART LOCATION')}
          </span>
          <h1>{t(
            'নিকটস্থ প্রয়োজনীয় সেবা',
            'Nearby Essential Services'
          )}</h1>
          <p>{t(
            'সহজে আপনার অবস্থান নির্বাচন করুন, প্রয়োজনীয় সেবা খুঁজুন এবং Google Maps-এ দেখুন।',
            'Choose your location, find essential services and explore Google Maps in a few simple steps.'
          )}</p>
        </div>
      </section>

      <main className="container jny-content">
        <div className="jny-progress" aria-label="Search steps">
          {[
            [1, t('অবস্থান', 'Your Location')],
            [2, t('সেবা নির্বাচন', 'Choose Service')],
            [3, t('ম্যাপ ও রাস্তা', 'Map & Directions')]
          ].map(([n, label]) => (
            <div className={`jny-progress-item ${
              (n === 1 ||
               (n === 2 && locationReady) ||
               (n === 3 && searchReady))
                ? 'done'
                : ''
            }`} key={n}>
              <span>{n}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>

        <section className="jny-card" id="jny-location">
          <div className="jny-step-title">
            <span className="jny-step-number">1</span>
            <div>
              <h2>{t(
                'আপনি কোথায় আছেন?',
                'Where are you?'
              )}</h2>
              <p>{t(
                'বর্তমান অবস্থান নিন অথবা নিজের এলাকা লিখুন।',
                'Use your current location or enter your area.'
              )}</p>
            </div>
          </div>

          <div className="jny-location-options">
            <button
              className={`jny-location-option ${
                method === 'gps' ? 'selected' : ''
              }`}
              onClick={useGPS}
              disabled={locating}
            >
              <i className={`fa-solid ${
                locating
                  ? 'fa-spinner fa-spin'
                  : 'fa-location-crosshairs'
              }`} />
              <span>
                <strong>{locating
                  ? t('খোঁজা হচ্ছে...', 'Locating...')
                  : t('আমার বর্তমান অবস্থান', 'Use My Current Location')}</strong>
                <small>{t(
                  'GPS দিয়ে অবস্থান নির্ধারণ',
                  'Find your position using GPS'
                )}</small>
              </span>
            </button>

            <button
              className={`jny-location-option ${
                method === 'manual' ? 'selected' : ''
              }`}
              onClick={() => {
                setMethod('manual');
                setMessage('');
              }}
            >
              <i className="fa-solid fa-keyboard" />
              <span>
                <strong>{t(
                  'নিজে এলাকার নাম লিখুন',
                  'Enter Area Manually'
                )}</strong>
                <small>{t(
                  'এলাকা বা ঠিকানা লিখে শুরু করুন',
                  'Type your area or address'
                )}</small>
              </span>
            </button>
          </div>

          {method === 'manual' && (
            <div className="jny-manual-form">
              <label htmlFor="jny-area">
                {t('এলাকা বা ঠিকানা', 'Your Area or Address')}
              </label>
              <div>
                <input
                  id="jny-area"
                  value={areaInput}
                  onChange={e => setAreaInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') useManual();
                  }}
                  placeholder={t(
                    'যেমন: মিরপুর ১০, ঢাকা',
                    'e.g. Mirpur 10, Dhaka'
                  )}
                />
                <button onClick={useManual}>
                  {t('অবস্থান নির্বাচন', 'Set Location')}
                </button>
              </div>
            </div>
          )}

          {locationReady && (
            <div className="jny-success">
              <i className="fa-solid fa-circle-check" />
              <span>
                <strong>{t(
                  'আপনার অবস্থান নির্বাচিত',
                  'Location selected'
                )}</strong>
                <small>{locationLabel}</small>
                {accuracy !== null && (
                  <small>
                    {t('GPS নির্ভুলতা (আনুমানিক)', 'Estimated GPS accuracy')}:
                    {' ±'}{Math.round(accuracy)} m
                  </small>
                )}
              </span>
            </div>
          )}

          {message && (
            <div className="jny-message" role="alert">
              {message}
            </div>
          )}
        </section>

        <section className={`jny-card ${
          !locationReady ? 'jny-muted-step' : ''
        }`} id="jny-services">
          <div className="jny-step-title">
            <span className="jny-step-number">2</span>
            <div>
              <h2>{t(
                'আপনি কী খুঁজছেন?',
                'What do you need?'
              )}</h2>
              <p>{t(
                'সেবার ধরন নির্বাচন করে নিচের button চাপুন।',
                'Select a service and press the button below.'
              )}</p>
            </div>
          </div>

          <div className="jny-services">
            {CATEGORIES.map(item => (
              <button
                key={item[0]}
                className={`jny-service ${
                  category === item[0] && !customService
                    ? 'selected'
                    : ''
                }`}
                onClick={() => chooseCategory(item)}
              >
                <i className={`fa-solid ${item[4]}`} />
                <span>{labelFor(item)}</span>
                {favourites.includes(item[0]) && (
                  <i className="fa-solid fa-star jny-fav-mark" />
                )}
              </button>
            ))}
          </div>

          <div className="jny-custom-search">
            <label htmlFor="jny-service-other">
              {t(
                'অন্য কোনো জায়গা খুঁজতে চান?',
                'Looking for something else?'
              )}
            </label>
            <input
              id="jny-service-other"
              value={customService}
              onChange={e => setCustomService(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') showNearby();
              }}
              placeholder={t(
                'যেমন: ডায়াগনস্টিক সেন্টার',
                'e.g. Diagnostic centre'
              )}
            />
          </div>

          <button
            className="jny-primary-action"
            onClick={showNearby}
            disabled={!locationReady}
          >
            <i className="fa-solid fa-magnifying-glass-location" />
            {t('কাছাকাছি জায়গা দেখুন', 'Show Nearby Places')}
            <i className="fa-solid fa-arrow-right" />
          </button>

          {!locationReady && (
            <p className="jny-helper">
              {t(
                'সার্চ করতে আগে Step 1-এ আপনার অবস্থান নির্বাচন করুন।',
                'Select your location in Step 1 to enable search.'
              )}
            </p>
          )}
        </section>

        <section className="jny-card jny-map-section" id="jny-map">
          <div className="jny-step-title">
            <span className="jny-step-number">3</span>
            <div>
              <h2>{t(
                'ম্যাপে দেখুন ও রাস্তা খুঁজুন',
                'Explore Map & Directions'
              )}</h2>
              <p>{t(
                'আপনার নির্বাচিত এলাকার Google Map এখানে দেখাবে।',
                'Your selected area appears on the map below.'
              )}</p>
            </div>
          </div>

          {locationReady ? (
            <>
              <div className="jny-map-heading">
                <div>
                  <strong>{searchReady
                    ? t('কাছাকাছি সেবা', 'Nearby Services')
                    : t('আপনার অবস্থান', 'Your Location')}</strong>
                  <span>{searchReady
                    ? searchQuery
                    : locationLabel}</span>
                </div>

                <button
                  className="jny-map-expand"
                  onClick={() => setExpanded(v => !v)}
                >
                  <i className="fa-solid fa-expand" />
                  {expanded
                    ? t('ছোট করুন', 'Collapse')
                    : t('বড় করুন', 'Expand')}
                </button>
              </div>

              <div className={`jny-map-frame ${
                expanded ? 'expanded' : ''
              }`}>
                <iframe
                  key={mapUrl}
                  title={t('গুগল ম্যাপ', 'Google Map')}
                  src={mapUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div className="jny-map-bottom">
                <span>
                  <i className="fa-solid fa-circle-info" />
                  {' '}
                  {t(
                    'এখানে map দেখা যাবে; সম্পূর্ণ ফলাফল Google Maps-এ খুলবে।',
                    'View the map here; full search results open in Google Maps.'
                  )}
                </span>

                {searchReady && (
                  <a
                    href={externalSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="jny-secondary-link"
                  >
                    {t('সব জায়গা দেখুন', 'View All Places')}
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>
                )}
              </div>

              {searchReady && (
                <div className="jny-directions">
                  <div>
                    <h3>
                      <i className="fa-solid fa-route" />
                      {' '}
                      {t('সেখানে কীভাবে যাবেন?', 'How to Get There')}
                    </h3>
                    <p>{t(
                      'যেখানে যেতে চান তার নাম লিখুন এবং যাতায়াতের মাধ্যম বেছে নিন।',
                      'Enter your destination and select how you will travel.'
                    )}</p>
                  </div>

                  <label htmlFor="jny-destination">
                    {t('গন্তব্যের নাম', 'Destination')}
                  </label>

                  <input
                    id="jny-destination"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder={t(
                      'যেমন: নির্দিষ্ট হাসপাতালের নাম',
                      'e.g. Name of a particular hospital'
                    )}
                  />

                  <div className="jny-travel">
                    {[
                      ['walking', 'হেঁটে', 'Walking', 'fa-person-walking'],
                      ['driving', 'গাড়িতে', 'Driving', 'fa-car'],
                      ['transit', 'গণপরিবহন', 'Transit', 'fa-bus']
                    ].map(([mode, nameBn, nameEn, icon]) => (
                      <button
                        key={mode}
                        className={
                          travelMode === mode ? 'selected' : ''
                        }
                        onClick={() => setTravelMode(mode)}
                      >
                        <i className={`fa-solid ${icon}`} />
                        {bn ? nameBn : nameEn}
                      </button>
                    ))}
                  </div>

                  <a
                    className="jny-primary-action jny-direction-action"
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fa-solid fa-diamond-turn-right" />
                    {t('Google Maps-এ রাস্তা দেখুন', 'Get Directions in Google Maps')}
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </a>

                  <p className="jny-helper">
                    {t(
                      'রাস্তা, দূরত্ব ও আনুমানিক সময় Google Maps-এ দেখাবে।',
                      'Google Maps will show the available routes, distance and estimated time.'
                    )}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="jny-map-placeholder">
              <i className="fa-solid fa-map-location-dot" />
              <strong>{t(
                'আপনার ম্যাপ এখানে দেখাবে',
                'Your Map Will Appear Here'
              )}</strong>
              <p>{t(
                'প্রথমে আপনার অবস্থান নির্বাচন করুন।',
                'Start by choosing your location.'
              )}</p>
            </div>
          )}
        </section>

        <details className="jny-card jny-extras">
          <summary>
            <span>
              <i className="fa-solid fa-clock-rotate-left" />
              {' '}
              {t('সাম্প্রতিক সার্চ ও পছন্দের সেবা', 'Recent Searches & Favourites')}
            </span>
            <i className="fa-solid fa-chevron-down" />
          </summary>

          <div className="jny-extras-grid">
            <div>
              <div className="jny-extra-heading">
                <h3>{t('সাম্প্রতিক সার্চ', 'Recent Searches')}</h3>
                <button onClick={() => setRecents([])}>
                  {t('মুছুন', 'Clear')}
                </button>
              </div>

              {recents.length === 0 && (
                <p className="jny-helper">
                  {t('কোনো সার্চ নেই।', 'No recent searches.')}
                </p>
              )}

              {recents.map(id => {
                const item = CATEGORIES.find(c => c[0] === id);
                const label = item
                  ? labelFor(item)
                  : id.startsWith('custom:')
                    ? id.slice(7)
                    : id;

                return (
                  <button
                    key={id}
                    className="jny-recent"
                    onClick={() => restoreRecent(id)}
                  >
                    <i className="fa-solid fa-clock-rotate-left" />
                    {label}
                  </button>
                );
              })}
            </div>

            <div>
              <h3>{t('পছন্দের সেবা', 'Favourite Services')}</h3>
              <p className="jny-helper">
                {t(
                  'তারায় ক্লিক করে পছন্দের সেবা সংরক্ষণ করুন।',
                  'Click a star to save your frequently used services.'
                )}
              </p>

              <div className="jny-favourites">
                {CATEGORIES.map(item => (
                  <button
                    key={item[0]}
                    className={
                      favourites.includes(item[0]) ? 'selected' : ''
                    }
                    onClick={() => toggleFavourite(item[0])}
                  >
                    <i className={`fa-${
                      favourites.includes(item[0])
                        ? 'solid' : 'regular'
                    } fa-star`} />
                    {labelFor(item)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </details>
      </main>
    </div>
  );
}
