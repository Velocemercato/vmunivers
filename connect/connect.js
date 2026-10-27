/* VM Connect · aperçu : toutes les données ci-dessous sont des EXEMPLES FICTIFS (aucun vrai commerce, profil ou message),
   sauf le canal VM Univers qui annonce de vrais services VM. Aucun serveur : rien n'est envoyé ni enregistré ailleurs que sur l'appareil. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('vmc-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('vmc-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var toastT;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3200); }

  /* ---------- Villes pilotes ---------- */
  var VILLES = {
    belfort: {nom: 'Belfort', c: [47.6383, 6.8628]},
    lure: {nom: 'Lure', c: [47.6833, 6.4967]},
    montbeliard: {nom: 'Montbéliard', c: [47.5100, 6.7980]},
    hericourt: {nom: 'Héricourt', c: [47.5770, 6.7620]}
  };
  var ville = store.get('ville', 'belfort'); if (!VILLES[ville]) ville = 'belfort';
  var sel = $('ville');
  sel.innerHTML = Object.keys(VILLES).map(function (k) { return '<option value="' + k + '"' + (k === ville ? ' selected' : '') + '>📍 ' + VILLES[k].nom + '</option>'; }).join('');
  sel.onchange = function () { ville = sel.value; store.set('ville', ville); renderAll(); };

  /* ---------- 1. Autour de moi ---------- */
  var CATS = {commerce: ['🛒', 'Commerces', '#ffd23f'], service: ['🔧', 'Services', '#3d6df2'], event: ['🎉', 'Événements', '#ff4d8d'], signal: ['⚠️', 'Signalements', '#ff8a3d']};
  // Modèles de lieux fictifs, placés autour du centre de la ville choisie (décalages en degrés).
  var LIEUX = [
    {cat: 'commerce', nom: 'Boulangerie du Marché', d: 'Pain au levain, viennoiseries. Ouvert dès 6 h 30.', o: [.004, -.006], verif: '20/10/2026'},
    {cat: 'commerce', nom: 'Pizzeria La Lune', d: 'Pizzas au feu de bois, à emporter ou en livraison.', o: [-.005, .007], verif: '22/10/2026'},
    {cat: 'commerce', nom: 'Salon Belle & Rebelle', d: 'Coiffure femme, homme et enfant, sur rendez-vous.', o: [.007, .004], verif: null},
    {cat: 'service', nom: 'Garage du Rond-Point', d: 'Entretien toutes marques, pneus, contrôle avant CT.', o: [-.009, -.004], verif: '15/10/2026'},
    {cat: 'service', nom: 'Plomberie Express 24/7', d: 'Dépannage plomberie et chauffage, devis gratuit.', o: [.002, .011], verif: null},
    {cat: 'event', nom: 'Marché de nuit gourmand', d: 'Vendredi 18 h – 23 h · food trucks et concerts.', o: [-.002, -.010], quand: 'Ven. 31 oct.'},
    {cat: 'event', nom: 'Tournoi de foot à 5', d: 'Samedi · équipes de 5, inscription sur place.', o: [.010, -.001], quand: 'Sam. 1 nov.'},
    {cat: 'signal', nom: 'Travaux rue principale', d: 'Circulation alternée en journée.', o: [-.006, .002], statut: 'confirmé', vu: '27/10/2026'},
    {cat: 'signal', nom: 'Lampadaire en panne', d: 'Signalé par des habitants, en attente de la mairie.', o: [.005, -.012], statut: 'proposé', vu: '26/10/2026'}
  ];
  var filtres = store.get('filtres', {commerce: 1, service: 1, event: 1, signal: 1});
  var favs = store.get('favs', {});
  var map, layer;
  function lieuxVille() {
    var c = VILLES[ville].c;
    return LIEUX.map(function (l, i) { return Object.assign({}, l, {id: ville + i, lat: c[0] + l.o[0], lng: c[1] + l.o[1]}); });
  }
  function itin(l) { return 'https://www.openstreetmap.org/directions?to=' + l.lat.toFixed(5) + '%2C' + l.lng.toFixed(5); }
  function waze(l) { return 'https://waze.com/ul?ll=' + l.lat.toFixed(5) + '%2C' + l.lng.toFixed(5) + '&navigate=yes'; }
  function gmaps(l) { return 'https://www.google.com/maps/dir/?api=1&destination=' + l.lat.toFixed(5) + '%2C' + l.lng.toFixed(5); }
  function renderFiltres() {
    $('filtres').innerHTML = Object.keys(CATS).map(function (k) { return '<button type="button" data-f="' + k + '" aria-pressed="' + (filtres[k] ? 'true' : 'false') + '">' + CATS[k][0] + ' ' + CATS[k][1] + '</button>'; }).join('');
    $('filtres').querySelectorAll('button').forEach(function (b) { b.onclick = function () { filtres[b.dataset.f] = filtres[b.dataset.f] ? 0 : 1; store.set('filtres', filtres); renderCarte(); }; });
  }
  function statutTag(l) {
    if (l.cat === 'signal') return '<span class="tag ' + (l.statut === 'confirmé' ? 'ok' : 'wait') + '">' + esc(l.statut) + ' · ' + l.vu + '</span>';
    if (l.cat === 'event') return '<span class="tag blue">📅 ' + esc(l.quand) + '</span>';
    return l.verif ? '<span class="tag ok">Fiche vérifiée le ' + l.verif + '</span>' : '<span class="tag wait">Fiche non vérifiée</span>';
  }
  function renderCarte() {
    renderFiltres();
    var L = lieuxVille().filter(function (l) { return filtres[l.cat]; });
    $('lieux').innerHTML = L.map(function (l) {
      return '<article class="item"><div class="meta"><span class="tag" style="color:' + CATS[l.cat][2] + '">' + CATS[l.cat][0] + ' ' + CATS[l.cat][1] + '</span><span class="tag ex">Exemple</span></div>' +
        '<h3>' + esc(l.nom) + '</h3><p>' + esc(l.d) + '</p><div class="meta">' + statutTag(l) + '</div>' +
        '<div class="row"><a class="mini on" href="' + waze(l) + '" target="_blank" rel="noopener">🚗 Waze</a><a class="mini" href="' + gmaps(l) + '" target="_blank" rel="noopener">🗺️ Maps</a><button type="button" class="mini' + (favs[l.id] ? ' on' : '') + '" data-fav="' + l.id + '">' + (favs[l.id] ? '★ Favori' : '☆ Favori') + '</button>' +
        (l.cat === 'signal' ? '<button type="button" class="mini" data-confirm="1">👍 Toujours là</button>' : '') + '</div></article>';
    }).join('') || '<p class="small">Aucun résultat avec ces filtres.</p>';
    $('lieux').querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { var k = b.dataset.fav; if (favs[k]) delete favs[k]; else favs[k] = 1; store.set('favs', favs); renderCarte(); toast(favs[k] ? 'Ajouté à vos favoris sur cet appareil.' : 'Retiré des favoris.'); }; });
    $('lieux').querySelectorAll('[data-confirm]').forEach(function (b) { b.onclick = function () { toast('Merci ! La confirmation des signalements ouvrira avec les comptes.'); }; });
    if (!window.L) return;
    if (!map) {
      map = window.L.map('map', {scrollWheelZoom: false, attributionControl: true});
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
      layer = window.L.layerGroup().addTo(map);
    }
    layer.clearLayers();
    map.setView(VILLES[ville].c, 14);
    L.forEach(function (l) {
      var icon = window.L.divIcon({className: '', html: '<div class="pin" style="background:' + CATS[l.cat][2] + '"><span>' + CATS[l.cat][0] + '</span></div>', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28]});
      window.L.marker([l.lat, l.lng], {icon: icon}).addTo(layer).bindPopup('<b>' + esc(l.nom) + '</b><br>' + esc(l.d) + '<br><small>Exemple fictif</small><br><a href="' + waze(l) + '" target="_blank" rel="noopener">🚗 Waze</a> · <a href="' + gmaps(l) + '" target="_blank" rel="noopener">Maps</a>');
    });
    setTimeout(function () { map.invalidateSize(); }, 60);
  }

  /* ---------- 2. Fil & stories ---------- */
  var STORIES = [['🥐', 'Boulangerie', '#3a2a10'], ['🍕', 'Pizzeria', '#3a1414'], ['💇', 'Salon', '#3a1430'], ['⚽', 'Foot à 5', '#12301e'], ['🎶', 'Marché de nuit', '#1d1440'], ['🚗', 'Garage', '#13223a']];
  var POSTS = [
    {av: '🥐', bg: '#3a2a10', qui: 'Boulangerie du Marché', quand: 'il y a 25 min', aud: 'Public', txt: 'Nouveau : la tourte aux noix du week-end est de retour, vendredi et samedi uniquement.', vis: '🥧'},
    {av: '🎶', bg: '#1d1440', qui: 'Comité des fêtes', quand: 'il y a 2 h', aud: 'Public', txt: 'Marché de nuit gourmand vendredi soir : 12 food trucks, deux concerts, entrée libre.', vis: '🎪'},
    {av: '⚽', bg: '#12301e', qui: 'Club de foot à 5', quand: 'hier', aud: 'Abonnés', txt: 'Il reste 3 places pour le tournoi de samedi. Équipes de 5, mixtes bienvenues.', vis: '🏆'},
    {av: '💇', bg: '#3a1430', qui: 'Salon Belle & Rebelle', quand: 'hier', aud: 'Public', txt: 'Créneaux libres jeudi après-midi. Réservez directement sur notre page.', vis: null}
  ];
  function renderFil() {
    $('stories').innerHTML = STORIES.map(function (s) { return '<button type="button" class="story"><span class="ring"><span style="background:' + s[2] + '">' + s[0] + '</span></span><small>' + esc(s[1]) + '</small></button>'; }).join('');
    $('stories').querySelectorAll('.story').forEach(function (b) { b.onclick = function () { toast('Story d’exemple · elle disparaît au bout de 24 h.'); }; });
    $('feed').innerHTML = POSTS.map(function (p) {
      return '<article class="post"><header><span class="av" style="background:' + p.bg + '">' + p.av + '</span><div><b>' + esc(p.qui) + '</b><small>' + p.quand + ' · ' + VILLES[ville].nom + '</small></div></header>' +
        '<p>' + esc(p.txt) + '</p>' + (p.vis ? '<div class="vis" style="background:' + p.bg + '">' + p.vis + '</div>' : '') +
        '<div class="meta"><span class="tag ' + (p.aud === 'Public' ? 'blue' : 'wait') + '">' + (p.aud === 'Public' ? '🌍 Public' : '👥 Abonnés') + '</span><span class="tag ex">Exemple</span></div></article>';
    }).join('');
  }

  /* ---------- 3. Shop ---------- */
  var ANN = [
    {e: '👕', bg: '#14244a', t: 'Maillot de foot vintage, taille M', p: 25, etat: 'Très bon état', s: 'publiée', cat: 'mode'},
    {e: '🎮', bg: '#251444', t: 'Console de salon + 2 manettes', p: 180, etat: 'Bon état', s: 'réservée', cat: 'tech'},
    {e: '🚲', bg: '#13301f', t: 'Vélo enfant 16 pouces', p: 40, etat: 'Bon état', s: 'publiée', cat: 'sport'},
    {e: '🛋️', bg: '#3a2414', t: 'Canapé 3 places en tissu', p: 120, etat: 'Correct', s: 'publiée', cat: 'maison'},
    {e: '📚', bg: '#2a2414', t: 'Lot de 10 BD manga', p: 30, etat: 'Très bon état', s: 'vendue', cat: 'loisirs'},
    {e: '⚽', bg: '#13301f', t: 'Chaussures à crampons, pointure 42', p: 35, etat: 'Comme neuf', s: 'publiée', cat: 'sport'}
  ];
  var SCATS = {tout: 'Tout', mode: 'Mode', tech: 'High-tech', sport: 'Sport', maison: 'Maison', loisirs: 'Loisirs'};
  var scat = 'tout', sfav = store.get('sfav', {});
  function renderShop() {
    $('shopcats').innerHTML = Object.keys(SCATS).map(function (k) { return '<button type="button" data-c="' + k + '" aria-pressed="' + (k === scat) + '">' + SCATS[k] + '</button>'; }).join('');
    $('shopcats').querySelectorAll('button').forEach(function (b) { b.onclick = function () { scat = b.dataset.c; renderShop(); }; });
    var st = {publiée: 'ok', réservée: 'wait', vendue: 'no'};
    $('annonces').innerHTML = ANN.map(function (a, i) { a.i = i; return a; }).filter(function (a) { return scat === 'tout' || a.cat === scat; }).map(function (a) {
      return '<article class="ad"><div class="vis" style="background:' + a.bg + '"><span class="tag ' + st[a.s] + '">' + a.s + '</span><button type="button" class="fav" data-i="' + a.i + '" aria-pressed="' + !!sfav[a.i] + '" aria-label="Favori">' + (sfav[a.i] ? '♥' : '♡') + '</button>' + a.e + '</div>' +
        '<div class="b"><span class="price">' + a.p + ' €</span><h3>' + esc(a.t) + '</h3><div class="meta"><span class="tag">' + esc(a.etat) + '</span><span class="tag">📍 Secteur ' + VILLES[ville].nom + '</span><span class="tag ex">Exemple</span></div>' +
        '<div class="row"><button type="button" class="mini" data-contact="1"' + (a.s === 'vendue' ? ' disabled' : '') + '>💬 Contacter</button></div></div></article>';
    }).join('');
    $('annonces').querySelectorAll('.fav').forEach(function (b) { b.onclick = function () { var k = b.dataset.i; if (sfav[k]) delete sfav[k]; else sfav[k] = 1; store.set('sfav', sfav); renderShop(); }; });
    $('annonces').querySelectorAll('[data-contact]').forEach(function (b) { b.onclick = function () { toast('Annonce d’exemple. Pour les vraies annonces, passez par VM Annonces.'); }; });
  }

  /* ---------- 4. Guide TV (programmes fictifs) ---------- */
  var CHAINES = [['VM 1', '#c8102e'], ['LUNE TV', '#3d6df2'], ['CANAL EST', '#26a269'], ['SPORT+ DÉMO', '#ff8a3d'], ['CINÉ NUIT', '#7b3fe4'], ['KIDS VM', '#e6a700']];
  var GRILLE = [
    ['Le journal du soir', 'Info', 'Une soirée de démonstration', 'Série policière · S2 E4', 'Débat : le foot de demain'],
    ['Cuisine du terroir', 'Magazine', 'Jeu : la grande question', 'Film : La route de l’Est', 'Court métrage'],
    ['Météo locale', 'Info', 'Reportage : les lacs du Nord', 'Documentaire : forêts comtoises', 'Musique live'],
    ['Résumé de la journée', 'Sport', 'Match de démonstration', 'L’after du match', 'Le mercato en direct'],
    ['Classique du dimanche', 'Cinéma', 'Film : Les étoiles filantes', 'Film : Nuit blanche', 'Cinéclub'],
    ['Dessins animés', 'Jeunesse', 'Aventures de la petite lune', 'Histoires du soir', 'Programme de nuit']
  ];
  var tvm = 'now', tvfav = store.get('tvfav', {0: 1, 3: 1}), rappels = store.get('rappels', {});
  function hm(d) { return d.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris'}); }
  function renderTV() {
    document.querySelectorAll('.seg button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.m === tvm); b.onclick = function () { tvm = b.dataset.m; renderTV(); }; });
    var now = new Date(), start = new Date(now); start.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
    var soir = new Date(now); soir.setHours(21, 10, 0, 0);
    var rows = CHAINES.map(function (c, i) {
      if (tvm === 'fav' && !tvfav[i]) return '';
      var s = tvm === 'soir' ? soir : start, dur = tvm === 'soir' ? 100 : 60, slot = tvm === 'soir' ? 3 : 2;
      var fin = new Date(s.getTime() + dur * 60000), prog = Math.max(0, Math.min(100, (now - s) / (fin - s) * 100));
      var key = tvm + i + s.toISOString().slice(0, 13);
      return '<article class="prog"><span class="chan" style="background:' + c[1] + '">' + c[0] + '</span><div style="min-width:0"><h3>' + esc(GRILLE[i][slot]) + '</h3><small>' + hm(s) + ' – ' + hm(fin) + ' · ' + GRILLE[i][1] + ' · <span class="warn">fictif</span></small>' +
        (tvm === 'now' ? '<div class="bar"><i style="width:' + prog.toFixed(0) + '%"></i></div>' : '') + '</div>' +
        '<div class="acts"><button type="button" class="mini' + (tvfav[i] ? ' on' : '') + '" data-tf="' + i + '">' + (tvfav[i] ? '★ Ma chaîne' : '☆ Ma chaîne') + '</button>' +
        (tvm !== 'now' ? '<button type="button" class="mini' + (rappels[key] ? ' on' : '') + '" data-r="' + key + '">' + (rappels[key] ? '⏰ Rappel noté' : '⏰ Rappel') + '</button>' : '') + '</div></article>';
    }).join('');
    $('tvlist').innerHTML = rows || '<p class="small">Ajoutez des chaînes avec « ☆ Ma chaîne ».</p>';
    $('tvlist').querySelectorAll('[data-tf]').forEach(function (b) { b.onclick = function () { var k = b.dataset.tf; if (tvfav[k]) delete tvfav[k]; else tvfav[k] = 1; store.set('tvfav', tvfav); renderTV(); }; });
    $('tvlist').querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { var k = b.dataset.r; if (rappels[k]) delete rappels[k]; else rappels[k] = 1; store.set('rappels', rappels); renderTV(); toast(rappels[k] ? 'Rappel noté sur cet appareil. Les notifications arriveront avec l’appli complète.' : 'Rappel retiré.'); }; });
  }

  /* ---------- 5. Communautés ---------- */
  var SPACES = [
    {e: '⚽', bg: '#12301e', nom: 'Foot du coin', n: 214, chans: ['général', 'matchs-du-week-end', 'mercato'], msgs: [
      ['🦁', '#3a2a10', 'Karim (ex.)', 'Admin', 'Qui est chaud pour un foot à 5 samedi matin ?'], ['🐺', '#13223a', 'Léa (ex.)', 'Membre', 'Moi ! Je ramène un ballon.'], ['🦊', '#3a1414', 'Tom (ex.)', 'Modérateur', 'Rappel : pas de pub sans accord des admins 🙏']]},
    {e: '👶', bg: '#3a1430', nom: 'Parents du secteur', n: 158, chans: ['général', 'bons-plans', 'garde-d-enfants'], msgs: [
      ['🦋', '#3a1430', 'Sophie (ex.)', 'Propriétaire', 'Bienvenue aux nouveaux membres ! Lisez les règles épinglées.'], ['🐻', '#2a2414', 'Marc (ex.)', 'Membre', 'Quelqu’un connaît une nounou dispo le mercredi ?']]},
    {e: '🛠️', bg: '#13223a', nom: 'Entraide bricolage', n: 87, chans: ['général', 'prêt-d-outils'], msgs: [
      ['🦉', '#1d1440', 'Paul (ex.)', 'Admin', 'Je prête ma perceuse ce week-end, MP si besoin.']]}
  ];
  var cur = 0, ch = 0, ROLE = {Propriétaire: 'ex', Admin: 'blue', Modérateur: 'wait', Membre: ''};
  function renderCommu() {
    $('spaces').innerHTML = SPACES.map(function (s, i) { return '<button type="button" class="space" data-s="' + i + '" aria-current="' + (i === cur) + '"><span class="av" style="background:' + s.bg + '">' + s.e + '</span><span><b>' + esc(s.nom) + '</b><small>' + s.n + ' membres · exemple</small></span></button>'; }).join('');
    $('spaces').querySelectorAll('.space').forEach(function (b) { b.onclick = function () { cur = +b.dataset.s; ch = 0; renderCommu(); }; });
    var s = SPACES[cur];
    $('room').innerHTML = '<div class="rh"><b>' + s.e + ' ' + esc(s.nom) + '</b><span class="tag">🔒 Réservé aux membres</span></div>' +
      '<div class="chans">' + s.chans.map(function (c, i) { return '<button type="button" data-c="' + i + '" aria-pressed="' + (i === ch) + '"># ' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<div class="msgs">' + (ch === 0 ? s.msgs.map(function (m) { return '<div class="msg"><span class="av" style="background:' + m[1] + '">' + m[0] + '</span><div><b>' + esc(m[2]) + '</b><span class="tag role ' + ROLE[m[3]] + '">' + m[3] + '</span><p>' + esc(m[4]) + '</p></div></div>'; }).join('') : '<p class="small">Pas encore de message dans ce salon.</p>') + '</div>' +
      '<form class="compose"><label class="sr-only" for="msg">Message</label><input id="msg" placeholder="Écrire dans #' + esc(s.chans[ch]) + '…" autocomplete="off"><button class="btn" type="submit">Envoyer</button></form>';
    $('room').querySelectorAll('.chans button').forEach(function (b) { b.onclick = function () { ch = +b.dataset.c; renderCommu(); }; });
    $('room').querySelector('form').onsubmit = function (e) { e.preventDefault(); toast('Aperçu : la messagerie ouvrira avec les comptes. Rien n’a été envoyé.'); };
  }

  /* ---------- 6. Canaux ---------- */
  function renderCanaux() {
    var C = [
      {av: '🌙', bg: '#1d1440', qui: 'VM Univers', off: true, quand: 'aujourd’hui', txt: 'VM Studio crée le site de votre commerce : essai 7 jours à 49 €, ou pack Lancement 1 mois à 149 € avec 100 cartes de visite.', lien: ['https://velocemercato.fr/web-studio.html', 'Voir les offres']},
      {av: '⚽', bg: '#14244a', qui: 'Véloce Mercato', off: true, quand: 'cette semaine', txt: 'Nouveau grand reportage vidéo : Alexia Depagne, de la fête foraine à l’équipe de France de baby-foot.', lien: ['https://velocemercato.fr/reportages/alexia-depagne.html', 'Voir le reportage']},
      {av: '🌦️', bg: '#13223a', qui: 'VM Météo', off: true, quand: 'cette semaine', txt: 'La météo du coin sur 7 jours et les plus beaux lieux à visiter, région par région.', lien: ['/meteo/', 'Ouvrir VM Météo']},
      {av: '🏛️', bg: '#2a2414', qui: 'Mairie de ' + VILLES[ville].nom + ' (exemple)', off: false, quand: 'hier', txt: 'Exemple d’annonce : collecte des encombrants le premier mardi du mois, inscription en mairie.'}
    ];
    $('canaux').innerHTML = C.map(function (p) {
      return '<article class="post"><header><span class="av" style="background:' + p.bg + '">' + p.av + '</span><div><b>' + esc(p.qui) + (p.off ? ' <span class="tag ok">Officiel VM</span>' : ' <span class="tag ex">Exemple</span>') + '</b><small>' + p.quand + ' · 📣 canal</small></div></header>' +
        '<p>' + esc(p.txt) + '</p>' + (p.lien ? '<div class="row"><a class="mini on" href="' + p.lien[0] + '">' + p.lien[1] + ' ›</a></div>' : '') + '</article>';
    }).join('');
  }

  /* ---------- 7. Rencontres 18+ ---------- */
  var PROFILS = [['Exemple A', 34, '#ff4d8d', 1, 'Rando, cinéma et bons restos.'], ['Exemple B', 29, '#3d6df2', 0, 'Foot le dimanche, concerts le samedi.'], ['Exemple C', 41, '#26c46b', 1, 'Voyages, jardin et soirées jeux.'], ['Exemple D', 37, '#ff8a3d', 0, 'Cuisine, moto et balades au lac.']];
  function silhouette(cv, col, hair) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, col); g.addColorStop(1, '#0b0d17'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = .2; for (var i = 0; i < 18; i++) { c.fillStyle = '#fff'; c.beginPath(); c.arc((i * 53) % W, (i * 97) % (H * .6), 2 + i % 3, 0, 7); c.fill(); } c.globalAlpha = 1;
    c.fillStyle = '#0b0d17'; c.beginPath(); c.arc(W / 2, H * .42, W * .17, 0, 7); c.fill();
    if (hair) { c.beginPath(); c.ellipse(W / 2, H * .47, W * .22, H * .16, 0, Math.PI, 0); c.fill(); c.fillRect(W / 2 - W * .22, H * .46, W * .08, H * .16); c.fillRect(W / 2 + W * .14, H * .46, W * .08, H * .16); }
    c.beginPath(); c.ellipse(W / 2, H * .95, W * .36, H * .3, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 ' + Math.round(W * .07) + 'px Poppins, sans-serif'; c.textAlign = 'center'; c.fillText('PROFIL D’EXEMPLE', W / 2, H * .12);
  }
  function renderRencontres() {
    var ok = store.get('majeur', false);
    $('gate').hidden = ok; $('dating').hidden = !ok;
    if (!ok) return;
    $('profiles').innerHTML = PROFILS.map(function (p, i) {
      return '<article class="pf"><canvas width="400" height="500" data-p="' + i + '" aria-label="Illustration, personne fictive"></canvas><div class="b"><h3>' + p[0] + ' · ' + p[1] + ' ans</h3><p class="small">' + esc(p[4]) + '</p><div class="meta"><span class="tag">📍 Secteur ' + VILLES[ville].nom + '</span><span class="tag ex">Personne fictive</span></div>' +
        '<div class="row"><button type="button" class="mini" data-no="1">Passer</button><button type="button" class="mini on" data-yes="1">💞 Intéressé·e</button></div></div></article>';
    }).join('');
    $('profiles').querySelectorAll('canvas').forEach(function (cv) { var p = PROFILS[+cv.dataset.p]; silhouette(cv, p[2], p[3]); });
    $('profiles').querySelectorAll('[data-yes],[data-no]').forEach(function (b) { b.onclick = function () { toast('Profil d’exemple : les vraies rencontres ouvriront après la vérification de l’âge.'); }; });
  }
  $('majeur').onclick = function () { store.set('majeur', true); renderRencontres(); };
  $('mineur').onclick = function () { toast('Cet espace est réservé aux adultes. Le reste de VM Connect vous est ouvert !'); show('carte'); };

  /* ---------- Onglets ---------- */
  var tabs = document.querySelectorAll('.tabs button');
  function show(v) {
    tabs.forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === v); });
    document.querySelectorAll('.view').forEach(function (s) { s.hidden = s.id !== 'v-' + v; });
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v);
    if (v === 'carte' && map) setTimeout(function () { map.invalidateSize(); }, 60);
  }
  tabs.forEach(function (b) { b.onclick = function () { show(b.dataset.v); }; });
  addEventListener('hashchange', function () { var v = location.hash.slice(1); if (document.getElementById('v-' + v)) show(v); });

  function renderAll() { renderCarte(); renderFil(); renderShop(); renderTV(); renderCommu(); renderCanaux(); renderRencontres(); }
  function fixTop() { document.querySelector('.tabs').style.top = document.querySelector('.top').offsetHeight + 'px'; }
  fixTop(); addEventListener('resize', fixTop);
  renderAll();
  var h = location.hash.slice(1); show(['carte', 'fil', 'shop', 'tv', 'commu', 'canaux', 'rencontres'].indexOf(h) >= 0 ? h : 'carte');
  setInterval(function () { if (!$('v-tv').hidden) renderTV(); }, 60000);
  if (!window.L) addEventListener('load', function () { renderCarte(); });

  /* ---------- Partager + Installer ---------- */
  $('partager').onclick = function () {
    var data = {title: 'VM Connect', text: 'Le local, les liens, les projets : l’appli locale de VM Univers.', url: 'https://vmunivers.fr/connect/'};
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(data.url) : Promise.reject()).then(function () { toast('Lien copié : ' + data.url); }, function () { toast(data.url); });
  };
  var dp = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); dp = e; });
  $('installer').onclick = function () {
    if (dp) { dp.prompt(); dp = null; return; }
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    toast(ios ? 'Sur iPhone : bouton Partager puis « Sur l’écran d’accueil ».' : 'Menu ⋮ du navigateur puis « Installer l’appli » ou « Ajouter à l’écran d’accueil ».');
  };
  if (matchMedia('(display-mode: standalone)').matches) $('installer').hidden = true;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'}).catch(function () {});
})();
