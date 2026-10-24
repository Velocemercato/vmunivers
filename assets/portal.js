(() => {
  const search = document.getElementById('q');
  const root = document.getElementById('apps');
  const items = [...root.querySelectorAll('.ap')];
  const groups = [...root.querySelectorAll('.grp')];
  const initialOpen = new Map(groups.map(group => [group, group.open]));
  const count = document.getElementById('projectCount');
  const chips = [...document.querySelectorAll('#themeFilters [data-theme-filter]')];
  const reset = document.getElementById('resetFilters');
  const toggle = document.getElementById('toggleGroups');
  const normalize = text => String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const knownThemes = new Set(groups.map(group => group.dataset.theme));
  // Anciens thèmes et anciennes ancres (liens déjà partagés) : ils mènent au nouveau groupe.
  const THEME_ALIASES = {auto: 'local', achats: 'local'};
  const ID_ALIASES = {'g-auto': 'g-local', 'g-achats': 'g-local'};
  const themeOf = value => {
    value = THEME_ALIASES[value] || value;
    return knownThemes.has(value) ? value : '';
  };
  const themeOfItem = item => item.closest('.grp').dataset.theme;
  const params = new URLSearchParams(location.search);
  let theme = themeOf(params.get('theme'));
  search.value = params.get('q') || '';
  chips.forEach(chip => {
    const value = chip.dataset.themeFilter;
    const total = value ? items.filter(item => themeOfItem(item) === value).length : items.length;
    const badge = chip.querySelector('[data-chip-count]');
    if (badge) badge.textContent = String(total);
    chip.addEventListener('click', () => { theme = value; filter(true); });
  });
  function syncToggle() {
    const visible = groups.filter(group => !group.hidden);
    const allOpen = visible.length > 0 && visible.every(group => group.open);
    toggle.textContent = allOpen ? 'Tout replier' : 'Tout déplier';
    toggle.setAttribute('aria-expanded', String(allOpen));
    toggle.hidden = visible.length < 2;
  }
  function filter(updateURL = false) {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    const active = !!(words.length || theme);
    items.forEach(item => {
      const text = normalize(`${item.dataset.k || ''} ${item.textContent}`);
      const sameTheme = !theme || themeOfItem(item) === theme;
      item.hidden = !sameTheme || !words.every(word => text.includes(word));
    });
    groups.forEach(group => {
      const visible = group.querySelectorAll('.ap:not([hidden])').length;
      group.hidden = !visible;
      group.querySelector('[data-group-count]').textContent = String(visible);
      group.open = active ? visible > 0 : initialOpen.get(group);
    });
    chips.forEach(chip => {
      const on = chip.dataset.themeFilter === theme;
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', String(on));
    });
    root.classList.toggle('is-filtered', active);
    const visible = items.filter(item => !item.hidden).length;
    count.textContent = `${visible} projet${visible > 1 ? 's' : ''}${active ? ' trouvé' + (visible > 1 ? 's' : '') : ' à découvrir'}`;
    document.getElementById('none').hidden = visible > 0;
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
  reset.addEventListener('click', () => { search.value = ''; theme = ''; filter(true); search.focus(); });
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (!search.value.trim() && !theme) initialOpen.set(group, group.open);
    syncToggle();
  }));
  toggle.addEventListener('click', () => {
    const visible = groups.filter(group => !group.hidden);
    const open = !visible.every(group => group.open);
    visible.forEach(group => {
      group.open = open;
      if (!search.value.trim() && !theme) initialOpen.set(group, open);
    });
    syncToggle();
  });
  const groupFor = id => groups.find(group => group.id === (ID_ALIASES[id] || id));
  document.querySelectorAll('.portal-links a[href^="#"], .hub-actions a[href="#projets"]').forEach(link => link.addEventListener('click', () => {
    const href = link.getAttribute('href').slice(1);
    const group = groupFor(href);
    if (group) { search.value = ''; theme = group.dataset.theme; filter(true); group.open = true; }
    else if (href === 'projets') { search.value = ''; theme = ''; filter(true); }
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
  function currentHash() {
    try { return decodeURIComponent(location.hash.slice(1)); } catch (_) { return ''; }
  }
  function revealSection() {
    const id = currentHash();
    const target = document.getElementById(ID_ALIASES[id] || id);
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
  const hash = currentHash();
  const group = groupFor(hash) || groupFor(`g-${hash}`);
  if (group) { initialOpen.set(group, true); group.open = true; }
  else if (hash && !document.getElementById(hash)) search.value = hash;
  filter();
})();
