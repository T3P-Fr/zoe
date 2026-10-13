# z-spinner

Pendant qu'une réponse se fait attendre, l'écran ne doit pas paraître mort : il faut
un signe qui dise « ça travaille ». z-spinner est ce signe, réduit à l'essentiel. Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md), il hérite `tone` et `size`, et
n'ajoute qu'une **sémantique d'attente** — `role="status"` et un libellé lu par les
lecteurs d'écran. L'anneau qui tourne est peint et animé en CSS : le JS n'y touche pas.

```html
<z-spinner label="Chargement des commandes"></z-spinner>
<z-spinner size="s" tone="soft"></z-spinner>
```

## En calques

Une seule pièce : `marker`, l'anneau. La forme courte le dessine en `::before` ; la forme
en calques ([`z-layer`](../../core/z-layer/z-layer.doc.md)) en fait un élément que votre
CSS peut viser sans pseudo-élément (`z-spinner > [part=marker]`) — pour lui poser une
transition, un second mouvement, une ombre.

```html
<z-spinner label="Envoi en cours…">
  <z-layer part="marker"></z-layer>
</z-spinner>
```

Les deux formes lisent les mêmes tokens et tournent à la même vitesse.

## Le libellé — `label`

Visuellement, il n'y a que l'anneau. Un lecteur d'écran, lui, ne voit rien tourner : il
lui faut un texte. `label` est ce texte ; le composant le recopie dans `aria-label` et le
tient à jour. Sans attribut, il annonce « Chargement… ».

```js
spinner.label = "Envoi en cours…";   // met aria-label à jour
spinner.label;                        // → le texte annoncé
```

Si l'attente mérite un texte **visible**, écrivez-le à côté : le spinner reste en ligne
(`inline-block`, `vertical-align: middle`) et se cale sur la hauteur du texte.

## `tone` et `size`

La couleur de l'anneau suit le `tone` (`--z-tone__fill`), à défaut l'accent de la peau.
Exception : `complement` et `soft` n'ont pas de surface (le socle y pose une surface
neutre ou transparente) — un anneau n'est qu'un trait, il prend alors l'**encre** du ton
(`--z-tone__ink` : l'encre pour `complement`, l'encre atténuée pour `soft`). La boîte
fait 1,4 em de côté et le trait .16 em : `size` change la taille du texte, tout suit.

```html
<z-spinner size="xs"></z-spinner>
<z-spinner tone="danger" size="l"></z-spinner>
```

## Mouvement réduit

Quand le système demande moins de mouvement (`prefers-reduced-motion: reduce`), l'anneau
ne disparaît pas — une attente invisible serait un mensonge. Il **ralentit** : un tour en
2 s au lieu de .7 s.

## Accessibilité

- `role="status"` (sauf si vous posez un `role`), `aria-label` = `label`.
- Non focalisable, non interactif : il informe, il ne reçoit aucun geste.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-spinner--ring__width` | l'épaisseur de l'anneau (défaut .16 em) |
| `--z-spinner__speed` | la durée d'un tour (défaut .7 s ; 2 s en mouvement réduit) |

L'anneau est la pièce `marker` ; son épaisseur se règle par le token `ring`, le trait qui
le dessine. Tout le reste boit la peau : la couleur vient de `--z-tone__fill` puis de
`--z-accent`.

## Le geste

Un seul mouvement, continu : une rotation linéaire (`z-spinner-spin`) d'un cercle dont un
quart est transparent — c'est ce quart qui rend la rotation visible. Pas d'animation
d'entrée, aucun état peint : le spinner n'a rien d'autre à dire que « j'attends ».
Démo : `z-spinner.demo.html` (+ sélecteur de peau).
