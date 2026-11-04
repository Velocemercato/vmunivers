"""Parcours professionnel : choix d'offre, envoi réel confirmé seulement après succès, brouillon de secours."""
import unittest
from urllib.parse import urlsplit, parse_qs
import test_site as site

class ProfessionalTests(unittest.TestCase):
    setUpClass = classmethod(site.SiteTests.setUpClass.__func__)
    tearDownClass = classmethod(site.SiteTests.tearDownClass.__func__)
    context = site.SiteTests.context
    paths = ['/professionnels/'] if site.PORTAL else ['/web-studio.html', '/pub/']

    def test_home_exposes_studio_and_preserves_identity(self):
        context = self.context(); page = context.new_page()
        page.goto(self.base, wait_until='networkidle')
        if site.PORTAL:
            self.assertTrue(page.locator('.portal-links a[href="/professionnels/"]').is_visible())
            page.get_by_role('searchbox').fill('cartes visite')
            self.assertEqual(page.locator('.ap:not([hidden])').count(), 1)
            self.assertEqual(page.locator('.ap:not([hidden])').get_attribute('href'), '/professionnels/')
            self.assertEqual(page.locator('.grp .gapps .gapps').count(), 0)
        else:
            self.assertTrue(page.locator('.vmbar a[href="/web-studio.html"]').is_visible())
            self.assertIn('football', page.title().lower())
            self.assertIn('cartes de visite', page.locator('.promo-entry').inner_text())
        context.close()

    def test_offer_shortcuts_and_prefilled_url(self):
        context = self.context(); page = context.new_page()
        for path in self.paths:
            value = 'local' if path == '/pub/' else 'cartes'
            page.goto(self.base + path + '?offre=' + value + '#devis', wait_until='networkidle')
            self.assertEqual(page.locator('select[name=service]').input_value(), value)
            for link in page.locator('a[data-offer]').all():
                expected = link.get_attribute('data-offer')
                link.click()
                self.assertEqual(page.locator('select[name=service]').input_value(), expected)
        context.close()

    ENDPOINT = 'https://formsubmit.co/ajax/vminvest.fr@gmail.com'

    def fill(self, page, consent=True):
        page.locator('input[name=nom]').fill('Atelier Test & Fils')
        page.locator('input[name=email]').fill('client@example.org')
        page.locator('input[name=ville]').fill('Belfort')
        page.locator('textarea[name=besoin]').fill('Carte recto / verso — été & création <test>.')
        if consent:
            page.locator('input[name=consentement]').check()
        page.wait_for_timeout(3100)  # délai anti-robot du formulaire

    def studio(self, reply):
        context = self.context(); calls = []
        def handler(route):
            calls.append(route.request)
            route.fulfill(**reply) if reply else route.abort()
        context.route(self.ENDPOINT, handler)
        page = context.new_page()
        page.goto(self.base + self.paths[0], wait_until='networkidle')
        return context, page, calls

    def test_send_confirms_only_after_real_success(self):
        if not site.PORTAL: self.skipTest('Envoi réel propre au portail')
        context, page, calls = self.studio({'json': {'success': 'true', 'message': 'ok'}})
        self.fill(page)
        page.get_by_role('button', name='Envoyer ma demande').click()
        page.locator('[data-pro-sent].ok').wait_for()
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0].method, 'POST')
        payload = calls[0].post_data_json
        self.assertEqual(payload['nom'], 'Atelier Test & Fils')
        self.assertEqual(payload['email'], 'client@example.org')
        self.assertEqual(payload['projet'], 'Carte recto / verso — été & création <test>.')
        self.assertEqual(payload['consentement'], 'oui')
        self.assertEqual(payload['_honey'], '')
        self.assertIn('Demande envoyée', page.locator('[data-pro-sent]').inner_text())
        self.assertEqual(page.locator('input[name=nom]').input_value(), '')
        self.assertTrue(page.locator('[data-pro-send]').is_disabled())
        self.assertEqual(page.evaluate('Object.keys(localStorage).length + Object.keys(sessionStorage).length'), 0)
        self.assertEqual(page.evaluate('document.cookie'), '')
        context.close()

    def test_failure_never_confirms_and_offers_mail_draft(self):
        if not site.PORTAL: self.skipTest('Envoi réel propre au portail')
        for reply in ({'json': {'success': 'false', 'message': 'This form needs Activation.'}},
                      {'status': 500, 'body': 'erreur'}, None):
            context, page, calls = self.studio(reply)
            self.fill(page)
            page.get_by_role('button', name='Envoyer ma demande').click()
            page.locator('[data-pro-sent].err').wait_for()
            self.assertNotIn('Demande envoyée', page.locator('[data-pro-sent]').inner_text())
            self.assertTrue(page.locator('[data-pro-result]').is_visible())
            parts = urlsplit(page.locator('[data-pro-mail]').get_attribute('href'))
            self.assertEqual(parts.path, 'vminvest.fr@gmail.com')
            body = parse_qs(parts.query)['body'][0]
            self.assertIn('Atelier Test & Fils', body)
            self.assertIn('client@example.org', body)
            self.assertEqual(page.locator('input[name=nom]').input_value(), 'Atelier Test & Fils')
            self.assertFalse(page.locator('[data-pro-send]').is_disabled())
            context.close()

    def test_antispam_and_consent_block_sending(self):
        if not site.PORTAL: self.skipTest('Envoi réel propre au portail')
        context, page, calls = self.studio({'json': {'success': 'true'}})
        self.fill(page, consent=False)
        page.get_by_role('button', name='Envoyer ma demande').click()
        self.assertFalse(page.locator('input[name=consentement]').evaluate('e => e.checkValidity()'))
        page.locator('input[name=consentement]').check()
        page.locator('input[name=email]').fill('pas-un-email')
        page.get_by_role('button', name='Envoyer ma demande').click()
        self.assertFalse(page.locator('input[name=email]').evaluate('e => e.checkValidity()'))
        page.locator('input[name=email]').fill('client@example.org')
        page.evaluate("document.querySelector('input[name=_honey]').value = 'robot'")
        page.get_by_role('button', name='Envoyer ma demande').click()
        page.wait_for_timeout(500)
        self.assertEqual(len(calls), 0)
        self.assertTrue(page.locator('[data-pro-sent]').is_hidden())
        box = page.locator('.pro-hp').bounding_box()
        self.assertLess(box['x'] + box['width'], 0)  # piège placé hors écran, invisible pour un humain
        context.close()
        # Envoi trop rapide (moins de 3 s) : refusé avec un message, sans requête.
        context, page, calls = self.studio({'json': {'success': 'true'}})
        page.locator('input[name=nom]').fill('Rapide'); page.locator('input[name=email]').fill('a@b.fr')
        page.locator('textarea[name=besoin]').fill('Test'); page.locator('input[name=consentement]').check()
        page.get_by_role('button', name='Envoyer ma demande').click()
        self.assertEqual(len(calls), 0)
        self.assertIn('relire', page.locator('[data-pro-sent]').inner_text())
        context.close()

    def test_copy_fallback_and_offer_change_invalidate_draft(self):
        if not site.PORTAL: self.skipTest('Brouillon de secours propre au portail')
        context, page, calls = self.studio(None)
        self.fill(page)
        page.get_by_role('button', name='Envoyer ma demande').click()
        page.locator('[data-pro-result]').wait_for()
        page.evaluate("Object.defineProperty(navigator, 'clipboard', {value: {writeText: () => Promise.reject(new Error('indisponible'))}, configurable:true})")
        page.get_by_role('button', name='Copier la demande').click()
        self.assertIn('Sélectionnez Copier', page.locator('[data-pro-status]').inner_text())
        self.assertIn('Atelier Test & Fils', page.evaluate('getSelection().toString()'))
        page.locator('a[data-offer]').first.click()
        self.assertTrue(page.locator('[data-pro-result]').is_hidden())
        context.close()

    def test_email_available_without_javascript(self):
        context = self.browser.new_context(java_script_enabled=False)
        context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(self.base + '/') else r.abort())
        page = context.new_page()
        for path in self.paths:
            page.goto(self.base + path, wait_until='networkidle')
            self.assertTrue(page.locator('a.pro-mail[href="mailto:vminvest.fr@gmail.com"]').is_visible())
            self.assertIn('Écrivez directement', page.locator('noscript').inner_text())
        context.close()

    def test_portfolio_previews_fit_their_cards(self):
        for width in [390, 1440]:
            context = self.context(width); page = context.new_page()
            page.goto(self.base + self.paths[0], wait_until='networkidle')
            self.assertGreater(page.locator('.pro-work > img').count(), 0)
            for image in page.locator('.pro-work > img').all():
                box = image.bounding_box()
                self.assertGreater(box['height'], 0)
                self.assertLessEqual(box['height'], box['width'] + 1)
            context.close()

if __name__ == '__main__': unittest.main(verbosity=2)
