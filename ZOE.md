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

- **`core/z-layer`** — le **calque** : du **contenu** qui porte un rôle
  (`<z-layer part="icon">★</z-layer>`), ou une pièce de plus que l'auteur veut animer.
  Il n'écrit **jamais** une pièce peinte. Les rôles se partagent entre composants ; un
  calque peut en contenir d'autres. *(C'est ce que l'ADR-0016 appelait `z-part`.)*

**LA LOI DES PIÈCES — « peint, pas posé » — tranchée le 2026-10-14**

*(Remplace la loi des calques du 2026-07-20. Deux formes, c'était chaque état écrit deux
fois dans 36 CSS, et un seul calque ajouté qui faisait basculer la forme courte. Le
principe du calque est simple, c'était son prix qui ne l'était pas.)*

**UNE forme.** L'auteur écrit le contenu ; Zoé PEINT les pièces. Un élément est un seul
nœud, et ses pièces sont ses pseudo-éléments :

```
l'hôte     la boîte, la typo, LE TEXTE (le label, c'est le texte de l'élément)
::before   LA pièce qui bouge seule : `background` (un bouton) OU `marker` (une case)
::after    `contact` : la zone du doigt, ≥ --z-contact-zone (44 px), posée par le SOCLE
contenu    `icon`, et toute pièce de plus : un <z-layer part="…"> écrit par l'auteur,
           en flux, qui ne change jamais la forme
```

**La seule chose gardée de l'esprit Flash : la HIT AREA.** Un petit bouton sur un
téléphone est injouable, et personne ne l'agrandit « plus tard ». Alors tout élément
interactif reçoit du socle une zone tactile invisible, centrée, d'au moins 44 px, qui
déborde ; et « lâché dedans » se juge sur elle. Rien à écrire, jamais.

Ce qui ne change pas : la **grammaire** du pacte (`--z-checkbox--marker__size` nomme
une pièce peinte, la peau ne voit pas la différence), le **lexique** partagé (interdit
d'inventer un synonyme de `label`, `background`, `contact`…), l'**anatomie** propre à
chaque composant, déclarée dans son `static api.layers` avec le `pseudo` de chaque pièce
peinte. La recette du contact vit dans `core/z-element/z-element.css` (liste régénérée
par z-manifest) ; `core/z-layer` ne place plus que du contenu.

**Les états** (le cœur de z-element)
- cycle : `default ⇄ over → press → release / releaseOut` · `drag` · `focus`
- durable : `current` (sélection) · statut métier (`loading/disabled/error/success`)
- combinables (`:state(a):state(b)`), imbricables (scopés), séquençables (`from-<x>`),
  déclarables en CSS (`@property --z-state__x`).

**Les tools** — s'appliquent au HTML nu **ET** à z-element (`tools/`)
- **`z-contact`** — l'effet au point de contact, signé par la peau (une balise dans la page)
- **`z-cursor`** — le sillage du pointeur (un ruban qui suit la souris, ou fuse d'un clic à l'autre)
- **`z-motion`** — animer (presets : shake, slide, pop, ripple, shimmer…)
- **`z-channel`** — faire dialoguer des composants par variables CSS (*le CSS pilote*)
- **`z-lint`** — la console qui corrige : balise, attribut, état, pièce ou token inconnu → le nom le plus proche
- **`z-pointer`** — donner la position de la souris au CSS, pour tout ce qu'il enveloppe
- **`z-scroll`** — où en est le défilement (part parcourue, sens, haut, bout)
- **`z-inview`** — ce qui est à l'écran (entré, part visible, déjà vu, traversée)
- **`z-size`** — la taille réelle d'une boîte, et **est-ce que ça déborde**
- **`z-drag`** — tirer à la main : l'outil pose la position, le CSS décide ce qu'elle bouge

*(Les cinq forment **les CAPTEURS** : ils ne peignent rien, ils répondent en NOMBRES aux
questions que le CSS ne sait pas poser seul — où est la souris · où en est la page ·
qu'est-ce qu'on voit · quelle taille ça fait · où la main a posé l'objet.)*

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

Une source, plusieurs sorties. Chaque composant déclare son API (`static api` : résumé,
exemple, attributs, événements, états, calques, variables, membres — en trois langues) ;
son CSS dit les tokens qu'il lit. **`scripts/z-manifest`** lit tout ça et génère :
- `dist/zoe.json` → **l'index complet** (la doc, l'accueil et le serveur MCP le lisent)
- `dist/custom-elements.json` → interop (standard Custom Elements Manifest)
- `dist/vscode.html-custom-data.json` → **autocomplétion VSCode**
- `llms.txt` · `llms-full.txt` (racine) → **IA / LLM** (grammaire + référence, convention llmstxt.org)
- les listes de balises de `core/z-element/z-element.css` et la table du `README.md`

**`scripts/z-mcp`** expose la même source à un agent IA par le protocole MCP (`.mcp.json`) :
`zoe_grammar · zoe_list · zoe_get · zoe_example · zoe_search · zoe_skins · zoe_lint`.
**`scripts/check.mjs`** est le rouge qui décide : api complète, dossier complet, listes
alignées, aucun lien mort, dist à jour. `node --test` couvre le générateur, les règles de
z-lint et le serveur.

On écrit la doc **une fois**, dans le code. `docs/index.html` la met en scène (exemple
rendu + son code, narratif, tables). Ajouter un composant = son dossier → il apparaît partout.

---

## L'arbre

```
zoe.css · zoe.js       — les deux points d'entrée (tout Zoé ; vérifiés par check)
core/z-element/        — la base vivante (les états, le formulaire, les déclencheurs)
core/z-layer/          — le calque (les pièces, un rôle chacune)
tools/z-*/             — z-contact · z-cursor · z-motion · z-channel · z-lint
                         les capteurs : z-pointer · z-scroll · z-inview · z-size · z-drag
components/z-*/        — .js · .css · .doc.md · .demo.html (+ .lab.html pour les essais)
skins/*/               — .css · .doc.md · .demo.html (la planche de contrôle)
scripts/z-manifest/    — le générateur (code → index, manifeste, autocomplétion, llms.txt)
scripts/z-mcp/         — le serveur MCP (la même source, outil par outil, pour un agent)
scripts/check.mjs      — le contrôle de cohérence · scripts/serve.mjs — le serveur local
dist/                  — sorties générées (jamais éditées à la main)
llms.txt · llms-full.txt — la référence pour les IA, à la racine
docs/                  — la doc officielle (viewer de dist/zoe.json) · GRAMMAR.md · intro.html
examples/              — pages entières, et la boîte à outils des démos (page.css, code.js…)
```
