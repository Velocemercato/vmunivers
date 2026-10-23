(() => {
  const API = 'https://api.open-meteo.com/v1/forecast';
  const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
  // Codes météo WMO utilisés par Open-Meteo.
  const CODES = {0: ['☀️', 'Ciel dégagé'], 1: ['🌤️', 'Peu nuageux'], 2: ['⛅', 'Partiellement nuageux'], 3: ['☁️', 'Couvert'],
    45: ['🌫️', 'Brouillard'], 48: ['🌫️', 'Brouillard givrant'], 51: ['🌦️', 'Bruine légère'], 53: ['🌦️', 'Bruine'], 55: ['🌧️', 'Bruine forte'],
    56: ['🌧️', 'Bruine verglaçante'], 57: ['🌧️', 'Bruine verglaçante'], 61: ['🌦️', 'Pluie faible'], 63: ['🌧️', 'Pluie'], 65: ['🌧️', 'Forte pluie'],
    66: ['🌧️', 'Pluie verglaçante'], 67: ['🌧️', 'Pluie verglaçante'], 71: ['🌨️', 'Neige faible'], 73: ['🌨️', 'Neige'], 75: ['❄️', 'Forte neige'],
    77: ['🌨️', 'Grains de neige'], 80: ['🌦️', 'Averses'], 81: ['🌧️', 'Averses'], 82: ['⛈️', 'Fortes averses'], 85: ['🌨️', 'Averses de neige'],
    86: ['❄️', 'Fortes averses de neige'], 95: ['⛈️', 'Orage'], 96: ['⛈️', 'Orage et grêle'], 99: ['⛈️', 'Orage et forte grêle']};
  const code = value => CODES[value] || ['🌡️', 'Conditions inconnues'];
  const $ = id => document.getElementById(id);
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const deg = value => `${Math.round(value)}°`;
  const day = iso => new Date(iso + 'T12:00').toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric'});

  async function forecast(points, extra) {
    const params = new URLSearchParams({
      latitude: points.map(p => p[1]).join(','), longitude: points.map(p => p[2]).join(','),
      current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto', forecast_days: extra ? '7' : '1', wind_speed_unit: 'kmh'});
    if (extra) params.set('hourly', 'temperature_2m,weather_code,precipitation_probability');
    const response = await fetch(`${API}?${params}`);
    if (!response.ok) throw new Error(`Météo indisponible (${response.status})`);
    const data = await response.json();
    // Une seule position renvoie un objet, plusieurs renvoient une liste.
    return Array.isArray(data) ? data : [data];
  }

  // Tableaux France / Europe / Monde.
  const tabs = [...document.querySelectorAll('[data-zone]')];
  let zoneRequest = 0;
  async function zone(name) {
    tabs.forEach(tab => tab.setAttribute('aria-selected', String(tab.dataset.zone === name)));
    const grid = $('villes');
    const request = ++zoneRequest;
    grid.setAttribute('aria-busy', 'true');
    grid.innerHTML = '<p class="msg">Chargement de la météo…</p>';
    const cities = window.VM_VILLES[name];
    try {
      const results = await forecast(cities, false);
      if (request !== zoneRequest) return;
      grid.innerHTML = results.map((r, i) => {
        const [icon, label] = code(r.current.weather_code);
        return `<button type="button" class="ville" data-i="${i}"><b>${esc(cities[i][0])}</b><span class="ico" role="img" aria-label="${label}">${icon}</span><strong>${deg(r.current.temperature_2m)}</strong><small>${deg(r.daily.temperature_2m_min[0])} / ${deg(r.daily.temperature_2m_max[0])}</small></button>`;
      }).join('');
      grid.querySelectorAll('.ville').forEach(button => button.onclick = () => detail(cities[button.dataset.i]));
    } catch (error) {
      if (request === zoneRequest) grid.innerHTML = `<p class="msg err">${esc(error.message)}. Réessaie dans un instant.</p>`;
    } finally {
      if (request === zoneRequest) grid.removeAttribute('aria-busy');
    }
  }
  tabs.forEach(tab => tab.onclick = () => zone(tab.dataset.zone));

  // Prévisions détaillées d'un lieu.
  async function detail(point, sub) {
    const box = $('detail');
    box.hidden = false;
    box.innerHTML = `<p class="msg">Prévisions pour ${esc(point[0])}…</p>`;
    box.scrollIntoView({behavior: 'smooth', block: 'start'});
    try {
      const [r] = await forecast([point], true);
      const [icon, label] = code(r.current.weather_code);
      const now = r.current.time.slice(0, 13);
      const start = Math.max(0, r.hourly.time.findIndex(t => t.slice(0, 13) >= now));
      const hours = r.hourly.time.slice(start, start + 24).map((t, k) => {
        const i = start + k;
        return `<li><small>${t.slice(11, 13)} h</small><span>${code(r.hourly.weather_code[i])[0]}</span><b>${deg(r.hourly.temperature_2m[i])}</b><small>💧${r.hourly.precipitation_probability[i] ?? 0}%</small></li>`;
      }).join('');
      const days = r.daily.time.map((t, i) => `<li><span>${day(t)}</span><span>${code(r.daily.weather_code[i])[0]}</span><span>${deg(r.daily.temperature_2m_min[i])} / <b>${deg(r.daily.temperature_2m_max[i])}</b></span><small>💧${r.daily.precipitation_probability_max[i] ?? 0}%</small></li>`).join('');
      box.innerHTML = `<div class="now"><div><h2>${esc(point[0])}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}<p class="big"><span role="img" aria-label="${label}">${icon}</span> ${deg(r.current.temperature_2m)}</p><p>${label} · ressenti ${deg(r.current.apparent_temperature)}</p><p class="sub">💨 ${Math.round(r.current.wind_speed_10m)} km/h · 💧 humidité ${r.current.relative_humidity_2m}% · relevé à ${r.current.time.slice(11, 16)} (heure locale)</p></div>
        <div class="links">${maps(point[0] + (sub ? ' ' + sub : ''), point[1], point[2])}</div></div>
        <h3>Prochaines 24 heures</h3><ul class="hours">${hours}</ul><h3>7 jours</h3><ul class="days">${days}</ul>`;
    } catch (error) {
      box.innerHTML = `<p class="msg err">${esc(error.message)}. Réessaie dans un instant.</p>`;
    }
  }

  function maps(name, lat, lon) {
    const q = encodeURIComponent(name);
    return `<a href="https://fr.mappy.com/plan#/${q}" target="_blank" rel="noopener">🗺️ Mappy</a>`
      + `<a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener">🚗 Itinéraire</a>`
      + `<a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}" target="_blank" rel="noopener">📍 Carte</a>`;
  }

  // Recherche de ville.
  $('cherche').onsubmit = async event => {
    event.preventDefault();
    const name = $('ville').value.trim();
    const list = $('choix');
    if (!name) return;
    list.innerHTML = '<li class="msg">Recherche…</li>';
    try {
      const response = await fetch(`${GEO}?${new URLSearchParams({name, count: '6', language: 'fr', format: 'json'})}`);
      if (!response.ok) throw new Error('Recherche indisponible');
      const results = (await response.json()).results || [];
      if (!results.length) { list.innerHTML = '<li class="msg">Aucune ville trouvée. Vérifie l’orthographe.</li>'; return; }
      list.innerHTML = results.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.name)} <small>${esc([r.admin1, r.country].filter(Boolean).join(', '))}</small></button></li>`).join('');
      list.querySelectorAll('button').forEach(button => button.onclick = () => {
        const r = results[button.dataset.i];
        list.innerHTML = '';
        detail([r.name, r.latitude, r.longitude], [r.admin1, r.country].filter(Boolean).join(', '));
      });
    } catch (error) {
      list.innerHTML = `<li class="msg err">${esc(error.message)}.</li>`;
    }
  };
  $('position').onclick = () => {
    if (!navigator.geolocation) { $('choix').innerHTML = '<li class="msg err">Localisation non disponible sur cet appareil.</li>'; return; }
    navigator.geolocation.getCurrentPosition(
      p => detail(['Ma position', +p.coords.latitude.toFixed(4), +p.coords.longitude.toFixed(4)]),
      () => { $('choix').innerHTML = '<li class="msg err">Localisation refusée. Cherche ta ville par son nom.</li>'; },
      {timeout: 10000, maximumAge: 600000});
  };

  // Lieux à visiter.
  const regions = window.VM_LIEUX;
  const select = $('region');
  select.innerHTML = regions.map((r, i) => `<option value="${i}">${esc(r.region)} (${r.lieux.length})</option>`).join('');
  const cats = $('cats');
  let cat = '';
  let lieuxRequest = 0;
  async function lieux() {
    const region = regions[select.value];
    const all = [...new Set(region.lieux.map(l => l[4]))];
    if (cat && !all.includes(cat)) cat = '';
    cats.innerHTML = ['', ...all].map(c => `<button type="button" data-c="${esc(c)}" aria-pressed="${c === cat}">${c ? esc(c) : 'Tout'}</button>`).join('');
    cats.querySelectorAll('button').forEach(button => button.onclick = () => { cat = button.dataset.c; lieux(); });
    const shown = region.lieux.filter(l => !cat || l[4] === cat);
    const list = $('lieux');
    list.innerHTML = shown.map((l, i) => `<article class="lieu"><p class="tag">${esc(l[4])}</p><h3>${esc(l[0])}</h3><p class="where">📍 ${esc(l[1])}</p><p>${esc(l[5])}</p>
      <p class="wx" data-i="${i}">Météo…</p><div class="links"><button type="button" data-i="${i}">🌦️ Prévisions</button>${maps(l[0] + ' ' + l[1], l[2], l[3])}</div></article>`).join('');
    list.querySelectorAll('button[data-i]').forEach(button => button.onclick = () => {
      const l = shown[button.dataset.i];
      detail([l[0], l[2], l[3]], l[1]);
    });
    const request = ++lieuxRequest;
    try {
      const results = await forecast(shown.map(l => [l[0], l[2], l[3]]), false);
      if (request !== lieuxRequest) return;
      results.forEach((r, i) => {
        const [icon, label] = code(r.current.weather_code);
        list.querySelector(`.wx[data-i="${i}"]`).textContent = `${icon} ${deg(r.current.temperature_2m)} · ${label} · ${deg(r.daily.temperature_2m_min[0])} / ${deg(r.daily.temperature_2m_max[0])}`;
      });
    } catch (_) {
      if (request === lieuxRequest) list.querySelectorAll('.wx').forEach(p => p.textContent = 'Météo momentanément indisponible');
    }
  }
  select.onchange = () => { cat = ''; lieux(); };

  const today = new Date();
  $('date').textContent = today.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
  zone('france');
  lieux();
})();
