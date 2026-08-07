# z-pointer — la position de la souris, donnée au CSS

« Je voudrais qu'un div suive la souris » est la demande la plus banale du web, et celle
qui coûte le plus cher : un écouteur, une mesure de boîte, une image d'animation, un
nettoyage à la sortie. Écrite trente fois dans une page, elle rame. Écrite **une fois pour
toutes**, elle est gratuite.

```html
<z-pointer local global>
  <div class="halo"></div>
</z-pointer>

<script type="module" src="tools/z-pointer/z-pointer.js"></script>
```

L'outil ne fait qu'**une** chose : poser des **nombres** sur lui-même. Comme une variable
CSS hérite, tout ce qu'il enveloppe les lit gratuitement — aussi profond que ça descende.

## L'exemple — le div ne sait rien, et il suit

```html
<z-pointer>
  <div class="halo"></div>
</z-pointer>

<style>
  .halo {
    position: absolute; width: 220px; height: 220px; margin: -110px 0 0 -110px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--z-accent), transparent 70%);

    translate: calc(var(--z-pointer--local__x) * 1px)      /* ← la position, lue en CSS */
               calc(var(--z-pointer--local__y) * 1px);
    opacity: var(--z-pointer--local__in);                  /* ← 1 dedans, 0 dehors */
  }
</style>
```

Tu bouges la souris, le halo suit. Rien d'autre à écrire. Le `<div>` ne « sait » pas d'où
vient la valeur : il lit un token, comme il lirait `--z-accent`. **Aucune classe, aucun
`addEventListener`, aucune ligne de JS de ta part.**

Et ça descend : un div **trois niveaux plus bas** reçoit exactement les mêmes nombres,
sans que personne ne les lui passe. C'est l'héritage CSS qui travaille, pas nous.

## Les deux repères — la boîte, et la fenêtre

Deux **sorties** d'une même source, comme les `low`/`high` d'un `z-range` — d'où le
séparateur double du pacte, `--z-{comp}--{part}__{prop}`.

| L'attribut | Le repère | Ce qu'il pose |
|---|---|---|
| `local` *(par défaut)* | la **boîte** — `0,0` = son coin haut-gauche | `--z-pointer--local__x` · `__y` (px) · `__rx` · `__ry` (0→1) · `__in` (1/0) |
| `global` | la **fenêtre** — `0,0` = son coin haut-gauche | `--z-pointer--global__x` · `__y` (px) · `__rx` · `__ry` (0→1) |

**Sans attribut, `local` seul** — c'est le cas courant, et le moins cher : l'écouteur est
sur la boîte, pas sur le document. Demande `global` et la souris est suivie **partout**,
même loin de la boîte : c'est ce qu'il faut pour une mire, ou une lumière à l'échelle de
la page.

```html
<z-pointer local global>…</z-pointer>   <!-- les deux repères à la fois -->
```

Quand `global` est demandé, le repère local continue d'être calculé — il devient
simplement négatif ou dépasse la boîte, ce qui est **juste** : la souris est à gauche,
`x` vaut `-40`. C'est `__in` qui dit si l'on est dedans.

## Un nombre, jamais une longueur

Les tokens sont des **nombres nus** — `137.5`, pas `137.5px`. C'est délibéré : un nombre
se **multiplie**, et devient ce que tu veux.

```css
translate: calc(var(--z-pointer--local__x) * 1px);            /* une distance */
rotate:    calc(var(--z-pointer--local__rx) * 360deg);        /* un angle */
width:     calc(var(--z-pointer--local__rx) * 100%);          /* une part */
filter:    blur(calc(var(--z-pointer--local__ry) * 8px));     /* un flou */
```

Une longueur, elle, ne donnerait jamais que des longueurs. C'est la règle du carnet
couleur : **poser un nombre, jamais peindre**.

Les **ratios** `__rx` / `__ry` (0→1) valent souvent mieux que les pixels : ils ne
dépendent pas de la taille de la boîte, donc la même règle tient sur un téléphone et sur
un écran large.

## Il traîne, si tu le demandes

Les neuf nombres sont déclarés en `@property` comme des `<number>`. Un nombre **typé
s'anime** — donc une transition sur la variable suffit à faire **traîner** un calque
derrière la souris, sans une image de JS :

```css
.traine {
  translate: calc(var(--z-pointer--local__x) * 1px) calc(var(--z-pointer--local__y) * 1px);
  transition: --z-pointer--local__x 260ms ease-out,
              --z-pointer--local__y 260ms ease-out;
}
```

Deux calques, la même source, deux retards différents : le second suit à la traîne. C'est
tout le lag qu'il faut pour que ça paraisse vivant.

> `@property` sert une seconde chose, invisible : la **valeur de départ** (`0`). Sans
> elle, un `var()` non défini rendrait la déclaration invalide et **effacerait** le
> calque en silence — le danger silencieux du pacte.

## `__in` — dedans, dehors

Sans lui, un halo reste **collé au dernier pixel survolé** quand la souris s'en va. `__in`
vaut `1` dans la boîte, `0` dehors, et se met où l'on veut :

```css
.halo {
  opacity: var(--z-pointer--local__in);
  transition: opacity 220ms ease;   /* il s'éteint doucement au lieu de disparaître */
}
```

## Ce qu'il n'est pas

Un outil, un rôle — et trois outils qui se ressemblent de loin :

| | |
|---|---|
| **z-pointer** | *où* est la souris, en nombres, pour **ses enfants** |
| [z-cursor](#z-cursor) | il **dessine** un curseur (le sillage, la traînée) |
| [z-channel](#z-channel) | il relie deux éléments **distants** — `channel=` traverse la page, z-pointer ne descend que dans ses enfants |

Besoin de la souris **ailleurs** que sous le `<z-pointer>` ? C'est le canal qu'il te faut,
pas cet outil.

## Le coût

Un seul écouteur — sur la boîte, ou sur le document quand `global` est demandé, **jamais
les deux** (sinon chaque mouvement serait compté deux fois). L'écriture est groupée à
**une par image** (`requestAnimationFrame`), et la boîte n'est mesurée qu'une fois par
image, seulement si le repère local sert. À la déconnexion, tout est retiré.

Un attribut hors du vocabulaire n'est jamais bloqué — **il est dit tout haut** dans la
console. `<z-pointer globale>` ne se perdra pas en silence.
