# z-avatar

Une liste de participants, l'auteur d'un commentaire, les membres d'une équipe : il
faut dire **qui**, en un coup d'œil, avec ou sans photo. `z-avatar` est cette pastille
d'identité — une **image** si vous en donnez une, sinon les **initiales** que vous avez
écrites. Bâti sur [`z-element`](../../core/z-element/z-element.doc.md) : `tone` et `size`
sont gratuits. Rien d'injecté : l'image est posée en fond (une propriété de style),
jamais en `<img>`.

```html
<z-avatar name="Ada Lovelace">AL</z-avatar>
<z-avatar name="Grace Hopper" src="/img/grace.jpg"></z-avatar>
<z-avatar name="Inconnu" size="l" tone="soft">?</z-avatar>
```

## En calques

Deux pièces suffisent — le disque et ce qu'il porte. Pas d'`infos` : il n'y a qu'un
texte, pas d'icône à grouper avec.

```html
<z-avatar name="Ada Lovelace">
  <z-layer part="background"></z-layer>
  <z-layer part="label">AL</z-layer>
</z-avatar>
```

| Rôle | La pièce |
|---|---|
| `background` | le disque — l'image, ou la surface tonale et son filet ; il peut tourner, pulser, sans emmener les initiales |
| `label` | les initiales — masquées quand une image les recouvre |

Les deux formes lisent les mêmes tokens et se comportent pareil.

## Image ou initiales

`src` donne l'image. Le composant la pose en **fond** de l'hôte — `--z-avatar__image:
url("…")` en style inline, centrée, en `cover` — et marque l'hôte `has-image` : les
initiales deviennent transparentes (forme courte) ou s'effacent (`label`, en calques),
mais restent dans le DOM. Retirez `src`, elles reviennent.

```js
avatar.src = "/img/grace.jpg";   // reflet de l'attribut — l'image apparaît
avatar.src = "";                 // les initiales reviennent
```

Pourquoi un fond et pas un `<img>` : Zoé n'injecte aucune balise (le light DOM est le
vôtre), et un disque image est une **décoration de surface** — c'est `name` qui porte le
sens. L'URL est nettoyée de ce qui sortirait de la chaîne `url("…")` (guillemets,
antislash, sauts de ligne), rien d'autre.

## `name` — l'alternative, toujours

`name` devient `aria-label`, sur un hôte en `role="img"`. Donnez-le **même sans image** :
un élément `img` ne lit pas ses enfants, donc des initiales seules ne nomment rien pour un
lecteur d'écran. Pour un compteur, nommez ce qu'il compte : `name="3 autres personnes"`.

## Taille et ton

Le disque fait `2.4em` ; `size` ne règle que la taille du texte et tout suit — le disque,
le filet, les initiales. `tone` colore la surface sans image : `success`, `danger`, ou
`soft` pour un disque effacé.

```html
<z-avatar name="Ada Lovelace" size="xl">AL</z-avatar>
<z-avatar name="Grace Hopper" tone="success">GH</z-avatar>
```

## Accessibilité

`role="img"` posé au montage (un rôle écrit par vous n'est jamais écrasé) et `aria-label`
suivi depuis `name`. L'avatar n'est pas focalisable et ne reçoit aucun geste : c'est une
image. Pour le rendre cliquable, mettez-le **dans** un lien ou un `z-button`, pas l'inverse.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-avatar__image` | l'image, posée par le composant depuis `src` — ne l'écrivez pas vous-même ; une peau peut la lire ou la surcharger |
| `--z-avatar--background__color` | la surface sans image (repli : `--z-tone__fill`, puis `--z-surface`) |

Défauts qui **consomment la peau** : `--z-tone__ink` puis `--z-ink` (les initiales),
`--z-tone__line` puis `--z-line` (le filet), `--z-border-width`, `--z-font`,
`--z-font-weight-strong`, `--z-dur-enter` et `--z-ease-spring` (l'entrée). Marche sur
HighTech comme sur Claude sans une ligne de plus.

## Le geste

À l'arrivée, le disque **pope** (`enter`). Seul, il ne bouge plus : il montre. Dans un
[`z-avatar-group`](../z-avatar-group/z-avatar-group.doc.md), il remonte au survol et passe
devant ses voisins. Démo : `z-avatar.demo.html` (+ sélecteur de peau).
