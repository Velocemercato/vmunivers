# VM Studio · paiement Stripe et CGV (issue velocemercato.fr #158)

> **Statut : PRÉPARÉ, NON ACTIVÉ.** La page `/professionnels/paiement.html` reste fermée tant que `assets/paiements.json` n'a pas `actif=true` **et** `cgv_validees=true`. Aucune clé, aucun secret ni aucune donnée bancaire n'est présent dans ce dépôt.

## 1. Audit de l'existant (4/11/2026)
| Élément | Présent ? | Où |
|---|---|---|
| Mentions légales (micro-entreprise, SIRET 528 102 916 00012, TVA non applicable selon l'art. 293 B du CGI, hébergeur) | ✅ | velocemercato.fr/mentions-legales.html |
| **Nom et prénom de l'entrepreneur individuel** (obligatoire) | ✅ Romain ORIEZ | Ajouté aux mentions légales le 4/11 |
| Politique de confidentialité | ✅ partielle | Mentions légales. **Ajouter** FormSubmit (formulaire de devis) et Stripe (paiement) comme prestataires |
| Tarifs | ✅ prix nets, TVA non applicable | vmunivers.fr/professionnels, velocemercato.fr/web-studio.html, /pub/ |
| **CGV** | ❌ absentes | Projet ci-dessous, **à faire valider** |
| **Droit de rétractation / remboursement** | ❌ absent | Dans les CGV |
| **Médiateur de la consommation** (obligatoire si clients particuliers) | ❌ absent | À choisir et à indiquer |
| Serveur pour des webhooks Stripe signés | ❌ aucun (sites statiques GitHub Pages) | D'où le choix des **Payment Links hébergés**, sans webhook |

## 2. Solution retenue : les liens de paiement Stripe (Payment Links)
- Créés **par le titulaire du compte Stripe**, dans son tableau de bord. Le site affiche seulement le lien public `https://buy.stripe.com/...`.
- Stripe héberge la page de paiement : cartes, 3-D Secure, reçus. **Aucune donnée de carte sur nos sites.**
- La page n'accepte **que** les liens `https://buy.stripe.com/`. Tout autre lien est ignoré (testé).
- **Paiement ponctuel** pour un acompte ou un solde de devis accepté. **Abonnement** pour l'entretien mensuel.
- **Preuve de paiement :** uniquement le tableau de bord Stripe ou l'email de Stripe. Le site ne déclare jamais « payé » et rien n'est livré automatiquement.

## 3. Étapes manuelles pour le titulaire Stripe (dans l'ordre)
1. Dans Stripe, passer en **mode test** (interrupteur « Mode test »).
2. Créer les **produits** : par exemple « Acompte site Starter », « Entretien mensuel » (récurrent). **Les montants viennent de tes devis**, pas du site.
3. Pour chaque produit, cliquer sur **Créer un lien de paiement**. Activer « Collecter l'adresse e-mail » et, si besoin, « Accepter les CGV » (case à cocher Stripe renvoyant vers l'URL des CGV).
4. Copier les liens test (`https://buy.stripe.com/test_...`) et me les envoyer **dans la conversation**. Ce sont des liens publics, pas des secrets.
5. Je les mets dans `assets/paiements.json` avec `actif=true`, `cgv_validees=true` (une fois les CGV validées) et `mode="test"`. La page affiche alors « 🧪 MODE TEST ».
6. **Faire des essais** avec la carte de test Stripe `4242 4242 4242 4242` (date future, n'importe quel CVC) : succès, refus (`4000 0000 0000 0002`), annulation (bouton retour), double clic, remboursement depuis le tableau de bord, et abonnement puis résiliation.
7. Vérifier les **emails** de Stripe (reçus) et ta notification de vente.
8. **Passage en réel** : recréer les liens en mode live, me les envoyer, et je passe `mode="live"`. **Seulement après ta validation écrite.**

## 4. Exclusions
- **Aucun paiement lié aux pronos, au VIP ou aux paris.** Stripe restreint ces activités, et l'ANJ les encadre : il faudrait une revue juridique explicite avant d'envisager quoi que ce soit.
- Aucune vente de prestation indisponible, aucun tarif inventé.

---

## 5. PROJET de conditions générales de vente VM Studio (À FAIRE VALIDER par un professionnel du droit avant publication)

**Article 1 – Vendeur.** VM Studio, activité de Romain ORIEZ, entrepreneur individuel (micro-entreprise), SIRET 528 102 916 00012, [adresse professionnelle], vminvest.fr@gmail.com. TVA non applicable, article 293 B du CGI.

**Article 2 – Objet.** Les présentes conditions s'appliquent aux prestations de VM Studio : création de sites, entretien, identité visuelle, supports imprimés et numériques, publicité sur les médias VM.

**Article 3 – Devis et commande.** Toute prestation fait l'objet d'un devis gratuit, valable [30] jours. La commande est ferme à l'acceptation écrite du devis (email) et, le cas échéant, au paiement de l'acompte prévu au devis.

**Article 4 – Prix.** Prix en euros, nets de taxe (TVA non applicable, art. 293 B du CGI). Le prix applicable est celui du devis accepté.

**Article 5 – Paiement.** Par carte via Stripe (lien de paiement sécurisé), ou par virement. Acompte de [X] % à la commande, solde à la livraison, sauf mention contraire au devis. Abonnements : prélèvement mensuel, résiliable à tout moment avec effet à la fin du mois en cours. Pour les professionnels, en cas de retard : pénalités au taux légal et indemnité forfaitaire de recouvrement de 40 €.

**Article 6 – Délais et livraison.** Les délais sont indiqués au devis et courent à réception des éléments fournis par le client (textes, photos, accès).

**Article 7 – Droit de rétractation (clients particuliers).** Le client consommateur dispose de 14 jours à compter de l'acceptation du devis pour se rétracter, sans motif, en écrivant à vminvest.fr@gmail.com. Si le client demande expressément que la prestation commence avant la fin de ce délai, il doit le montant correspondant au service déjà fourni. Le droit de rétractation ne s'applique pas à une prestation entièrement exécutée avec son accord préalable et sa renonciation expresse, ni aux biens confectionnés selon ses spécifications. Remboursement sous 14 jours par le même moyen de paiement.

**Article 8 – Propriété intellectuelle.** Les créations restent la propriété de VM Studio jusqu'au paiement complet. Elles sont ensuite cédées au client pour l'usage prévu au devis. VM Studio peut citer la réalisation dans son portfolio, sauf refus écrit du client.

**Article 9 – Responsabilité.** VM Studio est tenu d'une obligation de moyens. Le client garantit disposer des droits sur les éléments qu'il fournit.

**Article 10 – Données personnelles.** Les données servent uniquement à la gestion du devis, de la commande et de la facturation, et sont conservées pendant la durée légale. Prestataires : Stripe (paiement), FormSubmit (transmission du formulaire). Droit d'accès et d'effacement : vminvest.fr@gmail.com.

**Article 11 – Médiation (clients particuliers).** En cas de litige, le client peut recourir gratuitement au médiateur de la consommation : [NOM DU MÉDIATEUR, site, adresse, à choisir et à adhérer].

**Article 12 – Droit applicable.** Droit français. À défaut d'accord amiable, les tribunaux compétents sont ceux prévus par la loi.

> Les éléments entre crochets sont **à compléter par le propriétaire**. Le texte doit être **relu par un professionnel du droit** avant publication et avant l'activation des paiements.
