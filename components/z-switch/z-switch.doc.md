# z-switch

Une case à cocher pose un choix qu'on validera plus tard ; un interrupteur **agit tout
de suite** — notifications, mode sombre, lecture automatique. z-switch est la cousine
active de [`z-checkbox`](../z-checkbox/z-checkbox.doc.md) : même mécanique (`current` =
allumé, clic ou <kbd>Espace</kbd>, participation au formulaire), mais la sémantique d'un
interrupteur — `role="switch"`, deux valeurs, jamais « peut-être ». Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md), il hérite toute la grammaire
d'états sans en réécrire une.

```html
<z-switch name="notifications">Notifications</z-switch>
<z-switch current>Mode sombre</z-switch>
<z-switch disabled>Indisponible</z-switch>
```

## En calques

Forme courte : le CSS peint la piste en `::before` et la pastille en `::after`. Forme en
calques ([`z-layer`](../../core/z-layer/z-layer.doc.md)) : chaque pièce est un élément,
donc animable seule.

```html
<z-switch>
  <z-layer part="background"></z-layer>
  <z-layer part="marker">
    <z-layer part="dot"></z-layer>
  </z-layer>
  <z-layer part="infos">
    <z-layer part="label">Notifications</z-layer>
  </z-layer>
  <z-layer part="contact"></z-layer>
</z-switch>
```

| Rôle | La pièce |
|---|---|
| `background` | le fond de toute la ligne — souvent transparent, il porte les effets |
| `marker` | la **piste**, le rail |
| ↳ `dot` | la **pastille** qui glisse d'éteint à allumé — le même mot que le `dot` d'une case |
| `infos` | ce qui informe — déplacé, caché ou animé d'un bloc |
| ↳ `label` | votre texte |
| `contact` | ce qui reçoit le geste — invisible, il peut déborder |

Les deux formes lisent **les mêmes tokens** et se comportent pareil ; le JS ne sait pas
quelle forme il porte.

## Allumé = `current`

Allumer, c'est poser la **sélection durable** `current`. Le composant la pose lui-même au
clic ou à <kbd>Espace</kbd> — jamais le socle.

```js
sw.checked = true;          // allume (sans événement : c'est le programme)
sw.checked;                 // → true/false
sw.addEventListener("change", () => console.log(sw.checked));
```

`change` ne part que sur un **geste** de l'utilisateur. `aria-checked` suit `current`
tout seul.

## Case ou interrupteur ?

| | `z-checkbox` | `z-switch` |
|---|---|---|
| le sens | un choix, validé plus tard (formulaire) | un effet **immédiat** |
| les valeurs | trois (`indeterminate`) | **deux** |
| le rôle | `checkbox` | `switch` |

La règle : si l'effet attend un bouton « Envoyer », c'est une case.

## Dans un formulaire

Il part comme un `<input type="checkbox">`, sans wrapper ni champ caché :

```html
<form>
  <z-switch name="newsletter" value="hebdo" current>Recevoir la lettre</z-switch>
</form>
```

| | |
|---|---|
| `name` | le nom du champ |
| `value` | ce qui part **s'il est allumé** (défaut `"on"`) |
| éteint | **rien** ne part |
| `<fieldset disabled>` | le coupe, et ses visuels d'état suivent |
| reset du formulaire | il revient à son HTML d'origine |

Pas de `required` : un interrupteur éteint est une réponse valable, le composant ne se
déclare jamais invalide.

## Accessibilité

- `role="switch"` + `aria-checked="true|false"`.
- Un arrêt de tabulation (`tabindex="0"`, `-1` quand `disabled`).
- <kbd>Espace</kbd> bascule, sans faire défiler la page. Le halo de focus se pose sur la
  piste.

## Anatomie & grammaire du pacte

Dans les tokens, la piste s'appelle `track` et la pastille `thumb` ; dans le HTML, ce sont
les rôles partagés `marker` et `dot`.

| Token | Peint |
|---|---|
| `--z-switch--track__width` | la largeur de la piste (2,2 em) |
| `--z-switch--track__height` | sa hauteur (1,25 em) |
| `--z-switch--track__off` | la piste éteinte (défaut : `--z-surface-sunken`) |
| `--z-switch--track__on` | la piste allumée (défaut : `--z-accent`) |
| `--z-switch--thumb__size` | le diamètre de la pastille (.95 em) |
| `--z-switch--thumb__inset` | sa marge dans la piste (.2 em) |
| `--z-switch--thumb__color` | sa couleur (blanc) |

Les quatre tokens de géométrie sont posés sur l'hôte par le composant : surchargez-les sur
`z-switch` lui-même. La course de la pastille en découle (piste − pastille − 2 × marge) :
changez une dimension, le trajet se recalcule.

## Le geste

Allumé, la pastille **glisse** en `translate` (composé, aucun reflow) au ressort de la
peau, et la piste prend l'accent : le mouvement dit *quand* ça a basculé, là où la
couleur seule ne suffit pas. L'appui assombrit à peine ; le focus pose un halo sur la
piste ; l'arrivée joue `pop`. Avec un `<z-contact>` dans la page, le clic a l'onde de la
peau. Démo : `z-switch.demo.html` (+ sélecteur de peau).
