# z-card

Grouper un titre, un texte, une image, une action, et dire d'un trait « ceci va
ensemble » : c'est le travail d'une surface. `z-card` est cette **carte** — un fond, un
filet, des coins, un padding confortable — et à l'intérieur, **votre HTML**, libre.
Bâtie sur [`z-element`](../../core/z-element/z-element.doc.md) : `tone` et `size` sont
gratuits, et avec `interactive` la carte entière devient un bouton, fait proprement.

```html
<z-card>
  <h3>Titre de la carte</h3>
  <p>Contenu libre : texte, images, autres composants.</p>
</z-card>
<z-card interactive tone="soft">Toute la carte est cliquable.</z-card>
```

## En calques

La [structure canonique](../../core/z-layer/z-layer.doc.md) sans `marker` ni `contact`,
plus un rôle propre à la carte : `media`, le visuel de tête. On n'écrit que les rôles
qu'on a.

```html
<z-card>
  <z-layer part="background"></z-layer>
  <z-layer part="media"><img src="/img/couverture.jpg" alt=""></z-layer>
  <z-layer part="infos">
    <z-layer part="label">Titre de la carte</z-layer>
    <p>Le reste du contenu, libre.</p>
  </z-layer>
</z-card>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface — fond, filet, élévation ; elle peut s'élever ou changer de teinte sans emmener le contenu |
| `media` | optionnel : un visuel en tête, collé aux bords, coins hauts arrondis (`img`, `picture`, `video` prennent la largeur) |
| `infos` | ce qui informe — un **bloc** : titre, texte, actions |
| ↳ `label` | le titre |

Dans la forme courte, `media` marche aussi : un `<div part="media">` en premier enfant
suffit, le CSS cible `> [part="media"]` quelle que soit la balise. Les deux formes lisent
les mêmes tokens.

## `interactive` — la carte devient un bouton

Par défaut, une carte n'est qu'une surface : elle informe l'œil, elle ne se clique pas,
elle n'est pas dans l'ordre de tabulation. Avec `interactive`, elle **devient** un bouton,
et tout ce qu'un bouton doit faire arrive d'un coup :

- elle réagit au survol — filet accent, ombre, légère montée — et s'enfonce à l'appui ;
- elle devient focalisable (`role="button"`, `tabindex="0"`) et montre son anneau de focus ;
- le **clavier** l'active comme un bouton natif : <kbd>Entrée</kbd> tout de suite,
  <kbd>Espace</kbd> au relâché, sans faire défiler la page — les deux émettent un vrai
  `click`.

```js
const carte = document.querySelector("z-card[interactive]");
carte.addEventListener("click", () => ouvrir(carte.dataset.id));
carte.interactive = false;   // reflet de l'attribut — rôle et tabindex retirés
```

Zéro logique métier : la carte émet `click`, la page décide. Évitez un lien ou un bouton
**à l'intérieur** d'une carte interactive : un bouton dans un bouton, l'assistance ne sait
plus qui on active.

## Ton et taille

`tone` colore la surface et le filet : `soft` donne une carte sans fond ni filet (du
contenu à peine cadré — sur HighTech, le seul ton sans aucun trait), `complement` la
surface ordinaire, `success` et `danger` une surface pleine à encre contrastée. `size`
règle la taille du texte, et padding, filet, coins suivent en `em`.

## Accessibilité

Inerte, la carte ne porte **aucun** rôle et n'entre pas dans la tabulation : un conteneur
ne doit pas s'annoncer « bouton ». Interactive, elle prend `role="button"` et
`tabindex="0"` (jamais par-dessus ce que vous avez écrit), et les retire si l'attribut
part. Les statuts du socle (`loading`, `disabled`, `error`) se reflètent en ARIA tout seuls.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-card--background__color` | la surface (repli : `--z-tone__fill`, puis `--z-surface-raised`, puis `--z-surface`) |
| `--z-card--background__border` | le filet (repli : `--z-tone__line`, puis `--z-line`) |

Défauts qui **consomment la peau** : `--z-tone__ink` puis `--z-ink` (le texte),
`--z-radius` (les coins, repris par `media`), `--z-border-width`, `--z-font` et
`--z-font-size`, `--z-accent` (filet au survol, anneau de focus), `--z-ink-soft` (l'ombre),
`--z-dur` et `--z-ease` (les transitions), `--z-dur-enter` et `--z-ease-spring` (l'entrée).

## Le geste

À l'arrivée, la carte **pope** (`enter`). Interactive, elle **monte** de deux pixels au
survol pendant que son filet vire à l'accent et qu'une ombre se creuse dessous — le retour
naît sur la carte, là où est l'œil ; à l'appui elle **redescend** ; au focus clavier un
anneau accent la cerne. Tout transite (`box-shadow`, `border-color`, `transform`), rien ne
saute. En calques, c'est le `background` seul qui s'élève. Démo : `z-card.demo.html`
(+ sélecteur de peau).
