# z-stat

Un tableau de bord vit de quelques chiffres qui se lisent d'un coup d'œil : un intitulé,
un grand nombre, et ce qui a bougé depuis la dernière fois. z-stat est cette tuile de
KPI. Bâti sur [`z-element`](../../core/z-element/z-element.doc.md), c'est un composant
d'**affichage** : il n'ajoute aucune ligne de comportement. Vous écrivez les trois
pièces (Zoé n'injecte rien, ADR-0018), le CSS les empile ; `trend` colore la variation et
lui pose une flèche, par le CSS seul.

```html
<z-stat trend="up">
  <span part="label">Chiffre d'affaires</span>
  <strong part="value">1,24 M€</strong>
  <span part="delta">+12,4 %</span>
</z-stat>
```

Purement informatif : ça se lit, ça ne se clique pas.

## Les pièces que vous écrivez

Pas de calque ici : les pièces sont vos balises natives, et `part` nomme leur rôle. La
balise reste la vôtre — un `<strong>` pour le nombre garde son poids sémantique pour un
lecteur d'écran et un moteur de recherche (contrat SEO : le texte reste natif).

| Rôle | La pièce |
|---|---|
| `label` | l'intitulé — petit, atténué, en capitales espacées : il nomme sans voler la vedette |
| `value` | le grand nombre — police de titre, dense |
| `delta` | la variation, **optionnelle** — colorée et fléchée par `trend` |

L'ordre HTML (label → value → delta) fait aussi l'ordre de lecture ; le CSS ne fait que
l'espacer. Les pièces sont visées en **enfant direct** (`> [part=…]`) : une tuile posée
dans une tuile ne se fait pas repeindre.

## Le sens de la variation — `trend`

```html
<z-stat trend="up">…</z-stat>     <!-- succès + ↑ -->
<z-stat trend="down">…</z-stat>   <!-- danger + ↓ -->
<z-stat>…</z-stat>                <!-- neutre : encre atténuée, pas de flèche -->
```

Le CSS lit l'attribut directement (`[trend=up]`) : zéro JS. La flèche est un `::before`
décoratif qui **double** le signe que vous écrivez (+12,4 %) : le sens se voit avant même
de lire le nombre. `trend` dit la direction, pas la valeur morale — une baisse de coûts
est une bonne nouvelle, et c'est à vous de choisir `up` ou `down` selon ce que vous
voulez faire ressentir.

## `tone` et `size`

Sans `tone`, la tuile se pose sur la surface surélevée de la peau avec un filet. Avec
`tone`, son fond prend `--z-tone__fill` et son encre `--z-tone__ink` : une tuile `main`
est un aplat d'accent.

```html
<z-stat tone="main" trend="up">…</z-stat>
<z-stat size="l">…</z-stat>
```

Sur un `tone`, l'intitulé et la variation lisent l'**encre du ton** (atténuée) : sur un
aplat d'accent, l'encre de la page serait illisible. Sur un aplat (`main`, `success`,
`danger`), la variation fléchée prend l'encre pleine — c'est la flèche qui porte le sens,
pas la couleur.

Tout est en `em`, donc `size` fait suivre l'espacement, l'intitulé et la variation. Le
grand nombre lit `--z-font-size-2xl` de la peau (repli : 2,2 em) — c'est elle qui décide
ce que « grand » veut dire.

## Accessibilité

z-stat ne pose aucun rôle ni attribut ARIA : c'est du texte, lu dans l'ordre où vous
l'écrivez. Il n'est pas focalisable. Si la tuile est le titre d'une section, le titre
reste un `<h2>` autour ou au-dessus — jamais généré par le composant.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-stat--background__color` | le fond de la tuile (défaut : `--z-tone__fill` si `tone`, sinon `--z-surface-raised`) |

Le reste boit la peau sans token intermédiaire : `--z-line` et `--z-border-width` (le
filet), `--z-radius`, `--z-ink-soft` (intitulé et variation neutre), `--z-font-title`,
`--z-font-size-sm`, `--z-font-size-2xl`, `--z-success` et `--z-danger` (la variation
selon `trend`).

## Le geste

À l'arrivée, la tuile joue `pop` sur `:state(enter)` (loi Zoé : rien ne pope sec).
Aucun autre état n'est peint : une tuile de chiffre n'a pas de survol ni d'appui. Démo :
`z-stat.demo.html` (+ sélecteur de peau).
