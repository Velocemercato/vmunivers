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
        self.assertEqual(page.locator('.ap').count(),26)
        titles=page.locator('.ap .ab b').all_text_contents();self.assertEqual(len(set(titles)),26)
        totals={'medias':6,'pro':3,'quotidien':6,'local':6,'communaute':3,'bientot':2}
        self.assertEqual(sum(totals.values()),26)
        for theme,total in totals.items():
            chip=page.locator(f'#themeFilters [data-theme-filter="{theme}"]')
            self.assertIn(str(total),chip.inner_text())
            chip.click()
            self.assertEqual(page.locator('.ap:not([hidden])').count(),total)
            self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
            self.assertTrue(page.locator('.grp:not([hidden])').get_attribute('open') is not None)
            self.assertEqual(chip.get_attribute('aria-pressed'),'true')
            self.assertEqual(page.locator('#themeFilters [aria-pressed="true"]').count(),1)
            self.assertEqual(parse_qs(urlsplit(page.url).query)['theme'],[theme])
        page.locator('#themeFilters [data-theme-filter=""]').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),26)
        context.close()

    def test_old_theme_links_still_work(self):
        context=self.context();page=context.new_page()
        for url in ['/?theme=auto','/?theme=achats']:
            page.goto(self.base+url,wait_until='networkidle')
            self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
            self.assertTrue(page.locator('#g-local').is_visible())
        page.goto(self.base+'/#g-achats',wait_until='networkidle')
        self.assertTrue(page.locator('#g-local').get_attribute('open') is not None)
        self.assertEqual(page.get_by_role('searchbox').input_value(),'')
        context.close()

    def test_studio_banner_and_badges(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        banner=page.locator('#vm-studio')
        self.assertTrue(banner.is_visible())
        self.assertIn('VM STUDIO',banner.inner_text().upper());self.assertIn('290 €',banner.inner_text())
        # Vitrine (oct. 2026) : tout le bandeau mène aux offres VM Studio, prix affichés.
        self.assertEqual(banner.get_attribute('href'),'https://velocemercato.fr/web-studio.html#tarifs')
        self.assertIn('590 €',banner.inner_text());self.assertIn('990 €',banner.inner_text())
        self.assertNotIn('tel:',page.locator('#vitrine').inner_html())  # numéro retiré à la demande du propriétaire
        self.assertEqual(page.locator('.ap .bdg').count(),26)
        self.assertEqual(page.locator('#g-bientot .ap .bdg.b-soon').count(),2)  # Pépite FC lancé le 26/10
        context.close()

    def test_combined_search_reset_and_shared_url(self):
        context=self.context();page=context.new_page();page.goto(self.base+'/?utm_source=instagram',wait_until='networkidle')
        page.locator('#themeFilters [data-theme-filter="bientot"]').click();page.get_by_role('searchbox').fill('rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        self.assertIn('vmunivers',page.locator('link[rel=canonical]').get_attribute('href'))
        self.assertEqual(parse_qs(urlsplit(page.url).query)['utm_source'],['instagram'])
        page.reload(wait_until='networkidle');self.assertEqual(page.get_by_role('searchbox').input_value(),'rénovation jantes')
        self.assertEqual(page.locator('.ap:not([hidden])').count(),1)
        page.get_by_role('searchbox').fill('introuvable-9876');self.assertTrue(page.locator('#none').is_visible())
        page.locator('#resetFilters').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),26)
        self.assertFalse(page.locator('#none').is_visible());self.assertFalse(page.locator('#resetFilters').is_visible())
        context.close()

    def test_navigation_opens_selected_theme_after_collapse(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        self.assertEqual(page.locator('.grp[open]').count(),2)
        self.assertTrue(page.locator('#g-rapporte').get_attribute('open') is not None)
        self.assertTrue(page.locator('#g-gratuit').get_attribute('open') is not None)
        self.assertIsNone(page.locator('#g-passion').get_attribute('open'))
        page.locator('#toggleGroups').click();self.assertEqual(page.locator('.grp[open]').count(),6)
        page.locator('#toggleGroups').click();self.assertEqual(page.locator('.grp[open]').count(),0)
        page.locator('.portal-links a[href="#g-passion"]').click()
        self.assertEqual(page.locator('.grp:not([hidden])').count(),1)
        self.assertEqual(page.locator('.ap:not([hidden])').count(),6)
        self.assertTrue(page.locator('#g-passion').get_attribute('open') is not None)
        page.locator('.portal-links a[href="#projets"]').click();self.assertEqual(page.locator('.ap:not([hidden])').count(),26)
        context.close()

    def test_cleaned_directory_has_no_empty_or_duplicate_card(self):
        context=self.context();page=context.new_page();page.goto(self.base,wait_until='networkidle')
        self.assertIn('26 PROJETS',page.locator('.directory-heading .eyebrow').inner_text().upper())
        titles=page.locator('.ap .ab b').all_text_contents()
        for gone in ['VM Bons Plans','La Pastille en vrai','Sites métiers à tester','VM Boutique','VM Auto Particulier']:
            self.assertNotIn(gone,titles)
        self.assertEqual(page.locator('.ap.soon').count(),0)
        pro=page.locator('#g-local a.ap[href="https://velocemercato.fr/pro/"]')
        self.assertEqual(pro.count(),1);self.assertEqual(titles.count('VM Pro Local'),1)
        self.assertIn('Annuaire des artisans, commerces et pros de l’auto du secteur',pro.text_content())
        self.assertEqual(pro.locator('.bdg').text_content(),'Nouveau · inscription gratuite')
        self.assertFalse('is-soon' in pro.get_attribute('class'))
        for word in ['garagiste','caviste']:
            page.get_by_role('searchbox').fill(word)
            self.assertEqual(page.locator('.ap:not([hidden]) b').all_text_contents(),['VM Pro Local'])
        context.close()

    def test_professional_offers_folded_with_quick_links(self):
        for width in [320, 390, 1440]:
            context=self.context(width);page=context.new_page();page.goto(self.base,wait_until='networkidle')
            # Accueil rangé : deux accès rapides, l'espace pro replié
            self.assertTrue(page.locator('.pq-pro').is_visible());self.assertTrue(page.locator('.pq-free').is_visible())
            self.assertFalse(page.locator('#tarifs').is_visible())
            self.assertEqual(page.locator('#tarifs .tf').count(),6);self.assertEqual(page.locator('#demos .dm').count(),8)
            self.assertEqual(page.evaluate('document.documentElement.scrollWidth'),width)
            page.locator('.pq-pro').click()
            self.assertTrue(page.locator('#tarifs').is_visible());self.assertTrue(page.locator('#demos').is_visible())
            # Gamme oct. 2026 : 4 packs à prix fixe + maintenance facultative 29/59 €.
            self.assertIn('1 490 €',page.locator('#tarifs .tf',has_text='Max').first.inner_text())
            self.assertIn('29 € ou 59 €',page.locator('#tarifs .tf',has_text='Maintenance').inner_text())
            tops=page.evaluate("""['#tarifs','#demos','#apps'].map(s=>document.querySelector(s).getBoundingClientRect().top)""")
            self.assertLess(tops[0],tops[1]);self.assertLess(tops[1],tops[2])
            context.close()

    def test_bottom_pro_link_opens_space_and_free_link_filters(self):
        context=self.context(390);page=context.new_page();page.goto(self.base,wait_until='networkidle')
        page.locator('.portal-pro-actions a[href="#tarifs"]').click()
        self.assertTrue(page.locator('#tarifs').is_visible())
        page.goto(self.base+'?theme=quotidien#projets',wait_until='networkidle')
        visibles=page.locator('.ap:not([hidden]) .ab b').all_text_contents()
        self.assertIn('VM CV',visibles);self.assertIn('VM Emploi',visibles);self.assertNotIn('VM Studio',visibles)
        context.close()

if __name__=='__main__':unittest.main(verbosity=2)
