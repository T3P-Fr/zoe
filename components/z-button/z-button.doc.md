# z-button

Un bouton. Il fait ce qu'un bouton fait : le clavier l'active, il agit dans un formulaire,
`disabled` coupe tout. Et il vit : survol, appui, relâché dedans ou dehors, chargement,
erreur, succès, sans une ligne de votre part.

```html
<z-button>Envoyer</z-button>
<z-button loading>Chargement…</z-button>
<z-button disabled>Indisponible</z-button>
```

Une ligne à écrire. Les pièces du bouton (sa surface, sa zone tactile) sont **peintes**
par le CSS, jamais à taper.

## Utiliser

| Vous voulez | Vous écrivez |
|---|---|
| un bouton | `<z-button>Envoyer</z-button>` |
| qu'il soumette le formulaire | rien : c'est le défaut (`type="submit"`) |
| qu'il remette le formulaire à zéro | `type="reset"` |
| qu'il ne fasse rien tout seul | `type="button"`, et vous branchez un `click` |
| une icône devant le texte | `<z-button><z-layer part="icon">★</z-layer> Favori</z-button>` |
| le montrer occupé, en erreur, validé | `loading` · `error` · `success` |
| le couper | `disabled` |

<kbd>Entrée</kbd> l'active tout de suite, <kbd>Espace</kbd> au relâché, comme le natif.
`disabled` coupe le pointeur **et** le clavier, et l'événement ne remonte même pas.

**Sur téléphone, le doigt a sa place.** Même minuscule, un bouton reçoit une zone
tactile invisible d'au moins 44 px, centrée sur lui, qui déborde. Rien à écrire. Pour
l'élargir sur un bouton précis : `--z-contact-zone: 56px`.

## Peindre 🖌️

```html
<z-button size="l">Grand</z-button>
<z-button tone="soft">Discret</z-button>
<z-button tone="danger">Supprimer</z-button>
<z-button width="full">Pleine largeur</z-button>
```

`size` (`xs · s · m · l · xl`) ne règle qu'une chose, la taille du texte : padding,
filet et rayon sont en `em` et suivent. `tone` dit ce que le bouton **veut dire**, la
peau le peint. `width="full"` prend la ligne.

Le mouvement, fourni par la peau : il surgit à l'arrivée, recule sous le doigt, et une
**onde** part de son bord au relâché (plus courte si vous lâchez dehors : elle dit
« annulé »). En chargement, un balayage passe sur sa surface. En erreur, il tremble.

Pour repeindre un bouton sans changer de peau, les couleurs du pacte :

| Token | Peint |
|---|---|
| `--z-button--background__color` · `__border` | la surface et son filet |
| `--z-button--background__color-current` · `__border-current` | la surface une fois sélectionné |
| `--z-button--label__color-current` | le texte une fois sélectionné |
| `--z-button--icon__color` | l'icône, si vous en écrivez une |
| `--z-button--halo__color` | l'onde du clic |

```css
z-button.cta { --z-button--background__color: #ff2d55; }
z-button.cta:state(press) { --z-button--background__color: #c2103a; }
```

Démo : `z-button.demo.html`, avec le sélecteur de peau en haut.

## Brancher </>

**Le clic** : un `click`, comme un bouton natif. Le clavier passe par là aussi.

**Dans un formulaire** : `submit` (défaut) soumet avec validation, `reset` remet à zéro,
`button` ne fait rien. La soumission passe par `requestSubmit()`, le seul qui déclenche
la validation et l'événement `submit`.

**Une séquence** : deux lignes, la peau fait le reste.

```js
btn.setState("loading");
// …à la fin de l'envoi :
btn.setState("loading", false);
btn.setState("success");   // le CSS sait qu'on ARRIVE de loading : :state(success):state(from-loading)
```

**Réagir à un état** en CSS, sans JS : `z-button:state(press) { … }`. Tous les états du
socle sont là : `over` · `press` · `release` · `releaseOut` · `focus` · `loading` ·
`disabled` · `error` · `success`.

**Lecteurs d'écran** : `role="button"`, dans l'ordre de tabulation, `aria-busy` en
chargement, `aria-disabled` si coupé. Un `role` que vous écrivez vous-même n'est jamais
écrasé.

Attributs, événements et états complets : la référence, plus bas.

## Sous le capot

Pour aller plus loin, ou pour écrire une peau.

**Un nœud, deux pièces peintes.** Le bouton est un seul élément. L'hôte porte la boîte
et le texte ; sa surface est le `::before` (la pièce `background`) ; sa zone tactile
est le `::after` (la pièce `contact`, posée par le socle). Il n'y a rien à écrire, et
une seule forme.

**Pourquoi la surface est une pièce à part** : pour qu'une peau l'anime sans emmener le
texte. Le fond peut respirer, glisser, clignoter, le libellé reste en place.

```css
z-button.respire::before { animation: respire 2.4s var(--z-ease) infinite; }
@keyframes respire { 50% { scale: 1.06 1.14; } }
```

**La zone du doigt** est centrée sur le bouton, d'au moins `--z-contact-zone` (la peau :
44 px) dans les deux sens, et déborde si le dessin est plus petit. Le socle juge
« relâché dedans » sur cette zone, pas sur la boîte visible : un doigt qui glisse de
quelques pixels ne perd pas son bouton.

**L'onde** est le preset `halo` de z-motion sur la surface : son ombre grandit et se
fond, en lisant l'humeur de l'état (`--z-state__color`). Rouge sur un bouton en erreur,
sans une ligne de plus.

**Ce qu'il lit dans la peau** : `--z-surface`, `--z-surface-raised`, `--z-surface-sunken`,
`--z-ink`, `--z-line`, `--z-accent`, `--z-accent-ink`, `--z-danger`, `--z-success`,
`--z-disabled`, `--z-radius`, `--z-border-width`, `--z-font`, `--z-font-weight`,
`--z-pad-x` · `--z-pad-y`, `--z-dur` et ses déclinaisons, `--z-ease` · `--z-ease-spring`,
`--z-contact-zone`.
