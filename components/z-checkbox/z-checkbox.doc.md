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
  <z-layer part="marker">
    <z-layer part="ring"></z-layer>
    <z-layer part="dot"></z-layer>
  </z-layer>
  <z-layer part="infos">
    <z-layer part="icon">✳</z-layer>
    <z-layer part="label">J'accepte les conditions</z-layer>
  </z-layer>
  <z-layer part="contact"></z-layer>
</z-checkbox>
```

Les calques sont **emboîtés** : `ring` et `dot` vivent dans `marker` (bouger la case
emmène son cerclage et sa marque), `icon` et `label` dans `infos` (cacher l'info d'un
bloc). Le CSS écrit les chemins en entier, donc une case imbriquée dans une autre ne se
fait jamais peindre par le parent.

| Rôle | La pièce |
|---|---|
| `background` | le fond de toute la ligne (souvent transparent — il porte les effets) |
| `marker` | la case, sa surface |
| ↳ `ring` | son cerclage — animable seul (il peut tourner, pointiller) |
| ↳ `dot` | la marque qui apparaît une fois cochée |
| `infos` | ce qui informe — déplacé, caché ou animé d'un bloc |
| ↳ `icon` | optionnel, avant le label |
| ↳ `label` | ton texte |
| `contact` | ce qui reçoit le geste — invisible, il déborde la case (viser 1.15em au doigt, c'est dur) |

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

## Trois valeurs : `indeterminate`

Une case a **trois** valeurs, pas deux. `indeterminate`, c'est celle d'un « tout cocher »
dont les enfants ne sont pas d'accord : la marque s'écrase en **barre**, et
`aria-checked` passe à `mixed`.

```html
<z-checkbox indeterminate>Tout cocher</z-checkbox>
```

Deux règles, les mêmes que la case native :

- un **geste** (clic, <kbd>Espace</kbd>) tranche toujours dans le sens « oui » : la case
  devient cochée ;
- l'**API** ne tranche pas : `box.checked = false` ne lève pas l'indétermination. Les
  deux sont indépendants, sinon un « tout cocher » qui recalcule ses enfants s'effacerait
  lui-même selon l'ordre de tes deux lignes.

Le composant **ne connaît pas ses enfants** (zéro logique métier) : relier une case au
groupe qu'elle commande, c'est trois lignes chez toi — voir la démo, section 4.

## Dans un formulaire

Elle part comme un `<input type="checkbox">`, sans wrapper ni champ caché :

```html
<form>
  <z-checkbox name="cgu" required>J'accepte</z-checkbox>
  <z-checkbox name="lettre" value="hebdo" current>Recevoir la lettre</z-checkbox>
</form>
```

| | |
|---|---|
| `name` | le nom du champ |
| `value` | ce qui part **si elle est cochée** (défaut `"on"`, comme le natif) |
| décochée | **rien** ne part — elle n'apparaît pas dans les données |
| indéterminée | rien ne part non plus : elle n'est pas « cochée » |
| `required` | le formulaire refuse la soumission tant qu'elle n'est pas cochée |
| `<fieldset disabled>` | la coupe, et tous ses visuels d'état suivent |
| reset du formulaire | elle revient à son HTML d'origine |

Le message de refus est en anglais comme le reste de l'API — remplace-le d'une ligne :
`box.setValidity("Coche cette case")`. Toute la plomberie vit dans
[`z-element`](../../core/z-element/z-element.doc.md) : ici, la case décide seulement de
**ce qu'elle envoie**.

## Anatomie & grammaire du pacte

Chaque part se peint par un token à **double séparateur** — c'est ce que z-button
(sans part) ne prouvait pas :

| Token | Peint |
|---|---|
| `--z-checkbox__gap` | l'écart marker ↔ label |
| `--z-checkbox--marker__size` | la taille de la case |
| `--z-checkbox--marker__radius` | son rayon |
| `--z-checkbox--marker__background` | le fond au repos |
| `--z-checkbox--marker__background-checked` | le fond une fois cochée |
| `--z-checkbox--ring__color` | le contour au repos |
| `--z-checkbox--ring__color-checked` | le contour une fois cochée |
| `--z-checkbox--dot__color` · `__size` · `__radius` | la marque qui zoome (blanc, 60 %, carrée) |
| `--z-checkbox--dot__bar-scale` · `__bar-height` | l'écrasement de la marque quand elle est indéterminée |
| `--z-checkbox--background__color` · `__radius` · `__bleed` | le fond de la ligne, et de combien il déborde |
| `--z-checkbox--icon__color` | l'icône optionnelle |
| `--z-checkbox--contact__bleed` | de combien la zone touchable déborde |
| `--z-checkbox--halo__color` | l'onde au clic (accent par défaut) |
| `--z-checkbox--label__weight` · `__emphasis` | le poids du label cochée (vrai gras, ou faux-bold sans saut) |

Défauts qui **consomment la peau** (`--z-accent`, `--z-line`, `--z-radius`…) : marche
sur HighTech comme sur Claude sans une ligne de plus.

## Le geste

Au clic, un **halo** part de la case (l'onde `ripple`, la signature de Zoé — la même que
`z-button` et `z-radio`) ; lâché **dehors**, il est plus court : il dit « annulé ».
Puis, au coché, la case se remplit d'accent et un **carré blanc zoome du fond** (un seul
`::before`, `background-size` 0 → 60 % en ressort). Le label s'épaissit **sans saut de
pixel** (faux-bold). Démo : `z-checkbox.demo.html` (+ sélecteur de peau).
