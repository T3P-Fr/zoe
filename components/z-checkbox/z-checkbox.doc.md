# z-checkbox

Une case à cocher. Elle a trois valeurs (cochée, décochée, indéterminée), elle part
dans le formulaire comme une case native, et elle vit : survol, appui, onde au clic,
erreur, succès, sans une ligne de votre part.

```html
<z-checkbox>J'accepte les conditions</z-checkbox>
<z-checkbox current>Déjà cochée</z-checkbox>
<z-checkbox disabled>Indisponible</z-checkbox>
```

Une ligne à écrire : votre texte. La case elle-même et sa zone tactile sont **peintes**
par le CSS, jamais à taper.

## Utiliser

| Vous voulez | Vous écrivez |
|---|---|
| une case | `<z-checkbox>Votre texte</z-checkbox>` |
| cochée d'avance | ajoutez `current` |
| ni cochée ni décochée (un « tout cocher » partagé) | ajoutez `indeterminate` |
| qu'elle parte dans le formulaire | `name="cgu"` (et `value`, sinon `on`) |
| obligatoire | `required` |
| une icône avant le texte | `<z-checkbox><z-layer part="icon">✳</z-layer> Texte</z-checkbox>` |
| la couper | `disabled` |

Un clic ou <kbd>Espace</kbd> bascule. Une case indéterminée que l'on touche devient
cochée, comme la case native.

**Sur téléphone, le doigt a sa place.** Viser une case de 15 px au pouce, c'est dur.
Chaque case reçoit une zone tactile invisible d'au moins 44 px, centrée sur la case.
Rien à écrire. La ligne entière reste cliquable.

## Peindre 🖌️

La case prend les couleurs de la peau : filet au repos, accent une fois cochée, un carré
blanc qui **zoome du fond**. Changez de peau, toutes les cases suivent.

Le mouvement, fourni par la peau : la case rebondit quand elle se coche, recule sous le
doigt, et une **onde** part de son bord au relâché (plus courte si vous lâchez dehors).
Le texte s'épaissit sans sauter d'un pixel.

Pour repeindre une case sans changer de peau, les tokens du pacte :

| Token | Peint |
|---|---|
| `--z-checkbox__gap` | l'écart entre la case et le texte |
| `--z-checkbox--marker__size` · `__radius` | la taille de la case et son rayon |
| `--z-checkbox--marker__background` · `__background-checked` | son fond au repos, puis cochée |
| `--z-checkbox--ring__color` · `__color-checked` | son contour au repos, puis cochée |
| `--z-checkbox--dot__color` | la marque qui zoome (blanc par défaut) |
| `--z-checkbox--dot__bar-height` | l'épaisseur de la barre quand elle est indéterminée |
| `--z-checkbox--background__color` · `__radius` | le fond de la ligne entière |
| `--z-checkbox--icon__color` | l'icône, si vous en écrivez une |
| `--z-checkbox--halo__color` | l'onde du clic |
| `--z-checkbox--label__weight` · `__emphasis` | le texte une fois cochée (vrai gras, ou faux-bold sans saut) |

```css
z-checkbox.rose:state(current) { --z-checkbox--marker__background-checked: #ff2d55; }
```

Démo : `z-checkbox.demo.html`, avec le sélecteur de peau en haut.

## Brancher </>

**Lire et écrire** : `checked`, `indeterminate`, et l'événement `change`.

```js
box.checked = true;
box.addEventListener("change", () => console.log(box.checked));
```

**L'indéterminée** ne se lève pas toute seule : `box.checked = false` ne la retire pas,
c'est `box.indeterminate = false`. Les deux sont indépendants, sinon un « tout cocher »
qui recalcule ses enfants s'effacerait lui-même selon l'ordre de vos deux lignes. La
case **ne connaît pas ses enfants** : relier un « tout cocher » à son groupe, c'est trois
lignes chez vous (démo, section 4).

**Dans un formulaire** : elle part comme un `<input type="checkbox">`.

| | |
|---|---|
| `name` | le nom du champ |
| `value` | ce qui part **si elle est cochée** (défaut `on`) |
| décochée ou indéterminée | **rien** ne part |
| `required` | le formulaire refuse la soumission tant qu'elle n'est pas cochée |
| `<fieldset disabled>` | la coupe, et ses visuels suivent |
| reset du formulaire | elle revient à son HTML d'origine |

Le message de refus se remplace d'une ligne : `box.setValidity("Cochez cette case")`.

**Réagir à un état** en CSS, sans JS : `z-checkbox:state(current) { … }`. Cochée =
`current`, l'état de sélection durable du socle, posé par la case elle-même.

**Lecteurs d'écran** : `role="checkbox"`, `aria-checked` (`true`, `false`, `mixed`)
suit tout seul, <kbd>Espace</kbd> bascule.

Attributs, événements et états complets : la référence, plus bas.

## Sous le capot

Pour aller plus loin, ou pour écrire une peau.

**Un nœud, deux pièces peintes.** La case est un seul élément. L'hôte est la ligne
(votre texte, et le fond `background`) ; la case est le `::before` (la pièce `marker`,
dont le contour est `ring` et la marque `dot`) ; la zone tactile est le `::after` (la
pièce `contact`, posée par le socle et recentrée sur la case). Rien à écrire, une seule
forme.

**La marque qui zoome** est une image de fond de la case (`background-size` de 0 à 60 %,
en ressort). L'indéterminée est la **même** marque, écrasée en barre : le passage
indéterminée → cochée est une seule transition continue.

**Une peau anime la case sans toucher au texte** :

```css
z-checkbox.fou:state(current)::before { rotate: 90deg; scale: 1.15; }
```

**La zone du doigt** : le socle la centre sur l'élément entier ; la case la ramène sur
elle (`left`, `width` sur le `::after`), parce que c'est la case que l'œil vise. Le socle
juge « relâché dedans » sur cette zone, pas sur la boîte visible.

**L'onde** est le preset `halo` de z-motion sur la case : son ombre grandit et se fond,
à la couleur de l'état (`--z-state__color`).

**Ce qu'elle lit dans la peau** : `--z-surface`, `--z-surface-sunken`, `--z-ink`,
`--z-line`, `--z-accent`, `--z-danger`, `--z-success`, `--z-disabled`, `--z-radius`,
`--z-border-width`, `--z-gap`, `--z-font`, `--z-dur` · `--z-dur-select`, `--z-ease` ·
`--z-ease-spring`, `--z-focus-halo`, `--z-contact-zone`.
