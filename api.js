/* ─────────────────────────────
   BrewMap — api.js
   Overpass API + Nominatim geocoding.
   ───────────────────────────── */

/* ── FETCH CAFES (Overpass) ── */
async function fetchCafes(lat, lon, radius = state.radius) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      way["amenity"="cafe"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query)
  });

  if (!res.ok) throw new Error('Overpass API error: ' + res.status);
  const data = await res.json();
  return data.elements || [];
}

/* ── LOAD CAFES (wrapper with loading state) ── */
async function loadCafes(lat, lon) {
  setLoading(true);
  renderSkeletons();

  const panel = document.getElementById('cafePanel');
  panel.classList.add('show');

  try {
    const cafes = await fetchCafes(lat, lon);
    state.cafes = cafes;
    setLoading(false);
    addMarkers(cafes);
    renderCafeList(applyFilter(cafes));
  } catch (err) {
    setLoading(false);
    document.getElementById('cafeList').innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text2)">
        ⚠️ Could not load cafes.<br>
        <button class="cafe-btn" style="margin-top:12px" onclick="loadCafes(state.userLat,state.userLon)">
          🔄 Try Again
        </button>
      </div>`;
    console.error('loadCafes error:', err);
  }
}

/* ── REVERSE GEOCODE (Nominatim) ── */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const d = await res.json();
    const label =
      d.address?.suburb       ||
      d.address?.city_district ||
      d.address?.city          ||
      'Your Location';
    setLocLabel(label);
  } catch {
    setLocLabel('Your Location');
  }
}

/* ── SEARCH AREA (Nominatim forward geocode) ── */
async function searchArea(area) {
  hideSuggestions();
  document.getElementById('searchInput').value = area;
  setLoading(true, 'Searching in ' + area + '…');

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(area + ', Chennai')}&format=json&limit=1`
    );
    const data = await res.json();

    if (!data[0]) {
      setLoading(false);
      showToast('Area not found, try another name');
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    state.userLat = lat;
    state.userLon = lon;

    // Move map
    if (!state.map) {
      initMap(lat, lon);
    } else {
      state.map.flyTo([lat, lon], 15, { duration: 1 });
    }

    // Move / create user marker
    if (!state.userMarker) {
      state.userMarker = L.marker([lat, lon], { icon: userIcon })
        .addTo(state.map)
        .bindPopup('📍 Searching here')
        .openPopup();
    } else {
      state.userMarker.setLatLng([lat, lon]);
    }

    setLocLabel(area);
    document.getElementById('fabGroup').style.display = 'flex';
    loadCafes(lat, lon);

  } catch {
    setLoading(false);
    showToast('Search failed. Check connection.');
  }
}
