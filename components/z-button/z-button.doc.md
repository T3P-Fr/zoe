# z-button

Un bouton bâti sur [`z-element`](../../core/z-element/z-element.doc.md) : il **hérite tous
les états** sans en écrire un seul, et se peint via les tokens de la peau (`z-button.css`).
Structure figée → **skinnable** (Chemin A).

```html
<z-button>Envoyer</z-button>
<z-button loading>Chargement…</z-button>
<z-button disabled>Indisponible</z-button>
```

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
