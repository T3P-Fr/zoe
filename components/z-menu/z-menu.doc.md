# z-menu

Un **menu d'actions** — le pattern ARIA « menu button » — bâti sur
[`z-popover`](../z-popover/z-popover.doc.md). Un bouton, une liste d'actions qui s'ouvre
dessous : renommer, dupliquer, supprimer. Tout ce qui fait le panneau (l'ancrage, le top
layer, la fermeture au clic dehors, l'animation) est **hérité** ; z-menu ajoute ce qui
fait d'un panneau un menu — les rôles, le clavier, l'activation d'un item. Zoé n'injecte
**aucune balise** (ADR-0018) : vous écrivez les items, le composant leur donne leur rôle.

```html
<z-menu>
  <z-button part="trigger" type="button">Actions ▾</z-button>
  <div part="panel">
    <button part="item" value="rename">Renommer</button>
    <button part="item" value="duplicate">Dupliquer</button>
    <hr part="separator">
    <button part="item" value="delete" tone="danger">Supprimer</button>
  </div>
</z-menu>
```

| Rôle | La pièce |
|---|---|
| `trigger` | le bouton du menu — n'importe quel élément focusable |
| `panel` | la liste des actions (`role="menu"`) |
| ↳ `item` | une action — un `<button>`, ou un `<a href>` qui navigue naturellement |
| ↳ `separator` | un trait entre deux groupes d'actions (optionnel) |

## Activer = `select`

Activer un item (clic, <kbd>Entrée</kbd>, <kbd>Espace</kbd>) émet **`select`**, puis
ferme le menu. L'événement bulle et porte `{ value, item }` : `value` est l'attribut
`value` de l'item, ou son texte s'il n'en a pas.

```js
const menu = document.querySelector("z-menu");
menu.addEventListener("select", (event) => {
  event.detail.value;   // "rename" · "duplicate" · "delete"
  event.detail.item;    // le <button> activé
});
```

`select` est **annulable** : un `preventDefault()` garde le menu ouvert — c'est ainsi
qu'on écrit un menu de bascules (afficher/masquer des colonnes, par exemple). Un item
`<a href>` navigue de lui-même, le composant ne touche pas à son clic. Le composant
**émet, la page décide** : il ne sait pas ce que « supprimer » veut dire.

## Au clavier

Le menu est **un seul arrêt de tabulation** : le déclencheur. Le focus se promène
*dedans* aux flèches (roving tabindex — chaque item est `tabindex="-1"`).

| Sur le déclencheur | |
|---|---|
| <kbd>Entrée</kbd> · <kbd>Espace</kbd> | ouvre, focus sur le **premier** item (c'est le clic du bouton) |
| <kbd>↓</kbd> | ouvre, focus sur le **premier** item |
| <kbd>↑</kbd> | ouvre, focus sur le **dernier** item |

| Dans le menu | |
|---|---|
| <kbd>↓</kbd> · <kbd>↑</kbd> | item suivant · précédent, **en boucle** |
| <kbd>Home</kbd> · <kbd>End</kbd> | premier · dernier |
| une lettre | saute au prochain item qui **commence** par elle |
| <kbd>Entrée</kbd> · <kbd>Espace</kbd> | active l'item (`select`, puis fermeture) |
| <kbd>Échap</kbd> | ferme, **focus rendu au déclencheur** |
| <kbd>Tab</kbd> | ferme, le focus continue sa route dans la page |

Les items `disabled` ou `aria-disabled="true"` sont **sautés** par le clavier et
ignorés au clic. Au survol, le focus **suit le pointeur** : un seul item est « en main »
à la fois, et les flèches repartent de là — comme dans un menu natif.

## Placement, ouverture : hérités de z-popover

`open`, `placement`, `align`, `show()` / `hide()` / `toggle()`, l'événement `toggle`,
le retournement quand ça déborde, le suivi du défilement : tout est celui de
[`z-popover`](../z-popover/z-popover.doc.md), à l'identique.

```html
<z-menu placement="top" align="end">…</z-menu>
```

## Accessibilité

- Déclencheur : `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.
- Panneau : `role="menu"` ; items : `role="menuitem"` + `tabindex="-1"` ; séparateurs :
  `role="separator"`. Un rôle que vous avez déjà écrit est respecté (`menuitemcheckbox`,
  par exemple).
- À l'ouverture, le focus **entre** dans le menu ; à la fermeture, il **revient** au
  déclencheur (<kbd>Échap</kbd>, activation) ou continue sa route (<kbd>Tab</kbd>) —
  jamais sur `<body>`.
- Les items arrivés plus tard (liste générée) reçoivent leur rôle aussi : le composant
  observe son panneau.

## Anatomie & grammaire du pacte

Le **panneau** se peint avec les tokens de z-popover (`--z-popover__background`,
`__shadow`, `__offset`…) : c'est le même. z-menu règle deux d'entre eux depuis les siens
— `--z-popover__padding` ← `--z-menu__padding`, `--z-popover__width` ← `--z-menu__width`
— et ajoute ce qui est à lui :

| Token | Peint |
|---|---|
| `--z-menu__padding` | l'air autour de la colonne (`.3em`) |
| `--z-menu__width` · `__min-width` | la boîte du panneau (`max-content`, `11em`) |
| `--z-menu--item__padding` · `__gap` · `__radius` | la boîte d'un item (gap entre icône et texte ; rayon = celui de la peau, moins un cheveu) |
| `--z-menu--item__background` · `__color` | un item au repos (transparent, `--z-ink`) |
| `--z-menu--item__background-over` · `__color-over` | un item survolé ou focalisé (`--z-accent-soft`, `--z-ink`) |
| `--z-menu--separator__color` · `__margin` | le trait entre deux groupes (`--z-line-soft`) |

`[tone="danger"]` (ou `data-tone="danger"`) sur un item lui donne l'encre `--z-danger`,
et son survol se teinte du même rouge. Les tokens retombent sur la peau : juste sur
HighTech comme sur Claude sans une ligne de plus.

## Le geste

Celui de z-popover : la colonne **naît en retrait vers son bouton** et glisse en place ;
elle repart par le même chemin. Dedans, un seul item s'allume à la fois — celui sous le
pointeur ou sous les flèches — et l'action dangereuse rougit sans crier. Démo :
`z-menu.demo.html` (+ sélecteur de peau).
