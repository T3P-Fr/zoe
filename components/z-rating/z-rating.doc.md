# z-rating

Donner une note, c'est un geste : on vise une étoile, on la touche. `z-rating` est cette
rangée d'étoiles, bâtie sur [`z-element`](../../core/z-element/z-element.doc.md). Comme
[`z-slider`](../z-slider/z-slider.doc.md), le JS ne peint rien : il traduit le geste en un
**entier**, le publie, et le CSS dessine — sans qu'une seule étoile soit un nœud injecté
(ADR-0018).

```html
<z-rating value="3"></z-rating>
<z-rating value="4" max="5" name="note"></z-rating>
<z-rating value="2" readonly></z-rating>
```

## En calques

```html
<z-rating value="3">
  <z-layer part="background"></z-layer>
  <z-layer part="marker"></z-layer>
  <z-layer part="contact"></z-layer>
</z-rating>
```

| Rôle | La pièce |
|---|---|
| `background` | le fond de la rangée — transparent le plus souvent, il porte les effets |
| `marker` | les étoiles : la rangée vide, et par-dessus la rangée pleine clippée à la note |
| `contact` | ce qui reçoit le geste — couvre la rangée, invisible |

Les rôles se partagent ([`z-layer`](../../core/z-layer/z-layer.doc.md)) : `marker` est
ici la rangée d'étoiles, la case sur `z-checkbox`, le remplissage sur `z-slider`. En
forme courte, `::before` écrit les étoiles vides et `::after` les pleines. Mêmes tokens.

## Deux nombres, et tout le dessin en découle

```css
--z-rating__value   /* la part pleine, en % : value / max × 100 */
--z-rating__stars   /* une chaîne de `max` étoiles, écrite par content: */
```

Les étoiles vides sont écrites une fois (`content: var(--z-rating__stars)`), les pleines
une seconde fois, exactement superposées, puis **clippées** à `--z-rating__value`. Ce
pourcentage est déclaré en `@property <percentage>` : il s'interpole, donc une note qui
change **glisse** (`--z-dur-select`, ressort) au lieu de sauter — au clavier comme par
API.

`max` est le nombre d'étoiles (défaut 5, arrondi, jamais moins d'une) ; `value` est
borné à `[0, max]` et arrondi à l'entier : une note est un compte d'étoiles.

```js
note.value;            // → 3
note.value = 4;        // republie tout, et émet `input` si la note a changé (jamais `change`)
note.max = 10;
```

## Le geste

| Geste | Ce qui se passe |
|---|---|
| clic (ou toucher) | l'étoile visée devient la note — arrondi au supérieur : le premier pixel de la 3ᵉ étoile donne 3 |
| <kbd>→</kbd> <kbd>↑</kbd> | une étoile de plus |
| <kbd>←</kbd> <kbd>↓</kbd> | une étoile de moins |
| <kbd>Début</kbd> · <kbd>Fin</kbd> | 0 · le maximum |

`input` à chaque changement de valeur, `change` quand le geste est fini (clic posé,
touche relevée) — la convention d'un contrôle natif. Les flèches ne font pas défiler la
page, et un glissé sur la rangée ne la fait pas défiler non plus (`touch-action: none`).

## `readonly` et `disabled`

| | geste | focus | rendu |
|---|---|---|---|
| `readonly` | refusé | oui — la note se lit au clavier | couleurs intactes, curseur flèche, `aria-readonly="true"` |
| `disabled` | refusé | non (`tabindex="-1"`) | éteinte (`--z-disabled`, opacité .55), curseur interdit |

`readonly` est une note qu'on **montre** (l'avis moyen d'un produit) ; `disabled` un
champ coupé.

## Dans un formulaire

Elle part comme un `<input>`, sans wrapper ni champ caché :

```html
<form>
  <z-rating name="note" required></z-rating>
</form>
```

| | |
|---|---|
| `name` | le nom du champ |
| la valeur envoyée | la note, en entier (`"3"`) — `"0"` si aucune |
| `required` | le formulaire refuse la soumission tant que la note est à 0 |
| `<fieldset disabled>` | la coupe, visuels compris |
| reset | retour à la note écrite dans le HTML d'origine |

Le message de refus est en anglais comme le reste de l'API (« Please give a rating to
continue. ») ; il est reposé à chaque changement de note. La plomberie vit dans
[`z-element`](../../core/z-element/z-element.doc.md) : ici, la note décide seulement de
**ce qu'elle envoie**.

## Accessibilité

`role="slider"` — c'est bien une valeur bornée qu'on fait varier, et les lecteurs
d'écran l'annoncent déjà bien. Posés et tenus à jour : `tabindex="0"`,
`aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext` (« 3/5 », plus
parlant qu'un nombre nu), `aria-readonly`. Nommez-la : `aria-label="Votre note"`.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-rating__value` | la part pleine, en % — **posé par le JS**, à lire, pas à écrire |
| `--z-rating__stars` | la chaîne des étoiles — **posé par le JS**, à lire |
| `--z-rating__size` | la taille des étoiles (`font-size`, `1.4em`) |
| `--z-rating__gap` | l'écart entre étoiles (`letter-spacing`, `.1em`) |
| `--z-rating--empty__color` | les étoiles vides — défaut `--z-line` |
| `--z-rating--full__color` | les étoiles pleines — défaut `--z-accent` |

`empty` et `full` nomment les deux couches d'étoiles, pas des calques : en forme en
calques, les deux vivent dans `marker`.

```css
z-rating { --z-rating__size: 2em; --z-rating--full__color: var(--z-danger); }
```

## Le geste (ce qui s'anime)

Le remplissage **glisse** d'une étoile à l'autre (`--z-dur-select`, `--z-ease-spring`).
Au focus clavier, un halo (`--z-state__color` à 40 %) entoure la rangée — jamais
l'outline natif. Au pressé, la rangée s'assombrit d'un rien (`brightness(.97)`) : le
geste répond avant l'effet. À l'apparition, `pop`. Démo : `z-rating.demo.html`
(+ sélecteur de peau).
