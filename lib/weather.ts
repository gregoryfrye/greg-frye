/**
 * Current conditions in Kingston, NY from Open-Meteo (free, no key). Fetched on the server and cached
 * for an hour; returns null on any failure so the page just leaves the weather out.
 */
const KINGSTON = { latitude: 41.93, longitude: -74.0 };

// WMO weather codes → one or two plain words.
function describe(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  return "Storms";
}

export async function getKingstonWeather(): Promise<{ temperature: number; conditions: string } | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${KINGSTON.latitude}&longitude=${KINGSTON.longitude}` +
      `&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FNew_York`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const data = await response.json();
    const { temperature_2m, weather_code } = data.current ?? {};
    if (typeof temperature_2m !== "number" || typeof weather_code !== "number") return null;
    return { temperature: Math.round(temperature_2m), conditions: describe(weather_code) };
  } catch {
    return null;
  }
}
