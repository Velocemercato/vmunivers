Titre : VM Univers — portail autonome, cartes des projets et confidentialité

VM Univers dépendait des images et d’un script de copie du portail de Véloce Mercato. Les compteurs publics mélangeaient son audience avec celle des autres sites VM. Cette branche rend le portail autonome sur `vmunivers.fr`, avec ses ressources visuelles locales, des cartes détaillées, les logos actuels et une navigation accessible sur mobile.

Les 20 liens de projets sont conservés ; les deux projets en préparation restent explicitement signalés. Les illustrations ont été copiées sans modification binaire. Le manifeste et les domaines déclarés restent propres à VM Univers ; le service worker utilise un cache limité à son domaine et préserve les autres caches. Le script de copie et les appels de statistiques publics sont retirés.

La proposition d’audience privée recommande deux sites Plausible distincts, avec tableaux de bord privés, périodes jour/semaine/mois et tendances. Aucune collecte n’est activée et aucun abonnement n’est créé.

Validation : cinq tests de navigation, ressources, recherche, interactions et cache passent, avec huit combinaisons d’affichage de 320 à 1440 px en clair et sombre. Les mobiles sont émulés avec Chromium. Les appels tiers sont bloqués durant les tests ; le contrôle HTTP public et l’API GitHub restent inaccessibles depuis cet environnement.

- [Diagnostic et limites](https://github.com/Velocemercato/vmunivers/blob/codex/vm-univers-identite-confidentialite/docs/REVUE_IDENTITE.md)
- [Aperçus mobile et ordinateur](https://github.com/Velocemercato/vmunivers/blob/codex/vm-univers-identite-confidentialite/docs/apercus/README.md)
- [Statistiques privées : activation à décider](https://github.com/Velocemercato/vmunivers/blob/codex/vm-univers-identite-confidentialite/docs/STATISTIQUES_PRIVEES.md)

Revue uniquement. Ne pas fusionner ou publier sans autorisation explicite du propriétaire.
