# z-divider

Deux blocs qui se suivent ont parfois besoin d'un trait entre eux — et un trait n'est
pas qu'un dessin : l'assistance doit savoir qu'une section finit ici. `z-divider` est ce
séparateur, bâti sur [`z-element`](../../core/z-element/z-element.doc.md) : un filet, ou
deux filets autour d'un mot, posés avec leur sémantique (`role="separator"`).

```html
<z-divider></z-divider>
<z-divider>ou</z-divider>
<z-divider orientation="vertical"></z-divider>
```

## Ce que vous écrivez

Les filets ne sont pas des pièces : ce sont deux pseudo-éléments (`::before` / `::after`)
qui **poussent** (`flex: 1`) de part et d'autre du contenu. Le rendu se décide sur ce que
vous avez écrit, sans une ligne de JS :

| Vous écrivez | Vous obtenez |
|---|---|
| `<z-divider></z-divider>` | une ligne continue — l'écart entre les deux filets est nul, ils se rejoignent |
| `<z-divider>ou</z-divider>` | le mot centré, un filet de chaque côté (l'écart s'ouvre à `.75em`) |
| `<z-divider><z-layer part="label">ou</z-layer></z-divider>` | la même chose, le mot étant une pièce nommée — jamais coupé (`white-space: nowrap`) |

Le lexique place `label` dans `infos` (ce qui informe) ; le texte brut suffit dans la
plupart des cas. La bascule repose sur `:empty` : laissez l'élément **vraiment vide** pour
une ligne continue — un espace entre les balises compte comme du contenu et ouvrirait
l'écart.

## Vertical

`orientation="vertical"` change de nature : l'hôte **devient** le filet — un trait d'`1em`
de haut, de l'épaisseur du filet de la peau (`--z-border-width`), en `inline-block` aligné
sur le milieu de la ligne. Il se glisse dans une phrase ou entre deux boutons.

```html
<p>Fichier <z-divider orientation="vertical"></z-divider> Édition</p>
```

```js
trait.orientation;               // → "horizontal" | "vertical"
trait.orientation = "vertical";  // l'attribut et aria-orientation suivent
```

## Taille

`size` (`xs · s · m · l · xl`) règle la taille du texte : le label et la hauteur du trait
vertical (en `em`) suivent. L'épaisseur du filet, elle, reste `--z-border-width` — un
filet ne grossit pas avec le texte.

## Accessibilité

`role="separator"` et `aria-orientation` sont posés par le composant (jamais écrasés si
vous écrivez `role` vous-même). Un séparateur n'est pas focusable : il structure, il ne
reçoit pas de geste.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-divider__color` | la couleur des filets, horizontaux comme vertical — défaut `--z-line` |

Le reste vient de la peau : `--z-border-width` (l'épaisseur), `--z-font-size-sm` et
`--z-ink-soft` (le label).

```css
z-divider { --z-divider__color: var(--z-accent); }
```

## Le geste

Un séparateur n'a pas d'interaction : seul `enter` est peint — l'apparition joue `pop`
(`--z-dur-enter`, `--z-ease-spring`), la loi Zoé : rien ne surgit d'un coup. Démo :
`z-divider.demo.html` (+ sélecteur de peau).
