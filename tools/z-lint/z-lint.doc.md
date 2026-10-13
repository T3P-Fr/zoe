# z-lint — la console qui corrige

Le navigateur ne dit jamais qu'une propriété est inconnue. `--z-button-bg: red` ne peint
rien, `z-button:state(hovered)` ne correspond à rien, `<z-buton>` reste une boîte vide —
et tout cela **sans un mot**. Pour un humain, Zoé paraît cassée. Pour un agent IA, la
faute passe inaperçue.

z-lint compare ce que la page écrit au vocabulaire **réel** de Zoé — celui que le
générateur tire du code (`dist/zoe.json`) — et signale chaque écart avec le nom valide
le plus proche.

```html
<script type="module" src="tools/z-lint/z-lint.js"></script>
```

Une ligne, en développement seulement. Au chargement, la console reçoit par exemple :

```
z-lint : 3 finding(s) — 1 will never work
  ✗ unknown element <z-buton> — did you mean <z-button>?
  ⚠ <z-button> never poses the state `hovered` — did you mean `over`?
  ⚠ `--z-button-bg` is not in the pact's grammar `--z-{component}[--{part}]__{css-property}` — did you mean `--z-button__background-color`?
```

Les messages sont en anglais, comme le reste de l'API : la console est lue par des
développeurs et par des agents, et la grammaire qu'elle cite l'est aussi.

## Ce qu'il vérifie

| Dans | Constat | Niveau |
|---|---|---|
| le HTML | une balise `z-*` inconnue | erreur |
| le HTML | un attribut inconnu sur une balise connue | avertissement |
| le CSS | `z-x:state(y)` où `y` n'est jamais posé par `z-x` | avertissement |
| le CSS | `z-x … [part=y]` où `y` n'est pas une pièce de `z-x` | avertissement |
| le CSS | une variable `--z-x…` hors de la grammaire du pacte | avertissement |
| le CSS | une variable `--z-x__…` que le CSS de `z-x` ne lit pas | information |
| le CSS | une variable globale `--z-…` proche d'un token de peau | information |
| le CSS | `::part()`, `[state=…]`, `.z-press` — les formes mortes | erreur |
| le CSS | `animation: nom` sans `@keyframes` ni preset de z-motion | information |

Ce que l'auteur **déclare lui-même** est légitime et jamais signalé : un état annoncé par
`@property --z-state__x`, une `@keyframes` écrite dans la page, les états de séquence
`from-*`, les attributs HTML globaux, `aria-*` et `data-*`.

## Pourquoi la suggestion est juste

La grammaire de Zoé est régulière : un état s'écrit toujours `z-x:state(nom)`, une
variable toujours `--z-{composant}[--{pièce}]__{propriété-css}`. Le vocabulaire est donc
fini et connu, et la distance d'édition entre ce qui est écrit et le mot le plus proche
suffit. Un agent qui lit la console peut appliquer la correction sans deviner.

## Depuis votre code

```js
const findings = await ZoeLint.lint();        // relance l'analyse, rend les constats
document.addEventListener("zoe:lint", (e) => e.detail.findings);
```

Chaque constat porte `level` (`error` · `warn` · `info`), `kind`, `found` (ce qui est
écrit), `expected` (la suggestion, ou `null`) et `message`.

## Le même moteur, ailleurs

Les règles vivent dans `z-lint.rules.js`, un module pur sans DOM. Le serveur MCP de Zoé
les expose avec l'outil `zoe_lint` : un agent peut vérifier un fragment HTML ou CSS
**avant** de l'écrire dans une page.

## Ce qu'il n'est pas

Pas un validateur HTML, pas un linter CSS généraliste. Il ne connaît que Zoé : ses
balises, ses attributs, ses états, ses pièces, ses tokens, ses mouvements. Et il n'a rien
à faire en production : il lit la page, il ne la change pas.
