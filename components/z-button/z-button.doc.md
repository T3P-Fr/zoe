# z-button

Un bouton bâti sur [`z-element`](../../core/z-element/z-element.doc.md) : il **hérite tous
les états** sans en écrire un seul, et se peint via les tokens de la peau (`z-button.css`).
Structure figée → **skinnable** (Chemin A).

```html
<z-button>Envoyer</z-button>
<z-button loading>Chargement…</z-button>
<z-button disabled>Indisponible</z-button>
```

## En calques

La [structure canonique](../../core/z-layer/z-layer.doc.md) **moins le marker** : un
bouton n'a pas de pièce d'état à montrer. On n'écrit que les rôles qu'on a.

```html
<z-button>
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="icon">★</z-layer>
    <z-layer part="label">Envoyer</z-layer>
  </z-layer>
  <z-layer part="contact"></z-layer>
</z-button>
```

Ce que ça débloque : le **fond** est une pièce à part, il peut bouger sans emmener le
texte (il gonfle, il glisse, il clignote). Sur la forme courte, fond et texte sont le
même élément — donc le même mouvement. Les deux formes lisent les mêmes tokens.

## Il fait ce qu'un bouton fait

Sinon ce n'est pas un bouton, c'est un `div` qui y ressemble.

**Le clavier l'active** — <kbd>Entrée</kbd> tout de suite, <kbd>Espace</kbd> au relâché,
exactement comme le natif (et l'espace ne fait pas défiler la page au passage).

**Dans un `<form>`, il agit** :

```html
<form>
  <z-checkbox name="cgu" required>J'accepte</z-checkbox>
  <z-button type="submit">Envoyer</z-button>
  <z-button type="reset">Réinitialiser</z-button>
  <z-button type="button">Ne fait rien</z-button>
</form>
```

| `type` | |
|---|---|
| `submit` | **le défaut** — soumet le formulaire, validation comprise |
| `reset` | le remet à son état d'origine |
| `button` | rien : à toi de brancher un `click` |

La soumission passe par `requestSubmit()`, pas `submit()` : lui seul déclenche la
**validation** et l'événement `submit`. `submit()` saute les deux, en silence.

**`disabled` coupe tout** — pointeur et clavier — et l'événement ne remonte même pas :
un parent qui écoute ne verra rien passer.

## Taille, ton, largeur

```html
<z-button size="l">Grand</z-button>
<z-button tone="soft">Discret</z-button>
<z-button width="full">Pleine largeur</z-button>
```

`size` (`xs · s · m · l · xl`) ne règle qu'**une** chose : la taille du texte. Tout le
reste du bouton est en `em`, donc padding, filet et rayon suivent d'eux-mêmes. Les
facteurs appartiennent à la **peau** — c'est elle qui décide ce que « grand » veut dire.

## États (hérités de z-element)

Interaction : `over` · `press` · `release` / `releaseOut` · `focus`.
Statut (par attribut) : `loading` (balayage skeleton) · `disabled` ·
`error` (secousse) · `success`.

```js
btn.setState("loading");           // en JS
btn.setState("success", true);     // → un dev l'appelle à la fin d'un envoi
```

## Piloter une séquence

`loading → success` déclenche un rendu propre à la transition (`from-loading`), que
`success` seul ne fait pas — voir le moteur d'états de z-element.

## Skin

Change la peau (le fichier de tokens) : couleurs, forme, mouvement suivent. Le bouton
ne bouge pas d'une ligne. Démo : `z-button.demo.html` (+ sélecteur de peau).
