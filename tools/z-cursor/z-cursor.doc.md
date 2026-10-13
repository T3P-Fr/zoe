# z-cursor — le sillage du pointeur

Un ruban qui suit la souris, ou qui fuse d'un clic au suivant. Une balise à poser, à plat
dans la page ; le dessin est fait au pinceau par le moteur, dans un canevas plein écran,
au-dessus de tout. Le curseur natif reste en place.

```html
<z-cursor></z-cursor>                <!-- le ruban suit la souris -->
<z-cursor fx="click"></z-cursor>     <!-- il fuse d'un clic au suivant -->
<z-cursor fx="none"></z-cursor>      <!-- rien -->
```

## Deux effets, un seul moteur

| `fx` | Ce que fait le ruban |
|---|---|
| `move` *(défaut)* | il **suit** le pointeur : courbe lissée sur les dernières positions, tête épaisse au curseur, pointe à la queue, qui s'efface dès qu'on s'arrête |
| `click` | le **même** ruban, nourri d'un point fantôme qui voyage du clic précédent vers le nouveau, puis meurt seul |
| `none` | aucun sillage |

Le clic-à-clic n'est pas un autre effet : c'est le même sillage, avec une autre main sur la
barre. C'est ce qui rend les deux réglables par les **mêmes** tokens.

La balise ne se voit jamais (`display: none`) : elle déclare que le sillage tourne ici, et
rien d'autre. Elle est coupée sous `prefers-reduced-motion`.

## Le ton et la taille

```html
<z-cursor tone="complement"></z-cursor>
<z-cursor size="l"></z-cursor>
```

`tone` colore le ruban avec le ton de la peau (`main` · `complement` · `soft`) ; `size`
règle sa grosseur sur l'échelle commune (`xs` → `xl`). Sans rien, la couleur est l'accent
de la peau : changez de peau, le sillage suit.

## Anatomie & grammaire du pacte

Le ruban se règle par des tokens `--z-trail-*`, que **chaque peau pose à sa façon** sur
`:root` (la queue de Claude est une plume qui traîne, celle de HighTech un tracé
d'instrument). Une valeur posée sur la balise elle-même gagne sur celle de la peau.

| Token | Règle | Repères |
|---|---|---|
| `--z-trail-thickness` | la grosseur de la tête (px) | 1 → 60 |
| `--z-trail-scale` | multiplie la grosseur — c'est ce que pose `size` | 0.2 → 4 |
| `--z-trail-fade` | la durée de vie d'un point (ms) — la longueur du sillage | 60 → 2500 |
| `--z-trail-smooth` | la fluidité du suivi : bas = il traîne, 1 = collé au pointeur | 0.05 → 1 |
| `--z-trail-speed-ref` | la vitesse de souris (px/ms) qui remplit la tête | 0.2 → 4 |
| `--z-trail-speed-fuse` | la vitesse (px/ms) du voyage d'un clic au suivant | 0.5 → 12 |
| `--z-trail-ease` | la décroissance tête → queue : `linear` `quad` `cubic` `quart` `quint` `expo` `sine` `back` | |
| `--z-trail-color` | la couleur (par défaut l'accent de la peau) | |

Ces bornes ne sont pas décoratives : elles permettent au pupitre de la démo de monter un
curseur plutôt qu'un champ à taper — un réglage de mouvement ne se juge qu'en le traînant.

## Le geste

Le mouvement se valide à l'œil, dans la démo (`z-cursor.demo.html`) : bougez vite, bougez
lentement, arrêtez-vous — la tête se remplit avec la vitesse, la queue s'efface au repos.
En `fx="click"`, cliquez à deux endroits éloignés et regardez le trait voyager.

## Ce qu'il n'est pas

- Pas l'effet **au point de contact** : c'est [`z-contact`](../z-contact/z-contact.doc.md),
  l'autre axe (l'impact, pas le sillage).
- Pas un curseur personnalisé : le curseur natif reste, le ruban l'accompagne.
- Pas une position donnée au CSS : pour cela, c'est [`z-pointer`](../z-pointer/z-pointer.doc.md).
