# z-layer — le calque

La deuxième brique du noyau, à côté de [`z-element`](../z-element/z-element.doc.md).
`z-element` porte les **états** (le vivant) ; `z-layer` porte les **pièces** (le visible).
Un composant Zoé, c'est une pile de calques qui jouent chacun **un rôle**.

```html
<z-checkbox>
  <z-layer part="background"></z-layer>
  <z-layer part="marker">
    <z-layer part="ring"></z-layer>
    <z-layer part="dot"></z-layer>
  </z-layer>
  <z-layer part="infos">
    <z-layer part="label">J'accepte</z-layer>
  </z-layer>
  <z-layer part="contact"></z-layer>
</z-checkbox>
```

## Grammaire commune, anatomie propre (tranché le 2026-07-20)

Ce qui est commun à tous les composants n'est **pas** un arbre unique — on n'imposera
jamais à un bouton la structure d'une case. C'est :

- **la grammaire** — une balise `z-layer`, un attribut `part`, et un calque peut en
  **contenir** d'autres ;
- **le lexique** — le même mot pour le même rôle, partout. **Interdit d'inventer un
  synonyme** de `label` ou de `background`.

L'**anatomie** appartient au composant : il déclare ses rôles dans son `static
api.layers`, et c'est ça que l'éditeur Zoé lit.

```
z-button    background · infos(icon, label) · contact
z-checkbox  background · marker(ring, dot) · infos(icon, label) · contact
z-radio     les MÊMES mots que la case (forme ronde) → la même skin les peint
z-field     son anatomie à lui (input, etc.) — quand on l'écrira
```

C'est le **lexique partagé** qui permet à une skin de peindre un composant qu'elle ne
connaît pas. Pas l'uniformité des arbres.

**Un groupe se déplace d'un bloc.** `infos` (icône + texte) et `marker` (cerclage +
marque) s'animent, se cachent, se décalent **entiers**, sans qu'on touche à leurs pièces.

**`contact` est la couche qui reçoit** — l'anatomie v4 (*reçoit · montre · contient*).
Elle couvre le composant et peut le **déborder** : la zone qu'on vise au doigt n'est pas
le dessin. Les calques décoratifs, eux, ne prennent pas le pointeur — sinon le composant
devrait deviner qui a été touché. *(Le tool `z-contact`, l'effet au point de clic, garde
son nom : l'un est un rôle de calque, l'autre est un moteur. Plus de collision.)*

## Une balise + un rôle, pas une balise par rôle

Un **dictionnaire** ne tient pas — `z-track`, `z-thumb`, `z-tick`, `z-fill`… un mot de
plus à chaque composant. Une **grammaire**, oui : une seule balise à apprendre, et un
ensemble de rôles **ouvert**. Un composant — ou l'éditeur Zoé — invente le sien sans
qu'on touche au noyau.

Et surtout, ça donne au pacte sa traduction en HTML. Le `--{part}` du CSS existait déjà,
il lui manquait son élément :

```
--z-checkbox--marker__background      ce que la SKIN peint
z-checkbox z-layer[part="marker"]     ce que le CSS vise
<z-layer part="marker">               ce que l'AUTEUR écrit
```

Trois écritures, **un** mot : `marker`.

`part` est l'attribut du web standard (celui de `::part()`) : inerte en light DOM donc
gratuit — et déjà en place si un composant passe un jour en shadow.

## Les rôles se partagent entre composants

Le `dot` d'une case et celui d'une radio, **c'est le même mot**. Une skin peut donc les
peindre d'un coup :

```css
z-layer[part="dot"] { background: var(--ma-couleur); }
```

Vocabulaire de départ : `background` · `marker` · `ring` · `dot` · `infos` · `icon` ·
`label` · `contact`. Un composant en ajoute quand son anatomie l'exige (`track`,
`thumb`, `fill`…) — l'ensemble est ouvert, c'est le principe.

**Un rôle est une intention, jamais une propriété CSS.** `part="ring"` (la pièce) est
juste ; `part="border"` (la propriété) est **interdit** — c'est la loi *nom = RÔLE* du
socle.

## Qui décide de quoi

Comme la structure est canonique, le **placement** d'un rôle est le même partout : il
vit donc dans `core/z-layer/z-layer.css`. Le **composant** ne donne que ses **tailles**,
la **peau** que ses **couleurs**. Aucune couleur dans le noyau. Si une règle de mise en
page apparaît dans un composant, se demander si elle n'est pas universelle — et
inversement, si une valeur arrive dans le noyau, elle est probablement de trop.

## Écrire les calques n'est jamais obligatoire

Zoé n'injecte rien (ADR-0018) : `<z-checkbox>J'accepte</z-checkbox>` **sans aucun calque**
marche — le CSS peint alors l'hôte. Les calques sont la forme **riche**, celle que
l'éditeur produit, celle qui permet d'animer chaque pièce séparément. Les deux formes
lisent les **mêmes tokens** : une skin écrite pour l'une marche sur l'autre.

## Pourquoi ça change tout pour l'animation

Chaque pièce a son propre `transform`, sa propre transition, sa propre horloge. L'anneau
tourne **pendant** que le point rebondit **pendant** que le fond respire — sans qu'aucune
n'écrase l'autre. Sur la forme courte, tout tient dans un seul `::before` : un seul
mouvement à la fois. Démo : `components/z-checkbox/z-checkbox.demo.html`, section 3.
