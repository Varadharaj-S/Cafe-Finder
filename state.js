/* ─────────────────────────────
   BrewMap — state.js
   Global app state object.
   All other files read/write this.
   ───────────────────────────── */

const state = {
  /* Map */
  map:        null,
  userMarker: null,
  userLat:    null,
  userLon:    null,
  markers:    null,   // MarkerClusterGroup

  /* Data */
  cafes:   [],
  saved:   JSON.parse(localStorage.getItem('brewmap_saved') || '[]'),

  /* UI */
  activeFilter:    'all',
  radius:          2000,
  panelCollapsed:  false,
  voiceEnabled:    true,
};
