// VM Design Factory — logique pure du configurateur (sans DOM) : catalogue, gabarits, prix, export SVG impression/découpe, devis.
// Unités : millimètres. Rien n'est envoyé à un serveur : tout reste dans le navigateur de l'utilisateur.
export const SRC = {
  psvgc: 'https://www.videogameschronicle.com/news/ps5-pro-images-compare-its-size-to-the-original-and-slim-ps5-models',
  psvgc2: 'https://www.videogameschronicle.com/news/the-official-playstation-5-pro-specifications-have-been-revealed',
  xbox: 'https://www.gamesradar.com/how-big-is-the-xbox-series-x',
};
const TODO = 'À MESURER / à fournir par le client avant découpe';
// Dimensions extérieures hors parties saillantes. verified=true : valeur relevée dans la source citée (novembre 2026). Sinon : valeur PROVISOIRE d'aperçu, à remplacer.
// ATTENTION : ce sont des dimensions de l'appareil, pas des gabarits constructeur des plaques : un gabarit réel (mesuré) est requis avant toute découpe.
export const DEVICES = [
  { id: 'ps5', cat: 'console', name: 'PlayStation 5 (édition disque, 2020)', dims: { h: 390, d: 260, w: 104 }, verified: true, source: SRC.psvgc, surfaces: [{ id: 'plaque', label: 'Plaque latérale', w: 390, h: 260, qty: 2, shape: 'rrect', r: 14 }] },
  { id: 'ps5slim', cat: 'console', name: 'PlayStation 5 Slim (disque, 2023)', dims: { h: 358, d: 216, w: 96 }, verified: true, source: SRC.psvgc, surfaces: [{ id: 'plaque', label: 'Plaque latérale', w: 358, h: 216, qty: 2, shape: 'rrect', r: 14 }] },
  { id: 'ps5pro', cat: 'console', name: 'PlayStation 5 Pro', dims: { h: 388, d: 216, w: 89 }, verified: true, source: SRC.psvgc2, surfaces: [{ id: 'plaque', label: 'Plaque latérale', w: 388, h: 216, qty: 2, shape: 'rrect', r: 14 }] },
  { id: 'xsx', cat: 'console', name: 'Xbox Series X', dims: { h: 301, d: 151, w: 151 }, verified: true, source: SRC.xbox, surfaces: [{ id: 'face', label: 'Face latérale', w: 301, h: 151, qty: 4, shape: 'rect' }, { id: 'dessus', label: 'Dessus', w: 151, h: 151, qty: 1, shape: 'rect' }] },
  { id: 'dualsense', cat: 'manette', name: 'Manette DualSense (PS5)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'facade', label: 'Face avant (provisoire)', w: 160, h: 106, qty: 1, shape: 'rrect', r: 30 }] },
  { id: 'xboxpad', cat: 'manette', name: 'Manette Xbox', dims: null, verified: false, source: TODO, surfaces: [{ id: 'facade', label: 'Face avant (provisoire)', w: 150, h: 100, qty: 1, shape: 'rrect', r: 30 }] },
  { id: 'fold', cat: 'telephone', name: 'Samsung Galaxy Z Fold (modèle exact à préciser)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'dos', label: 'Dos (provisoire)', w: 155, h: 72, qty: 1, shape: 'rrect', r: 8 }] },
  { id: 'iphone', cat: 'telephone', name: 'iPhone (modèle exact à préciser)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'dos', label: 'Dos (provisoire)', w: 147, h: 71, qty: 1, shape: 'rrect', r: 9 }] },
  { id: 'ordi', cat: 'ordinateur', name: 'Ordinateur portable (capot)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'capot', label: 'Capot (provisoire)', w: 330, h: 230, qty: 1, shape: 'rrect', r: 8 }] },
  { id: 'enceinte', cat: 'enceinte', name: 'Enceinte (face)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'face', label: 'Face (provisoire)', w: 200, h: 100, qty: 1, shape: 'rrect', r: 10 }] },
  { id: 'moto', cat: 'moto', name: 'Moto (réservoir, carénage : sur mesure)', dims: null, verified: false, source: TODO, surfaces: [{ id: 'reservoir', label: 'Réservoir (provisoire)', w: 400, h: 250, qty: 1, shape: 'rrect', r: 60 }] },
  { id: 'custom', cat: 'objet', name: 'Objet sur mesure', dims: null, verified: false, source: TODO, surfaces: [{ id: 'surface', label: 'Surface (à saisir)', w: 200, h: 150, qty: 1, shape: 'rect' }] },
];
export const CATS = { console: 'Consoles', manette: 'Manettes', telephone: 'Téléphones', ordinateur: 'Ordinateurs', enceinte: 'Enceintes', moto: 'Motos', objet: 'Objets sur mesure' };
export const FINISHES = { mat: 'Mat', brillant: 'Brillant' };

// TARIFS TTC indicatifs de préparation : manette 24,90 €, console 49,90 €, téléphone 19,90 €. Validation fournisseur et gabarit avant commande.
// Le propriétaire renseigne ici (ou dans tarifs.json) ses prix : base (€), parCm2 (€/cm²), brillant (surcoût €). Aucune valeur inventée.
export const TARIFS = {
  manette: { base: 24.9, parCm2: 0, brillant: null, publicNote: 'dès 24,90 € (page publique)' },
  console: { base: 49.9, parCm2: 0, brillant: null }, telephone: { base: 19.9, parCm2: 0, brillant: null }, ordinateur: { base: null, parCm2: null, brillant: null },
  enceinte: { base: null, parCm2: null, brillant: null }, moto: { base: null, parCm2: null, brillant: null }, objet: { base: null, parCm2: null, brillant: null },
};
const round2 = (n) => Math.round(n * 100) / 100;
export function area(dev, surf = null, sizes = {}) { const list = surf ? dev.surfaces.filter((s) => s.id === surf) : dev.surfaces; return list.reduce((a, s) => { const w = sizes[s.id]?.w ?? s.w, h = sizes[s.id]?.h ?? s.h; return a + (w * h / 100) * s.qty; }, 0); }
/** Prix indicatif TTC. Retourne {status:'ok'|'devis', total, lines, reasons}. Jamais de chiffre inventé : une donnée manquante donne « sur devis ». */
export function price(dev, { finish = 'mat', sizes = {}, copies = 1, tarifs = TARIFS } = {}) {
  const t = tarifs[dev.cat] || {}, reasons = [], lines = [];
  if (!(copies >= 1 && copies <= 100)) return { status: 'devis', total: null, lines, reasons: ['quantité invalide'] };
  if (t.base == null) reasons.push('tarif de cette catégorie non fixé');
  if (t.parCm2 == null) reasons.push('tarif à la surface non fixé');
  if (finish === 'brillant' && t.brillant == null) reasons.push('surcoût brillant non fixé');
  if (!dev.verified) reasons.push('gabarit provisoire : dimensions à confirmer');
  if (reasons.length) return { status: 'devis', total: null, lines, reasons };
  const a = area(dev, null, sizes); lines.push({ label: 'Base', amount: t.base });
  if (t.parCm2 > 0) lines.push({ label: `Surface ${a.toFixed(0)} cm²`, amount: round2(a * t.parCm2) });
  if (finish === 'brillant') lines.push({ label: 'Finition brillante', amount: t.brillant });
  const unit = round2(lines.reduce((s, l) => s + l.amount, 0));
  return { status: 'ok', total: round2(unit * copies), unit, lines, reasons: [] };
}
// ---- SVG ----
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONTS = ['Arial', 'Impact', 'Georgia', 'Courier New', 'Verdana'];
export const safeColor = (c, d = '#000000') => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : d);
export const safeImage = (u) => (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(u || '') ? u : '');
export const num = (v, d = 0, lo = -1e5, hi = 1e5) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);
export function shapePath(s, w = s.w, h = s.h) {
  const r = Math.min(s.shape === 'rrect' ? (s.r || 0) : 0, w / 2, h / 2); if (!r) return `M0 0H${w}V${h}H0Z`;
  return `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
}
export function layerSvg(l) {
  const x = num(l.x), y = num(l.y), rot = num(l.rot, 0, -360, 360), w = num(l.w, 20, 0.5, 5000), h = num(l.h, 20, 0.5, 5000), fill = safeColor(l.fill, '#ffffff'), tr = `transform="translate(${x} ${y}) rotate(${rot})"`;
  if (l.type === 'text') return `<text ${tr} text-anchor="middle" dominant-baseline="middle" font-family="${FONTS.includes(l.font) ? l.font : 'Arial'}" font-weight="700" font-size="${num(l.size, 14, 2, 400)}" fill="${fill}">${esc(String(l.text || '').slice(0, 120))}</text>`;
  if (l.type === 'rect') return `<rect ${tr} x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill}"/>`;
  if (l.type === 'circle') return `<ellipse ${tr} rx="${w / 2}" ry="${h / 2}" fill="${fill}"/>`;
  if (l.type === 'star') { const pts = []; for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2, r = i % 2 ? 0.4 : 1; pts.push(`${(Math.cos(a) * r * w / 2).toFixed(2)},${(Math.sin(a) * r * h / 2).toFixed(2)}`); } return `<polygon ${tr} points="${pts.join(' ')}" fill="${fill}"/>`; }
  if (l.type === 'image') { const src = safeImage(l.src); return src ? `<image ${tr} x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" href="${src}"/>` : ''; }
  return '';
}
/** Fichier d'impression/découpe : calque « print » (design, 1 unité = 1 mm) + calque « CutContour » (trait magenta 0,25 mm, sans remplissage). */
export function buildSvg(surface, design, { bleed = 2, marks = true } = {}) {
  const w = num(surface.w, 100, 5, 2000), h = num(surface.h, 100, 5, 2000), b = num(bleed, 2, 0, 10), cid = 'c' + (surface.id || 'x').replace(/[^a-z0-9]/gi, '');
  const path = shapePath({ ...surface, w, h });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * b}mm" height="${h + 2 * b}mm" viewBox="${-b} ${-b} ${w + 2 * b} ${h + 2 * b}">\n<title>VM Design Factory — ${esc(surface.label || '')} (${w} x ${h} mm, fond perdu ${b} mm)</title>\n<defs><clipPath id="${cid}"><path d="${path}"/></clipPath><clipPath id="${cid}b"><rect x="${-b}" y="${-b}" width="${w + 2 * b}" height="${h + 2 * b}"/></clipPath></defs>\n<g id="print" clip-path="url(#${cid}b)"><rect x="${-b}" y="${-b}" width="${w + 2 * b}" height="${h + 2 * b}" fill="${safeColor(design.bg, '#1e4fc5')}"/>${(design.layers || []).map(layerSvg).join('')}</g>\n<g id="CutContour" fill="none" stroke="#ff00ff" stroke-width="0.25"><path d="${path}"/></g>${marks ? `\n<g id="marks" stroke="#000" stroke-width="0.2"><path d="M${-b} ${-b - 0}h-3M${-b} ${-b}v-3"/></g>` : ''}\n</svg>\n`;
}
export function quoteText({ device, surface, design, price: p, finish, copies, contact }) {
  const L = ['DEMANDE DE DEVIS — VM Design Factory', '', `Appareil : ${device.name}${device.verified ? '' : ' (gabarit PROVISOIRE : dimensions à confirmer)'}`, `Surface : ${surface.label} — ${surface.w} × ${surface.h} mm × ${surface.qty}`, `Finition : ${FINISHES[finish] || finish} · quantité : ${copies}`, `Éléments du design : ${(design.layers || []).length}`, `Prix : ${p.status === 'ok' ? p.total.toFixed(2) + ' € TTC (indicatif)' : 'sur devis — ' + p.reasons.join(' ; ')}`, '', `Nom : ${String(contact.name || '').slice(0, 80)}`, `E-mail : ${String(contact.email || '').slice(0, 120)}`, `Message : ${String(contact.message || '').slice(0, 500)}`, '', 'Le fichier SVG d’impression et de découpe est joint par le client. Aucune commande n’est passée tant que le devis n’est pas accepté et payé.'];
  return L.join('\n');
}
