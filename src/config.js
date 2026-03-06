export const CESIUM_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MGM0NDlkYy04MzgzLTRhZDAtYmRjNi0yMTJkMTI4YTkzZGMiLCJpZCI6Mzk5MTQ5LCJpYXQiOjE3NzI3ODk1MzV9.j3SYDY3JuilpF0YtAnFncuC7ybvwk_LvC9bIeyL9xog'; // ← PASTE YOUR TOKEN

// Locations
export const LOCATIONS = {
  // Threat launch sites
  PYONGYANG:  { lon: 125.7625, lat: 39.0392,  alt: 0,    label: 'Pyongyang' },
  TEHRAN:     { lon: 51.3890,  lat: 35.6892,  alt: 0,    label: 'Tehran' },
  GULF_SHIP:  { lon: 56.0,     lat: 24.0,     alt: 0,    label: 'Gulf Launch Point' },

  // Defense battery sites
  SEOUL:      { lon: 127.0,    lat: 37.5,     alt: 0,    label: 'Seoul THAAD' },
  RIYADH:     { lon: 46.6753,  lat: 24.6877,  alt: 0,    label: 'Riyadh S-400' },
  TEL_AVIV:   { lon: 34.7818,  lat: 32.0853,  alt: 0,    label: 'Tel Aviv Iron Dome' },

  // India / Pakistan
  LAHORE:     { lon: 74.3436,  lat: 31.5497,  alt: 0,    label: 'Lahore' },
  ISLAMABAD:  { lon: 73.0479,  lat: 33.6844,  alt: 0,    label: 'Islamabad' },
  AMRITSAR:   { lon: 74.8723,  lat: 31.6340,  alt: 0,    label: 'Amritsar' },
  NEW_DELHI:  { lon: 77.2090,  lat: 28.6139,  alt: 0,    label: 'New Delhi' },
};

// Simulation parameters
export const SIM = {
  MISSILE_SPEED_MS:      6000,    // m/s — threat missile (~Mach 18, +50%)
  INTERCEPTOR_SPEED_MS:  7500,    // m/s — interceptor (faster than threat)
  MAX_APOGEE_KM:         300,     // km — max arc height
  RADAR_RANGE_KM:        200,     // km — radar detection radius
  RADAR_DETECTION_DELAY: 1.5,     // seconds after launch before radar triggers
  HIT_PROBABILITY:       0.70,    // 70% chance of successful intercept
  INTERCEPT_RADIUS_M:    25000,   // meters — proximity to count as intercept
  MISS_RETRY_DELAY:      0.75,     // seconds before second interceptor launches
  TICK_RATE_MS:          50,      // simulation update interval ms
  TRAIL_LENGTH:          60,      // number of trail positions to keep
};

export const SCENARIOS = [
  { threat: 'PYONGYANG',  defense: 'SEOUL',    label: 'North Korea → Seoul' },
  { threat: 'TEHRAN',     defense: 'RIYADH',   label: 'Iran → Saudi Arabia' },
  { threat: 'GULF_SHIP',  defense: 'TEL_AVIV', label: 'Gulf → Tel Aviv' },
];

export const REGIONS = {
  NK_SK: {
    label: 'N. Korea / S. Korea',
    camera: { lon: 127.5, lat: 37.5, alt: 2500000 },
    sideA: { name: 'North Korea', sites: ['PYONGYANG'] },
    sideB: { name: 'South Korea', sites: ['SEOUL'] },
  },
  IRAN_ISRAEL: {
    label: 'Iran / Israel',
    camera: { lon: 44.0, lat: 32.0, alt: 3500000 },
    sideA: { name: 'Iran / Gulf', sites: ['TEHRAN', 'GULF_SHIP'] },
    sideB: { name: 'Israel / KSA', sites: ['TEL_AVIV', 'RIYADH'] },
  },
  INDIA_PAKISTAN: {
    label: 'India / Pakistan',
    camera: { lon: 74.5, lat: 31.0, alt: 1800000 },
    sideA: { name: 'Pakistan', sites: ['LAHORE', 'ISLAMABAD'] },
    sideB: { name: 'India', sites: ['AMRITSAR', 'NEW_DELHI'] },
  },
};