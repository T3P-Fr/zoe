# z-tooltip

Un « ? » à côté d'un champ, une icône sans texte : il faut une bulle qui explique, sans
encombrer l'écran avant qu'on la demande. z-tooltip montre cette bulle au **survol** et
au **focus clavier** — les deux, jamais l'un sans l'autre. Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md) ; l'essentiel ici est
l'accessibilité : relier la bulle à son déclencheur pour qu'un lecteur d'écran la lise.

```html
<z-tooltip>
  <button>?</button>
  <z-layer part="tip">On habille le natif, on ne le remplace pas.</z-layer>
</z-tooltip>
<z-tooltip tip="Explication rapide" placement="bottom"><button>?</button></z-tooltip>
```

## Deux écritures, une accessible

**La pièce `[part=tip]`** — la forme à préférer. La bulle est un élément : le composant
lui donne un `id` (s'il manque) et `role="tooltip"`, puis cherche le **premier élément
focalisable** du déclencheur (`a[href]`, `button`, `input`, `select`, `textarea`,
`[tabindex]`) et le fait pointer la bulle par `aria-describedby`. Un lecteur d'écran lit
donc l'aide en atteignant le bouton. Si le déclencheur n'a rien de focalisable (un simple
`<span>`), l'hôte devient lui-même l'arrêt de tabulation (`tabindex="0"`) et porte le
lien. Un `aria-describedby` que vous avez déjà écrit n'est pas écrasé.

**L'attribut `tip`** — la forme courte. Le texte est posé en `::after`
(`content: attr(tip)`). Visuellement identique, mais rien ne relie la bulle au
déclencheur : pas de `role="tooltip"`, pas d'`aria-describedby`. À réserver à une aide
dont l'absence ne coûte rien.

## Placement

`placement="top"` (défaut) ou `"bottom"`. La bulle est centrée sur le déclencheur, à
`--z-tooltip__offset` de distance. Le positionnement reste simple : il ne détecte pas les
bords de la fenêtre.

## Au survol et au focus

Le montré/caché est en CSS (`:hover`, `:focus-within`) : aucun minuteur, aucun écouteur de
souris. <kbd>Échap</kbd> ferme la bulle au clavier — le composant retire le focus de
l'intérieur, et le CSS se referme. La bulle laisse passer le pointeur
(`pointer-events: none`) : elle ne gêne jamais ce qu'elle survole.

## Accessibilité

- `role="tooltip"` et `aria-describedby` posés sur la forme `[part=tip]`.
- Révélée au focus clavier comme au survol ; <kbd>Échap</kbd> la masque.
- Les couleurs sont **inversées** par rapport à la page (fond d'encre, texte couleur de
  page) : le contraste est celui de la peau.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-tooltip__offset` | l'écart entre le déclencheur et la bulle (.5 em) |

Posé sur l'hôte par le composant : surchargez-le sur `z-tooltip`. Le reste boit la peau :
`--z-ink` (le fond de la bulle), `--z-page` (son texte), `--z-radius`, `--z-font`,
`--z-dur` + `--z-ease` (le fondu) et `--z-ease-spring` (la remontée).

## Le geste

La bulle part invisible, un cheveu trop bas (.3 em), et **remonte** en fondu jusqu'à sa
place au ressort de la peau — rien ne pope sec. En `placement="bottom"`, elle descend.
Démo : `z-tooltip.demo.html` (+ sélecteur de peau).
