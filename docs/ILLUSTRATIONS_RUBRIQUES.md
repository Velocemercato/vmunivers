# Cartes illustrées dans VM Univers

Cinq visuels locaux remplacent les fonds de présentation des cartes Recette du jour, VM Auto Particulier, Produits locaux, Sport & randonnée et Immobilier & vacances. Les logos, les destinations, les trente projets, leurs thèmes et leurs filtres sont conservés.

Les cinq WebP de 480 pixels sont sous `assets/illustrations/`. Les instructions de génération, l’origine image_gen intégré et la date du 23 octobre 2026 sont inscrites dans [provenance.json](../assets/illustrations/provenance.json). Une mention discrète précise le caractère illustratif et généré des visuels. Aucun logement ni professionnel réel n’est représenté par ces images.

La version du cache propre au portail passe à v7. L’isolation des caches est conservée. Aucun nouvel appel à un service d’images externe ni ajout de mesure d’audience.

Vérifications : chemins HTML et fonds modifiés valides, fichiers WebP décodés, dimensions vérifiées et `git diff --check` réussi. Le navigateur Chromium local se termine avec SIGTRAP dans cet environnement : le rendu des pages sur mobile et ordinateur reste à vérifier au navigateur avant fusion. Les images ont été inspectées visuellement.

L’intégration dans les pages thématiques est préparée dans le dépôt `Velocemercato/velocemercato.fr` sur la branche `codex/illustrations-rubriques`. Cette modification ne publie rien avant sa fusion.
