# z-drawer

Un panneau latéral modal : un [`z-dialog`](../z-dialog/z-dialog.doc.md) **collé à un
bord**, sur toute la hauteur, qui **glisse** depuis son côté. Même `<dialog>` natif à
l'intérieur, même attribut `open`, mêmes déclencheurs, même fermeture animée — c'est la
même classe (`ZDrawer extends ZDialog`), seule la géométrie change.

```html
<z-drawer id="menu" light-dismiss>
  <dialog>
    <header part="header">
      <h2>Menu</h2>
      <z-button type="button" command="close" tone="soft">Fermer</z-button>
    </header>
    <nav part="body">
      <a href="#">Accueil</a>
      <a href="#">Catalogue</a>
      <a href="#">Contact</a>
    </nav>
  </dialog>
</z-drawer>
<z-button type="button" commandfor="menu" command="show-modal">Menu</z-button>
```

## Ce qui est hérité, mot pour mot

Tout ce que la doc de [`z-dialog`](../z-dialog/z-dialog.doc.md) décrit vaut ici :

- `open` est la source de vérité (`:state(open)`), `show()` · `close(returnValue)` ·
  `toggle()` · `requestClose()` · `returnValue` · `dialog` ;
- les déclencheurs `commandfor` + `command` (`show-modal` · `close` · `request-close` ·
  `toggle`), qui visent l'**id du z-drawer**, et `command="close"` à l'intérieur ;
- <kbd>Échap</kbd>, `light-dismiss` et `<form method="dialog">`, tous **animés**, les
  deux premiers annulables par l'événement `cancel` ;
- les événements `open` · `close` (`detail.returnValue`) · `cancel` · `z-state` ;
- le nom accessible posé à l'ouverture, le focus piégé, la page inerte, le défilement
  bloqué.

## `placement`

`right` (défaut) · `left` · `top` · `bottom` — le bord auquel le panneau est collé, et
d'où il arrive. Droite et gauche prennent **toute la hauteur** et lisent
`--z-drawer__width` ; haut et bas prennent **toute la largeur** et lisent
`--z-drawer__height`. Le défaut ne s'écrit pas dans le HTML : un `<z-drawer>` sans
attribut sort de la droite.

```html
<z-drawer id="filtres" placement="left">…</z-drawer>
<z-drawer id="partage" placement="bottom">…</z-drawer>
```

## Anatomie & grammaire du pacte

Les mêmes rôles que z-dialog (`header` · `body` · `footer`), et les **mêmes tokens**
`--z-dialog__*` pour la surface, l'encre, le filet, l'ombre, le voile et les pièces : un
tiroir est une boîte, une peau qui peint l'une peint l'autre. Il n'ajoute que sa
mesure :

| Token | Peint |
|---|---|
| `--z-drawer__width` | la largeur du panneau pour `right` et `left` (repli `min(24em, 90vw)`) |
| `--z-drawer__height` | la hauteur du panneau pour `top` et `bottom` (repli `min(24em, 90vh)`) |
| `--z-dialog__radius` | les coins **côté intérieur** seulement — les coins contre l'écran restent droits |
| `--z-dialog__*` | tout le reste, voir [z-dialog](../z-dialog/z-dialog.doc.md#anatomie--grammaire-du-pacte) |

Pour peindre les tiroirs autrement que les boîtes, posez les tokens sur la balise :
`z-drawer { --z-dialog__background: … }` — l'écrasement reste local.

## Le geste

Le voile **fond**, le panneau **glisse** depuis son bord jusqu'à s'y coller (sur
`--z-ease-spring` : chez Claude il dépasse d'un souffle puis se cale, chez HighTech il
s'arrête net). Pas de fondu sur le panneau : ce qui sort de l'écran n'a rien à estomper.
À la fermeture, le même trajet à l'envers, puis le natif cache la boîte. Durées :
`--z-dur-enter` / `--z-dur-exit`. Démo : `z-drawer.demo.html` (+ sélecteur de peau).
