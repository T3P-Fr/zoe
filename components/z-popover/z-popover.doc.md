# z-popover

Un **panneau flottant ancré à son déclencheur**, bâti sur
[`z-element`](../../core/z-element/z-element.doc.md). Des options, des filtres, une aide
détaillée : un contenu qui s'ouvre **à côté** de ce que vous venez d'activer, et se
referme dès que vous regardez ailleurs. Zoé n'injecte **aucune balise** (ADR-0018) : vous
écrivez le déclencheur et le panneau, le composant leur donne leur rôle, leur place et
leur mouvement.

```html
<z-popover placement="bottom">
  <z-button part="trigger" type="button">Options</z-button>
  <div part="panel">
    <p>Contenu libre.</p>
  </div>
</z-popover>
```

| Rôle | La pièce |
|---|---|
| `trigger` | ce qui l'ouvre — n'importe quel élément focusable (un `z-button`, un `<button>`) |
| `panel` | ce qui s'ouvre — votre contenu, sans contrainte |

## Ouvert = `open`

L'attribut `open` est la **source de vérité** : il est posé par le clic sur le
déclencheur, par `show()` / `hide()` / `toggle()`, et **resynchronisé** quand le
navigateur ferme seul (clic dehors, <kbd>Échap</kbd>, un autre popover qui s'ouvre). Il
est stylable en `:state(open)`, comme tout état durable de Zoé.

```js
const popover = document.querySelector("z-popover");
popover.show();                // ou popover.open = true
popover.addEventListener("toggle", (event) => event.detail.open);   // true / false
```

L'événement `toggle` bulle et part **une fois par bascule**, quelle qu'en soit la
cause. Le composant **émet, la page décide** : rien d'autre ne se passe dedans.

## Placement et alignement

Deux attributs, lus à chaque ouverture :

| | Valeurs | Ce que ça dit |
|---|---|---|
| `placement` | `bottom` (défaut) · `top` · `left` · `right` | le **côté** du déclencheur où le panneau s'ouvre |
| `align` | `start` (défaut) · `center` · `end` | le **bord** du déclencheur sur lequel il s'aligne |

Si le côté demandé manque de place dans la fenêtre — et que le côté opposé en offre
davantage — le panneau **se retourne** (`bottom` → `top`, `left` → `right`…). Le côté
effectif est écrit sur le panneau en `data-placement` : c'est lui que le CSS lit pour
orienter le mouvement d'entrée. Le panneau reste toujours **dans la fenêtre**, à 8 px
des bords. Tant qu'il est ouvert, il suit le défilement et le redimensionnement.

L'ancrage se fait en JS (l'ancrage CSS natif n'est pas encore partout) : le composant
mesure, puis pose **deux nombres nus** sur le panneau, `--z-popover__x` et
`--z-popover__y` (des px sans unité). Le CSS multiplie — `left: calc(var(--z-popover__x)
* 1px)` — et c'est lui qui bouge. La mesure d'un côté, le mouvement de l'autre : la même
règle que l'indicateur de `z-tabs`.

## Sous le capot : l'API Popover native

Le composant pose `popover="auto"` sur le panneau (sauf si vous avez déjà écrit un
`popover`). Le navigateur lui donne alors :

- le **top layer** — rien ne passe au-dessus, ni un `z-index: 9999`, ni un
  `overflow: hidden` d'un parent ;
- la **fermeture au clic dehors** (light-dismiss) et à <kbd>Échap</kbd> ;
- **un seul** popover `auto` ouvert à la fois — en ouvrir un ferme le précédent.

Sans API Popover (navigateur ancien), un **repli** fait le même travail : `hidden` sur le
panneau, un écouteur sur `document` pour le clic dehors et <kbd>Échap</kbd>. Même
attribut, mêmes événements, même CSS — seule la couche d'affichage change. Dans ce mode,
un ancêtre porteur de `transform` ou `filter` casse le repère du `position: fixed` (piège
classique) ; le top layer, lui, y échappe.

## Accessibilité

- Le déclencheur annonce ouvert/fermé (`aria-expanded`) et pointe le panneau
  (`aria-controls`).
- **Aucun rôle n'est imposé au panneau** : un popover générique n'en a pas. Si votre
  contenu est un dialogue, écrivez `role="dialog"` et un `aria-label` ; un menu
  d'actions, lui, a son composant : [`z-menu`](../z-menu/z-menu.doc.md).
- <kbd>Échap</kbd> ferme et **rend le focus au déclencheur** ; à toute fermeture, si le
  focus était dans le panneau, il revient au déclencheur — jamais sur `<body>`.
- Le clavier atteint le panneau comme n'importe quel contenu : <kbd>Tab</kbd> y entre
  depuis le déclencheur, le focus n'y est pas piégé (ce n'est pas une modale).

## Anatomie & grammaire du pacte

Le panneau se peint par des tokens à **double séparateur** ; chacun retombe sur la peau :

| Token | Peint |
|---|---|
| `--z-popover__background` · `__color` | la surface du panneau et son encre (`--z-surface-raised`, `--z-ink`) |
| `--z-popover__border-color` · `__radius` | son filet et son rayon (`--z-line`, `--z-radius`) |
| `--z-popover__shadow` | son ombre — douce par défaut ; HighTech l'éteint (`none`, loi « zéro ombre ») |
| `--z-popover__padding` | l'air intérieur (`--z-pad-y --z-pad-x`) |
| `--z-popover__width` · `__max-width` · `__max-height` | sa boîte (`max-content`, `min(22em, 90vw)`, `calc(100vh - 2em)`) |
| `--z-popover__offset` | le **souffle** entre déclencheur et panneau (`.4em`) |
| `--z-popover__travel` | la distance parcourue à l'entrée — le **retrait** d'où il vient (`.35em`) |
| `--z-popover__x` · `__y` | **posés par le composant** : la position mesurée, en px nus |
| `--z-popover--panel__translate` | posé par le CSS d'après `data-placement` — le vecteur du retrait, relu par `@starting-style` ; ne s'écrit pas |

Le mouvement est réglé par la peau : `--z-dur-open` et `--z-ease-spring` à l'ouverture,
`--z-dur-close` et `--z-ease` à la fermeture.

## Le geste

Le panneau **naît en retrait vers son déclencheur** et glisse en place en se révélant ;
il repart par le même chemin. Le piège documenté dans le CSS : un popover natif passe en
`display: none` et quitte le top layer **à l'instant** de la fermeture — sans
`transition-behavior: allow-discrete` sur `display` et `overlay`, aucune sortie ne
s'anime, quoi que vous écriviez sur `opacity`. Démo : `z-popover.demo.html` (+ sélecteur
de peau).
