# z-badge

Un compteur sur un bouton, « nouveau » à côté d'un titre, « payé » dans une liste : une
information courte qui doit se lire d'un coup d'œil sans prendre la place du contenu.
`z-badge` est cette **pastille**. C'est le composant le plus gratuit de la famille : bâti
sur [`z-element`](../../core/z-element/z-element.doc.md), il hérite `tone` et `size` et ne
fait que peindre sa gélule. Il informe l'œil ; il ne se clique pas.

```html
<z-badge>Nouveau</z-badge>
<z-badge tone="danger">3</z-badge>
<z-badge tone="success" size="s">payé</z-badge>
```

## En calques

La [structure canonique](../../core/z-layer/z-layer.doc.md) réduite à deux rôles : le
fond et ce qui informe. Pas de `marker` — un badge n'a pas de pièce d'état à montrer, il
**est** l'information. Pas de `contact` — il ne reçoit aucun geste.

```html
<z-badge tone="danger">
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="label">3</z-layer>
  </z-layer>
</z-badge>
```

| Rôle | La pièce |
|---|---|
| `background` | la gélule — elle peut pulser sur une notification sans emmener le chiffre |
| `infos` | ce qui informe |
| ↳ `label` | votre texte ou votre nombre |

Les deux formes lisent les mêmes tokens.

## Le ton

`tone` ne peint pas : il pose trois swatches que le badge boit (fond, encre, filet).

| `tone` | La pastille |
|---|---|
| *(aucun)* | discrète : surface et filet de la peau, encre ordinaire |
| `main` | l'accent, encre contrastée |
| `complement` | la surface et le filet ordinaires |
| `soft` | ni fond ni filet : un mot posé, en encre douce |
| `success` · `danger` | la couleur de sens de la peau |

## La taille, et la composition

Un badge fait `.75em` de **son contexte** : il est toujours un peu plus petit que le texte
qui l'entoure, sans devenir illisible. Posé dans un `z-button size="l"`, il grandit avec
lui — les facteurs se composent. `size` règle en plus son propre cran.

```html
<z-button>Messages <z-badge tone="danger">3</z-badge></z-button>
```

Un chiffre seul reste un **rond** (`min-width: 1.7em`), un mot une gélule. Le rayon vient
de `--z-radius-pill` : la peau décide — HighTech garde des rectangles, Claude arrondit.

## Accessibilité

Aucun rôle : le badge est du **contenu**, et c'est voulu — « 3 messages » doit se lire. Il
n'est pas focalisable et ne porte aucun geste. Si le nombre change en direct, posez
`role="status"` sur **votre conteneur** (le bouton, la ligne), pas sur le badge : c'est le
contexte qui doit être annoncé, pas un chiffre nu.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-badge--background__color` | la surface de la gélule (repli : `--z-tone__fill`, puis `--z-surface`) |
| `--z-badge--background__border` | son filet (repli : `--z-tone__line`, puis `--z-line`) |

Défauts qui **consomment la peau** : `--z-tone__ink` puis `--z-ink` (le texte),
`--z-radius-pill`, `--z-border-width`, `--z-font`, `--z-font-weight-strong`,
`--z-dur-enter` et `--z-ease-spring` (l'entrée).

## Le geste

À l'arrivée, la pastille **pope** (`enter`, le ressort de la peau). Quand le nombre change,
rejouez l'entrée d'une ligne — `badge.play("enter")` — et le chiffre repope près de l'œil.
En calques, le fond peut **pulser** seul (`pulse`, un preset de z-motion) pendant que le
chiffre reste net. Démo : `z-badge.demo.html` (+ sélecteur de peau).
