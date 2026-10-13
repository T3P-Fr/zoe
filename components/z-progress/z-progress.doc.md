# z-progress

Un envoi, une installation, une lecture : quand une tâche avance, l'utilisateur veut voir
**où elle en est** — ou, au moins, qu'elle vit. `z-progress` est cette barre, bâtie sur
[`z-element`](../../core/z-element/z-element.doc.md) : `role="progressbar"`, un
pourcentage publié que le CSS dessine, et un mode « inconnu » qui balaye.

```html
<z-progress value="40"></z-progress>
<z-progress value="3" max="5" tone="success"></z-progress>
<z-progress indeterminate></z-progress>
```

## En calques

```html
<z-progress value="40">
  <z-layer part="background"></z-layer>
  <z-layer part="marker"></z-layer>
</z-progress>
```

| Rôle | La pièce |
|---|---|
| `background` | la piste — le rail vide |
| `marker` | le remplissage — sa largeur est la progression |

En forme courte, l'hôte est la piste et un `::before` fait le remplissage. Les deux
formes lisent les mêmes tokens ([`z-layer`](../../core/z-layer/z-layer.doc.md)). Ce que
les calques permettent : animer le remplissage seul (une pulsation, un reflet) sans
toucher à la piste.

## `value` et `max`

`value / max` donne un ratio, borné à `[0, 1]`, posé en pourcentage dans
`--z-progress__value`. Le CSS en fait une largeur ; il ne calcule rien. `max` vaut 100
par défaut ; un `max` nul ou négatif est ignoré. Pas de `min` : une progression part de
zéro.

```js
barre.value = 72;        // l'attribut suit, le CSS redessine
barre.max = 200;
```

## Inconnu : `indeterminate`

Quand on ne sait pas encore combien, la largeur ne veut plus rien dire : un segment
(35 % de la piste) **balaye** en boucle. `indeterminate` est un état durable — attribut,
`:state(indeterminate)` et propriété disent la même chose :

```html
<z-progress indeterminate></z-progress>
```

```js
barre.indeterminate = true;    // ⟺ barre.setState("indeterminate")
barre.indeterminate = false;   // la largeur reprend son sens
```

Pendant ce temps `aria-valuenow` est **retiré** (WAI-ARIA : on ne prétend pas connaître
une valeur qu'on n'a pas) ; il revient dès que l'état tombe.

## Ton et taille

`tone` colore le remplissage via `--z-tone__fill` : `main` (l'accent, par défaut),
`success`, `danger`. `complement` et `soft` existent sur tout composant Zoé mais rendent
le remplissage quasi invisible (surface, transparent) : ils n'ont pas de sens pour une
barre. `size` règle la taille du texte ; la hauteur de la piste (`.5em`) suit.

## Progression, pas mesure

Une barre qui montre un **état** (batterie, stock, note) n'est pas une progression : c'est
[`z-meter`](../z-meter/z-meter.doc.md), avec ses seuils et son `role="meter"`.

## Accessibilité

`role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax` et `aria-valuenow` sont posés
et tenus à jour (`aria-valuenow` disparaît en `indeterminate`). Nommez la barre :
`aria-label` ou `aria-labelledby`. Elle n'est pas focusable et n'envoie rien à un
formulaire — c'est une sortie.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-progress__value` | la largeur du remplissage, en % — **posé par le JS**, à lire, pas à écrire |
| `--z-progress--track__height` | la hauteur de la piste (`.5em`) |
| `--z-progress--track__color` | la couleur de la piste — défaut `--z-surface-sunken` |
| `--z-progress--fill__color` | la couleur du remplissage — défaut le ton (`--z-tone__fill`, puis `--z-accent`) |

`track` et `fill` nomment les deux dessins de la barre ; en forme en calques, `track` est
le calque `background` et `fill` le calque `marker`. Le rayon vient de `--z-radius-pill`.

```css
z-progress { --z-progress--track__height: 1em; --z-progress--fill__color: var(--z-ink); }
```

## Le geste

La largeur du remplissage **glisse** (`--z-dur`, `--z-ease`) à chaque changement de
valeur : une barre que l'on fait avancer par paliers ne saute pas, elle coule. En
`indeterminate`, le segment traverse la piste de gauche à droite en 1,1 s, en boucle
(`@keyframes z-progress-sweep`). Démo : `z-progress.demo.html` (+ sélecteur de peau).
