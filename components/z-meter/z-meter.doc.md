# z-meter

Une batterie à 15 %, un disque presque plein, un stock bas : ce n'est pas une
progression, c'est une **mesure** — une valeur dans une plage, qui peut être bonne ou
mauvaise. `z-meter` est cette jauge, bâtie sur
[`z-element`](../../core/z-element/z-element.doc.md) : `role="meter"`, des seuils qui
colorent, et un seul nombre publié que le CSS dessine.

```html
<z-meter value="72"></z-meter>
<z-meter value="15" low="20" high="80" optimum="100"></z-meter>
<z-meter value="3" max="5"></z-meter>
```

## En calques

```html
<z-meter value="72">
  <z-layer part="background"></z-layer>
  <z-layer part="marker"></z-layer>
</z-meter>
```

| Rôle | La pièce |
|---|---|
| `background` | la piste — le rail vide, de `min` à `max` |
| `marker` | le remplissage — sa largeur est la mesure, sa couleur suit la zone |

En forme courte, l'hôte est la piste et un `::before` fait le remplissage. Les deux
formes lisent les mêmes tokens ([`z-layer`](../../core/z-layer/z-layer.doc.md)).

## Mesure, pas progression

[`z-progress`](../z-progress/z-progress.doc.md) dit « où en est une tâche » : 0 → fini.
`z-meter` dit « où en est une grandeur » : bas, bon, haut. Deux rôles ARIA
(`progressbar` / `meter`), donc deux composants — une jauge de stock annoncée comme
`progressbar` promettrait une attente qui n'existe pas.

## Un seul nombre

Le JS borne `value` à `[min, max]`, en tire un pourcentage et le pose dans
`--z-meter__value`. Le CSS en fait une largeur ; il ne calcule rien. `min` vaut 0 et
`max` 100 par défaut ; un `max` inférieur ou égal à `min` est ignoré (retour à 100).

```js
jauge.value = 42;        // l'attribut suit, le CSS redessine
jauge.min; jauge.max;    // reflets des attributs
```

## Les seuils : `low`, `high`, `optimum`

Les seuils découpent la plage en trois zones — basse, moyenne, haute — comme ceux du
`<meter>` natif. Le composant pose l'état de la zone où tombe la valeur, et son CSS la
colore :

| Zone | État | Couleur |
|---|---|---|
| valeur < `low` | `:state(low)` | `--z-danger` |
| entre les deux | — | neutre (`--z-accent`) |
| valeur > `high` | `:state(high)` | `--z-success` |
| la zone de `optimum` | `:state(optimum)` | le ton (`--z-tone__fill`, accent par défaut) — **gagne** sur les deux autres |

Sans seuil, pas d'état : la jauge reste neutre. `optimum` désigne la zone idéale : une
batterie avec `optimum="100"` n'est pas « en succès » quand elle est pleine, elle est
dans l'idéal — c'est son `tone` qui la peint (`tone="success"` pour du vert).

Ce n'est **pas** la coloration complète du `<meter>` natif (optimum / sub-optimum / even
less good) : la zone haute reste `success` quel que soit l'idéal. Pour une échelle
inversée — « bas = bon », comme un taux de pollution — placez `optimum` en bas et
repeignez la zone haute d'une ligne :

```css
z-meter.pollution:state(high) { --z-meter--fill__color: var(--z-danger); }
```

Les états de zone ne sont pas des attributs : `[low]` est le seuil que vous écrivez,
`:state(low)` la zone où tombe la valeur. Aucune collision.

## Accessibilité

`role="meter"`, `aria-valuemin`, `aria-valuemax` et `aria-valuenow` (la valeur bornée)
sont posés et tenus à jour. Un `meter` doit être nommé : donnez-lui un `aria-label` ou un
`aria-labelledby`. Il n'est pas focusable et n'envoie rien à un formulaire — c'est une
sortie, pas une entrée.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-meter__value` | la largeur du remplissage, en % — **posé par le JS**, à lire, pas à écrire |
| `--z-meter__fill` | la couleur de la zone courante — redéfinie par `:state(low\|high\|optimum)`, à lire |
| `--z-meter--track__height` | la hauteur de la piste (`.55em`) |
| `--z-meter--track__color` | la couleur de la piste — défaut `--z-surface-sunken` |
| `--z-meter--fill__color` | la couleur du remplissage — **force** une couleur, zone ou pas (défaut : `--z-meter__fill`) |

`track` et `fill` nomment les deux dessins de la jauge ; en forme en calques, `track`
est le calque `background` et `fill` le calque `marker`. Le rayon vient de
`--z-radius-pill` : une gélule sur une peau ronde, un rectangle sur une peau à angles.

## Le geste

La largeur du remplissage **glisse** (`--z-dur`, `--z-ease`) à chaque changement de
valeur, et sa couleur fond d'une zone à l'autre à la même vitesse : une batterie qui
passe sous `low` rougit sans sauter. Démo : `z-meter.demo.html` (+ sélecteur de peau).
