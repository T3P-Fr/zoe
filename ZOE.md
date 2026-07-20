# Zoé — le manifeste

> **La source unique de vérité sur ce qu'EST Zoé.** Court, stable. Si un jour un doute
> revient, on relit ceci — pas 19 Mo d'archives contradictoires.

Zoé étend le HTML avec des éléments **vivants** (états), **skinnables** (peaux portables)
et **animés**, pour le « gradev » (mi-graphiste / mi-dev). *Less code, more creativity.*

---

## La carte

**Le noyau**
- **`core/z-element`** — la brique vivante, **une seule**. Un custom element qui **porte
  les états** nativement (`:state()` + événement `z-state` + attributs + `@property`).
  Deux usages : un composant l'**étend** (Chemin A) · tu l'**enroules** autour de ton
  élément (Chemin B, `<z-element><button/></z-element>`). *« z-state, c'était son nom de
  prototype ; il EST le z-element. »*

- **`core/z-layer`** — le **calque** : une pièce d'un composant, portant **un rôle**
  (`<z-layer part="marker">`). z-element porte les états (le vivant), z-layer porte les
  pièces (le visible). Une balise, un ensemble de rôles **ouvert** — la traduction en
  HTML du `--{part}` du pacte. Les rôles se partagent entre composants. **Un calque peut
  en contenir d'autres.** *(C'est ce que l'ADR-0016 appelait `z-part`.)*

**LA LOI DES CALQUES — tranchée le 2026-07-20**

Ce qui est **commun** à tous les composants n'est **pas** un arbre unique : on n'impose
pas à un bouton la structure d'une case. C'est la **grammaire** et le **lexique**.
L'**anatomie**, elle, appartient à chaque composant.

```
GRAMMAIRE (commune)  une balise z-layer · un attribut part · imbricable
LEXIQUE   (commun)   le même mot pour le même rôle, partout
ANATOMIE  (propre)   quels rôles CE composant a — déclarés dans son static api.layers

  z-button    background · infos(icon, label) · contact
  z-checkbox  background · marker(ring, dot) · infos(icon, label) · contact
  z-radio     les MÊMES mots que la case (forme ronde) → la même skin les peint
  z-field     son anatomie à lui (input, etc.) — quand on l'écrira
```

**Interdit d'inventer un synonyme** : si le rôle existe déjà (`label`, `icon`,
`background`, `contact`…), on reprend le mot. C'est le **lexique partagé** qui permet à
une skin de peindre un composant qu'elle ne connaît pas — pas l'uniformité des arbres.

Le placement des rôles **universels** (background, infos, contact) vit dans
`core/z-layer` ; un composant ne décide que de **ses tailles et de ses couleurs**.
Schéma : `core/z-layer/z-layer.anatomie.txt`.

**Les états** (le cœur de z-element)
- cycle : `default ⇄ over → press → release / releaseOut` · `drag` · `focus`
- durable : `current` (sélection) · statut métier (`loading/disabled/error/success`)
- combinables (`:state(a):state(b)`), imbricables (scopés), séquençables (`from-<x>`),
  déclarables en CSS (`@property --z-state__x`).

**Les tools** — s'appliquent au HTML nu **ET** à z-element (`tools/`)
- **`z-motion`** — animer (presets : shake, slide, pop, ripple, shimmer…)
- **`z-stager`** — décaler en cascade (stagger)
- **`z-grid`** — mettre en page
- **`z-channel`** — faire dialoguer des composants par variables CSS (*le CSS pilote*)

*(« z-state » n'est plus un tool : poser des états sur ton élément = l'enrouler dans
`z-element`, Chemin B. Un seul nom.)*

**Les composants** (`components/`) — structure figée, skinnable (Chemin A)

**Les peaux** (`skins/`) — 1 fichier de tokens = 1 peau. Swap = 1 ligne.

**Le pacte / geste central** — `--z-{comp}[--{part}]__{prop}` : un état **redéfinit une
swatch** → repeint local, natif, animable.

---

## Les deux chemins de la skinnabilité

Un skin (CSS) est écrit contre **une** structure. Donc **skin portable ⟺ structure figée**.
- **Chemin A** — composant Zoé : structure figée + skin tokenisée (portable).
- **Chemin B** — ton élément entouré de `z-state` + ton CSS + presets (sur-mesure).

---

## La loi

HTML-first · **la VUE d'abord** · le light DOM appartient à l'auteur · zéro logique
métier dans le composant · tout skinnable & animable · code (JSDoc + `.doc.md`) = la
source de la doc.

---

## La doc, comment elle se fabrique

Une source, plusieurs sorties. Chaque composant déclare son API (`static api`).
**`scripts/z-manifest`** la lit et génère :
- `dist/vscode.html-custom-data.json` → **autocomplétion VSCode**
- `dist/custom-elements.json` → **doc officielle** (`docs/`) + interop (standard CEM)
- `dist/llms.txt` → **IA / LLM**

On écrit la doc **une fois**, dans le code. `docs/index.html` la met en scène (démos
live, params temps réel). Ajouter un composant = son dossier → il apparaît partout.

---

## L'arbre

```
core/z-element/        — la base vivante (les états)
core/z-layer/          — le calque (les pièces, un rôle chacune)
tools/z-*/             — z-contact · z-motion · z-stager · z-grid · z-channel
components/z-*/        — .js · .css · .doc.md · .demo.html
skins/*/               — .css · .doc.md
scripts/z-manifest/    — l'outil (code → doc + autocomplétion + IA)
dist/                  — sorties générées (jamais éditées à la main)
docs/                  — la doc officielle (viewer léger du manifeste)
```
