# z-checkbox

Une case à cocher bâtie sur [`z-element`](../../core/z-element/z-element.doc.md) — le
**premier composant à anatomie**. Deux parts : le **marker** (la case) et le **label**
(ton texte). Zoé n'injecte **aucune balise** : le marker est un `::before` peint par la
peau, le label reste ton light DOM. Structure figée → **skinnable** (Chemin A).

```html
<z-checkbox>J'accepte les conditions</z-checkbox>
<z-checkbox current>Déjà cochée</z-checkbox>
<z-checkbox disabled>Indisponible</z-checkbox>
```

## Cochée = `current`

Cocher, c'est poser une **sélection durable** : l'état `current`. Le composant le pose
lui-même au clic ou à <kbd>Espace</kbd> — jamais le socle (z-element ne touche pas
`current`, c'est le composant qui décide de ce qu'« être sélectionné » veut dire).

```js
box.checked = true;         // API : coche
box.checked;                // → true/false
box.addEventListener("change", () => console.log(box.checked));
```

Accessibilité : `role="checkbox"` + `aria-checked` suivent `current` tout seuls ;
<kbd>Espace</kbd> bascule (convention native).

## Anatomie & grammaire du pacte

Chaque part se peint par un token à **double séparateur** — c'est ce que z-button
(sans part) ne prouvait pas :

| Token | Peint |
|---|---|
| `--z-checkbox__gap` | l'écart marker ↔ label |
| `--z-checkbox--marker__size` | la taille de la case |
| `--z-checkbox--marker__border` | le contour |
| `--z-checkbox--marker__background` | le fond au repos |
| `--z-checkbox--marker__background-checked` | le fond une fois cochée |
| `--z-checkbox--check__color` | le carré qui zoome (blanc par défaut) |
| `--z-checkbox--label__weight` | le poids du label cochée |

Défauts qui **consomment la peau** (`--z-accent`, `--z-line`, `--z-radius`…) : marche
sur HighTech comme sur Claude sans une ligne de plus.

## Le geste

Au coché, la case se remplit d'accent et un **carré blanc zoome du fond** (un seul
`::before`, `background-size` 0 → 60 % en ressort). Le label s'épaissit **sans saut de
pixel** (faux-bold). Démo : `z-checkbox.demo.html` (+ sélecteur de peau).
