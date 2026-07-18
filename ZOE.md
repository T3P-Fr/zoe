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

**Les états** (le cœur de z-element)
- cycle : `default ⇄ over → press → release / releaseOut` · `drag` · `focus`
- durable : `current` (sélection) · statut métier (`loading/busy/disabled/error/success`)
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
core/z-element/       — la base
tools/z-*/            — z-state · z-motion · z-stager · z-grid · z-channel
components/z-*/        — .js · .css · .doc.md · .demo.html
skins/*/               — .css · .doc.md
scripts/z-manifest/    — l'outil (code → doc + autocomplétion + IA)
dist/                  — sorties générées (jamais éditées à la main)
docs/                  — la doc officielle (viewer léger du manifeste)
```
