# z-layer — le calque

La deuxième brique du noyau, à côté de [`z-element`](../z-element/z-element.doc.md).
`z-element` porte les **états** (le vivant) ; `z-layer` porte les **pièces** (le visible).
Un composant Zoé, c'est une pile de calques qui jouent chacun **un rôle**.

```html
<z-checkbox>
  <z-layer part="background"></z-layer>
  <z-layer part="marker"></z-layer>
  <z-layer part="ring"></z-layer>
  <z-layer part="dot"></z-layer>
  <z-layer part="label">J'accepte</z-layer>
</z-checkbox>
```

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

Vocabulaire de départ : `background` · `marker` · `ring` · `dot` · `label` · `icon`.
Un composant en ajoute quand son anatomie l'exige (`track`, `thumb`, `fill`…).

**Un rôle est une intention, jamais une propriété CSS.** `part="ring"` (la pièce) est
juste ; `part="border"` (la propriété) est **interdit** — c'est la loi *nom = RÔLE* du
socle.

## Ce calque ne décide de rien

Il ne se positionne pas, ne se peint pas, ne s'anime pas : le **composant** place chaque
rôle, la **peau** le peint. Une brique bête ne peut pas se tromper. Si `z-layer.css`
grossit un jour, c'est qu'une décision a fui du composant vers le noyau — il faut la
renvoyer chez elle.

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
