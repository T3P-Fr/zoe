# z-segmented

Trois vues, une seule active : un `<select>` les cacherait, des boutons séparés ne
diraient pas qu'elles s'excluent. `z-segmented` est la **pilule** à choix unique, bâtie
sur [`z-element`](../../core/z-element/z-element.doc.md) : vos boutons, et un indicateur
qui **glisse** sous le choix — le mouvement dit *quand* ça a changé, là où la couleur
seule ne suffit pas.

```html
<z-segmented value="mois">
  <button part="segment" value="jour">Jour</button>
  <button part="segment" value="mois">Mois</button>
  <button part="segment" value="an">Année</button>
</z-segmented>
```

## Ce que vous écrivez

Les segments sont des **`<button>` natifs** portant `part="segment"` et une `value` — pas
des calques : un bouton sait déjà recevoir le focus et le clic, et le lexique nomme la
pièce sans la remplacer. Écrivez-en de deux à cinq : au-delà, une pilule ne se lit plus.
Le composant les retrouve (`.segments`) et ignore ceux d'une pilule imbriquée.

`value` sur l'hôte **présélectionne** ; le composant le tient ensuite à jour, pour que
`[value="mois"]` reste vrai en CSS comme en HTML. Zoé n'injecte rien (ADR-0018) : pas de
segment ajouté, pas d'indicateur dans le DOM.

## Exclusivité et valeur

Un seul segment courant à la fois : il porte `aria-checked="true"` et
`aria-current="true"`, posés par le composant.

```js
pilule.value;              // → "mois"   ("" si rien n'est choisi)
pilule.value = "an";       // choisit SANS émettre — c'est le programme qui parle
pilule.selected;           // → le <button> courant, ou null
pilule.segments;           // → les <button part="segment">
pilule.addEventListener("change", (e) => e.detail.value);
```

`change` bulle avec `{ value }`, et seulement pour un **geste** qui change le choix :
recliquer le segment courant n'émet rien, poser `.value` non plus.

## L'indicateur glisse

Le JS **mesure** le segment courant (`offsetLeft`, `offsetWidth`) et publie deux nombres
en pixels : `--z-segmented__x` et `--z-segmented__w`. L'indicateur est un `::after` de
l'hôte qui se déplace en `translate` (composé : pas de reflow) et épouse la largeur, au
ressort (`--z-dur-select`, `--z-ease-spring`). Aucune pièce déplacée à la main.

Un `ResizeObserver` le replace si la pilule change de taille (police chargée, fenêtre
redimensionnée) ; un `MutationObserver` resynchronise si vous ajoutez ou retirez des
segments. Sans choix, l'indicateur a une largeur nulle : il n'a rien à montrer.

## Clavier

La pilule est **un seul arrêt** de tabulation (roving tabindex) : le segment courant
porte le focus, les autres s'atteignent aux flèches — cinq segments ne font pas cinq
tabulations.

| Touche | |
|---|---|
| <kbd>→</kbd> <kbd>↓</kbd> | le suivant — et le **choisit** (dans un `radiogroup`, naviguer c'est choisir) |
| <kbd>←</kbd> <kbd>↑</kbd> | le précédent, idem |
| <kbd>Début</kbd> · <kbd>Fin</kbd> | le premier · le dernier |

Le parcours est circulaire ; les segments `disabled` sont sautés ; la page ne défile pas
sous les flèches.

## `disabled`

Sur l'hôte : plus de clic, plus de clavier, aucun segment tabulable, et tout s'éteint
(`--z-disabled`, opacité .55). Sur un seul `<button disabled>` : il est sauté par les
flèches et le roving ; le navigateur, lui, refuse déjà son clic.

## Accessibilité

`role="radiogroup"` sur l'hôte, `role="radio"` et `aria-checked` sur chaque segment : un
choix unique, annoncé comme tel. Le focus clavier pose un halo sur le segment visé
(`:focus-visible`, `--z-accent` à 40 %), jamais l'outline natif. Nommez le groupe :
`aria-label="Période"`. Si vous écrivez `role` sur l'hôte, il est respecté.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-segmented__x` · `--z-segmented__w` | position et largeur du segment courant, en px — **posés par le JS**, à lire |
| `--z-segmented__pad` | la marge intérieure de la pilule (`.25em`) — aussi celle de l'indicateur |
| `--z-segmented__gap` | l'écart entre segments (`0`) |
| `--z-segmented--background__color` | le fond de la pilule — défaut `--z-surface-sunken` |
| `--z-segmented--indicator__color` | la pastille qui glisse — défaut `--z-surface-raised` |
| `--z-segmented--indicator__shadow` | son ombre |
| `--z-segmented--segment__pad` | la marge intérieure d'un segment (`.5em 1.1em`) |
| `--z-segmented--segment__ink` | l'encre du segment courant — défaut `--z-ink` |

`indicator` nomme le dessin qui glisse (un `::after`, pas un calque). Le rayon vient de
`--z-radius-pill` ; le repos des segments lit `--z-ink-soft`, le survol `--z-ink`.

```css
.pleine {
  --z-segmented--indicator__color: var(--z-accent);
  --z-segmented--segment__ink: var(--z-accent-ink);
}
```

## Le geste

L'indicateur **glisse** et se redimensionne au ressort (`--z-dur-select`,
`--z-ease-spring`) ; l'encre du segment visé s'allume au survol et s'épaissit une fois
choisi (`--z-dur`). À l'apparition, `pop`. Démo : `z-segmented.demo.html` (+ sélecteur
de peau).
