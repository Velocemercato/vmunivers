"""Paiement d'un devis validé : liens Stripe hébergés uniquement, fermé par défaut, mode test visible."""
import json
import unittest
import test_site as site


class PaiementTests(unittest.TestCase):
    setUpClass = classmethod(site.SiteTests.setUpClass.__func__)
    tearDownClass = classmethod(site.SiteTests.tearDownClass.__func__)
    context = site.SiteTests.context
    PATH = '/professionnels/paiement.html'

    def page_with(self, config):
        if not site.PORTAL:
            self.skipTest('Page propre au portail')
        context = self.context()
        if config is not None:
            context.route('**/assets/paiements.json', lambda r: r.fulfill(
                status=200, content_type='application/json', body=json.dumps(config)))
        page = context.new_page()
        page.goto(self.base + self.PATH, wait_until='networkidle')
        return context, page

    def test_closed_by_default_with_real_config(self):
        context, page = self.page_with(None)
        self.assertIn('pas encore ouvert', page.locator('[data-paiements-etat]').inner_text())
        self.assertEqual(page.locator('.pay-card').count(), 0)
        self.assertEqual(page.locator('meta[name=robots]').get_attribute('content'), 'noindex')
        context.close()

    def test_needs_cgv_validation_and_activation(self):
        lien = {'titre': 'Acompte site Starter', 'prix': '177 €', 'url': 'https://buy.stripe.com/test_abc123'}
        for config in ({'actif': True, 'cgv_validees': False, 'liens': [lien]},
                       {'actif': False, 'cgv_validees': True, 'liens': [lien]}):
            context, page = self.page_with(config)
            self.assertEqual(page.locator('.pay-card').count(), 0)
            context.close()

    def test_test_mode_shows_stripe_links_and_badge(self):
        context, page = self.page_with({'actif': True, 'cgv_validees': True, 'mode': 'test', 'liens': [
            {'titre': 'Acompte site Starter', 'prix': '177 €', 'url': 'https://buy.stripe.com/test_abc123'},
            {'titre': 'Entretien mensuel', 'prix': '29 €/mois', 'type': 'abonnement', 'url': 'https://buy.stripe.com/test_def456'}]})
        self.assertIn('MODE TEST', page.locator('[data-paiements-etat]').inner_text())
        self.assertEqual(page.locator('.pay-card').count(), 2)
        self.assertEqual(page.locator('.pay-card a').first.get_attribute('href'), 'https://buy.stripe.com/test_abc123')
        self.assertIn('S’abonner', page.locator('.pay-card a').nth(1).inner_text())
        context.close()

    def test_rejects_non_stripe_and_injected_links(self):
        context, page = self.page_with({'actif': True, 'cgv_validees': True, 'mode': 'live', 'liens': [
            {'titre': 'Faux', 'url': 'https://evil.example/buy'},
            {'titre': 'Script', 'url': 'javascript:alert(1)'},
            {'titre': 'Mot de passe', 'url': 'https://user:pass@buy.stripe.com/abc'},
            {'titre': '<img src=x onerror=alert(1)>', 'url': 'https://buy.stripe.com/live_ok1'}]})
        self.assertEqual(page.locator('.pay-card').count(), 1)
        self.assertEqual(page.locator('.pay-card img').count(), 0)
        self.assertIn('<img', page.locator('.pay-card h3').inner_text())
        self.assertNotIn('MODE TEST', page.locator('[data-paiements-etat]').inner_text())
        context.close()


if __name__ == '__main__':
    unittest.main(verbosity=2)
