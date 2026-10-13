# Contrat SEO de Zoé

> **La loi, en une phrase :**
> **Lu par Google → natif, habillé par la peau. Cliqué → `z-*`.**
> La sémantique est TOUJOURS dans ce que vous écrivez, jamais dans ce que Zoé génère.

Décision tranchée. Ne pas re-débattre.

## Pourquoi c'est déjà gagné (et pas un problème à résoudre)

Zoé est en **Light DOM** (zéro Shadow DOM — décision gravée). Donc le contenu
sémantique vit dans le **source** : Google le lit tout de suite, sans exécuter le JS.
Un `<h1>` reste un `<h1>` pour le crawler. Il suffit de ne jamais le lui cacher.

Le piège à ne JAMAIS faire — `<z-text h1>` qui *injecte* un `<h1>` :

```
FAUX :  <z-text h1>mon titre</z-text>
        └─ le crawler lit ÇA. Pas de <h1>. Le <h1> n'existe qu'APRÈS le JS → mort.

VRAI :  <h1>mon titre</h1>
        └─ le crawler lit le <h1>. Tout de suite. Sans JS. Vivant.
```

La sémantique qui naît du JS est invisible au moment où on l'indexe. Et ça viole
ADR-0018 (« ce que tu écris est ce que tu debug » — Zoé n'injecte rien) et la loi
« une seule forme, jamais deux » (`h1=` ré-invente `<h1>`).

## Le tableau — balise · importance SEO · ce que Zoé fait

| Balise | Importance SEO | Ce que Zoé fait |
|---|---|---|
| `title` `h1` | **PRIMORDIAL** — Google indexe dessus en premier | Habille (reste natif intact) |
| `a[href]` | **PRIMORDIAL** — liens = tout le maillage | Habille · jamais remplacé (⚠️ un `z-button` est `role=button`, PAS un lien) |
| `meta[description]` `html[lang]` `link[canonical]` | **PRIMORDIAL** — le `<head>` | N'y touche pas |
| `h2`…`h6` | **IMPORTANT** — sous-hiérarchie des titres | Habille |
| `img[alt]` | **IMPORTANT** — image + alt indexés | Habille · `alt` obligatoire |
| `main` `article` `nav` `header` `footer` | **IMPORTANT** — repères de contenu | Habille · 1 seul `main` + 1 seul `h1`/page |
| `p` `ul` `ol` `li` `blockquote` `table` `figure` | **MOYEN** — corps lu | Habille |
| `strong` `em` `code` `time` `cite` `section` `aside` | **FAIBLE** — nuance sémantique | Habille |
| `button` `input` `select` · tabs, dialog, slider, toggle | **NUL** — action, pas contenu | Remplace par un widget `z-*` |

**Habiller** = la peau style la balise native (couche « classless », portée dans la peau) ; la
balise reste ce qu'elle est. De PRIMORDIAL à FAIBLE → Zoé habille. NUL → Zoé remplace.

## Habiller ≠ animer — deux couches, jamais confondues

Le tableau ne parle que d'**habillage** (SEO + peau). **Animer** est un AUTRE sujet.
Quand vous voulez qu'un `<h1>` primordial *apparaisse en mouvement*, vous l'**encapsulez** :

```html
<z-reveal>
  <h1>mon titre</h1>   <!-- TOI tu écris le <h1>, en vrai, dans le source -->
</z-reveal>
```

Le `<h1>` reste écrit par vous, donc indexé ; `z-reveal` ne fait que l'animer. C'est
l'exact opposé du `<z-text h1>` : l'un *enrobe* un `<h1>` présent (vivant), l'autre
*crée* un `<h1>` absent du source (mort).

## La couche classless

Chaque peau porte la **couche classless** : les règles qui habillent le natif —
`h1`…`h6`, `p`, `a`, listes, `table`… Les peaux stylent les composants `z-*` et les
balises natives. C'est ce qui rend le SEO indolore : on habille sans rien renommer.
