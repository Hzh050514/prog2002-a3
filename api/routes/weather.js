/**
 * routes/weather.js
 * ---------------------------------------------------------------------------
 * PROG2002 - Assessment 3 (Part 6: External Weather API - optional extra)
 *
 * GET /api/weather?latitude=-33.87&longitude=151.21
 *
 * The backend talks to the free, registration-less Open-Meteo API and
 * translates the numeric `weather_code` values into the plain-English
 * descriptions listed in the assessment brief. Doing the call server-side
 * keeps the API key-free endpoint reusable by both websites and avoids any
 * CORS problem in the browser.
 */

const express = require('express');
const router = express.Router();

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

/** Numeric weather code -> human readable description (from the brief). */
const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear, partly cloudy, and overcast',
  2: 'Mainly clear, partly cloudy, and overcast',
  3: 'Mainly clear, partly cloudy, and overcast',
  45: 'Fog and depositing rime fog',
  48: 'Fog and depositing rime fog',
  51: 'Drizzle: Light, moderate, and dense',
  53: 'Drizzle: Light, moderate, and dense',
  55: 'Drizzle: Light, moderate, and dense',
  56: 'Freezing drizzle: Light and dense',
  57: 'Freezing drizzle: Light and dense',
  61: 'Rain: Light, moderate, and heavy',
  63: 'Rain: Light, moderate, and heavy',
  65: 'Rain: Light, moderate, and heavy',
  66: 'Freezing rain: Light and heavy',
  67: 'Freezing rain: Light and heavy',
  71: 'Snow fall: Light, moderate, and heavy',
  73: 'Snow fall: Light, moderate, and heavy',
  75: 'Snow fall: Light, moderate, and heavy',
  77: 'Snow grains',
  80: 'Rain showers: Light, moderate, and violent',
  81: 'Rain showers: Light, moderate, and violent',
  82: 'Rain showers: Light, moderate, and violent',
  85: 'Snow showers: Slight and heavy',
  86: 'Snow showers: Slight and heavy',
  95: 'Thunderstorm: Slight or moderate',
  96: 'Thunderstorm with slight and heavy hail',
  99: 'Thunderstorm with slight and heavy hail',
};

/** Turn a numeric weather code into text. */
function describe(code) {
  return WEATHER_CODES[Number(code)] || 'Unknown weather condition';
}

router.get('/', async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({ error: 'Both latitude and longitude are required.' });
  }

  const url =
    `${OPEN_METEO_URL}?latitude=${latitude}&longitude=${longitude}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
    '&forecast_days=7&timezone=auto';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'The weather service returned an error.' });
    }

    const data = await response.json();
    const daily = data.daily || {};

    const forecast = (daily.time || []).map((date, index) => ({
      date,
      weather_code: daily.weather_code?.[index],
      description: describe(daily.weather_code?.[index]),
      temperature_max: daily.temperature_2m_max?.[index],
      temperature_min: daily.temperature_2m_min?.[index],
    }));

    res.json({
      latitude,
      longitude,
      timezone: data.timezone,
      forecast,
    });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach the weather service.' });
  }
});

module.exports = router;
