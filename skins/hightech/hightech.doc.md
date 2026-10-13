# HighTech — la planche d'ingénieur

> ⚠ **Cette peau ne s'invente pas — elle se PORTE.** Sa source est dans ce dossier :
> [`source/FullConcept--HighTech.html`](./source/FullConcept--HighTech.html), le
> référentiel « Atomes de composants web ». Avant de toucher **une** valeur : ouvrir la
> source et comparer. Si la source manque un jour : **s'arrêter et demander**, ne pas
> redessiner de mémoire. Redessinée de mémoire, la peau perd son essence.

## Les cinq lois (écrites en interdits)

1. **Angle 0.** Rien n'est arrondi. Le rayon n'est pas un réglage, c'est l'ADN.
   *(Seul le rond d'une radio l'est : c'est une forme de sens, pas une décoration.)*
2. **Le filet, jamais l'aplat.** Tout se délimite par un trait de 1px. Une surface
   colorée est un **événement**, pas un fond.
3. **Une seule ombre : le halo.** Zéro ombre portée, zéro élévation. Le halo de focus et
   **l'onde au clic** sont les seuls effets lumineux — ils sont la signature.
4. **Mono partout.** IBM Plex Mono porte toute l'interface ; Newsreader ne parle qu'en
   éditorial. Une interface pas en mono n'est pas HighTech.
5. **Le cobalt est rare.** `#006EFF` signale l'**activation** (choisi, actif, en cours),
   jamais la décoration. S'il y en a partout, il ne dit plus rien.

## La fondation : une échelle d'encre

La source ne pose pas une palette, elle pose une **échelle interpolée** — `ink-00` (le
papier) → `ink-100` (l'encre), 3 crans au milieu — **plus un accent**. Tout gris de
l'interface en sort ; on n'invente pas une couleur à côté.

| 00 | 25 | 50 | 75 | 100 | accent |
|---|---|---|---|---|---|
| `#efece7` | `#babbb4` | `#858381` | `#4f4f4d` | `#1a1a1a` | `#006eff` |

Les panneaux sont **blancs** sur ce papier greige : c'est ce contraste-là qui fait
« planche », pas le gris.

## Vérifier qu'on n'a pas dérivé

Ouvrez **[`hightech.demo.html`](./hightech.demo.html)** : les composants Zoé sous la peau
**à gauche**, la capture de la source **à droite**. Un écart se *voit* — il ne se discute
pas. C'est le contrôle à faire après toute modification de la peau **ou** d'un composant.

## Ce que la peau contient — et ce qu'elle ne contient pas

Une peau Zoé = des **valeurs** (`--z-*`), jamais des formes. Aucun sélecteur de composant
ici : la mécanique lit les tokens. Changer de peau = changer ce fichier.

**Charger :** `<link rel="stylesheet" href="skins/hightech/hightech.css">`. Le swap se
teste avec le sélecteur de peau (`examples/skin-switch.js`).

Les fontes sont importées depuis Google Fonts, comme la source. Un projet qui veut zéro
réseau les auto-héberge et retire l'`@import` — la peau ne connaît que les familles.
