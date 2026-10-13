# z-disclosure

Un contenu long n'a pas à s'imposer : on en montre le titre, et le lecteur décide de
l'ouvrir. `z-disclosure` est ce dépli — un titre qui agit comme un bouton, un panneau qui
se révèle **en glissant** — bâti sur [`z-element`](../../core/z-element/z-element.doc.md).
Vous écrivez les deux pièces ; Zoé n'injecte aucune balise (ADR-0018) et pose la
sémantique à votre place.

```html
<z-disclosure open>
  <z-layer part="label">Ce que Zoé garde natif</z-layer>
  <z-layer part="panel">Titres, paragraphes, liens — lus par les moteurs de recherche.</z-layer>
</z-disclosure>
```

## En calques

Deux rôles, et pas un de plus. Le composant les cherche en **enfants directs**
(`:scope > [part=…]`) : un dépli imbriqué dans un autre garde ses propres pièces.

| Rôle | La pièce |
|---|---|
| `label` | le déclencheur — une ligne cliquable, focusable, précédée d'un chevron (`::before`) |
| `panel` | le contenu repliable — n'importe quel HTML : paragraphes, listes, liens, un autre dépli |

Le contenu du panneau reste **natif** : c'est lui que les moteurs lisent (contrat SEO) ;
le dépli ne fait que le cacher ou le montrer. `label` est un rôle du lexique partagé
([`z-layer`](../../core/z-layer/z-layer.doc.md)) ; `panel` est propre au dépli.

## Ouvert = `open`

`open` est un état **durable** : l'attribut est la source de vérité, `:state(open)` le
reflète, et la propriété le lit et l'écrit.

```html
<z-disclosure open>…</z-disclosure>
```

```js
pli.open;                 // → true / false
pli.open = true;          // ouvre, sans événement — c'est le programme qui parle
pli.toggle();             // bascule ET émet `toggle`
pli.addEventListener("toggle", () => pli.open);
```

Le clic et le clavier passent par `toggle()` : `toggle` n'est émis que pour un geste, ou
pour un appel explicite. Poser `.open` depuis votre code ne l'émet pas — vous savez déjà
ce que vous venez de faire.

## La hauteur qui glisse

Un panneau qui s'ouvre d'un coup fait sauter la page. Ici l'hôte est une **grille** à
deux rangées : le label (`auto`) et le panneau, qui passe de `0fr` à `1fr`. Cette
transition est animable ; le panneau garde `min-height: 0` et `overflow: hidden` pour se
laisser tailler — aucun `max-height` à deviner, quelle que soit la hauteur du contenu. Le
padding bas du panneau s'anime avec lui : le contenu respire une fois ouvert, sans
empêcher la rangée d'atteindre zéro.

## `disabled`

Le seul état qui **agit** : le label n'ouvre ni ne ferme plus, au pointeur comme au
clavier, et son encre s'éteint (`--z-disabled`). Le panneau reste dans l'état où il était.

## Accessibilité

Posé par le composant, rien à écrire :

| Sur | |
|---|---|
| `label` | `role="button"`, `tabindex="0"`, `aria-expanded` (suit `open`), `aria-controls` → l'`id` du panneau (généré s'il manque) |
| `panel` | `inert` quand il est fermé : hors tabulation **et** hors lecture d'écran |

`inert` plutôt que `hidden` : `hidden` tuerait l'animation de hauteur ; `inert` retire le
panneau de l'arbre interactif tout en le laissant se dessiner. Si vous écrivez vous-même
`role` ou `tabindex` sur le label, ils sont respectés.

Clavier : <kbd>Tab</kbd> atteint le label, <kbd>Entrée</kbd> ou <kbd>Espace</kbd> bascule.

## Plusieurs déplis

Un dépli ne connaît pas ses voisins (zéro logique métier). Pour qu'un seul reste ouvert à
la fois, c'est [`z-accordion`](../z-accordion/z-accordion.doc.md) qui coordonne ; sans
lui, chaque dépli vit sa vie — et c'est souvent ce qu'on veut (une FAQ).

## Anatomie & grammaire du pacte

`z-disclosure` ne lit **aucun token propre** : il boit directement la peau. Ce qu'il
boit, et où :

| Token (peau) | Peint |
|---|---|
| `--z-line` | le filet sous le dépli |
| `--z-ink` · `--z-font` · `--z-font-weight-strong` | le label |
| `--z-ink-soft` | le texte du panneau |
| `--z-dur-open` · `--z-ease` | le glissement de la hauteur (et du padding) |
| `--z-dur` · `--z-ease-spring` | la rotation du chevron |
| `--z-accent` | le halo de focus du label (à 40 %) |
| `--z-disabled` | le label désactivé |

Pour repeindre un dépli sans toucher à la peau, visez ses pièces depuis l'hôte — le `>`
protège un dépli imbriqué du CSS de son parent :

```css
z-disclosure > [part=label] { color: var(--z-accent); }
z-disclosure:state(open) > [part=label]::before { rotate: 135deg; }
```

## Le geste

À l'ouverture, le chevron pivote de −45° à 45° (ressort, `--z-dur`) pendant que la rangée
du panneau grandit de `0fr` à `1fr` (`--z-dur-open`, `--z-ease`). À la fermeture,
l'inverse — et le panneau devient `inert` à l'instant où l'attribut tombe, pas à la fin de
l'animation. Les autres états du socle restent disponibles en `:state()` ; le CSS du
composant ne peint que `open` et `disabled`. Démo : `z-disclosure.demo.html`
(+ sélecteur de peau).
