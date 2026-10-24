/* Sous chaque appli de l'annuaire : « 📤 Partager » et « 📲 Installer ».
   Installer ouvre l'appli avec ?installer=1 : la page montre alors le geste à faire (vm-guide.js côté appli). */
(() => {
  // Cartes qui n'ouvrent pas directement leur propre appli installable : adresse à installer, ou '' pour aucune.
  const INSTALL = {
    '/professionnels/': 'https://velocemercato.fr/web-studio.html',
    '/meteo/': 'https://velocemercato.fr/meteo/',
    'https://velocemercato.fr/soutenir.html': ''
  };
  const style = document.createElement('style');
  style.textContent = '.apw{display:flex;flex-direction:column;min-width:0;gap:6px}.apw>.ap{flex:1}.apw:has(>.ap[hidden]){display:none}'
    + '.apx{display:flex;gap:6px}.apx a,.apx button{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;min-height:38px;padding:7px 8px;border-radius:999px;border:1px solid #ffffff2e;background:#ffffff0d;color:#fff;font-family:inherit;font-weight:800;font-size:.78rem;line-height:1.1;text-decoration:none;cursor:pointer;white-space:nowrap}'
    + '.apx .apx-i{background:#1d3fb8;border-color:#1d3fb8}.apx a:hover,.apx button:hover{border-color:#f4cf55}'
    + '.apx a:focus-visible,.apx button:focus-visible{outline:3px solid #f4cf55;outline-offset:2px}';
  document.head.appendChild(style);
  const abs = href => new URL(href, location.href).href;
  const withInstall = href => {
    const u = new URL(href, location.href);
    u.searchParams.set('installer', '1');
    return u.href;
  };
  document.querySelectorAll('#apps .ap').forEach(card => {
    const href = card.getAttribute('href');
    const name = (card.querySelector('.ab b') || card).textContent.trim();
    const wrap = document.createElement('div');
    wrap.className = 'apw';
    card.before(wrap);
    wrap.append(card);
    const bar = document.createElement('div');
    bar.className = 'apx';
    const share = document.createElement('button');
    share.type = 'button';
    share.textContent = '📤 Partager';
    share.setAttribute('aria-label', `Partager ${name}`);
    share.addEventListener('click', () => {
      const url = abs(href), title = `${name} · VM Univers`;
      if (window.vmShareOpen) window.vmShareOpen(url, title, name);
      else if (navigator.share) navigator.share({title, url}).catch(() => {});
    });
    bar.append(share);
    const target = href in INSTALL ? INSTALL[href] : href;
    if (target) {
      const inst = document.createElement('a');
      inst.className = 'apx-i';
      inst.href = withInstall(target);
      inst.textContent = '📲 Installer';
      inst.setAttribute('aria-label', `Installer ${name} sur mon téléphone`);
      bar.append(inst);
    }
    wrap.append(bar);
  });
})();
