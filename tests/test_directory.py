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
        self.assertEqual(page.locator('.ap').count(),29)
        titles=page.locator('.ap .ab b').all_text_contents();self.assertEqual(len(set(titles)),29)
        totals={'medias':4,'auto':2,'pro':2,'quotidien':16,'communaute':3,'bientot':2}
        for theme,total in totals.items():
            page.locator(f'.theme-chip[data-theme="{theme}"]').click()
            self.assertEqual(page.locator('.ap:not([hidden])').count(),total)
            self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
            self.assertTrue(page.locator('.grp:not([hidden])').get_attribute('open') is not None)
            self.assertEqual(page.locator(f'.theme-chip[data-theme="{theme}"]').get_attribute('aria-pressed'),'true')
            self.assertEqual(parse_qs(urlsplit(page.url).query)['theme'],[theme])
        context.close()

    def test_combined_search_reset_and_shared_url(self):
        context=self.context();page=context.new_page();page.goto(self.base+'/?utm_source=instagram',wait_until='networkidle')
        page.locator('.theme-chip[data-theme="auto"]').click();page.get_by_role('searchbox').fill('rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        self.assertIn('vmunivers',page.locator('link[rel=canonical]').get_attribute('href'))
        self.assertEqual(parse_qs(urlsplit(page.url).query)['utm_source'],['instagram'])
        page.reload(wait_until='networkidle');self.assertEqual(page.get_by_role('searchbox').input_value(),'rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        page.get_by_role('searchbox').fill('introuvable-9876');self.assertTrue(page.locator('#none').is_visible())
        page.locator('#resetFilters').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),29)
        self.assertFalse(page.locator('#none').is_visible());self.assertFalse(page.locator('#resetFilters').is_visible())
        context.close()

    def test_navigation_opens_selected_theme_after_collapse(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        page.locator('#toggleGroups').click();self.assertEqual(page.locator('.grp[open]').count(),0)
        page.locator('.portal-links a[href="#g-passion"]').click()
        self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
        self.assertEqual(page.locator('.ap:not([hidden])').count(),4)
        self.assertTrue(page.locator('#g-passion').get_attribute('open') is not None)
        page.locator('.portal-links a[href="#projets"]').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),29)
        context.close()

if __name__=='__main__':unittest.main(verbosity=2)
