# VM Univers : diagnostic et corrections à examiner

## Constats

- Le fichier `CNAME`, le lien canonique et le manifeste désignaient déjà `vmunivers.fr`. Aucune redirection automatique vers Véloce Mercato n’a été trouvée dans l’accueil. Une éventuelle redirection HTTP, un ancien raccourci installé ou un réglage de domaine ne peut donc pas être attribué au HTML actuel sans observation du site public.
- Le script `sync.py` copiait le portail de Véloce Mercato depuis un chemin propre à une autre machine (`/home/claude/...`). Il risquait d’écraser l’identité de VM Univers lors d’une synchronisation.
- Les illustrations, logos de cartes et l’image de partage dépendaient surtout du domaine football. La présentation commençait en petite mosaïque et pouvait masquer les descriptions.
- Les compteurs d’audience utilisaient les mêmes clés publiques que plusieurs autres sites VM, sans statistiques fiables par domaine.
- Le service worker essayait de précacher un logo inexistant, cachait des images de domaines tiers et effaçait des caches sans limiter la suppression à ceux de VM Univers.

## Corrections de la branche

- Portail autonome, titre et métadonnées VM Univers, navigation propre au portail et retour à l’accueil via les logos.
- Cartes détaillées par défaut, logos conservés, recherche insensible aux accents, catégories et mosaïque optionnelle accessible au clavier. Les 20 liens de projets existants sont conservés ; les deux projets en préparation restent indiqués comme tels.
- 35 illustrations et icônes copiées à l’identique depuis les dépôts existants, avec vérification binaire des copies. Aucune image originale n’a été retouchée. L’en-tête utilise le logo déjà présent dans ce dépôt.
- Les ressources visuelles du portail viennent du domaine VM Univers. Les liens de projets restent volontairement des liens vers leurs sites respectifs, sans redirection automatique de l’accueil.
- `index-7.html` conserve un lien explicite vers l’accueil de ce même domaine. Le script de copie `sync.py` est retiré pour éviter une régression.
- Cache `vmu-v3` limité au même domaine, ressources essentielles vérifiées, migration des anciens caches VM Univers, maintien des caches étrangers et page hors connexion explicite pour une URL inconnue.
- Suppression des appels d’audience publics. La mesure privée proposée dans `STATISTIQUES_PRIVEES.md` est désactivée tant qu’un prestataire n’est pas choisi et configuré.

## Validation locale

Commande reproductible : `python3 tests/test_site.py`.

Les tests couvrent les domaines déclarés, les liens internes et ressources locales, les 20 liens de projets et leurs logos, les huit combinaisons de largeur (320, 390, 768 et 1440 px) et de thème clair/sombre, l’absence de débordement et d’erreur JavaScript, la recherche, le changement de vue, le retour à l’accueil et les URL de raccourci d’application. Ils vérifient aussi l’installation du service worker, le retrait de l’ancien cache, la conservation d’un cache étranger, l’absence de cache des données JSON et le comportement hors connexion.

Les essais mobiles sont des émulations Chromium, pas des essais sur téléphones physiques. Les services tiers sont bloqués pendant les tests : les liens externes sont validés comme destinations, sans prétendre contrôler leur disponibilité publique. Les aperçus utilisent les polices système de repli lorsque les polices externes sont indisponibles.

Les accès HTTPS à `vmunivers.fr`, `velocemercato.fr` et `api.github.com` sont refusés par le proxy de cet environnement. La résolution DNS locale n’est pas disponible non plus. Le contrôle des redirections HTTP, du DNS, des certificats et des réglages GitHub Pages reste à faire lorsque cet accès sera autorisé. Aucun DNS, `CNAME` ou réglage de production n’est modifié par cette branche.

## Revue avant toute publication

Examiner les captures mobile et ordinateur dans `docs/apercus/`, la pull request et la proposition d’audience privée. La fusion et toute publication restent soumises à l’autorisation du propriétaire. Aucun chiffre d’audience n’est créé ou reconstitué.
