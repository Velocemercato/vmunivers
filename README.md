# VM Univers

Le portail indépendant de tous les projets VM : https://vmunivers.fr/.

`index.html` est la source du portail. Il n’est plus généré à partir du site football. Les logos et illustrations existants sont conservés dans `app/` et `assets/projects/` ; les cartes ouvrent explicitement les sites des projets.

Développement statique, sans étape de compilation :

```sh
python3 -m http.server 8101 --bind 127.0.0.1
```

Validation (Python 3.12, Chromium et Playwright) :

```sh
python3 -m pip install -r tests/requirements.txt
python3 tests/test_site.py
```

Le test utilise Chromium installé sur la machine, ou le navigateur Playwright par défaut. `VM_CHROMIUM_EXECUTABLE` permet de préciser son chemin ; `VM_TEST_ARTIFACTS` choisit le dossier des captures. Les serveurs de test sont temporaires et les services tiers sont bloqués pour éviter toute mesure ou action externe.

Voir [le diagnostic et la validation](docs/REVUE_IDENTITE.md) et [la proposition de statistiques privées](docs/STATISTIQUES_PRIVEES.md). Les captures se trouvent dans `docs/apercus/`.

Cette branche est destinée à une pull request. Sa fusion et la mise en production nécessitent l’autorisation du propriétaire.
