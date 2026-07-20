# z-checkbox

Une case à cocher bâtie sur [`z-element`](../../core/z-element/z-element.doc.md) — le
**premier composant à anatomie**, et il s'écrit de **deux façons**. Zoé n'injecte
**aucune balise** (ADR-0018) : c'est toi — ou l'éditeur Zoé — qui choisis le niveau de
détail.

**Forme courte** — le CSS peint l'hôte, un `::before` fait la case :

```html
<z-checkbox>J'accepte les conditions</z-checkbox>
<z-checkbox current>Déjà cochée</z-checkbox>
<z-checkbox disabled>Indisponible</z-checkbox>
```

**Forme en calques** ([`z-layer`](../../core/z-layer/z-layer.doc.md)) — chaque pièce est
un élément, donc **animable seule** :

```html
<z-checkbox>
  <z-layer part="background"></z-layer>
  <z-layer part="marker"></z-layer>
  <z-layer part="ring"></z-layer>
  <z-layer part="dot"></z-layer>
  <z-layer part="label">J'accepte les conditions</z-layer>
</z-checkbox>
```

| Rôle | La pièce |
|---|---|
| `background` | le fond de toute la ligne (souvent transparent — il porte les effets) |
| `marker` | la case, sa surface |
| `ring` | son cerclage — animable seul (il peut tourner, pointiller) |
| `dot` | la marque qui apparaît une fois cochée |
| `label` | ton texte |
| `icon` | optionnel, avant le label |

Les deux formes lisent **exactement les mêmes tokens** : une skin écrite pour l'une
marche sur l'autre. Le comportement est identique — le JS ne sait même pas quelle forme
il porte. Ce que les calques débloquent : trois pièces, trois mouvements, **trois
horloges** dans une seule case (démo, section 3) — impossible avec un `::before` unique.

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
| `--z-checkbox--halo__color` | l'onde au clic (accent par défaut) |
| `--z-checkbox--label__weight` | le poids du label cochée |

Défauts qui **consomment la peau** (`--z-accent`, `--z-line`, `--z-radius`…) : marche
sur HighTech comme sur Claude sans une ligne de plus.

## Le geste

Au clic, un **halo** part de la case (l'onde `ripple`, la signature de Zoé — la même que
`z-button` et `z-radio`) ; lâché **dehors**, il est plus court : il dit « annulé ».
Puis, au coché, la case se remplit d'accent et un **carré blanc zoome du fond** (un seul
`::before`, `background-size` 0 → 60 % en ressort). Le label s'épaissit **sans saut de
pixel** (faux-bold). Démo : `z-checkbox.demo.html` (+ sélecteur de peau).
