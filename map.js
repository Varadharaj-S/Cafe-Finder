/* ─────────────────────────────
   BrewMap — map.js
   Leaflet map setup, icons, markers.
   ───────────────────────────── */

/* ── ICONS ── */
const cafeIcon = L.divIcon({
  html: `<div style="
    background:#e8c97c; width:28px; height:28px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.4)">☕</div>`,
  className: '', iconSize: [28, 28], iconAnchor: [14, 14]
});

const userIcon = L.divIcon({
  html: `<div style="
    background:#4ade80; width:16px; height:16px; border-radius:50%;
    border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  className: '', iconSize: [16, 16], iconAnchor: [8, 8]
});

/* ── INIT MAP ── */
function initMap(lat, lon) {
  // If map already exists just fly to new position
  if (state.map) {
    state.map.flyTo([lat, lon], 15, { duration: 1 });
    return;
  }

  state.map = L.map('map', { zoomControl: false }).setView([lat, lon], 15);

  // Tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(state.map);

  // Custom zoom position
  L.control.zoom({ position: 'topright' }).addTo(state.map);

  // Marker cluster group
  state.markers = L.markerClusterGroup({ showCoverageOnHover: false });
  state.map.addLayer(state.markers);

  // User position marker
  if (lat && lon) {
    state.userMarker = L.marker([lat, lon], { icon: userIcon })
      .addTo(state.map)
      .bindPopup('📍 You are here');
    state.userLat = lat;
    state.userLon = lon;
  }
}

/* ── FLY TO USER ── */
function flyToUser() {
  if (!state.userMarker) return showToast('📍 Location not available');
  state.map.flyTo([state.userLat, state.userLon], 16, { duration: 1 });
  state.userMarker.openPopup();
}

/* ── ADD CAFE MARKERS ── */
function addMarkers(cafes) {
  state.markers.clearLayers();

  cafes.forEach((cafe, i) => {
    const lat = cafe.lat || cafe.center?.lat;
    const lon = cafe.lon || cafe.center?.lon;
    if (!lat) return;

    const name = cafe.tags?.name || 'Cafe';

    const marker = L.marker([lat, lon], { icon: cafeIcon });

    marker.bindPopup(`
      <b style="font-family:'Syne',sans-serif">${name}</b><br>
      <small style="color:#9a9285">${cafe.tags?.['addr:street'] || ''}</small><br>
      <button
        onclick="showRoute(${lat},${lon},'${name.replace(/'/g, "\\'")}');
                 this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click()"
        style="margin-top:8px;padding:6px 14px;background:#e8c97c;border:none;
               border-radius:100px;cursor:pointer;font-size:12px;font-weight:700;color:#0d0d0d">
        🧭 Directions
      </button>
    `);

    // Highlight matching card on click
    marker.on('click', () => highlightCard(i));

    state.markers.addLayer(marker);
  });
}

/* ── HIGHLIGHT CARD ── */
function highlightCard(index) {
  document.querySelectorAll('.cafe-card').forEach(c => c.classList.remove('highlighted'));
  const cards = document.querySelectorAll('.cafe-card');
  if (cards[index]) {
    cards[index].classList.add('highlighted');
    cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
