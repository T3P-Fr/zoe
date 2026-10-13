# z-avatar-group

Montrer une équipe, les participants d'une réunion, « qui a vu » — en une rangée compacte
qui ne mange pas la ligne. `z-avatar-group` est le niveau **groupe** de
[`z-avatar`](../z-avatar/z-avatar.doc.md) : il ne redessine aucun avatar, il les fait se
**chevaucher**, les détache d'un liseré de la couleur de page, et remonte celui que l'on
survole. Bâti sur [`z-element`](../../core/z-element/z-element.doc.md), rien d'injecté.

```html
<z-avatar-group max="3">
  <z-avatar name="Ada Lovelace">AL</z-avatar>
  <z-avatar name="Grace Hopper">GH</z-avatar>
  <z-avatar name="Margaret Hamilton">MH</z-avatar>
  <z-avatar name="4 autres personnes" tone="soft">+4</z-avatar>
</z-avatar-group>
```

## Ce que vous écrivez

Des `<z-avatar>` en **enfants directs** — un groupe dans un groupe garde les siens. Chaque
avatar porte son propre `name` ; le groupe ne les lit pas.

`max` est un **repère pour vous**, pas un moteur : au-delà de ce nombre de visages, c'est
vous qui écrivez le dernier avatar `+N`, et vous le nommez (`name="4 autres personnes"`).
Zoé ne génère jamais ce nœud : il n'y a pas de donnée derrière un composant de vue, et un
compteur inventé par le CSS ne pourrait pas se dire à un lecteur d'écran.

## Le chevauchement

Trois réglages, trois tokens, et une mécanique qui tient toute seule :

- chaque avatar **mord** sur son voisin de gauche (`--z-avatar-group__overlap`, une marge
  négative) — sauf le premier ;
- un **liseré** de la couleur de page (`--z-avatar-group__ring`) sépare deux disques : sans
  lui, deux avatars sombres se fondraient. C'est un `box-shadow`, pas une bordure — il
  n'agrandit pas la boîte, donc ne fausse pas le recouvrement ;
- au survol, l'avatar visé **remonte** (`--z-avatar-group__lift`), son liseré s'épaissit, et
  il passe **devant** ses voisins.

Le groupe est un contexte d'empilement isolé (`isolation: isolate`) : le `z-index` du
survol joue dans le groupe, jamais par-dessus le reste de la page.

```html
<z-avatar-group class="serre">…</z-avatar-group>
<style>
  .serre { --z-avatar-group__overlap: -1.1em; --z-avatar-group__ring: .22em; }
</style>
```

## Taille

Posez `size` sur le **groupe** : les avatars sont en `em`, ils suivent tous. Ou sur un
avatar seul, pour le détacher.

```html
<z-avatar-group size="l">…</z-avatar-group>
```

## Accessibilité

`role="group"` au montage (un rôle écrit par vous n'est jamais écrasé). Le libellé reste
le vôtre — `aria-label="L'équipe"` — vous seul savez ce que ce groupe est. Chaque avatar
se dit par son `name`. Le survol est aussi joué sur `:focus-within` : un avatar rendu
focalisable (dans un lien, par exemple) remonte quand le clavier l'atteint.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-avatar-group__overlap` | de combien chaque avatar recouvre le précédent (défaut `-.7em`) |
| `--z-avatar-group__ring` | l'épaisseur du liseré couleur de page (défaut `.14em` ; × 1,4 au survol) |
| `--z-avatar-group__lift` | de combien l'avatar survolé remonte (défaut `.25em`) |

Défauts qui **consomment la peau** : `--z-page` (le liseré), `--z-dur` et
`--z-ease-spring` (la remontée), `--z-ease` (le liseré), `--z-dur-enter` (l'entrée du
groupe). Les avatars eux-mêmes se peignent avec la grammaire de `z-avatar`.

## Le geste

À l'arrivée, le groupe entier **pope** (`enter`). Au survol d'un visage — là où est
l'œil — il **remonte en ressort**, son liseré gonfle et il passe devant : « regardez
celui-là ». Le geste est joué sur `:hover`, `:focus-within` et `:state(over)`, pour que
souris, clavier et socle racontent la même chose. Démo : `z-avatar-group.demo.html`
(+ sélecteur de peau).
