# z-skeleton

Un contenu qui arrive en retard laisse un trou, et un trou se lit comme une panne.
`z-skeleton` tient la place : un bloc neutre traversé d'un reflet qui dit « ça charge,
ne partez pas ». Bâti sur [`z-element`](../../core/z-element/z-element.doc.md), c'est un
composant d'affichage pur — un **leurre**, invisible pour l'assistance.

```html
<z-skeleton radius="circle" w="3em" h="3em"></z-skeleton>
<z-skeleton radius="pill" h="1em" w="60%"></z-skeleton>
<z-skeleton h="6em"></z-skeleton>
```

## En calques

Un seul rôle : le fond qui scintille. Un leurre n'a rien à informer ni à marquer — il
**est** la surface d'attente.

```html
<z-skeleton h="6em">
  <z-layer part="background"></z-layer>
</z-skeleton>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface qui scintille — le bloc-leurre lui-même |

En forme courte, le CSS peint l'hôte. Les deux formes lisent les mêmes tokens
([`z-layer`](../../core/z-layer/z-layer.doc.md)).

## La boîte : `w`, `h`, `radius`

Par défaut, un bloc pleine largeur haut d'une ligne (`1em`). Trois raccourcis règlent la
boîte sans une ligne de CSS :

| | |
|---|---|
| `w` | la largeur — toute longueur CSS (`12em`, `60%`) |
| `h` | la hauteur — idem |
| `radius="pill"` | une gélule : la ligne de texte |
| `radius="circle"` | un rond : l'avatar — le carré est forcé (`aspect-ratio: 1`), la largeur vaut `w`, sinon `h`, sinon `3em` |

`w` et `h` sont posés en variables inline (`--z-skeleton__width`, `--z-skeleton__height`)
que le CSS lit ; sans eux, les défauts restent. Vous pouvez tout aussi bien styler la
boîte vous-même (`width`, `height` en CSS) : les raccourcis sont un confort, pas un
périmètre.

## Composer un leurre

Un skeleton = une pièce. Une carte en attente, c'est plusieurs skeletons disposés comme
le vrai contenu — même grille, mêmes tailles, pour que rien ne bouge quand il arrive.
Posez `aria-busy="true"` sur le conteneur si vous voulez signaler l'attente : le leurre,
lui, se tait.

```html
<article aria-busy="true" class="rangee">
  <z-skeleton radius="circle" w="3em" h="3em"></z-skeleton>
  <div class="stack">
    <z-skeleton radius="pill" h="1em" w="12em"></z-skeleton>
    <z-skeleton radius="pill" h=".8em" w="18em"></z-skeleton>
  </div>
</article>
```

## Remplacer par le vrai contenu

Le socle rend `exit` attendable : `await el.play("exit")` pose l'état, et la promesse se
résout à la fin de `--z-dur-exit`. Le skeleton **fond** pendant ce temps (opacité 0) ;
vous remplacez ensuite, et rien ne disparaît d'un coup.

```js
await leurre.play("exit");
leurre.replaceWith(contenu);
```

## Accessibilité

`aria-hidden="true"` est posé par le composant : un lecteur d'écran n'annonce pas un
leurre — la zone est vide pour lui, comme il se doit tant que le vrai contenu n'est pas là.
Sous `prefers-reduced-motion: reduce`, le reflet se **fige** : le bloc gris reste (l'info
« ça charge » passe par sa présence), seul le mouvement s'en va.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-skeleton__width` · `--z-skeleton__height` | la boîte — posés par `w`/`h`, ou par votre CSS |
| `--z-skeleton--background__radius` | le rayon — défaut `--z-radius` ; `pill` et `circle` le redéfinissent |
| `--z-skeleton__base` | la surface du bloc — défaut `--z-surface-sunken` |
| `--z-skeleton__sheen` | le reflet qui balaye — défaut l'encre à 8 % |

```css
z-skeleton { --z-skeleton__base: var(--z-accent-soft); }
```

## Le geste

Le reflet est un dégradé oblique 2,5 fois plus large que la boîte dont on anime la
**position** (`@keyframes z-skeleton-shimmer`, 1,4 s, en boucle) — jamais la boîte
elle-même : rien ne saute, rien ne déborde. À l'apparition (`enter`) le bloc naît
invisible et fond vers 1 (`--z-dur-enter`) ; à la sortie (`exit`) il fond vers 0
(`--z-dur-exit`). Démo : `z-skeleton.demo.html` (+ sélecteur de peau).
