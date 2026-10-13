# z-accordion

Une FAQ, des réglages par sections, un sommaire latéral : plusieurs blocs repliables les
uns sous les autres, dont souvent **un seul** doit rester ouvert.
[`z-disclosure`](../z-disclosure/z-disclosure.doc.md) sait déjà s'ouvrir seule ;
`z-accordion` n'ajoute que la **coordination** — un cadre qui empile les déplis et, avec
`exclusive`, ferme les autres quand l'un s'ouvre. Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md), zéro logique métier, rien d'injecté.

```html
<z-accordion exclusive>
  <z-disclosure open>
    <z-layer part="label">Livraison</z-layer>
    <z-layer part="panel">Sous 48 h en France métropolitaine.</z-layer>
  </z-disclosure>
  <z-disclosure>
    <z-layer part="label">Retours</z-layer>
    <z-layer part="panel">30 jours, sans justificatif.</z-layer>
  </z-disclosure>
</z-accordion>
```

## Ce que vous écrivez

L'accordéon n'a pas d'anatomie propre : ses pièces sont ses **déplis**. Chaque
`<z-disclosure>` porte les deux calques qu'elle a déjà quand elle est seule :

| Pièce | Rôle |
|---|---|
| `z-disclosure` | un dépli — `open` dans le HTML pour l'ouvrir d'emblée |
| ↳ `[part="label"]` | le déclencheur : le titre que l'on active (Zoé en fait un bouton) |
| ↳ `[part="panel"]` | le contenu repliable |

Le cadre, les coins et le fond sont ceux de la peau. Les déplis gardent leur filet du
bas, sauf le dernier : il doublerait le bord du cadre.

## `exclusive` — un seul ouvert à la fois

Sans l'attribut, les déplis s'ignorent : chacun s'ouvre et se ferme dans son coin. Avec
`exclusive`, ouvrir l'un **ferme les autres** — et c'est tout ce que le groupe fait.

Trois règles :

- la fermeture passe par l'API du dépli (`disclosure.open = false`), jamais par un geste
  simulé : les déplis que vous n'avez pas touchés ne rejouent pas d'onde de clic ;
- si votre HTML porte **plusieurs** `open` sous un accordéon exclusif, le **premier**
  gagne, dès le montage — comme deux `current` écrits à la main dans un `z-radio-group` ;
- l'attribut se pose et se retire à chaud (`accordeon.exclusive = true`) : l'invariant
  est réappliqué aussitôt, et suivi même si des déplis arrivent plus tard dans le DOM.

```js
const accordeon = document.querySelector("z-accordion");
accordeon.exclusive = true;     // reflet de l'attribut
accordeon.disclosures;          // → les z-disclosure que CE groupe coordonne
```

## Scopé

Un accordéon ne voit que les déplis dont il est **l'accordéon le plus proche**. Un
accordéon imbriqué dans le panneau d'un dépli coordonne les siens, et le parent ne les
compte pas : `disclosures` filtre par `closest("z-accordion")`. Même loi que
`z-radio-group`.

## Écouter

L'événement `toggle` **bulle** depuis le dépli qui vient de basculer. L'accordéon
l'intercepte en capture : quand il atteint votre écouteur, les autres sont **déjà**
fermés — vous lisez un état cohérent.

```js
accordeon.addEventListener("toggle", (evenement) => {
  evenement.target;        // le z-disclosure qui a bougé
  evenement.target.open;   // true s'il vient de s'ouvrir
});
```

## Accessibilité

Pas de rôle propre : chaque dépli porte déjà le sien — `label` devient `role="button"`
avec `aria-expanded` et `aria-controls`, et le `panel` fermé passe `inert` (hors
tabulation **et** hors lecture d'écran). Clavier : <kbd>Tab</kbd> va de titre en titre,
<kbd>Entrée</kbd> ou <kbd>Espace</kbd> bascule le dépli focalisé. Les statuts du socle
(`disabled`, `loading`, `error`) se reflètent en ARIA tout seuls.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-accordion__gap` | l'écart entre les déplis empilés (défaut `0` : les filets se touchent) |

Tout le reste vient de la peau : `--z-line` et `--z-border-width` (le cadre),
`--z-radius` (les coins), `--z-surface` (le fond), `--z-font`. Les déplis eux-mêmes se
peignent avec la grammaire de `z-disclosure` (`z-disclosure:state(open) > [part="label"]`…).

## Le geste

L'accordéon ne bouge pas : ce sont ses déplis qui jouent. Le panneau **glisse** (la
grille passe de `0fr` à `1fr`, aucune hauteur à deviner), le chevron du titre pivote.
En `exclusive`, le dépli qui se ferme et celui qui s'ouvre jouent **en même temps** — un
seul mouvement pour l'œil. Démo : `z-accordion.demo.html` (+ sélecteur de peau).
