import test from 'node:test'; import assert from 'node:assert/strict';
import { DEVICES, price, area, buildSvg, layerSvg, quoteText, shapePath, safeImage, TARIFS } from '../core.js';
const dev = (id) => DEVICES.find((d) => d.id === id);
test('catalogue : consoles, manettes, téléphones, ordinateurs, enceintes, motos, objets', () => { const cats = new Set(DEVICES.map((d) => d.cat)); for (const c of ['console', 'manette', 'telephone', 'ordinateur', 'enceinte', 'moto', 'objet']) assert.ok(cats.has(c), c); for (const id of ['ps5', 'ps5pro', 'dualsense', 'xsx', 'fold', 'iphone']) assert.ok(dev(id)); });
test('dimensions vérifiées : valeurs sourcées (PS5 Pro 388×216, Xbox Series X 301×151) et sources présentes', () => { assert.equal(dev('ps5pro').surfaces[0].w, 388); assert.equal(dev('ps5pro').surfaces[0].h, 216); assert.equal(dev('xsx').surfaces[0].w, 301); for (const d of DEVICES) { if (d.verified) assert.match(d.source, /^https:\/\//); else assert.match(d.source, /MESURER/); } });
test('prix : tarifs indicatifs, gabarits provisoires et finitions inconnues sur devis', () => {
  assert.equal(price(dev('dualsense')).status, 'devis', 'gabarit provisoire -> devis');
  const ok = { ...dev('dualsense'), verified: true }; const p = price(ok); assert.equal(p.status, 'ok'); assert.equal(p.total, 24.9); assert.equal(price(ok, { copies: 3 }).total, 74.7);
  assert.equal(price(ok, { finish: 'brillant' }).status, 'devis', 'surcoût brillant non fixé');
  assert.equal(price(dev('ps5')).total, 49.9); assert.equal(price(dev('fold')).status, 'devis'); assert.equal(price(ok, { copies: 0 }).status, 'devis');
  const T = { ...TARIFS, console: { base: 10, parCm2: 0.01, brillant: 5 } }; const q = price(dev('ps5'), { finish: 'brillant', tarifs: T }); assert.equal(q.status, 'ok'); assert.equal(q.unit, 10 + Math.round(area(dev('ps5')) * 0.01 * 100) / 100 + 5);
});
test('surface : aire en cm² (PS5 : 2 plaques 390×260)', () => assert.equal(area(dev('ps5')), 2 * 390 * 260 / 100));
test('SVG impression/découpe : calques print + CutContour, dimensions en mm, XML valide', () => {
  const s = dev('ps5').surfaces[0], svg = buildSvg(s, { bg: '#112233', layers: [{ type: 'text', text: 'VM <b>"&', x: 100, y: 100, size: 20, fill: '#ffffff' }, { type: 'star', x: 50, y: 50, w: 30, h: 30, fill: '#ffdf39' }, { type: 'rect', x: 10, y: 10, w: 5, h: 5, fill: 'rouge-invalide' }] });
  assert.match(svg, /width="394mm" height="264mm"/); assert.match(svg, /id="print"/); assert.match(svg, /id="CutContour"[^>]*stroke="#ff00ff"/); assert.ok(!svg.includes('<b>'), 'texte échappé'); assert.match(svg, /&lt;b&gt;/); assert.ok(!svg.includes('rouge-invalide'), 'couleur invalide remplacée');
  assert.equal(svg.match(/<svg /g).length, 1);
});
test('sécurité : image non autorisée (SVG, script, URL externe) refusée ; image valide acceptée', () => { for (const u of ['data:image/svg+xml;base64,AAAA', 'javascript:alert(1)', 'https://exemple.fr/a.png', 'data:text/html;base64,AAAA']) assert.equal(safeImage(u), ''); assert.ok(safeImage('data:image/png;base64,iVBORw0KGgo=')); assert.equal(layerSvg({ type: 'image', src: 'https://x/y.png', x: 0, y: 0 }), ''); });
test('formes : chemin arrondi borné, rotation et taille bornées', () => { assert.match(shapePath({ shape: 'rrect', r: 999, w: 50, h: 20 }), /^M10 0H40/); assert.match(layerSvg({ type: 'rect', x: 0, y: 0, w: 1e9, h: -5, rot: 9999 }), /width="5000"/); });
test('devis : mentionne le gabarit provisoire et « sur devis », sans engager de commande', () => { const d = dev('fold'), t = quoteText({ device: d, surface: d.surfaces[0], design: { layers: [1, 2] }, price: price(d), finish: 'mat', copies: 1, contact: { name: 'Test', email: 'a@b.fr', message: 'x'.repeat(900) } }); assert.match(t, /PROVISOIRE/); assert.match(t, /sur devis/); assert.match(t, /Aucune commande/); assert.ok(t.length < 1500); });
