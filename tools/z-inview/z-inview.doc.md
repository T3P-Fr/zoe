# z-inview — ce qui est à l'écran, dit au CSS

« Ça apparaît quand ça entre à l'écran » est la demande la plus répandue du web moderne.
C'est aussi la raison pour laquelle on charge **des bibliothèques entières** — chacune
avec ses classes, sa configuration, son catalogue d'animations à apprendre.

```html
<z-inview>
  <h2>ce titre entre en scène</h2>
</z-inview>

<script type="module" src="tools/z-inview/z-inview.js"></script>
```

```css
z-inview h2 {
  opacity: var(--z-inview__seen);
  translate: 0 calc((1 - var(--z-inview__seen)) * 20px);
  transition: opacity .6s, translate .6s;
}
```

Aucune classe posée par du JS, aucun nom d'animation à retenir : **l'apparition est écrite
en CSS**, dans la peau, comme le reste de Zoé. Et comme c'est du CSS, elle est à toi —
change la durée, la courbe, la direction, sans rien demander à personne.

## Ce qu'il pose

| Le token | Ce qu'il vaut |
|---|---|
| `--z-inview__in` | `1` dès qu'un pixel est visible, `0` sinon — pour ce qui doit **rejouer à chaque passage** |
| `--z-inview__ratio` | la **part visible** de l'élément, `0→1` |
| `--z-inview__seen` | `1` une fois vu — et **il ne redescend jamais** |
| `--z-inview__cross` | la **traversée** de l'écran : `0` en entrant par le bas, `1` en sortant par le haut |

## `seen` — parce qu'une entrée en scène ne se rejoue pas

Sans lui, remonter dans la page rejouerait toutes les animations, et la page **donnerait
le tournis**. C'est le défaut que tout le monde finit par corriger à la main
(`observer.unobserve`). Ici c'est un nombre de plus, et **le choix reste à l'auteur** :

```css
.une-fois     { opacity: var(--z-inview__seen); }   /* il entre, il reste */
.a-chaque-fois{ opacity: var(--z-inview__in); }     /* il va et il vient */
```

## `cross` — quand `ratio` ne suffit plus

`ratio` **sature** : dès que l'élément tient tout entier à l'écran, il vaut `1` et ne
bouge plus. Pour un décor qui glisse pendant **toute** la traversée, il faut un nombre qui
continue de monter — c'est `cross`, qui vaut `0` quand le haut de l'élément touche le bas
de l'écran et `1` quand son bas touche le haut.

```css
.decor  { translate: 0 calc(var(--z-inview__cross) * -60px); }        /* il dérive */
.image  { scale: calc(1 + var(--z-inview__cross) * .12); }            /* elle respire */
.teinte { filter: grayscale(calc(1 - var(--z-inview__cross))); }      /* elle se colore */
```

## `margin` — déclencher plus tôt, ou plus tard

L'attribut agrandit ou rétrécit l'écran, **pour cet élément seulement**.

```html
<z-inview margin="-120px">…</z-inview>   <!-- attend qu'il soit bien entré -->
<z-inview margin="300px">…</z-inview>    <!-- le prépare avant qu'il n'arrive -->
```

Une valeur négative est le réglage courant : elle évite qu'une chose se déclenche alors
qu'on n'en voit encore que le premier pixel.

## Le coût, et le soin qu'il demande

L'observateur (`IntersectionObserver`) est le moyen **le moins cher** de savoir qu'on
entre à l'écran : le navigateur le calcule lui-même, sans écouter le défilement. Il
prévient à vingt-et-un paliers (tous les 5 %), assez pour que `ratio` paraisse continu
sans demander un calcul à chaque pixel.

`cross`, lui, a besoin d'une mesure continue. Il n'est donc suivi **que pendant que
l'élément est visible**, et débranché dès qu'il sort — puis figé au bord qu'il vient de
franchir, `0` en bas, `1` en haut, pour qu'un décor ne reste jamais coincé à mi-course.
**Un élément hors de l'écran ne coûte rien.**

> **Accessibilité.** Une entrée en scène est une animation : pense à la couper pour qui
> n'en veut pas. `@media (prefers-reduced-motion: reduce) { transition: none }` — l'outil
> ne le fait pas à ta place, parce que c'est la peau qui décide ce qui bouge.
