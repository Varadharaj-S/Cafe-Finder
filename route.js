/* ─────────────────────────────
   BrewMap — route.js
   Opens Google Maps directions from
   user position to a cafe.
   ───────────────────────────── */

function showRoute(lat, lon, name) {
  if (!state.userLat) {
    showToast('📍 Location needed for routing');
    return;
  }

  const url = `https://www.google.com/maps/dir/${state.userLat},${state.userLon}/${lat},${lon}`;
  window.open(url, '_blank');
  showToast('🧭 Opening directions to ' + (name || 'cafe'));
}
