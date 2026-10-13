# z-stepper

Une quantité se règle à la souris par deux boutons, et au clavier en tapant le nombre.
Le navigateur sait déjà faire la seconde moitié — formulaire, flèches ↑ ↓, saisie,
bornes `min`/`max` — avec un `<input type="number">`. z-stepper **entoure** ce standard
au lieu de le remplacer (Chemin B) : vous écrivez un vrai `<input>` dedans, il lui ajoute
un « − » à gauche, un « + » à droite, et la sémantique de groupe. L'input reste la
**source de vérité**.

```html
<z-stepper aria-label="Quantité">
  <input type="number" name="qty" value="3" min="0" max="9" step="1">
</z-stepper>
```

## Ce que vous écrivez : l'input, et rien d'autre

Pas de calque ici. La valeur, les bornes et le pas sont lus **sur l'input** (`value`,
`min`, `max`, `step`) ; le `name` est le sien ; c'est lui qui part dans le formulaire.
Rien n'est dupliqué, donc rien ne peut diverger.

Les deux boutons sont **peints** (`::before` / `::after`), jamais injectés (ADR-0018).
Leur zone cliquable est détectée en JS au `pointerdown` : 2,2 em à gauche pour « − »,
2,2 em à droite pour « + », le centre reste à l'input pour la frappe. Cliquer un bouton
ne vole pas le focus à l'input.

## Les bornes

Aux bornes, le bouton concerné **se grise** et ne réagit plus. Le composant reflète sur
l'hôte deux attributs en lecture seule, que le CSS peint :

| Attribut | Posé quand |
|---|---|
| `at-min` | on ne peut plus descendre (`value ≤ min`) |
| `at-max` | on ne peut plus monter (`value ≥ max`) |

Une saisie directe au clavier les rafraîchit aussi. Sans `min`/`max`, les bornes valent
±∞ : aucun bouton ne se grise. Un `step` absent ou nul vaut 1.

## L'API

```js
stepper.value;          // → nombre (0 si l'input est vide)
stepper.value = 5;      // borné dans [min, max]
stepper.stepUp();       // un cran, le même chemin que le « + »
stepper.stepDown();
```

Un seul point change la valeur : il borne, écrit l'input, puis déclenche `input` et
`change` **sur l'input** (ils bulle). Écoutez où vous voulez — l'input, le stepper ou le
formulaire — tout écouteur natif suit. Déjà à la borne, rien ne part : la valeur n'a pas
changé. Poser `value` depuis le code passe par le même chemin, donc émet aussi.

## `disabled`

`disabled` sur `z-stepper` coupe les deux zones et grise l'ensemble ; l'input garde son
propre `disabled` — posez-le sur l'input si la frappe doit aussi être bloquée. Un
`<fieldset disabled>` fait les deux d'un coup : le socle reflète `disabled` sur l'hôte et
le navigateur coupe l'input.

## Dans un formulaire

C'est l'input qui part, nativement : `name`, `required`, `min`/`max`, validation et
`reset` sont ceux du navigateur. z-stepper lui-même n'envoie rien.

```html
<form>
  <z-stepper aria-label="Quantité">
    <input type="number" name="qty" value="1" min="1" max="12" required>
  </z-stepper>
</form>
```

## Accessibilité

- `role="group"` sur l'hôte ; **c'est à vous** de le nommer — `aria-label="Quantité"` ou
  `aria-labelledby` vers un libellé visible.
- Le clavier passe par l'input natif : <kbd>Tab</kbd> l'atteint, <kbd>↑</kbd> <kbd>↓</kbd>
  changent la valeur d'un cran, la frappe directe reste possible. Les zones − / + ne sont
  pas des arrêts de tabulation : au clavier, elles seraient un doublon.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-stepper__button-width` | la largeur de chaque zone − / + (2,2 em) |
| `--z-stepper__field-width` | la largeur du champ au centre (3,5 em) |
| `--z-stepper--background__color` | le fond du cadre (défaut : `--z-surface-raised`) |
| `--z-stepper--button__color` | la couleur des signes − / + au repos (défaut : `--z-ink`) |

`--z-stepper__button-width` est posé sur l'hôte par le composant : surchargez-le sur
`z-stepper` lui-même. La **zone cliquable**, elle, est une constante du JS (2,2 em) :
élargir le dessin sans elle décale le clic. Le cadre, le filet et le rayon boivent la
peau (`--z-line`, `--z-border-width`, `--z-radius`).

## Le geste

Survoler le stepper allume les deux boutons d'une teinte d'accent, là où l'œil est ;
l'appui assombrit à peine ; à la borne, le bouton mort se grise et son curseur dit
« non ». À l'arrivée, la tuile joue `pop` sur `:state(enter)`. Démo :
`z-stepper.demo.html` (+ sélecteur de peau).
