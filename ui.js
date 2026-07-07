/* ─────────────────────────────
   BrewMap — ui.js
   Cafe card rendering, skeletons,
   filter chips, tabs, toast, saved view.
   ───────────────────────────── */

/* ── CAFE IMAGES (Unsplash) ── */
const CAFE_IMAGES = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=80&h=80&fit=crop',
];

/* ── "BEST FOR" TAG SETS ── */
const TAG_SETS = [
  ['📶 WiFi', '📚 Study', '💻 Work'],
  ['❤️ Date', '👨‍👩‍👧 Family'],
  ['💰 Budget', '🌿 Organic'],
  ['🎵 Live Music', '☕ Specialty'],
  ['📶 WiFi', '💻 Work', '💰 Budget'],
];

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── LOADING ── */
function setLoading(show, msg = 'Finding cafes nearby…') {
  const el = document.getElementById('loadingOverlay');
  document.getElementById('loadingText').textContent = msg;
  el.classList.toggle('show', show);
}

/* ── SKELETON CARDS ── */
function renderSkeletons(count = 4) {
  document.getElementById('cafeList').innerHTML =
    Array(count).fill(`
      <div class="skeleton-card">
        <div class="skel-img"></div>
        <div class="skel-lines">
          <div class="skel-line"></div>
          <div class="skel-line short"></div>
          <div class="skel-line shorter"></div>
        </div>
      </div>`).join('');
}

/* ── RENDER CAFE LIST ── */
function renderCafeList(cafes) {
  const list = document.getElementById('cafeList');
  document.getElementById('cafeCount').textContent = cafes.length + ' found';

  if (!cafes.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">☕</div>
        <div>No cafes found here</div>
        <div style="font-size:13px">Try expanding the radius</div>
      </div>`;
    return;
  }

  list.innerHTML = '';

  cafes.slice(0, 40).forEach((cafe, i) => {
    const lat  = cafe.lat  || cafe.center?.lat;
    const lon  = cafe.lon  || cafe.center?.lon;
    if (!lat) return;

    const name    = cafe.tags?.name || 'Unnamed Cafe';
    const dist    = state.userLat ? distKm(state.userLat, state.userLon, lat, lon) : null;
    const distStr = dist ? (dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km') : '';
    const rating  = (3.8 + (hashCode(name) % 13) / 10).toFixed(1);
    const isOpen  = (hashCode(name) % 3) !== 0;
    const img     = CAFE_IMAGES[i % CAFE_IMAGES.length];
    const tags    = TAG_SETS[i % TAG_SETS.length];
    const isSaved = state.saved.some(s => s.id === cafe.id);

    const card = document.createElement('div');
    card.className = 'cafe-card';
    card.setAttribute('data-id', cafe.id);
    card.style.animationDelay = (i * 0.045) + 's';

    card.innerHTML = `
      <img class="cafe-img" src="${img}" alt="${name}" loading="lazy">
      <div class="cafe-info">
        <div class="cafe-name">${name}</div>
        <div class="cafe-meta">
          <span class="cafe-rating">⭐ ${rating}</span>
          ${distStr ? `<span>📍 ${distStr}</span>` : ''}
          <span class="${isOpen ? 'cafe-status-open' : 'cafe-status-closed'}">
            ${isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
        </div>
        <div class="cafe-tags-row">
          ${tags.map(t => `<span class="cafe-tag">${t}</span>`).join('')}
        </div>
        <div class="cafe-actions">
          <button class="cafe-btn"
            onclick="showRoute(${lat},${lon},'${name.replace(/'/g, "\\'")}');event.stopPropagation()">
            🧭 Route
          </button>
          <button class="cafe-btn ${isSaved ? 'saved' : ''}" id="save-${cafe.id}"
            onclick="toggleSave(${JSON.stringify(cafe).replace(/"/g, '&quot;')});event.stopPropagation()">
            ${isSaved ? '❤️ Saved' : '♡ Save'}
          </button>
        </div>
      </div>`;

    card.onclick = () => state.map.flyTo([lat, lon], 17, { duration: 0.8 });
    list.appendChild(card);
  });
}

/* ── RENDER SAVED VIEW ── */
function renderSaved() {
  const list = document.getElementById('savedList');

  if (!state.saved.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">♡</div>
        <div>No saved cafes yet</div>
        <div style="font-size:13px">Tap ♡ on any cafe to save it</div>
      </div>`;
    return;
  }

  list.innerHTML = '';

  state.saved.forEach((cafe, i) => {
    const lat  = cafe.lat  || cafe.center?.lat;
    const lon  = cafe.lon  || cafe.center?.lon;
    const name = cafe.tags?.name || 'Unnamed Cafe';
    const img  = CAFE_IMAGES[i % CAFE_IMAGES.length];

    const card = document.createElement('div');
    card.className = 'cafe-card';
    card.innerHTML = `
      <img class="cafe-img" src="${img}" alt="${name}">
      <div class="cafe-info">
        <div class="cafe-name">${name}</div>
        <div class="cafe-meta">
          <span class="cafe-rating">⭐ ${(3.8 + (hashCode(name) % 13) / 10).toFixed(1)}</span>
        </div>
        <div class="cafe-actions">
          ${lat ? `
            <button class="cafe-btn"
              onclick="showRoute(${lat},${lon},'${name.replace(/'/g, "\\'")}');event.stopPropagation()">
              🧭 Route
            </button>` : ''}
          <button class="cafe-btn saved"
            onclick="toggleSave(${JSON.stringify(cafe).replace(/"/g, '&quot;')});event.stopPropagation()">
            ❤️ Saved
          </button>
        </div>
      </div>`;

    if (lat) card.onclick = () => { switchTab('home'); setTimeout(() => state.map.flyTo([lat, lon], 17), 300); };
    list.appendChild(card);
  });
}

