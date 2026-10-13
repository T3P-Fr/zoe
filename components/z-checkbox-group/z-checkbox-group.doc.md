# z-checkbox-group

Le **niveau groupe** des cases — le cousin de [`z-radio-group`](../z-radio-group/z-radio-group.doc.md)
pour le choix **multiple**. Une [`z-checkbox`](../z-checkbox/z-checkbox.doc.md) seule
sait se cocher ; le groupe apporte ce qu'une liste de cases exige, et rien d'autre (zéro
logique métier) : une **valeur-liste**, une case **« tout cocher »**, l'exigence **« au
moins une »**, et un seul **`name`** pour le formulaire.

```html
<z-checkbox-group name="topics" required>
  <span part="label">Vos centres d'intérêt</span>
  <z-checkbox part="all">Tout cocher</z-checkbox>
  <z-checkbox value="design">Design</z-checkbox>
  <z-checkbox value="code" current>Code</z-checkbox>
  <z-checkbox value="motion">Motion</z-checkbox>
</z-checkbox-group>
```

| Pièce | Rôle |
|---|---|
| `[part="label"]` | l'intitulé, en balise native — il **nomme** le groupe (`aria-labelledby`) |
| `[part="all"]` | la **maîtresse** : coche et décoche tout, reflète la liste. Jamais envoyée, jamais comptée |
| les autres `z-checkbox` | les cases du groupe — celles dont ce groupe est le plus proche |

Le groupe n'injecte **aucune balise** (ADR-0018) : le filet sous la maîtresse est un
`::before`, l'ordre visuel (intitulé, maîtresse, cases) est posé par le CSS.

## 1. La valeur est une liste

```js
group.value;                     // → ["code"]
group.value = ["design", "code"]; // coche exactement celles-là (silencieux : c'est le programme)
group.value = "design code";     // la même chose, en chaîne à espaces
group.count;                     // → 2
group.checkboxes;                // → ses cases (sans la maîtresse, sans un groupe imbriqué)
group.all;                       // → la maîtresse, ou null

group.addEventListener("change", () => console.log(group.value));
```

L'attribut `value="design code"` en HTML = **présélection déclarative** : l'espace
sépare, comme pour `channel="x y"`. Elle est honorée **une fois**, et seulement si
aucune case ne porte déjà `current` (ce que vous écrivez sur une case gagne). Le groupe
tient ensuite l'attribut à jour : le DOM dit toujours vrai.

Le groupe **n'invente pas d'événement** : le `change` d'une case bulle à travers lui,
et comme il écoute en *capture*, `.value`, la maîtresse et la validité sont déjà à jour
quand votre écouteur se déclenche. Une seule exception, la maîtresse : son `change`
s'arrête au groupe, qui en émet **un**, le sien — vous voyez une liste qui change, pas
une case qui se coche.

## 2. La maîtresse — « tout cocher »

Marquez une case `part="all"` et le groupe fait le reste :

- cliquer la maîtresse coche **toutes** les cases libres, ou les décoche toutes ;
- elle **reflète** la liste : cochée si toutes le sont, `indeterminate` si certaines,
  rien si aucune — les trois valeurs de `z-checkbox`, posées par le groupe ;
- une case que vous avez verrouillée vous-même (`disabled` sur la case) **ne suit pas**
  et **ne compte pas** : elle ne peut pas bouger, elle ne peut pas être « manquante ».

Sur `z-checkbox` seule, relier une maîtresse à ses enfants vous coûte trois lignes ;
ici c'est un attribut, parce que le groupe, lui, connaît ses cases.

## 3. L'exigence — `required`

`required` sur le groupe = **au moins une case cochée**. Le groupe est associé au
formulaire ([`z-element`](../../core/z-element/z-element.doc.md)) : il bloque la
soumission lui-même, même sans `name`.

| État | Quand |
|---|---|
| `error` | le formulaire a **refusé** la soumission (événement `invalid`) ; levé dès qu'une case est cochée |
| `success` | l'exigence est remplie, après un **geste** |

Un geste ne pose jamais `error` : décocher la dernière case n'est pas une faute, la
soumettre l'est. Le message de refus est en anglais comme le reste de l'API —
remplacez-le d'une ligne : `group.setValidity("Cochez-en au moins une")`.

## Dans un formulaire

```html
<form>
  <z-checkbox-group name="topics" required>
    <z-checkbox value="design">Design</z-checkbox>
    <z-checkbox value="code">Code</z-checkbox>
  </z-checkbox-group>
  <button type="submit">Envoyer</button>
</form>
```

| | |
|---|---|
| `name` sur le groupe | **posé** sur chaque case qui n'en a pas : les valeurs partent sous ce nom — `topics=design&topics=code`, comme des cases natives de même `name` |
| `name` sur une case | le vôtre, jamais touché — la case part sous son propre nom |
| la maîtresse | ne part **jamais** (elle n'a pas de `name`) |
| `required` | au moins une, sinon le formulaire refuse ; le groupe passe en `error` |
| `disabled` sur le groupe | **descend** sur chaque case et la maîtresse — et remonte avec lui ; un `<fieldset disabled>` l'atteint aussi |
| reset du formulaire | les cases reviennent à leur HTML d'origine, la présélection d'origine reprend si rien n'est coché, le groupe redevient muet |

## Scopé

Un groupe ne voit que les cases dont il est le groupe **le plus proche** — la même loi
que l'imbrication dans `z-element`. Deux groupes emboîtés ne se volent pas leurs cases,
ni leur maîtresse.

## Accessibilité

`role="group"` sur l'hôte, nommé par l'intitulé (`aria-labelledby` → `[part="label"]`,
un id est créé s'il manque) ; `aria-required` quand l'exigence est posée. Chaque case
reste **un arrêt de tabulation à elle**, comme une case native — pas de roving : un
choix multiple se parcourt case par case, et <kbd>Espace</kbd> bascule. La maîtresse
annonce `aria-checked="mixed"` quand la liste est partielle.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-checkbox-group__direction` | `column` (défaut) ou `row` |
| `--z-checkbox-group__gap` | l'écart entre les cases |
| `--z-checkbox-group__align` | l'alignement transversal |
| `--z-checkbox-group--label__color` · `__font-size` | l'intitulé (il prend `--z-state__color` en erreur ou en succès) |
| `--z-checkbox-group--rule__color` | le filet sous la maîtresse |
| `--z-checkbox-group__count` · `__total` | **posés par le groupe** : deux entiers — cochées, et total (maîtresse exclue) |

Les deux nombres sont à vous. Écrire « 2 / 3 » dans l'intitulé tient en une règle, sans
JS ni nœud :

```css
z-checkbox-group > [part="label"]::after {
  content: " · " counter(c) " / " counter(t);
  counter-reset: c var(--z-checkbox-group__count) t var(--z-checkbox-group__total);
}
```

Le look des cases appartient à `z-checkbox` : ses tokens (`--z-checkbox--marker__…`)
marchent ici tels quels.

## Le geste

Chaque case garde son geste (le halo au clic, la coche qui zoome). Le groupe n'ajoute
que le sien : quand le formulaire le refuse, l'ensemble **tremble** une fois (`shake`, le
preset de z-motion) et l'intitulé passe au danger ; dès qu'une case est cochée, il
s'apaise. Démo : `z-checkbox-group.demo.html` (+ sélecteur de peau).
