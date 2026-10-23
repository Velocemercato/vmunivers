"""Parcours de l'annuaire : thèmes, recherche combinée et liens partagés."""
import unittest
from urllib.parse import urlsplit,parse_qs
import test_site as site

class DirectoryTests(unittest.TestCase):
    setUpClass=classmethod(site.SiteTests.setUpClass.__func__)
    tearDownClass=classmethod(site.SiteTests.tearDownClass.__func__)
    context=site.SiteTests.context

    def test_themes_preserve_every_project_and_count(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        self.assertEqual(page.locator('.grp').count(),6)
        self.assertEqual(page.locator('.ap').count(),30)
        titles=page.locator('.ap .ab b').all_text_contents();self.assertEqual(len(set(titles)),30)
        totals={'medias':4,'auto':2,'pro':3,'quotidien':16,'communaute':3,'bientot':2}
        for theme,total in totals.items():
            page.get_by_role('combobox',name='Choisir un thème').select_option(theme)
            self.assertEqual(page.locator('.ap:not([hidden])').count(),total)
            self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
            self.assertTrue(page.locator('.grp:not([hidden])').get_attribute('open') is not None)
            self.assertEqual(page.get_by_role('combobox',name='Choisir un thème').input_value(),theme)
            self.assertEqual(parse_qs(urlsplit(page.url).query)['theme'],[theme])
        context.close()

    def test_combined_search_reset_and_shared_url(self):
        context=self.context();page=context.new_page();page.goto(self.base+'/?utm_source=instagram',wait_until='networkidle')
        page.get_by_role('combobox',name='Choisir un thème').select_option('auto');page.get_by_role('searchbox').fill('rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        self.assertIn('vmunivers',page.locator('link[rel=canonical]').get_attribute('href'))
        self.assertEqual(parse_qs(urlsplit(page.url).query)['utm_source'],['instagram'])
        page.reload(wait_until='networkidle');self.assertEqual(page.get_by_role('searchbox').input_value(),'rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        page.get_by_role('searchbox').fill('introuvable-9876');self.assertTrue(page.locator('#none').is_visible())
        page.locator('#resetFilters').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),30)
        self.assertFalse(page.locator('#none').is_visible());self.assertFalse(page.locator('#resetFilters').is_visible())
        context.close()

    def test_navigation_opens_selected_theme_after_collapse(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        self.assertEqual(page.locator('.grp[open]').count(),0)
        page.locator('#toggleGroups').click();self.assertEqual(page.locator('.grp[open]').count(),6)
        page.locator('#toggleGroups').click();self.assertEqual(page.locator('.grp[open]').count(),0)
        page.locator('.portal-links a[href="#g-passion"]').click()
        self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
        self.assertEqual(page.locator('.ap:not([hidden])').count(),4)
        self.assertTrue(page.locator('#g-passion').get_attribute('open') is not None)
        page.locator('.portal-links a[href="#projets"]').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),30)
        context.close()

    def test_professional_offers_stay_compact_and_hash_links_open_them(self):
        for width in [320, 390, 1440]:
            context=self.context(width);page=context.new_page();page.goto(self.base,wait_until='networkidle')
            self.assertFalse(page.locator('#offres-pro').evaluate('node => node.open'))
            page.locator('.portal-pro-actions a[href="#tarifs"]').click()
            self.assertTrue(page.locator('#tarifs').is_visible())
            self.assertEqual(page.locator('#tarifs .tf').count(),6)
            self.assertEqual(page.evaluate('document.documentElement.scrollWidth'),width)
            page.goto(self.base+'/#demos',wait_until='networkidle')
            self.assertTrue(page.locator('#demos').is_visible())
            self.assertEqual(page.locator('#demos .dm').count(),8)
            self.assertEqual(page.evaluate('document.documentElement.scrollWidth'),width)
            context.close()

if __name__=='__main__':unittest.main(verbosity=2)
