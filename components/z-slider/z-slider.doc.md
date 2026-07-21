# z-slider

Un curseur de valeur bâti sur [`z-element`](../../core/z-element/z-element.doc.md).
C'est le premier composant de Zoé où **glisser est le geste normal**, et non un
accident — d'où le soin porté à l'état `drag`.

**Forme courte** — le CSS peint l'hôte, un `::before` unique fait tout le dessin :

```html
<z-slider value="40"></z-slider>
<z-slider value="70" label="over"></z-slider>
<z-slider min="0" max="10" step="1" markers label="under"></z-slider>
<z-slider orientation="vertical" value="60"></z-slider>
```

**Forme en calques** ([`z-layer`](../../core/z-layer/z-layer.doc.md)) — chaque pièce est
un élément, donc **animable seule** :

```html
<z-slider value="40" step="10" markers label="over">
  <z-layer part="background"><z-layer part="ticks"></z-layer></z-layer>
  <z-layer part="marker"><z-layer part="dot"></z-layer></z-layer>
  <z-layer part="infos"><z-layer part="label"></z-layer></z-layer>
  <z-layer part="contact"></z-layer>
</z-slider>
```

| Rôle | La pièce |
|---|---|
| `background` | la piste : le rail vide, de min à max |
| `ticks` | les graduations, dessinées en dégradé dans la piste |
| `marker` | la part remplie, de min à la valeur — c'est l'état, rendu visible |
| `dot` | la poignée, posée au bout du remplissage |
| `infos` › `label` | la valeur écrite ; laissé vide, le CSS l'y écrit lui-même |
| `contact` | ce qui reçoit le geste — déborde la piste fine pour rester attrapable |

Les rôles se **partagent** : `dot` est la poignée ici et la marque d'une case sur
`z-checkbox`. Une peau les atteint d'un coup. Seul `ticks` est propre au curseur.

## Un seul nombre, et tout le dessin en découle

Le JS ne mesure rien et ne déplace aucune pièce. Il traduit un geste en valeur, puis
pose **deux nombres** dans la cascade :

```css
--z-slider__progress   /* 0 → 1, la position */
--z-slider__value      /* la valeur, pour que le CSS puisse l'écrire */
```

Le remplissage, la poignée, les graduations et l'étiquette sont du CSS qui lit
`progress`. Trois conséquences, et ce sont elles qui justifient le choix :

1. **Tout est animable.** `progress` est déclaré en `@property <number>`, donc il
   s'interpole : une valeur posée par API *glisse* au lieu de sauter, et une peau
   change la courbe du geste sans toucher au composant.
2. **Rien n'est injecté.** Les graduations sont un `repeating-gradient`, l'étiquette un
   `counter()`. Le DOM que tu écris est le DOM que tu debug (ADR-0018).
3. **Le canal marche tout seul.** N'importe quel CSS de la page peut lire `progress` et
   s'en servir : le curseur pilote sans rien connaître de ce qu'il pilote.

## Les paramètres

| Attribut | Valeurs | Ce qu'il décide |
|---|---|---|
| `value` | nombre | la valeur — bornée à `[min, max]` et calée sur `step` |
| `min` `max` | nombres | les bornes (0 et 100 par défaut) |
| `step` | nombre · `any` | l'incrément. `any` = curseur continu |
| `orientation` | `horizontal` · `vertical` | le sens de la piste |
| `markers` | *nu* · nombre | les graduations : nu = une par pas, un nombre = ce nombre d'intervalles |
| `label` | `over` · `under` · `none` | où s'écrit la valeur (rien par défaut) |
| `disabled` | booléen | coupe l'interaction |

**En vertical on va de bas en haut** : monter, c'est augmenter. Et les quatre flèches
marchent dans les deux orientations — personne ne devrait avoir à deviner le sens d'une
piste avant d'appuyer sur une touche. L'étiquette, elle, passe sur le côté (`over` à
droite, `under` à gauche) : au-dessus, elle couvrirait la poignée à chaque valeur haute.

## L'étiquette — et son plafond, dit franchement

`label` écrit la valeur **brute, en nombre entier**, sans créer un seul nœud :

```css
content: counter(z-value);
counter-reset: z-value var(--z-slider__value);
```

C'est le seul moyen d'écrire un nombre en CSS pur. C'est aussi sa limite : un
`counter()` n'accepte qu'un entier, donc `12.5` ne s'affichera pas, et « 40 % » ou
« 12,50 € » non plus.

Ce n'est pas un mur — c'est une porte à côté. Écris ton texte dans le calque `label` et
écoute `input` : le CSS se tait dès que le calque n'est plus vide.

```html
<z-slider value="40" label="over">
  <z-layer part="infos"><z-layer part="label">40 %</z-layer></z-layer>
  …
</z-slider>
```

```js
slider.addEventListener("input", (e) => {
  slider.querySelector('[part="label"]').textContent = `${e.target.value} %`;
});
```

## Les graduations irrégulières

`markers` dessine des graduations **régulières** — c'est le chemin court. Pour des
positions arbitraires (0, 25, 90…), le gradient ne suffit plus, et Zoé ne va pas
injecter des nœuds à ta place. Tu écris les tiens dans la piste :

```html
<z-layer part="background">
  <z-layer part="tick" style="--z-tick__at: 25%"></z-layer>
  <z-layer part="tick" style="--z-tick__at: 90%"></z-layer>
</z-layer>
```

C'est ton DOM, tu le places, tu le peins. Le vocabulaire court est un chemin rapide,
pas un périmètre.

## Le geste

| Geste | Ce qui se passe |
|---|---|
| clic sur la piste | la poignée y va — on vise une position, pas un objet |
| glissé | la valeur suit, `input` à chaque changement |
| relâché | `change`, une fois |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | un cran |
| <kbd>PgUp</kbd> <kbd>PgDn</kbd> | dix crans |
| <kbd>Début</kbd> <kbd>Fin</kbd> | aux bornes |

`input` pendant, `change` à la fin : la convention d'un contrôle natif, pour qu'un
formulaire existant n'ait rien à réapprendre.

Un curseur continu (`step="any"`) n'a pas de cran ; au clavier il avance quand même, par
centièmes de course — sinon la touche ne ferait rien et le contrôle paraîtrait mort.

## Les états

Tous ceux de [`z-element`](../../core/z-element/z-element.doc.md), et `drag` en vedette :
la poignée grossit pendant le glissé — elle dit « je suis à toi » — et les graduations
s'effacent, car elles ont servi à viser et gêneraient maintenant la lecture.

```css
z-slider:state(drag) > z-layer[part="marker"] > z-layer[part="dot"] { scale: 1.25; }
z-slider:state(drag) > z-layer[part="background"] > z-layer[part="ticks"] { opacity: .35; }
```

## À voir

[`z-slider.demo.html`](./z-slider.demo.html) — les six sections : forme courte, pas et
graduations, vertical, forme en calques, ce que les calques débloquent, et deux curseurs
qui pilotent un carré.
