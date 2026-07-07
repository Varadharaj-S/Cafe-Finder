/* ─────────────────────────────
   BrewMap — main.js
   App entry point.
   GPS, manual search, voice, offline detection.
   ───────────────────────────── */

/* ── SPLASH ACTIONS ── */

function requestGPS() {
  hideSplash();
  setLoading(true, 'Getting your location…');

  navigator.geolocation.getCurrentPosition(
    onLocationSuccess,
    onLocationError,
    { timeout: 10000, enableHighAccuracy: true }
  );
}

function showManualSearch() {
  hideSplash();
  document.getElementById('searchInput').focus();
  showToast('Type a Chennai area to search');
  // Default to Chennai city centre
  initMap(13.0827, 80.2707);
  setLocLabel('Chennai, TN');
}

function hideSplash() {
  const s = document.getElementById('splash');
  s.classList.add('hidden');
  setTimeout(() => s.style.display = 'none', 500);
}

/* ── LOCATION CALLBACKS ── */

function onLocationSuccess(pos) {
  setLoading(false);
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  state.userLat = lat;
  state.userLon = lon;

  initMap(lat, lon);
  reverseGeocode(lat, lon);
  loadCafes(lat, lon);

  document.getElementById('fabGroup').style.display = 'flex';

  // Keep tracking position
  navigator.geolocation.watchPosition(pos => {
    state.userLat = pos.coords.latitude;
    state.userLon = pos.coords.longitude;
    if (state.userMarker) {
      state.userMarker.setLatLng([state.userLat, state.userLon]);
    }
  });
}

function onLocationError() {
  setLoading(false);
  showToast('📍 Enable GPS or search an area');
  // Fall back to Chennai centre
  initMap(13.0827, 80.2707);
  setLocLabel('Chennai, TN');
  loadCafes(13.0827, 80.2707);
  document.getElementById('fabGroup').style.display = 'flex';
}

/* ── LOCATION CHIP ── */
document.getElementById('locChip').onclick = () => {
  if (state.userLat) flyToUser();
};

/* ── FAB ACTIONS ── */

function refreshCafes() {
  if (!state.userLat) return;
  showToast('🔄 Refreshing…');
  loadCafes(state.userLat, state.userLon);
}

function goNearest() {
  if (!state.cafes.length) return showToast('No cafes loaded yet');

  let minDist = Infinity;
  let nearest = null;

  state.cafes.forEach(cafe => {
    const lat = cafe.lat || cafe.center?.lat;
    const lon = cafe.lon || cafe.center?.lon;
    if (!lat) return;

    const d = Math.hypot(lat - state.userLat, lon - state.userLon);
    if (d < minDist) { minDist = d; nearest = cafe; }
  });

  if (!nearest) return;

  const lat  = nearest.lat  || nearest.center.lat;
  const lon  = nearest.lon  || nearest.center.lon;
  const name = nearest.tags?.name || 'Cafe';

  state.map.flyTo([lat, lon], 17, { duration: 1 });
  showToast('🎯 Nearest: ' + name);
}

/* ── SEARCH INPUT ── */
const CHENNAI_AREAS = [
  'T Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Nungambakkam',
  'Mylapore', 'Kilpauk', 'Ashok Nagar', 'Vadapalani', 'Porur',
  'Tambaram', 'Perambur', 'Vepery', 'Anna Salai', 'ECR', 'OMR',
  'Sholinganallur', 'Perungudi', 'Guindy', 'Kodambakkam',
  'Egmore', 'Chetpet', 'Royapettah', 'Besant Nagar', 'Thiruvanmiyur',
];

let searchDebounce;

document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchDebounce);
  const val = e.target.value.trim();
  showSuggestions(val);
  searchDebounce = setTimeout(() => filterByName(val), 300);
});

document.getElementById('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    hideSuggestions();
    const val = document.getElementById('searchInput').value.trim();
    if (val) searchArea(val);
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) hideSuggestions();
});

function showSuggestions(val) {
  const box = document.getElementById('suggestions');
  if (!val) { box.classList.remove('show'); return; }

  const matches = CHENNAI_AREAS
    .filter(a => a.toLowerCase().includes(val.toLowerCase()))
    .slice(0, 5);

  if (!matches.length) { box.classList.remove('show'); return; }

  box.innerHTML = matches
    .map(m => `<div class="suggestion-item" onclick="searchArea('${m}')">📍 ${m} <span>Chennai</span></div>`)
    .join('');

  box.classList.add('show');
}

function hideSuggestions() {
  document.getElementById('suggestions').classList.remove('show');
}

function filterByName(text) {
  if (!text) {
    renderCafeList(applyFilter(state.cafes));
    return;
  }
  const filtered = state.cafes.filter(c =>
    (c.tags?.name || '').toLowerCase().includes(text.toLowerCase())
  );
  renderCafeList(filtered);
}

/* ── VOICE SEARCH ── */
function setupVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  const voiceBtn = document.getElementById('voiceBtn');
  voiceBtn.classList.add('show');

  const rec = new SR();
  rec.lang = 'en-IN';
  rec.interimResults = false;

  rec.onresult = e => {
    const text = e.results[0][0].transcript;
    document.getElementById('searchInput').value = text;
    voiceBtn.classList.remove('listening');
    filterByName(text);
    showToast('🎤 "' + text + '"');
  };

  rec.onend  = () => voiceBtn.classList.remove('listening');
  rec.onerror = () => { voiceBtn.classList.remove('listening'); showToast('Voice error, try again'); };

  voiceBtn.onclick = () => {
    voiceBtn.classList.add('listening');
    rec.start();
  };
}

/* ── OFFLINE DETECTION ── */
window.addEventListener('offline', () => {
  document.getElementById('offlineBanner').classList.add('show');
});

window.addEventListener('online', () => {
  document.getElementById('offlineBanner').classList.remove('show');
  showToast('✅ Back online');
});

/* ── BOOT ── */
setupVoice();
