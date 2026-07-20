# z-radio

Un bouton radio bâti sur [`z-element`](../../core/z-element/z-element.doc.md), à la même
anatomie que [`z-checkbox`](../z-checkbox/z-checkbox.doc.md) : le **marker** (le rond) et
le **label** (ton texte). Zoé n'injecte **aucune balise** — le marker est un `::before`,
le label reste ton light DOM.

```html
<z-radio value="fr">Français</z-radio>
<z-radio value="en" current>English</z-radio>
<z-radio value="es" disabled>Español</z-radio>
```

## La loi de la radio : elle ne s'éteint pas toute seule

C'est **la** différence avec la case à cocher, et elle tient en une phrase :

> Une case bascule. Une radio s'allume — pour l'éteindre, on en choisit **une autre**.

Donc re-cliquer sa propre radio ne fait **rien** (pas même un `change` : rien n'a changé).
Éteindre est une opération de **programme** (`radio.checked = false`), jamais un geste
d'utilisateur. Et comme une radio ne peut pas éteindre sa voisine, il faut quelqu'un
au-dessus : [`z-radio-group`](../z-radio-group/z-radio-group.doc.md).

## Choisie = `current`

Le même état de sélection durable que partout dans Zoé, posé par le composant au clic,
à <kbd>Espace</kbd> ou à <kbd>Entrée</kbd> — jamais par le socle.

```js
radio.checked;              // → true/false
radio.value;                // → l'attribut value, ou le texte du label à défaut
radio.addEventListener("change", () => console.log(radio.value));
```

Accessibilité : `role="radio"` + `aria-checked` suivent `current` tout seuls. Les
**flèches** ne sont pas gérées ici : elles appartiennent au groupe.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-radio__gap` | l'écart marker ↔ label |
| `--z-radio--marker__size` | la taille du rond |
| `--z-radio--marker__radius` | sa forme (50 % = rond ; une peau peut le carrer) |
| `--z-radio--marker__border` | le contour |
| `--z-radio--marker__background` | le fond au repos |
| `--z-radio--marker__background-checked` | le fond une fois choisie |
| `--z-radio--dot__color` | le point qui zoome (blanc par défaut) |
| `--z-radio--label__weight` | le poids du label choisie |

## Le geste

Au choix, le rond se remplit d'accent et le **point zoome du fond** (`background-size`
0 → 50 % en ressort) — exactement le mouvement de la case, car c'est le même sens :
« ça vient d'être choisi ». Seule la **forme** dit « un seul ». Le label s'épaissit sans
saut de pixel (faux-bold). Démo : `z-radio.demo.html` (+ sélecteur de peau).
