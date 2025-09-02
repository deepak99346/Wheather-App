// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;

if (process.env.OPENWEATHER_API_KEY) {
  console.log("✅ API key loaded");
} else {
  console.error("❌ API key NOT found");
}

// Optional: allow other origins (useful if frontend hosted separately during dev)
app.use(cors());


// Serve static frontend from /public
app.use(express.static(path.join(__dirname, 'public')));


// Simple in-memory cache (keyed by city name)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 2; // 2 minutes


app.get('/weather/:city', async (req, res) => {
try {
const city = req.params.city;
if (!city) return res.status(400).json({ error: 'City is required' });


const cacheKey = city.toLowerCase();
const now = Date.now();
if (cache.has(cacheKey)) {
const { ts, data } = cache.get(cacheKey);
if (now - ts < CACHE_TTL) return res.json({ source: 'cache', ...data });
cache.delete(cacheKey);
}

if (!OPENWEATHER_KEY) {
return res.status(500).json({ error: 'Server misconfigured: OPENWEATHER_API_KEY missing' });
}


const url = 'https://api.openweathermap.org/data/2.5/weather';
const params = { q: city, appid: OPENWEATHER_KEY, units: 'metric' };


const response = await axios.get(url, { params, timeout: 5000 });
const w = response.data;


// Simplify the payload for the frontend
const simplified = {
name: w.name,
country: w.sys && w.sys.country,
temp: w.main && w.main.temp,
feels_like: w.main && w.main.feels_like,
humidity: w.main && w.main.humidity,
wind: w.wind && w.wind.speed,
description: w.weather && w.weather[0] && w.weather[0].description,
icon: w.weather && w.weather[0] && w.weather[0].icon,
};


cache.set(cacheKey, { ts: now, data: simplified });
res.json({ source: 'api', ...simplified });
} catch (err) {
// Error handling
if (err.response) {
// Upstream (OpenWeather) returned non-2xx
const status = err.response.status;
if (status === 404) return res.status(404).json({ error: 'City not found' });
return res.status(status).json({ error: err.response.data?.message || 'Upstream error' });
} else if (err.code === 'ECONNABORTED') {
return res.status(504).json({ error: 'Upstream timeout' });
} else {
console.error('Unexpected server error:', err);
return res.status(500).json({ error: 'Internal server error' });
}
}
});


app.listen(PORT, () => {
console.log(`Server running: http://localhost:${PORT}`);
});