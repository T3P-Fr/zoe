# z-tabs

Des onglets, c'est une barre et un panneau à la fois — et tout ce qui va avec pour que ce
soit vrai : les rôles ARIA, le clavier, l'onglet actif qui se voit. z-tabs donne tout
ça à **votre** structure : vous écrivez les onglets et les panneaux (Zoé n'injecte rien,
ADR-0018), il les relie, les annonce, et fait glisser l'indicateur sous l'onglet actif.
Bâti sur [`z-element`](../../core/z-element/z-element.doc.md).

```html
<z-tabs value="livraison">
  <div part="tablist">
    <button part="tab" value="livraison">Livraison</button>
    <button part="tab" value="retours">Retours</button>
  </div>
  <div part="panel" value="livraison">Sous 48 h en France.</div>
  <div part="panel" value="retours">30 jours, sans justificatif.</div>
</z-tabs>
```

## Les pièces que vous écrivez

| Rôle | La pièce |
|---|---|
| `tablist` | le rail qui porte les onglets (`role="tablist"`) ; l'indicateur glissant est son `::after` |
| `tab` | un onglet (`role="tab"`) — l'actif porte `aria-selected="true"` et `current` |
| `panel` | le contenu d'un onglet (`role="tabpanel"`) — `hidden` tant qu'il n'est pas actif |

Écrivez les onglets en `<button>` : un bouton est focalisable et cliquable d'origine, et
un `<button disabled>` n'émet plus de clic — le composant n'a rien à simuler. Le CSS vise
les chemins **directs** (`z-tabs > [part=tablist] > [part=tab]`, `z-tabs > [part=panel]`) :
gardez cet emboîtement.

## Onglet ↔ panneau : par `value`, ou par l'ordre

Un onglet trouve son panneau par un `value` **partagé** ; à défaut, par l'**ordre** (le
premier onglet ↔ le premier panneau). Les deux se mélangent : un onglet sans `value`
prend le panneau de son rang.

```html
<z-tabs>
  <div part="tablist">
    <button part="tab">Un</button>
    <button part="tab">Deux</button>
  </div>
  <div part="panel">Premier panneau.</div>
  <div part="panel">Second panneau.</div>
</z-tabs>
```

## Le choix

L'attribut `value` sur `z-tabs` **présélectionne** ; s'il est présent, le composant le
tient à jour. Sans lui, l'onglet déjà marqué `aria-selected="true"` gagne, sinon le
premier.

```js
tabs.value;                 // → "retours" (ou l'index en chaîne si l'onglet n'a pas de value)
tabs.value = "livraison";   // choisit, SANS événement : c'est le programme qui parle
tabs.selectedIndex;         // → 0 (-1 si aucun)
tabs.selectedTab;           // → le <button> actif
tabs.tabs; tabs.panels;     // → les pièces de CE z-tabs

tabs.addEventListener("change", () => console.log(tabs.value));
```

`change` ne part que sur un **geste** (clic, flèche), et seulement si l'onglet a changé.

## Le clavier

<kbd>←</kbd> <kbd>→</kbd> (ou <kbd>↑</kbd> <kbd>↓</kbd>, pour une barre en colonne) se
promènent **et activent** — activation automatique, comme le recommande l'APG —
circulairement, en sautant les onglets `disabled`. <kbd>Home</kbd> / <kbd>End</kbd> vont
aux extrémités.

**Roving tabindex** : la barre est **un seul** arrêt de tabulation. L'onglet actif porte le
focus, les autres en sortent ; <kbd>Tab</kbd> passe ensuite au panneau (focalisable,
`tabindex="0"`), puis à son contenu.

## Imbriquable

Un z-tabs vit dans le panneau d'un autre sans qu'ils se volent leurs onglets : tout est
**scopé** au z-tabs le plus proche (`closest("z-tabs") === this`). Une flèche tapée dans
l'onglet intérieur est traitée par l'intérieur ; l'extérieur, qui la voit bulle, reconnaît
qu'elle ne vient pas d'un des siens et ne s'en mêle pas.

## L'indicateur glissant

Le trait sous l'onglet actif ne bricole aucun pixel : le composant **mesure** l'onglet
(position et largeur dans le rail) et pose deux variables sur le rail ; le trait se
translate vers cette cible, au ressort de la peau. La mesure est en JS, le **mouvement**
est en CSS. Un `ResizeObserver` sur le rail suit la fenêtre et la police.

## `disabled`

Sur un onglet (`<button part="tab" disabled>`) : il s'estompe, les flèches le sautent, et
le navigateur n'émet plus de clic. Sur `z-tabs` : clics et touches sont ignorés.

## Accessibilité

- `role="tablist"` / `tab` / `tabpanel` posés s'ils manquent ; les `id` sont générés si
  vous n'en donnez pas.
- Chaque onglet pointe son panneau (`aria-controls`), chaque panneau son onglet
  (`aria-labelledby`), et se cache (`hidden`) hors sélection.
- Les attributs que le composant pose, vous ne les écrivez pas : la démo montre le HTML
  d'auteur, pas le HTML calculé.

## Anatomie & grammaire du pacte

z-tabs ne lit aucun token d'auteur qui lui soit propre ; il **pose** deux variables que
son CSS consomme :

| Variable | Posée par z-tabs sur le rail |
|---|---|
| `--z-tabs__indicator-x` | le décalage gauche de l'onglet actif (px) |
| `--z-tabs__indicator-w` | sa largeur (px) |

Le reste boit la peau : `--z-accent` (le trait et l'onglet actif), `--z-line` et
`--z-border-width` (le filet du rail), `--z-ink-soft` / `--z-ink` (onglets au repos et
survolés), `--z-surface-sunken` (fond du survol), `--z-radius`, `--z-radius-pill`,
`--z-dur-open` + `--z-ease-spring` (la glisse), `--z-dur-enter` (le fondu du panneau).

## Le geste

Le trait **glisse** et change de largeur en même temps (`--z-dur-open`, ressort). Le
panneau qui apparaît monte d'un quart d'em en fondu (`z-tabs-fade`). L'onglet actif passe
à l'accent et s'épaissit **sans saut de largeur** (faux-bold par `text-shadow`, règle
Zoé « actif en gras »). Le survol teinte le fond d'un onglet. Démo : `z-tabs.demo.html`
(+ sélecteur de peau) ; le groupe au clavier voisin :
[`z-radio-group`](../z-radio-group/z-radio-group.doc.md).