/* ── SAVE / UNSAVE ── */
function toggleSave(cafe) {
  const idx = state.saved.findIndex(s => s.id === cafe.id);

  if (idx >= 0) {
    state.saved.splice(idx, 1);
    showToast('Removed from saved');
  } else {
    state.saved.push(cafe);
    showToast('❤️ Saved!');
  }

  localStorage.setItem('brewmap_saved', JSON.stringify(state.saved));

  const btn = document.getElementById('save-' + cafe.id);
  if (btn) {
    const nowSaved = idx < 0;
    btn.textContent = nowSaved ? '❤️ Saved' : '♡ Save';
    btn.classList.toggle('saved', nowSaved);
  }

  if (document.getElementById('savedView').classList.contains('show')) renderSaved();
}

/* ── TABS ── */
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.tab === tab));

  document.getElementById('savedView').classList.toggle('show', tab === 'saved');
  document.getElementById('settingsView').classList.toggle('show', tab === 'settings');
  document.getElementById('cafePanel').classList.toggle('show', tab === 'home' && state.cafes.length > 0);
  document.getElementById('map').classList.toggle('map-full', tab === 'map');

  if (tab === 'saved') renderSaved();
}

/* ── PANEL TOGGLE ── */
function togglePanel() {
  state.panelCollapsed = !state.panelCollapsed;
  document.getElementById('cafePanel').classList.toggle('collapsed', state.panelCollapsed);
}

/* ── FILTER CHIPS ── */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.activeFilter = chip.dataset.filter;
    renderCafeList(applyFilter(state.cafes));
  });
});

function applyFilter(cafes) {
  if (state.activeFilter === 'all') return cafes;
  if (state.activeFilter === 'open') {
    return cafes.filter(c => (hashCode(c.tags?.name || 'x') % 3) !== 0);
  }
  // More filters can be added here using real tags from the API
  return cafes;
}

/* ── RADIUS SLIDER ── */
document.getElementById('radiusSlider').addEventListener('input', e => {
  state.radius = parseInt(e.target.value);
  const km = (state.radius / 1000).toFixed(1).replace('.0', '');
  document.getElementById('radiusVal').textContent = km + ' km';
});

document.getElementById('radiusSlider').addEventListener('change', () => {
  if (state.userLat) loadCafes(state.userLat, state.userLon);
});

/* ── THEME ── */
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '☀️' : '🌙';
  document.getElementById('darkToggle').classList.toggle('on', !isDark);
}

/* ── VOICE TOGGLE ── */
function toggleVoice() {
  state.voiceEnabled = !state.voiceEnabled;
  document.getElementById('voiceToggle').classList.toggle('on', state.voiceEnabled);
  const vBtn = document.getElementById('voiceBtn');
  vBtn.style.display = state.voiceEnabled ? 'flex' : 'none';
  showToast(state.voiceEnabled ? '🎤 Voice on' : 'Voice off');
}

/* ── SET LOCATION LABEL ── */
function setLocLabel(text) {
  const el = document.getElementById('locLabel');
  el.textContent = text.length > 14 ? text.slice(0, 14) + '…' : text;
}

/* ── HELPERS ── */
function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
