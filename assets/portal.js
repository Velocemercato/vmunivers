(() => {
  const search = document.getElementById('q');
  const root = document.getElementById('apps');
  const items = [...root.querySelectorAll('.ap')];
  const groups = [...root.querySelectorAll('.grp')];
  const initialOpen = new Map(groups.map(group => [group, group.open]));
  const count = document.getElementById('projectCount');
  const feature = root.querySelector('.feat');
  const themeSelect = document.getElementById('themeSelect');
  const reset = document.getElementById('resetFilters');
  const toggle = document.getElementById('toggleGroups');
  const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const knownThemes = new Set(groups.map(group => group.dataset.theme));
  const params = new URLSearchParams(location.search);
  let theme = knownThemes.has(params.get('theme')) ? params.get('theme') : '';
  search.value = params.get('q') || '';
  [...themeSelect.options].forEach(option => {
    const total = option.value ? items.filter(item => item.closest('.grp').dataset.theme === option.value).length : items.length;
    option.textContent = `${option.dataset.label} (${total})`;
  });
  function syncToggle() {
    const visible = groups.filter(group => !group.hidden);
    const open = visible.some(group => group.open);
    toggle.textContent = open ? 'Tout replier' : 'Tout afficher';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.hidden = !visible.length;
  }
  function filter(updateURL = false) {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    const active = !!(words.length || theme);
    items.forEach(item => {
      const text = normalize(`${item.dataset.k || ''} ${item.textContent}`);
      const sameTheme = !theme || item.closest('.grp').dataset.theme === theme;
      item.hidden = !sameTheme || !words.every(word => text.includes(word));
    });
    groups.forEach(group => {
      const visible = group.querySelectorAll('.ap:not([hidden])').length;
      group.hidden = !visible;
      group.querySelector('[data-group-count]').textContent = String(visible);
      group.open = active ? visible > 0 : initialOpen.get(group);
    });
    themeSelect.value = theme;
    root.classList.toggle('is-filtered', active);
    const visible = items.filter(item => !item.hidden).length;
    count.textContent = `${visible} projet${visible > 1 ? 's' : ''}${active ? ' trouvé' + (visible > 1 ? 's' : '') : ' à découvrir'}`;
    document.getElementById('none').hidden = visible > 0;
    feature.hidden = active;
    reset.hidden = !active;
    syncToggle();
    if (updateURL) {
      const url = new URL(location.href);
      if (theme) url.searchParams.set('theme', theme); else url.searchParams.delete('theme');
      if (search.value.trim()) url.searchParams.set('q', search.value.trim()); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
  }
  function showResults() {
    document.getElementById('projets').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
  }
  search.addEventListener('input', () => filter(true));
  search.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search.blur(); showResults(); } });
  themeSelect.addEventListener('change', () => { theme = themeSelect.value; filter(true); showResults(); });
  reset.addEventListener('click', () => { search.value = ''; theme = ''; filter(true); search.focus(); });
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (!search.value.trim() && !theme) initialOpen.set(group, group.open);
    syncToggle();
  }));
  toggle.addEventListener('click', () => {
    const open = !groups.some(group => !group.hidden && group.open);
    groups.filter(group => !group.hidden).forEach(group => {
      group.open = open;
      if (!search.value.trim() && !theme) initialOpen.set(group, open);
    });
    syncToggle();
  });
  document.querySelectorAll('.portal-links a[href^="#"], .hub-actions a[href="#projets"]').forEach(link => link.addEventListener('click', () => {
    const group = groups.find(group => '#' + group.id === link.getAttribute('href'));
    if (group) { search.value = ''; theme = group.dataset.theme; filter(true); group.open = true; }
    else if (link.getAttribute('href') === '#projets') { search.value = ''; theme = ''; filter(true); }
  }));
  const buttons = [document.getElementById('vBig'), document.getElementById('vGrid')];
  function view(mode) {
    mode = mode === 'grid4' ? 'grid4' : 'big';
    root.querySelectorAll('.gapps').forEach(grid => grid.className = `apps gapps ${mode}`);
    buttons.forEach((button, index) => {
      const active = mode === (index ? 'grid4' : 'big');
      button.classList.toggle('on', active);
      button.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('vm-hub-vue', mode); } catch (_) { /* Stockage facultatif. */ }
  }
  buttons[0].onclick = () => view('big');
  buttons[1].onclick = () => view('grid4');
  let mode = 'big';
  try { mode = localStorage.getItem('vm-hub-vue') || 'big'; } catch (_) { /* Vue par défaut. */ }
  view(mode);
  function revealSection() {
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let node = target;
    while (node) {
      if (node.tagName === 'DETAILS') node.open = true;
      node = node.parentElement;
    }
    requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
  }
  addEventListener('hashchange', revealSection);
  revealSection();
  let hash = '';
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* URL mal formée. */ }
  const group = groups.find(item => item.id === `g-${hash}` || item.id === hash);
  if (group) { initialOpen.set(group, true); group.open = true; }
  else if (hash && !document.getElementById(hash)) search.value = hash;
  filter();
})();
