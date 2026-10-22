(() => {
  const search = document.getElementById('q');
  const root = document.getElementById('apps');
  const items = [...root.querySelectorAll('.ap')];
  const groups = [...root.querySelectorAll('.grp')];
  const initialOpen = new Map(groups.map(group => [group, group.open]));
  const count = document.getElementById('projectCount');
  const feature = root.querySelector('.feat');
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function filter() {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    items.forEach(item => {
      const text = normalize(`${item.dataset.k} ${item.textContent}`);
      item.hidden = !words.every(word => text.includes(word));
    });
    groups.forEach(group => {
      const visible = group.querySelectorAll('.ap:not([hidden])').length;
      group.hidden = !visible;
      group.open = words.length ? visible > 0 : initialOpen.get(group);
    });
    const visible = items.filter(item => !item.hidden).length;
    count.textContent = `${visible} projet${visible > 1 ? 's' : ''}${words.length ? ' trouvé' + (visible > 1 ? 's' : '') : ' à découvrir'}`;
    document.getElementById('none').hidden = visible > 0;
    feature.hidden = words.length > 0;
  }
  search.addEventListener('input', filter);
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (!search.value.trim()) initialOpen.set(group, group.open);
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
  let hash = '';
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* URL mal formée. */ }
  const group = groups.find(item => item.id === `g-${hash}` || item.id === hash);
  if (group) { initialOpen.set(group, true); group.open = true; }
  else if (hash) search.value = hash;
  filter();
})();
