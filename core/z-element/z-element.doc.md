# z-element — la base vivante

La brique de tout Zoé. Un custom element qui **porte les états d'interaction** en
`:state()`, les émet (`z-state`), et les laisse piloter par attribut, JS ou CSS.
Tout composant en hérite ; utilisé en décorateur, c'est le tool [`z-state`](../../tools/z-state/z-state.doc.md).

## Les états

| Famille | États | Nature |
|---|---|---|
| repos | `default` | posé tant qu'aucun statut n'est actif |
| interaction | `over` · `press` · `release` · `releaseOut` · `drag` · `focus` | transitoires, posés seuls |
| cycle de vie | `enter` · `exit` | transitoires |
| sélection | `current` · `select` · `unselect` | durable + gestes |
| statut métier | `loading` · `busy` · `disabled` · `error` · `success` | durables (attribut) |

**Le cycle** d'un contrôle : `default ⇄ over → press → release` (dedans) `/ releaseOut`
(dehors). Rien ne « reste » cliqué — `current` est une **sélection** durable, posée
exprès, jamais par le clic du socle.

## Piloter un état — trois voies, une vérité

```html
<z-element loading>…</z-element>        <!-- déclaratif : attribut -->
```
```js
el.setState("loading");                 // impératif : JS
el.toggleState("current");
```
```css
@property --z-state__glow {}            /* le CSS crée l'état : découvert et matérialisé */
z-element:state(glow) { … }
```

## Composer

```css
z-element:state(a):state(b) { … }              /* combiner (ET) */
z-parent:state(a) z-element:state(b) { … }      /* imbrication (relation) */
z-element:state(success):state(from-loading) { … }  /* séquence : arrivé de loading */
```

## Écouter

```js
el.addEventListener("z-state", (e) => e.detail); // { states, changed, on }
el.states;                                        // les états actifs à l'instant
```

## Loi

`current` n'est pas un état d'interaction · le light DOM appartient à l'auteur ·
tout état a un visuel redéfinissable en CSS (donc skinnable, animable).
