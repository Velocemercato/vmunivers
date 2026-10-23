# VM Météo & Découverte : avis, photos et fiches des visiteurs

Une seule liste, celle de velocemercato.fr : `meteo/avis.json`, `meteo/contributions.json` et `meteo/photos/` dans le dépôt velocemercato.fr. La page vmunivers.fr/meteo/ lit ces fichiers à la même adresse : valider sur velocemercato.fr suffit pour les deux sites.

Rien n’est publié automatiquement. Chaque proposition arrive par e-mail sur `velocemercato.fr@gmail.com`, avec les photos jointes par le visiteur.

## Valider un avis
1. Vérifier le texte et la photo (pas de visage reconnaissable sans accord, pas de plaque d’immatriculation, pas de publicité).
2. Enregistrer la photo en `.webp` ou `.jpg`, 1600 px de large maximum, dans `meteo/photos/` (dépôt velocemercato.fr) (nom en minuscules, sans espace).
3. Ajouter une ligne dans `meteo/avis.json` (dépôt velocemercato.fr) en reprenant l’« Identifiant » de l’e-mail :

```json
[
  {"lieu": "ballon-d-alsace", "nom": "Romain", "note": 5, "texte": "Vue superbe au lever du soleil.", "photo": "photos/ballon-romain.webp", "date": "23/10/2026"}
]
```

## Valider une fiche de lieu
Ajouter le lieu dans `meteo/contributions.json`. `region` doit reprendre exactement le nom affiché sur le site ; `lat` et `lon` se lisent sur une carte (clic droit dans Google Maps ou OpenStreetMap).

```json
[
  {"region": "Grand Est", "nom": "Cascade du Rummel", "ville": "Seebach (68)", "lat": 47.931, "lon": 6.996, "type": "Nature", "description": "Cascade en forêt, 20 min de marche.", "photo": "photos/rummel.webp", "par": "Julie"}
]
```

Refuser : contenu faux, injurieux, publicitaire, photos prises sans droit ou montrant des personnes sans leur accord. Un visiteur peut demander la suppression de son avis par e-mail.
