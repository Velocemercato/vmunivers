# Audit international — VM Univers
Date : 22 novembre 2026  
Périmètre : dépôt GitHub `Velocemercato/vmunivers`, branche de travail `audit-international-2026-11-22`.  
Statut : audit statique du dépôt. Ce document ne certifie pas l'état du portail en production.

## 1. Synthèse exécutive

VM Univers possède une identité de portail autonome, un accueil orienté vers les projets VM, une navigation, une page professionnelle et une entrée vers les services de création. La priorité est maintenant de transformer ce portail en véritable porte d'entrée commerciale et internationale, sans dénaturer son identité noire/or et sans perturber les projets reliés.

Le travail existant documente déjà des corrections importantes sur l'identité du portail, la recherche, les cartes, le service worker et la mesure d'audience. Il faut toutefois vérifier précisément quelle version est déployée et compléter la couverture SEO.

## 2. Éléments confirmés

- L'accueil déclare un titre, une description, un canonical vers `https://vmunivers.fr/`, Open Graph et une variante linguistique anglaise.
- Le portail présente les univers médias, services professionnels, projets et partenaires, avec des liens vers Véloce Mercato et VM Studio.
- Le dépôt contient une page professionnelle et des outils/services distincts du média football.
- `robots.txt` autorise l'exploration générale et déclare le sitemap.
- Le sitemap actuel contient **5 URL** : accueil, découverte, téléchargements, professionnels et anglais.
- La documentation `REVUE_IDENTITE.md` décrit des corrections de l'autonomie du portail, de la navigation, de la recherche, des ressources visuelles et du service worker. Elle précise que les contrôles DNS, HTTPS, redirections et réglages de production restent à effectuer.
- La documentation d'audience décrit le retrait d'anciens compteurs publics partagés et recommande deux mesures séparées, privées, pour les deux domaines. La nouvelle mesure Plausible n'est pas activée par cette documentation.
- Le code d'accueil contient une mesure Cloudflare Web Analytics propre au domaine. Un identifiant de beacon de collecte côté navigateur n'est pas un mot de passe ni une clé d'administration ; il ne faut pas le confondre avec un jeton API Cloudflare.

## 3. Risques et points à vérifier

### Priorité critique — cohérence de production
1. Vérifier que la version déployée correspond à la branche attendue et que le domaine principal ne redirige pas vers le site football.
2. Vérifier les redirections HTTP/HTTPS, www/non-www, certificat, DNS et règles Cloudflare.
3. Vérifier l'installation du service worker sur un téléphone réel : mise à jour, cache, navigation hors ligne, absence de ressources d'un autre domaine.
4. Vérifier tous les liens de l'accueil et les formulaires professionnels, y compris la réception des demandes.

### Priorité haute — SEO et international
1. Le sitemap ne référence actuellement que cinq URL. Vérifier l'ensemble des pages internes réellement destinées à Google et compléter le sitemap avec les pages canoniques utiles, sans inclure les outils privés, pages techniques, doublons ou pages sans valeur.
2. Vérifier que `/en/` est une véritable version anglaise et que les hreflang sont réciproques entre les pages française et anglaise.
3. Vérifier les métadonnées Open Graph et les images de partage propres à VM Univers, plutôt que de dépendre de visuels du média football.
4. Ajouter des données structurées Organization, WebSite et éventuellement Service uniquement si les informations sont exactes et visibles sur les pages.
5. Renforcer les liens internes entre les projets et leurs pages de présentation, sans transformer le portail en simple annuaire de liens externes.

### Priorité haute — conversion professionnelle
1. Faire de la page professionnelle une véritable page de vente : problèmes résolus, exemples concrets, étapes, délais réalistes, options et appel à l'action.
2. Vérifier le parcours de demande de site : formulaire, upload d'images, coordonnées, confirmation, notification et suivi.
3. Préparer une vitrine de réalisations avec autorisation des clients et données de contact vérifiées.
4. Ajouter une page partenaires/annonceurs avec offres distinctes et formulaire de contact.

## 4. Opportunités commerciales et internationales

- Positionner VM Univers comme maison-mère et studio numérique, et Véloce Mercato comme média spécialisé, avec des liens réciproques cohérents.
- Décliner les services en offres compréhensibles : site vitrine, refonte, identité visuelle, supports imprimés, communication et accompagnement.
- Préparer une version anglaise réellement traduite des pages stratégiques avant de promouvoir le site à l'international.
- Construire un portfolio démontrable : captures avant/après, cas clients autorisés, résultats vérifiables et témoignages authentiques.
- Proposer aux marques des partenariats éditoriaux séparés des prestations de création de sites.

## 5. Plan d'action recommandé

| Ordre | Action | Condition de validation |
|---|---|---|
| P0 | Vérification Cloudflare et production | Domaine, HTTPS, redirections et déploiement vérifiés |
| P0 | Test du formulaire professionnel | Demande reçue et notification confirmée |
| P1 | Cartographie des pages indexables | Sitemap complet, sans pages techniques |
| P1 | Contrôle version anglaise | Traduction, canonical et hreflang cohérents |
| P1 | Contrôle service worker mobile | Mise à jour et cache validés sur appareil réel |
| P2 | Optimisation page professionnelle | Offre, exemples et contact clairs |
| P2 | Portfolio et page partenaires | Réalisations autorisées et offres vérifiables |

## 6. Limites et sécurité

- Le dépôt consulté ne prouve pas la version actuellement servie par Cloudflare Pages.
- L'accès direct au site public, DNS, statistiques privées et configuration du compte Cloudflare n'a pas pu être validé depuis cet environnement.
- Les tests Chromium documentés ne remplacent pas un test sur téléphone réel.
- Aucun DNS, secret, compte, réglage de production ou facturation n'a été modifié.
- Aucune donnée d'audience ni aucun résultat commercial n'a été inventé.

## 7. Décision de sécurité

Cette branche ne contient que le présent rapport. Elle ne modifie pas `main` et ne déclenche pas de déploiement. Toute correction de code doit être proposée dans une branche distincte, testée, puis validée avant fusion.


## 8. Contrôle Metricool — instantané du 22 novembre 2026

Une lecture non destructive de Metricool a identifié une seule marque accessible, libellée `velocemercato`, avec fuseau `Europe/Paris`. Les connexions mélangent plusieurs univers : site web `vmunivers.fr`, Instagram et Threads `vmunivers.fr`, TikTok `velocemercato`, chaîne YouTube Véloce Mercato et Twitch. Cette configuration ne permet pas de considérer les statistiques agrégées comme un kit média fiable pour l'un ou l'autre site.

Aucune publication planifiée n'a été retournée pour cette marque entre le 22 et le 25 novembre 2026. Cela concerne le calendrier Metricool interrogé, pas nécessairement d'autres systèmes de publication.

Les métriques disponibles sont partielles et hétérogènes selon les réseaux. Elles ne doivent pas être additionnées entre plateformes ni présentées comme audience globale. Les valeurs brutes ne sont pas utilisées comme preuve d'audience commerciale.

**Action recommandée :** créer ou sélectionner des marques Metricool distinctes pour VM Univers et Véloce Mercato, rattacher chaque réseau au bon projet, vérifier les permissions, puis établir un tableau de bord séparé. Avant toute programmation, confirmer les contenus, les médias et le calendrier éditorial. Aucune publication n'a été créée ou envoyée pendant cet audit.
