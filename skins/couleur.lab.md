# La couleur — le carnet du labo

> **Ce fichier ne contient pas de calculs.** Le « comment » (L·C·H, les dérivations,
> les formules) vit dans les essais de `.tokenisation/` et dans
> [`examples/trois-variables.html`](../examples/trois-variables.html).
> Ici : **les NOMS**. Quelle grammaire, et pourquoi celle-là.
>
> Écrit le 2026-07-21.

---

## 1 · Le critère qui élimine

> **Un nom de plan ne doit jamais être un nom de composant.**

`--z-card-bg`, `--z-modal-bg`, `--z-header-bg` : chaque nouveau composant crée un
token. C'est le plafond garanti — et c'est exactement ce que font tous les design
systems. On nomme **la position ou la matière**, jamais l'objet.

---

## 2 · Les deux couches — TRANCHÉ

Une seule source de valeurs, deux vocabulaires qui pointent dessus.

```css
/* LA SOURCE — l'échelle d'opacité. Rien d'autre ne porte de valeur. */
--z-ink000   /* transparent */
--z-ink012  --z-ink025  --z-ink050  --z-ink075
--z-ink100   /* pleine */

/* PORTE 1 — LE DESSIN : à quoi ça sert */
--z-ink--title: var(--z-ink100);
--z-ink--body : var(--z-ink075);
--z-ink--note : var(--z-ink050);
--z-ink--line : var(--z-ink012);
--z-ink--veil : var(--z-ink000);

/* PORTE 2 — LES ÉTATS : quand ça change */
--z-opacity__disabled: var(--z-ink025);
--z-opacity__muted   : var(--z-ink050);
--z-opacity__over    : var(--z-ink100);
```

**Pourquoi une source et deux portes, plutôt que deux jeux séparés :**

- **une seule vérité.** Une peau qui veut plus de contraste bouge l'échelle, et le
  dessin *et* les états suivent ensemble. Deux jeux séparés dérivent — ils dérivent
  toujours.
- **les deux vocabulaires répondent à deux questions.** `--z-ink--note` dit *à quoi ça
  sert*. `--z-opacity__disabled` dit *quand ça arrive*. Les fusionner obligerait à
  écrire `--z-ink025` dans un état, et on aurait reperdu le sens.
- **rien n'est écrit deux fois.** Un alias n'est pas une copie.
- **le chiffre reste** pour qui sait ce qu'il veut ; le mot est là pour aller vite —
  et pour l'IA, qui devinera `--z-ink--note` et jamais `ink050`.

Si un état a besoin d'une valeur absente de l'échelle — ça arrivera — il l'écrit en
clair. L'échelle est un chemin rapide, **pas une clôture**.

---

## 3 · La règle d'écriture d'un état — la formule ne se répète JAMAIS

C'est le point le plus important de ce fichier, et il vaut pour tout Zoé.

**Ce qu'il ne faut pas faire** (le réflexe naturel, et le piège) :

```css
z-button:state(disabled) > z-layer[part="background"] {
  background-color: color-mix(in oklab, var(--z-label__color)
                    calc(var(--z-opacity__disabled) * 100%), transparent);
}
```

Quinze états × six calques : la formule serait écrite **quatre-vingt-dix fois**, donc
quatre-vingt-dix endroits où elle peut diverger.

**Ce qu'il faut faire** — la formule vit dans le CALQUE, écrite une fois :

```css
/* core/z-layer — une fois, pour toujours */
z-layer[part="background"] {
  background-color: color-mix(in oklab,
    var(--z-tint) calc(var(--z-opacity) * 100%), transparent);
}
```

…et un état ne fait plus que **poser un nombre** :

```css
z-button:state(disabled) { --z-opacity: var(--z-opacity__disabled); }
z-button:state(over)     { --z-opacity: var(--z-opacity__over); }
z-button:state(current)  { --z-tint: var(--z-color--accent); }
```

**Une ligne par état.** Pas de `color-mix`, pas de `part=`, pas de chemin à connaître.
Et comme les custom properties héritent, l'état posé sur l'hôte repeint **tous** ses
calques d'un coup : le geste central de Zoé, sans le câbler.

C'est la même mécanique que `z-slider` : le JS pose `progress`, le CSS a la formule.
Ici l'état pose `opacity`, le calque a la formule. **Poser un nombre, jamais peindre.**

---

## 4 · Les plans — les quatre vocabulaires étudiés, non tranché

Quatre familles ont été proposées pour nommer les fonds (page → carte → premier plan).
**Christophe n'a pas tranché** ; les voici pour ne pas les reperdre.

| | le vocabulaire | ce qu'il vaut |
|---|---|---|
| **A1 · l'échelle muette** | `--z-plan--02 · --z-plan-00 · --z-plan-1 · --z-plan-2` | aucun débat possible (`raised` vs `elevated` vs `overlay` n'existe plus), extensible à l'infini. Froid, mais indiscutable. |
| **A2 · l'imprimerie** | `paper · plate · varnish · emboss` | chaque mot dit sa hauteur physiquement, un imprimeur comprend sans doc. S'épuise à quatre. |
| **A3 · la scène** | `decor · scene · avant · fosse` | le vocabulaire Flash de Christophe. **La métaphore tient pour l'élévation ET pour l'animation** — « entrer en scène » n'est plus une image, c'est le même mot. |
| **A4 · la distance** | `loin · fond · pres · touche` | nomme ce que l'œil fait, pas ce que la matière est. Marche aussi pour le flou et l'échelle. Le plus abstrait, le plus extensible. |

**Ma recommandation : A3 (la scène)** — parce que c'est sa langue, que la métaphore
continue de marcher pour le mouvement (ce qu'aucune autre ne fait), et que quatre plans
suffisent : un cinquième est de toute façon un mauvais signe.

*Réserve honnête : A3 est en français dans une grammaire qui vise l'anglais
(`--z-ink--title`, `--z-opacity__disabled`). Soit on traduit — `backdrop · stage ·
front · pit` — soit on assume le mélange. À trancher avec le vocabulaire des plans.*

---

## 5 · Ce qui a été démontré ailleurs, pour mémoire

- Les fonds descendent de **l'harmonie complémentaire à la main**, jamais d'un gris. Un
  fond teinté de sa propre couleur éteint la marque ; teinté de l'opposé, il la fait
  vibrer. La variété vient de **l'angle**. Preuve : `examples/trois-variables.html`.
- Séparer L·C·H rend les états **arithmétiques** : `:hover` déplace L, `:disabled`
  divise C — un bouton éteint garde sa teinte au lieu de virer au gris.
- **Jour/nuit est EN PAUSE** (2026-07-21) : il se heurtait à l'harmonie, deux systèmes
  se disputant la clarté des fonds. Figé à 0, pas supprimé.

---

## 6 · Dette connue

- **`--z-ink--veil` = `--z-ink000` = transparent.** Un alias vers le vide a-t-il un
  sens, ou est-ce un mot pour rien ? À vérifier au premier usage réel.
- **La règle du §3 n'est pas encore appliquée** : `z-layer` ne porte pas la formule, et
  les composants existants (`z-button`, `z-checkbox`, `z-slider`) écrivent encore leurs
  couleurs état par état. C'est un refactor, il demande un go.
- **Une seule couleur invalide efface un composant entier**, sans erreur ni warning
  (vécu sur `z-slider` : `--z-line` absent d'une page → tout le `background-image`
  invalide, curseur disparu). C'est le « danger silencieux » du pacte : Zoé doit gueuler.
