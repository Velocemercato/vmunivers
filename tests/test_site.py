"""Régressions de navigation, d'affichage et de cache. Aucun appel externe de mesure."""
import json
import os
from pathlib import Path
import re
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
import unittest
from urllib.parse import parse_qs, urlsplit
from urllib.request import urlopen
from urllib.error import HTTPError

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = (ROOT / 'CNAME').read_text().strip()
PORTAL = DOMAIN == 'vmunivers.fr'
ARTIFACTS = Path(os.environ.get('VM_TEST_ARTIFACTS', '/tmp/vm-site-tests')) / DOMAIN


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Le navigateur annule les chargements lors d’un changement de page.


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.playwright = sync_playwright().start()
        executable = os.environ.get('VM_CHROMIUM_EXECUTABLE') or shutil.which('chromium')
        cls.browser = cls.playwright.chromium.launch(executable_path=executable, headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def context(self, width=390, theme='light', workers='block'):
        context = self.browser.new_context(viewport={'width': width, 'height': 960 if width > 800 else 844}, color_scheme=theme, service_workers=workers)
        # Vérifications locales : les APIs de vote, polices et autres intégrations ne sont pas simulées comme fonctionnelles.
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(self.base + '/') else route.abort())
        return context

    def test_01_domain_assets_and_navigation(self):
        context = self.context()
        page = context.new_page()
        requests = []
        page.on('request', lambda request: requests.append(request.url))
        page.goto(self.base, wait_until='networkidle')
        self.assertEqual(page.url, self.base + '/')
        self.assertEqual(page.locator('link[rel=canonical]').get_attribute('href'), f'https://{DOMAIN}/')
        self.assertEqual(page.locator('meta[property="og:url"]').get_attribute('content'), f'https://{DOMAIN}/')
        # Charger aussi les images sous la ligne de flottaison, dont les logos paresseux.
        page.locator('img[loading=lazy]').evaluate_all("images => images.forEach(image => image.loading = 'eager')")
        page.wait_for_function("[...document.images].filter(i=>new URL(i.src).origin===location.origin).every(i=>i.complete && i.naturalWidth>0)")
        for href in page.locator('a[href^="/"]').evaluate_all("links => links.map(link=>link.getAttribute('href'))"):
            path = urlsplit(href).path
            with urlopen(self.base + path, timeout=10) as response:
                self.assertEqual(response.status, 200, path)
        manifest_path = page.locator('link[rel=manifest]').get_attribute('href')
        with urlopen(self.base + manifest_path) as response:
            manifest = json.load(response)
        self.assertTrue(manifest['start_url'].startswith('/'))
        self.assertFalse(urlsplit(manifest['start_url']).netloc)
        self.assertFalse(any('vm-stats-' in url for url in requests))
        if PORTAL:
            self.assertFalse(any(not url.startswith(self.base) for url in requests), requests)
            self.assertEqual(page.locator('a.ap').count(), 27)
            self.assertEqual(page.locator('.ap.soon').count(), 2)
            self.assertEqual(page.locator('a.ap img').count(), 27)
            for href in page.locator('a.ap').evaluate_all('links => links.map(link=>link.href)'):
                self.assertIn(urlsplit(href).hostname, [urlsplit(self.base).hostname, 'velocemercato.fr', 'velocemercato.github.io'])
        else:
            self.assertEqual(page.locator('header a.logo').get_attribute('href'), '/')
            self.assertEqual(page.locator('.vmbar .vmb-logo').get_attribute('href'), 'https://vmunivers.fr/')
            self.assertGreater(page.locator('#feed .card').count(), 0)
            try:
                urlopen(self.base + '/stats.html')
                self.fail('Le tableau de bord public existe encore')
            except HTTPError as error:
                self.assertEqual(error.code, 404)
        context.close()

    def test_02_mobile_desktop_layout_and_artwork(self):
        for width in [320, 390, 768, 1440]:
            for theme in ['light', 'dark']:
                with self.subTest(width=width, theme=theme):
                    context = self.context(width, theme)
                    page = context.new_page()
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(self.base, wait_until='networkidle')
                    self.assertEqual(page.evaluate('document.documentElement.scrollWidth'), width)
                    self.assertFalse(errors, errors)
                    if PORTAL:
                        card = page.locator('.apps.big .ap').first.bounding_box()
                        self.assertGreater(card['width'], 240)
                    else:
                        artwork = page.locator('.v2-hero img.bg')
                        image = artwork.bounding_box()
                        natural = artwork.evaluate('image => image.naturalWidth/image.naturalHeight')
                        self.assertAlmostEqual(image['width']/image['height'], natural, places=2)
                        copy = page.locator('.v2-txt').bounding_box()
                        overlap = min(image['x']+image['width'], copy['x']+copy['width']) - max(image['x'], copy['x'])
                        self.assertTrue(overlap <= 1 or copy['y'] >= image['y']+image['height']-1)
                        wordmark = page.locator('header a.logo').bounding_box()
                        self.assertGreaterEqual(wordmark['x'], 0)
                        self.assertLessEqual(wordmark['x']+wordmark['width'], width)
                    if width in [390, 1440] and theme == 'dark':
                        page.screenshot(path=str(ARTIFACTS / f'{width}px.png'))
                        if PORTAL:
                            page.locator('#g-rapporte > summary').evaluate("element => element.scrollIntoView({block:'start', behavior:'instant'})")
                            page.screenshot(path=str(ARTIFACTS / f'{width}px-cartes.png'))
                    context.close()

    def test_03_interactions(self):
        context = self.context()
        page = context.new_page()
        page.goto(self.base, wait_until='networkidle')
        if PORTAL:
            search = page.get_by_role('searchbox')
            search.fill('rénovation jantes')
            self.assertEqual(page.locator('.ap:not([hidden])').count(), 1)
            self.assertEqual(page.locator('.ap:not([hidden])').get_attribute('href'), 'https://velocemercato.fr/vm-location/')
            search.fill('introuvable-987654321')
            self.assertTrue(page.locator('#none').is_visible())
            self.assertFalse(page.locator('.feat').is_visible())
            search.fill('')
            page.get_by_role('button', name='Afficher la mosaïque').click()
            self.assertEqual(page.locator('#vGrid').get_attribute('aria-pressed'), 'true')
            page.reload(wait_until='networkidle')
            self.assertEqual(page.locator('#vGrid').get_attribute('aria-pressed'), 'true')
            page.locator('.portal-brand').click()
            self.assertEqual(page.url, self.base + '/')
            page.goto(self.base + '/?app=1#%E0%A4%A', wait_until='networkidle')
            self.assertEqual(urlsplit(page.url).netloc, urlsplit(self.base).netloc)
        else:
            page.locator('#feed .card').first.click()
            self.assertTrue(page.locator('#modal').is_visible())
            self.assertTrue(page.locator('#mTitle').inner_text().strip())
            page.locator('#mClose').click()
            self.assertFalse(page.locator('#modal').is_visible())
            page.locator('button[data-cat=MERCATO]').click()
            self.assertEqual(page.locator('button[data-cat=MERCATO]').get_attribute('aria-pressed'), 'true')
            self.assertGreater(page.locator('#feed .card').count(), 0)
            page.locator('header a.logo').click()
            self.assertEqual(page.url, self.base + '/')
            before = page.locator('html').get_attribute('data-theme')
            page.locator('#themeBtn').click()
            self.assertNotEqual(page.locator('html').get_attribute('data-theme'), before)
        context.close()

    def test_04_service_worker_offline_and_migration(self):
        context = self.context(workers='allow')
        page = context.new_page()
        page.goto(self.base + '/robots.txt')
        old = 'vmu-v2-static' if PORTAL else 'vm-app-v3'
        page.evaluate("""async old => {
          await (await caches.open(old)).put('/obsolete', new Response('ancienne version'));
          await (await caches.open('other-app-cache')).put('/unrelated', new Response('à conserver'));
        }""", old)
        page.goto(self.base, wait_until='networkidle')
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        keys = page.evaluate('caches.keys()')
        self.assertNotIn(old, keys)
        self.assertIn('other-app-cache', keys)
        new = 'vmu-v6' if PORTAL else 'vm-app-v6'
        self.assertIn(new, keys)
        if not PORTAL:
            page.evaluate("fetch('/articles.json').then(response => response.json())")
        cached = page.evaluate("async name => (await (await caches.open(name)).keys()).map(request=>request.url)", new)
        self.assertFalse(any('.json' in url or '/stats.html' in url for url in cached))
        self.assertTrue(all(url.startswith(self.base + '/') for url in cached))
        context.set_offline(True)
        response = page.goto(self.base + '/?app=1', wait_until='domcontentloaded')
        self.assertEqual(response.status, 200)
        self.assertEqual(page.locator('link[rel=canonical]').get_attribute('href'), f'https://{DOMAIN}/')
        response = page.goto(self.base + '/never-cached-page', wait_until='domcontentloaded')
        self.assertEqual(response.status, 503)
        self.assertIn('hors connexion', page.title())
        context.close()

    def test_05_generators_and_audience_removal(self):
        files = list(ROOT.rglob('*.html')) + list(ROOT.glob('*.py'))
        for path in files:
            if '.git' in path.parts:
                continue
            self.assertNotIn('vm-stats-', path.read_text(), str(path))
        if PORTAL:
            self.assertFalse((ROOT / 'sync.py').exists())
            self.assertNotIn('location.replace', (ROOT / 'index.html').read_text())
            self.assertNotIn('http-equiv="refresh"', (ROOT / 'index.html').read_text())
        else:
            import importlib.util
            spec = importlib.util.spec_from_file_location('vmbar', ROOT / 'vmbar.py')
            vmbar = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(vmbar)
            output = vmbar.inject('<html><head></head><body><main>Article de contrôle</main></body></html>', 'f')
            self.assertIn('href="https://vmunivers.fr/"', output)
            self.assertNotIn('vm-stats-', output)
            self.assertIn('Article de contrôle', output)


    def test_06_meteo_decouverte(self):
        if not PORTAL:
            self.skipTest('Page propre au portail')
        def weather(route):
            query = parse_qs(urlsplit(route.request.url).query)
            count = len(query['latitude'][0].split(','))
            days = int(query['forecast_days'][0])
            item = {'current': {'time': '2026-10-23T14:00', 'temperature_2m': 14.2, 'apparent_temperature': 12.9, 'weather_code': 3,
                                'wind_speed_10m': 11.0, 'relative_humidity_2m': 70},
                    'daily': {'time': [f'2026-10-{23 + d}' for d in range(days)], 'weather_code': [61] * days,
                              'temperature_2m_max': [16.0] * days, 'temperature_2m_min': [8.0] * days, 'precipitation_probability_max': [40] * days}}
            if 'hourly' in query:
                item['hourly'] = {'time': [f'2026-10-{23 + h // 24}T{h % 24:02d}:00' for h in range(days * 24)],
                                  'temperature_2m': [12.0] * days * 24, 'weather_code': [2] * days * 24, 'precipitation_probability': [10] * days * 24}
            route.fulfill(json=item if count == 1 else [item] * count)
        def geocode(route):
            route.fulfill(json={'results': [{'name': 'Belfort', 'latitude': 47.64, 'longitude': 6.86, 'admin1': 'Bourgogne-Franche-Comté', 'country': 'France'}]})
        for width in [320, 1440]:
            context = self.context(width, 'dark')
            context.route('https://api.open-meteo.com/**', weather)
            context.route('https://geocoding-api.open-meteo.com/**', geocode)
            context.route('https://velocemercato.fr/meteo/avis.json', lambda route: route.fulfill(json=[
                {'lieu': 'ballon-d-alsace', 'nom': 'Julie', 'note': 5, 'texte': 'Vue superbe <b>au</b> sommet.', 'photo': '../../app/univers-192.png', 'date': '23/10/2026'}]))
            context.route('https://velocemercato.fr/meteo/contributions.json', lambda route: route.fulfill(json=[
                {'region': 'Bourgogne-Franche-Comté', 'nom': 'Étang de test', 'ville': 'Champagney (70)', 'lat': 47.7, 'lon': 6.68, 'type': 'Nature', 'description': 'Fiche validée.', 'par': 'Léo'}]))
            context.add_init_script('window.vmMail = (subject, body) => { window.sent = {subject, body}; };')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(self.base + '/meteo/', wait_until='networkidle')
            self.assertEqual(page.locator('#villes .ville').count(), 16)
            self.assertIn('14°', page.locator('#villes .ville').first.inner_text())
            page.get_by_role('tab', name='🌍 Monde').click()
            page.wait_for_function("document.querySelectorAll('#villes .ville').length === 16 && document.querySelector('#villes .ville b').textContent === 'New York'")
            self.assertGreater(page.locator('#lieux .lieu').count(), 4)
            page.wait_for_function("[...document.querySelectorAll('#lieux .wx')].every(p => p.textContent.includes('14°'))")
            page.locator('#cats button', has_text='Nature').click()
            self.assertTrue(all(tag == 'Nature' for tag in page.locator('#lieux .tag').all_text_contents()))
            fiche = page.locator('.lieu', has_text='Étang de test')
            self.assertIn('Proposé par Léo', fiche.inner_text())
            ballon = page.locator('.lieu', has_text='Ballon d’Alsace')
            ballon.get_by_role('button', name='💬 Avis & photos (1)').click()
            self.assertIn('Vue superbe <b>au</b> sommet.', page.locator('#avisListe').inner_text())
            self.assertEqual(page.locator('#avisListe img').count(), 0)  # Chemin de photo non autorisé.
            page.locator('#avisForm [name=nom]').fill('Sam')
            page.locator('#avisForm [name=texte]').fill('Très beau coin, parking gratuit.')
            page.locator('#avisForm [type=checkbox]').check()
            page.locator('#avisForm [type=submit]').click()
            self.assertTrue(page.locator('#avisMerci').is_visible())
            sent = page.evaluate('window.sent')
            self.assertIn('Identifiant : ballon-d-alsace', sent['body'])
            page.locator('#avisBox [data-close]').click()
            page.locator('#ficheBtn').click()
            self.assertEqual(page.locator('#ficheRegion').input_value(), 'Bourgogne-Franche-Comté')
            page.locator('#ficheForm [name=lieu]').fill('Cascade du Rummel')
            page.locator('#ficheForm [name=ville]').fill('Seebach (68)')
            page.locator('#ficheForm [name=desc]').fill('Cascade en forêt, vingt minutes de marche.')
            page.locator('#ficheForm [name=nom]').fill('Julie')
            page.locator('#ficheForm [type=checkbox]').check()
            page.locator('#ficheForm [type=submit]').click()
            self.assertIn('nouveau lieu : Cascade du Rummel', page.evaluate('window.sent.subject'))
            page.locator('#ficheBox [data-close]').click()
            page.locator('#ville').fill('Belfort')
            page.get_by_role('button', name='Chercher').click()
            page.locator('#choix button').first.click()
            page.wait_for_selector('#detail .hours li')
            self.assertEqual(page.locator('#detail .hours li').count(), 24)
            self.assertEqual(page.locator('#detail .days li').count(), 7)
            self.assertIn('Belfort', page.locator('#detail h2').inner_text())
            self.assertEqual(page.evaluate('document.documentElement.scrollWidth'), width)
            self.assertFalse(errors, errors)
            page.screenshot(path=str(ARTIFACTS / f'meteo-{width}px.png'), full_page=True)
            context.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
