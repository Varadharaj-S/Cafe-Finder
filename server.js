/* ─────────────────────────────
   BrewMap — server.js
   Express backend.
   Proxies Overpass API so browser
   doesn't hit CORS issues.

   Run:  node server.js
   ───────────────────────────── */

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('..')); // serve frontend files from parent folder

/* ── GET /cafes ── */
app.get('/cafes', async (req, res) => {
  const { lat, lon, radius = 2000 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon are required' });
  }

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      way["amenity"="cafe"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query)
    });

    if (!response.ok) throw new Error('Overpass error: ' + response.status);

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error('Overpass fetch failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch cafe data' });
  }
});

/* ── HEALTH CHECK ── */
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'BrewMap' }));

app.listen(PORT, () => {
  console.log(`☕ BrewMap server running at http://localhost:${PORT}`);
});
