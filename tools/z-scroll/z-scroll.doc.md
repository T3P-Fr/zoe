# z-scroll — où en est le défilement, donné au CSS

La barre de progression en tête d'article, le bandeau qui rétrécit quand on descend, le
décor qui glisse moins vite que le texte, la flèche « remonter » qui n'apparaît qu'après
le premier écran. **Quatre demandes banales, quatre écouteurs de scroll écrits à la
main** — et une page qui rame parce qu'aucun n'est groupé.

```html
<z-scroll page></z-scroll>
<script type="module" src="tools/z-scroll/z-scroll.js"></script>
```

Une balise posée n'importe où, et **toute la page sait où elle en est**.

## L'exemple — la barre de progression, en deux lignes

```html
<z-scroll page></z-scroll>
<div class="progression"></div>

<style>
  .progression {
    position: fixed; top: 0; left: 0; height: 3px;
    background: var(--z-accent);
    width: calc(var(--z-scroll__ry) * 100%);   /* ← 0 au départ, 1 au bout */
  }
</style>
```

C'est tout. Aucun `addEventListener`, aucune classe, aucun recalcul à la main.

## Deux modes, un seul vocabulaire

| | Ce qu'il mesure | Où il pose les nombres |
|---|---|---|
| `<z-scroll page>` | le défilement de **la page** | sur `:root` — donc **lisibles partout** |
| `<z-scroll>` | l'élément **est** la boîte qui défile | sur lui-même — ils descendent dans ses enfants |

Le mode `page` est le seul endroit de Zoé où un outil ne pose pas sur lui-même. C'est
voulu : **le défilement de la page n'appartient à aucun coin du document**, il doit être
lisible de partout. En mode boîte, au contraire, les nombres restent chez elle — et une
boîte peut donc en contenir une autre sans que les deux se marchent dessus.

## Ce qu'il pose

| Le token | Ce qu'il vaut |
|---|---|
| `--z-scroll__ry` · `__rx` | la **part** parcourue, `0` au départ, `1` au bout — le nombre qui sert 90 % du temps |
| `--z-scroll__y` · `__x` | la distance parcourue, en pixels (un nombre nu : `* 1px`) |
| `--z-scroll__dir` | `1` vers le bas, `-1` vers le haut — **il garde sa valeur à l'arrêt** |
| `--z-scroll__top` | `1` tant qu'on n'a pas bougé du départ |
| `--z-scroll__end` | `1` quand on touche le bout |

**`__dir` est le seul qu'on n'obtient jamais autrement** : il faut avoir gardé la position
d'avant. C'est lui qui fait le bandeau qui se cache quand on descend et revient quand on
remonte — le geste que tout le monde connaît, et que personne n'écrit en deux lignes :

```css
.bandeau {
  /* (dir + 1) / 2  vaut 1 en descendant, 0 en remontant.
     (1 - top)      annule tout tant qu'on est en haut de page.  */
  translate: 0 calc((1 - var(--z-scroll__top)) * (var(--z-scroll__dir) + 1) / 2 * -100%);
  transition: translate 260ms ease;
}
```

Le bandeau part vers le haut dès qu'on descend, revient dès qu'on remonte, et **reste
toujours là tant qu'on n'a pas quitté le sommet**. Trois comportements, une déclaration —
parce que des nombres, ça se combine.

Et il **garde sa valeur à l'arrêt**, exprès : un bandeau caché doit le rester quand on
s'immobilise, pas clignoter parce qu'un nombre est retombé à zéro.

## Le parallaxe, sans une ligne de JS

Un décor qui glisse moins vite que le texte : c'est le même nombre, multiplié plus petit.

```css
.decor  { translate: 0 calc(var(--z-scroll__y) * -0.3px); }   /* trois fois plus lent */
.avant  { translate: 0 calc(var(--z-scroll__y) * -0.8px); }
```

## Et le CSS natif ?

`animation-timeline: scroll()` fait une partie du travail, et le fera mieux le jour où
tous les navigateurs suivront. Mais **une timeline n'anime que des keyframes** : elle ne
donne pas de nombre. Ici le nombre est à toi — tu le multiplies, tu le compares, tu le
passes à `color-mix()`, tu le mets dans un `calc()` avec autre chose. Les deux
cohabitent : ce n'est pas un remplacement, c'est l'autre bout du problème.

## Le coût

Un écouteur `scroll` **passif** (il ne bloque jamais le défilement), plus un écouteur de
redimensionnement — parce que changer la taille de la fenêtre change la course totale,
donc la part parcourue, **sans le moindre scroll**. L'écriture est groupée à une par
image. Une première écriture a lieu à la connexion : avant tout geste, `__top` vaut déjà
`1`. Tout est retiré à la déconnexion.

Une boîte qui ne défile pas a une course nulle : ses parts valent `0`, jamais l'infini
d'une division par zéro.
