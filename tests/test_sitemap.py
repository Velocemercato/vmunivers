"""Validation SEO statique du sitemap et des canonicals VM Univers."""
from html.parser import HTMLParser
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
HOST = "vmunivers.fr"
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.robots = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonical.append(attrs.get("href", ""))
        if tag.lower() == "meta" and attrs.get("name", "").lower() == "robots":
            self.robots.append(attrs.get("content", "").lower())


def html_path(path):
    relative = path.lstrip("/")
    if not relative:
        return ROOT / "index.html"
    if relative.endswith("/"):
        return ROOT / relative / "index.html"
    return ROOT / relative


class SitemapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tree = ET.parse(ROOT / "sitemap.xml")
        cls.urls = [
            node.text.strip()
            for node in cls.tree.findall(".//sm:loc", NS)
            if node.text
        ]

    def test_sitemap_has_no_duplicates_and_only_vm_univers_urls(self):
        self.assertEqual(len(self.urls), len(set(self.urls)))
        self.assertTrue(self.urls)
        for url in self.urls:
            parsed = urlsplit(url)
            self.assertEqual(parsed.scheme, "https", url)
            self.assertEqual(parsed.netloc, HOST, url)
            self.assertFalse(parsed.query, url)
            self.assertFalse(parsed.fragment, url)

    def test_every_sitemap_page_exists_has_self_canonical_and_is_indexable(self):
        for url in self.urls:
            with self.subTest(url=url):
                path = html_path(urlsplit(url).path)
                self.assertTrue(path.is_file(), f"Page absente : {path}")
                parser = HeadParser()
                parser.feed(path.read_text(encoding="utf-8"))
                self.assertEqual(parser.canonical, [url])
                self.assertFalse(
                    any("noindex" in directive for directive in parser.robots),
                    f"Page noindex encore dans le sitemap : {url}",
                )

    def test_required_public_pages_are_discoverable(self):
        expected = {
            "https://vmunivers.fr/",
            "https://vmunivers.fr/decouvrir.html",
            "https://vmunivers.fr/meteo/",
            "https://vmunivers.fr/professionnels/",
            "https://vmunivers.fr/studio/reseaux.html",
            "https://vmunivers.fr/telechargements/",
            "https://vmunivers.fr/en/",
        }
        self.assertTrue(expected.issubset(set(self.urls)))

    def test_connect_preview_is_accessible_but_not_indexable(self):
        url = "https://vmunivers.fr/connect/"
        path = ROOT / "connect" / "index.html"
        self.assertTrue(path.is_file())
        self.assertNotIn(url, self.urls)
        parser = HeadParser()
        parser.feed(path.read_text(encoding="utf-8"))
        self.assertEqual(parser.canonical, [url])
        self.assertTrue(any("noindex" in rule for rule in parser.robots))


if __name__ == "__main__":
    unittest.main(verbosity=2)
