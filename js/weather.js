// ==========================================================================
// TripSync — Weather helper
// Calls OpenWeatherMap directly from the browser. Unlike the Gemini key,
// this one is safe to keep client-side: OpenWeatherMap's free tier is
// low-risk to expose (rate-limited, not billable) and this pattern is
// standard for simple weather widgets.
// ==========================================================================

const OPENWEATHER_API_KEY = "c70b13e3dfad8cce4d1f841518f8fabf";

async function getWeather(cityName) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&appid=${OPENWEATHER_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather lookup failed for "${cityName}"`);
  }

  const data = await response.json();

  return {
    tempC: Math.round(data.main.temp),
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: data.weather[0].icon
  };
}