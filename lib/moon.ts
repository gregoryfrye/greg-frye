/**
 * Pure, server-side moon phase + zodiac sign calculation. No client JS,
 * no external API — synodic month math for phase, a low-precision Meeus
 * lunar-longitude series for the zodiac sign. Both are accurate to well
 * under a degree/day, far more precision than a footer credit needs.
 */

const SYNODIC_MONTH_DAYS = 29.530588853;
// A known new moon, used as the epoch for phase-age calculation.
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

function moonPhaseName(date: Date): string {
  const daysSinceEpoch = (date.getTime() - KNOWN_NEW_MOON_MS) / 86400000;
  const age = ((daysSinceEpoch % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const index = Math.round((age / SYNODIC_MONTH_DAYS) * 8) % 8;
  return PHASE_NAMES[index];
}

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Moon's apparent ecliptic longitude in degrees (Meeus, low-precision truncated series). */
function moonEclipticLongitude(date: Date): number {
  const julianDay = date.getTime() / 86400000 + 2440587.5;
  const T = (julianDay - 2451545.0) / 36525;

  const meanLongitude = normalizeDegrees(218.3164591 + 481267.88134236 * T);
  const elongation = normalizeDegrees(297.8502042 + 445267.1115168 * T);
  const sunAnomaly = normalizeDegrees(357.5291092 + 35999.0502909 * T);
  const moonAnomaly = normalizeDegrees(134.9634114 + 477198.8676313 * T);
  const argOfLatitude = normalizeDegrees(93.2720993 + 483202.0175273 * T);

  const rad = toRadians;
  const correction =
    6.28875 * Math.sin(rad(moonAnomaly)) +
    1.274018 * Math.sin(rad(2 * elongation - moonAnomaly)) +
    0.658309 * Math.sin(rad(2 * elongation)) +
    0.213616 * Math.sin(rad(2 * moonAnomaly)) -
    0.185596 * Math.sin(rad(sunAnomaly)) -
    0.114336 * Math.sin(rad(2 * argOfLatitude)) +
    0.058793 * Math.sin(rad(2 * elongation - 2 * moonAnomaly)) +
    0.057212 * Math.sin(rad(2 * elongation - sunAnomaly - moonAnomaly)) +
    0.05332 * Math.sin(rad(2 * elongation + moonAnomaly)) +
    0.045874 * Math.sin(rad(2 * elongation - sunAnomaly)) +
    0.041024 * Math.sin(rad(sunAnomaly - moonAnomaly)) -
    0.034718 * Math.sin(rad(elongation)) -
    0.030465 * Math.sin(rad(sunAnomaly + moonAnomaly));

  return normalizeDegrees(meanLongitude + correction);
}

function moonZodiacSign(date: Date): string {
  const index = Math.floor(moonEclipticLongitude(date) / 30) % 12;
  return ZODIAC_SIGNS[index];
}

/** e.g. "Full Moon" */
export function getMoonPhaseName(date: Date = new Date()): string {
  return moonPhaseName(date);
}

/** e.g. "Full Moon in Aquarius ☾" */
export function getMoonPhaseLabel(date: Date = new Date()): string {
  return `${moonPhaseName(date)} in ${moonZodiacSign(date)} ☾`;
}
