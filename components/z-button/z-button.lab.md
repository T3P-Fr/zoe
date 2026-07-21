# z-button — le carnet du labo

> **Statut : complété le 2026-07-21.** Ce fichier note ce qui a été ajouté, ce qui
> manquait sans qu'on le voie, et ce qui reste ouvert.

---

## Ce qui manquait — et qui ne se voyait pas

Le bouton avait l'air fini. Il ne l'était pas, et **c'est une démo qui l'a dénoncé** :
la section « formulaire » de `z-checkbox.demo.html` utilisait des `<button>` **natifs**
pour Envoyer et Réinitialiser. Une démo Zoé qui doit emprunter le bouton du navigateur,
c'est un aveu.

| Ce qui manquait | Pourquoi c'est grave |
|---|---|
| **le clavier** | `role="button"` + `tabindex` sans <kbd>Entrée</kbd> ni <kbd>Espace</kbd> : un lecteur d'écran annonce un bouton, et rien ne l'active. Le rôle était un mensonge. |
| **`type` / le formulaire** | aucun moyen d'envoyer un formulaire. Le socle savait le faire depuis le matin même (`formAssociated`), lui non. |
| **`disabled` qui laisse passer** | le clic remontait quand même : un parent qui écoute agissait sur un bouton mort. |

## Les décisions

**`requestSubmit()`, jamais `submit()`.** Seul le premier déclenche la **validation** et
l'événement `submit`. `submit()` saute les deux, en silence — c'est le genre de piège
qu'on ne trouve qu'en production, avec un formulaire qui part sans être validé.

**`type="submit"` est le défaut**, comme le bouton natif. Un bouton dans un formulaire
qui ne ferait rien par défaut serait une surprise, et les surprises se paient en heures.

**`disabled` coupe par `stopImmediatePropagation`.** Pas seulement « ne rien faire » :
l'événement ne doit pas exister pour les autres.

## Ce que la démo montre maintenant

Cinq sections, chacune avec **son code en face** (`examples/code.js`) : les états · les
calques · taille/ton/largeur · la séquence `loading → success` (que la doc promettait
sans jamais la montrer) · le formulaire complet.

Contrôle automatique : `z-button.lab.html`, en bas — **8/8 le 2026-07-21**. Il vérifie
ce qu'une capture ne prouve pas : le clavier, les trois `type`, et le refus du bouton
désactivé.

## Ce qui reste ouvert

- **`name` / `value`** — un bouton natif peut envoyer sa propre paire au formulaire
  (`<button name="action" value="delete">`). Pas fait : on n'en a pas encore eu besoin,
  et [[pas-de-plafond]] dit d'attendre le vrai cas plutôt que d'inventer l'API.
- **L'onde au clic** est encore dessinée dans `z-button.css`, comme dans z-checkbox et
  z-radio. Christophe a tranché qu'elle appartient à **z-contact** — déménagement non
  fait, noté ici pour ne pas l'oublier.
- **`@scope`** — testé le 2026-07-21, il fait ce que les chemins à rallonge font
  aujourd'hui (`z-button > z-layer[part=infos] > …`) en s'arrêtant tout seul à la
  frontière d'un composant imbriqué. Piste ouverte pour tous les CSS, non appliquée.
