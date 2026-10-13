# z-tag

Un badge dit ce que le **système** sait (un statut, un compte). Une étiquette dit ce que
l'**humain** a posé : un mot-clé, un filtre, une catégorie — et ce qu'il a posé, il doit
pouvoir le retirer. z-tag est cette étiquette. Bâtie sur
[`z-element`](../../core/z-element/z-element.doc.md), elle hérite `tone` et `size`, et
n'ajoute qu'une capacité : `removable`, une croix pour la retirer.

```html
<z-tag>design</z-tag>
<z-tag tone="main" removable>filtre : rouge</z-tag>
<z-tag size="s" tone="soft">brouillon</z-tag>
```

## En calques

Forme courte : le CSS peint l'hôte (fond + filet). Forme en calques
([`z-layer`](../../core/z-layer/z-layer.doc.md)) : le fond devient une pièce qui peut
bouger sans emmener le texte.

```html
<z-tag removable>
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="icon">#</z-layer>
    <z-layer part="label">design</z-layer>
  </z-layer>
</z-tag>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface de l'étiquette — porte le `tone` et les effets |
| `infos` | ce qui informe — déplacé ou animé d'un bloc |
| ↳ `icon` | optionnel, avant le label |
| ↳ `label` | votre texte |

La croix de retrait n'est pas un calque : elle reste un `::after` de l'hôte dans les deux
formes.

## Retirable — `removable`

```html
<z-tag removable>à retirer</z-tag>
```

La croix est **peinte** (`::after`), jamais injectée (ADR-0018). Le retrait s'obtient de
trois façons, qui suivent le même chemin :

- au **clic dans la zone de la croix** — le bord droit, 1,7 em (cliquer le mot ne retire
  rien : sinon lire l'étiquette la supprimerait) ;
- au **clavier**, quand l'étiquette a le focus : <kbd>Suppr</kbd> ou
  <kbd>Retour arrière</kbd> (convention des puces d'e-mail) ;
- par l'**API** : `tag.remove()` — c'est le `remove()` natif, redéfini : tout code qui
  l'appelle passe par le composant.

Le composant **prévient d'abord**, par `zoe:remove` — annulable, il bulle. Si personne ne
s'y oppose, il joue sa sortie (état `exit`, le temps de `--z-dur-exit`) puis se détache.
`preventDefault()` et rien ne se passe : vous gardez la main pour confirmer ou refuser.

```js
filtres.addEventListener("zoe:remove", (event) => {
  if (event.target.dataset.obligatoire !== undefined) event.preventDefault();
});
```

Écoutez sur la **liste**, pas sur chaque étiquette : l'événement bulle, et une étiquette
ne connaît pas la liste qui la contient (zéro logique métier).

## `tone` et `size`

Le `tone` colore le fond, l'encre et le filet (`--z-tone__fill/ink/line`) ; sans lui,
l'étiquette se pose sur la surface de la peau. Elle est écrite à .85 em du texte autour :
une étiquette est toujours un peu plus petite que ce qu'elle qualifie. `size` ajoute son
facteur par-dessus.

## Accessibilité

Une étiquette simple est du texte : aucun rôle, aucun arrêt de tabulation. Retirable,
elle devient **focalisable** (`tabindex="0"`, sauf si vous en posez un), montre son halo
au focus, et répond à <kbd>Suppr</kbd> / <kbd>Retour arrière</kbd>. La croix n'a pas de
nom : si le retrait est une action importante de l'écran, nommez-le vous-même
(`aria-label="rouge — Suppr pour retirer"`).

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-tag--background__color` | le fond (défaut : `--z-tone__fill`, sinon `--z-surface`) |
| `--z-tag--background__border` | la couleur du filet de la pièce `background` (défaut : `--z-tone__line`) — forme en calques |
| `--z-tag--icon__color` | l'icône (défaut : la couleur du texte) — forme en calques |
| `--z-tag--remove__color` | la croix (défaut : la couleur du texte) |

Le rayon vient de `--z-radius-pill` (une gélule sur Claude, un rectangle sur HighTech), la
graisse de `--z-font-weight`, le filet de `--z-border-width`.

## Le geste

À l'arrivée, `pop`. La croix dort à 60 % et s'allume au survol dans un disque discret.
Au retrait, l'étiquette **se fond et rétrécit** (`z-tag-out`, `--z-dur-exit`) avant de
quitter le DOM — rien ne disparaît sec. Démo : `z-tag.demo.html` (+ sélecteur de peau).
