# z-breadcrumb

Où suis-je, et comment remonter d'un niveau : le fil d'Ariane répond aux deux en une
ligne. `z-breadcrumb` est un composant de **structure**, presque gratuit — vous écrivez
les maillons (des liens natifs, lus par les moteurs de recherche), et Zoé apporte les deux
seules choses qui manquent à une rangée de liens : le **sens** (une navigation nommée pour
le lecteur d'écran) et le **rythme** (un séparateur dessiné par le CSS, jamais un nœud de
plus). Bâti sur [`z-element`](../../core/z-element/z-element.doc.md), rien d'injecté.

```html
<z-breadcrumb label="Vous êtes ici">
  <a href="/">Accueil</a>
  <a href="/boutique">Boutique</a>
  <span aria-current="page">Chaussures</span>
</z-breadcrumb>
```

## Ce que vous écrivez

Pas de `z-layer` ici : les pièces sont vos propres maillons, en **enfants directs**.

| Maillon | Rendu |
|---|---|
| `<a href="…">` | un niveau remontable — encre douce, accent et soulignement au survol ou au focus |
| `<span aria-current="page">` | « vous êtes ici » — encre pleine, gras, plus cliquable |

Le dernier enfant est **toujours** traité comme la destination (`:last-child`), même sans
`aria-current` : écrivez la page courante en dernier, et écrivez-la en `<span>` — un lien
vers la page où l'on est ne mène nulle part. `aria-current="page"` reste la bonne pratique :
c'est lui que le lecteur d'écran annonce.

## Le séparateur

Le « › » entre deux maillons est **peint** par le CSS (`> * + *::before`) : il n'est pas
dans votre DOM, un lecteur d'écran ne le lit pas, et il se remplace d'une variable.

```css
z-breadcrumb { --z-breadcrumb__separator: "/"; --z-breadcrumb__gap: .8em; }
```

Une **chaîne** : gardez les guillemets. Le séparateur porte l'espacement (`gap: 0` sur la
rangée), pour rester centré entre deux maillons quelle que soit la peau.

## Un fil long

La rangée **replie** proprement (`flex-wrap`) : dans une colonne étroite, les maillons
passent à la ligne avec leur séparateur. La taille est celle du texte de service
(`--z-font-size-sm`) : un fil d'Ariane s'efface devant le titre qui le suit.

## Accessibilité

Au montage, `role="navigation"` et `aria-label` (depuis `label`, sinon « Fil d'Ariane ») :
un lecteur d'écran annonce un fil d'Ariane, pas une suite de liens anonymes. Un `role` ou
un `aria-label` que vous avez écrit n'est jamais écrasé. Les maillons sont des liens
**natifs** : <kbd>Tab</kbd> les parcourt, <kbd>Entrée</kbd> les suit, et le focus clavier
se voit (accent + soulignement). Le maillon courant ne reçoit plus le pointeur
(`pointer-events: none`) ; écrit en `<span>`, il n'est pas non plus dans la tabulation —
une raison de plus de ne pas en faire un lien.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-breadcrumb__separator` | le glyphe entre deux maillons (défaut `"\203A"`, soit ›) |
| `--z-breadcrumb__gap` | l'espace de chaque côté du séparateur (défaut `.5em`) |

Défauts qui **consomment la peau** : `--z-ink-soft` (les maillons), `--z-ink` et
`--z-font-weight-strong` (le courant), `--z-accent` (survol et focus), `--z-line` (le
séparateur), `--z-font` et `--z-font-size-sm`, `--z-dur` et `--z-ease` (la transition de
couleur), `--z-dur-enter` et `--z-ease-spring` (l'entrée).

## Le geste

Au survol d'un maillon, sa couleur **glisse** vers l'accent et un soulignement apparaît,
décollé du texte — le retour naît sur le lien, là où est l'œil. À l'arrivée, le fil
**pope** (`enter`). Démo : `z-breadcrumb.demo.html` (+ sélecteur de peau).
