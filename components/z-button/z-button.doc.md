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

## États (hérités de z-element)

Interaction : `over` · `press` · `release` / `releaseOut` · `focus`.
Statut (par attribut) : `loading` (balayage skeleton) · `busy` (pulse) · `disabled` ·
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
