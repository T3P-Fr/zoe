# z-state — décorer ton élément d'états (Chemin B)

`<z-state>` donne à **ton propre élément** toute la palette d'états de Zoé, sans écrire
une ligne d'état. C'est le [`z-element`](../../core/z-element/z-element.doc.md) enregistré
en balise décoratrice — **même moteur**.

## Quand l'utiliser

Tu veux garder **ta** structure (ton `<button>` avec ton icône, ta carte sur-mesure)
mais bénéficier des états animés/skinnables. C'est le **Chemin B** : ta structure, ton
CSS, les presets — pas de peau portable (normal), mais libre et facile.

```html
<z-state>
  <button><img src="icone.svg" alt=""> Envoyer</button>
</z-state>
```
```css
/* TON CSS, contre TA structure */
z-state:state(press) > button { transform: scale(.97); }
z-state:state(loading) > button { animation: shimmer 1.1s infinite; } /* preset z-motion */
```

## Ce que tu récupères, gratis

Tous les états de z-element : `over · press · release · releaseOut · drag · focus ·
enter · exit · loading · busy · error · success …` — voir la [doc de z-element](../../core/z-element/z-element.doc.md).

## Imbrication

Un `<z-state>` dans un `<z-state>` : chacun gère SES gestes (scopé au plus proche).
Le clic de l'enfant ne « clique » pas le parent.

## À retenir

Chemin A (composant Zoé, skin portable) vs **Chemin B (z-state + ton CSS)**. Ne skine
jamais à travers deux structures différentes — c'est pour ça que les deux chemins existent.
