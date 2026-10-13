# z-field

Le **champ de formulaire** de Zoé — et il ne remplace rien. Zoé n'a pas de « champ
texte » à elle : le formulaire, le clavier, l'autocomplétion, la validation, le mobile,
le navigateur fait déjà tout cela parfaitement avec un `<input>`. Ce que le web n'a
jamais livré, c'est ce qu'il y a **autour** : le label relié au contrôle, l'aide, le
message d'erreur, et des **états visibles** (erreur, succès, rempli) qu'une peau peut
peindre. C'est cela, `z-field`.

```html
<z-field>
  <label>Adresse e-mail</label>
  <input type="email" name="email" required placeholder="vous@exemple.fr">
  <small part="hint">Nous ne la partagerons jamais.</small>
  <small part="error"></small>
</z-field>
```

Vous écrivez tout, en balises natives ; Zoé n'injecte **aucun nœud** (ADR-0018). Il
**relie** et il **juge** — rien d'autre.

| Pièce | Ce que vous écrivez | Ce que le champ fait |
|---|---|---|
| `label` | un `<label>` natif | pose `for` vers le contrôle (un id est créé s'il manque) |
| le contrôle | un `<input>`, `<textarea>` ou `<select>`, **enfant direct** — la seule pièce obligatoire | le lit, ne le touche pas : il reste **la source de vérité** |
| `[part="hint"]` | l'aide, sous le contrôle | la relie au contrôle (`aria-describedby`) |
| `[part="error"]` | le message d'erreur — vide, ou avec votre texte | le montre en `:state(error)`, le relie, y écrit le message du navigateur s'il est vide |

Sans contrôle en enfant direct, le champ prévient dans la console et ne fait rien.

## Une seule source : le contrôle

`required`, `type`, `name`, `minlength`, `maxlength`, `pattern`, `value`… **restent sur
le contrôle natif.** Le champ ne les recopie pas, ne les recalcule pas : il lit
`control.validity` et `control.validationMessage`, ceux du navigateur. Vous n'apprenez
donc aucune règle de validation nouvelle, et les messages arrivent déjà traduits dans
la langue de l'utilisateur.

Le champ n'a que deux attributs à lui :

| | |
|---|---|
| `disabled` | désactive le champ — **propagé** au contrôle natif, et retiré avec lui (un `<fieldset disabled>` l'atteint aussi) |
| `counter` | écrit « 12 / 80 » au bout de l'aide, en CSS pur (voir plus bas) |

## Quand le champ juge

La règle qui évite le formulaire agaçant :

- **jamais pendant la première frappe** — on vous laisse taper ;
- à la **sortie du champ**, si vous y avez tapé quelque chose (ou dès que le contrôle
  émet `change` : un `<select>` choisi, par exemple) ;
- quand le formulaire **refuse** le contrôle à la soumission (événement `invalid`) ;
- puis **en direct** : une fois jugé, le champ se rejuge à chaque frappe, et l'erreur
  s'efface dès que vous la corrigez.

Trois états en découlent, tous **durables** (un attribut, lisible en `:state()`) :

| État | Quand |
|---|---|
| `error` | jugé et invalide |
| `success` | jugé, valide **et non vide** — un champ vide n'est jamais « réussi » |
| `filled` | la valeur n'est pas vide — posé à chaque frappe, jugé ou non ; c'est lui qui permet un **label flottant** en CSS pur |

Le focus, lui, est lu en CSS : `z-field:focus-within` allume le label et le filet du
contrôle (le socle ne pose `focus` qu'au clavier et sur l'hôte — ici c'est le contrôle
qui prend le focus).

```js
field.control;            // → le <input> natif
field.valid;              // → true / false (la validité native, à l'instant)
field.validate();         // juge maintenant, pose les états, rend la validité
field.addEventListener("change", () => field.valid);   // le change du contrôle bulle, intact
```

Le champ **n'invente aucun événement** : les `input` et `change` du contrôle natif
bullent à travers lui, et `z-state` dit chaque changement d'état.

## Le message d'erreur

`[part="error"]` est votre place pour le message. Deux façons de l'écrire :

- **vide** (`<small part="error"></small>`) : le champ y écrit le `validationMessage`
  du navigateur — « Veuillez renseigner ce champ », « Veuillez saisir une adresse
  e-mail valide »… déjà traduit, déjà précis. C'est **le seul texte que Zoé écrit**, et
  seulement là où vous lui avez fait de la place ;
- **avec votre texte** : il reste le vôtre, le champ ne le touche pas.

Quand la place existe, le champ **retient la bulle du navigateur** (`preventDefault()`
sur `invalid`) : un seul message, le vôtre, au bon endroit. À la soumission, le focus
va au **premier** champ refusé — pas au dernier.

Sans `[part="error"]`, la bulle native reste : vous n'avez rien perdu.

## Le compteur

Posez `counter` et le champ écrit « longueur / maxlength » au bout de l'aide :

```html
<z-field counter>
  <label>Votre message</label>
  <textarea name="message" maxlength="120"></textarea>
  <small part="hint">Soyez bref.</small>
</z-field>
```

Aucun nœud, aucun texte posé par le JS : le champ publie deux **nombres** sur l'hôte —
`--z-field__length` et `--z-field__max` — et le CSS les écrit avec `counter()`, le même
tour que `z-slider` pour sa valeur. L'aide doit exister (vide suffit) ; sans `maxlength`,
seule la longueur s'écrit. Et ces deux nombres sont à vous : `calc(var(--z-field__length) /
var(--z-field__max) * 100%)` fait une jauge de remplissage en une ligne.

## Dans un formulaire

```html
<form>
  <z-field>
    <label>Nom</label>
    <input name="nom" required minlength="2">
    <small part="error"></small>
  </z-field>
  <z-field>
    <label>Pays</label>
    <select name="pays" required>
      <option value="">—</option>
      <option>France</option>
    </select>
    <small part="error"></small>
  </z-field>
  <button type="submit">Envoyer</button>
</form>
```

| | |
|---|---|
| ce qui part | le contrôle natif, sous **son** `name` — le champ n'envoie rien lui-même |
| la soumission | refusée par le navigateur tant qu'un contrôle est invalide ; chaque champ refusé passe en `error` et montre son message |
| `<fieldset disabled>` | atteint le champ, qui le descend sur son contrôle |
| reset du formulaire | le champ revient au repos (plus d'erreur, plus de succès), le contrôle reprend sa valeur d'origine |

## Accessibilité

Tout ce que le champ pose, il le pose **sur le contrôle** — c'est lui que le lecteur
d'écran lit :

- `label[for]` → `control[id]` : cliquer le label focalise le contrôle, et le contrôle
  porte son nom ;
- `aria-describedby` : l'aide toujours, le message d'erreur **quand il est affiché** —
  derrière ce que vous aviez déjà relié vous-même ;
- `aria-invalid="true"` quand le champ est en erreur, retiré sinon.

Le champ n'a pas de rôle ARIA : c'est un morceau de formulaire, pas un widget.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-field__gap` | l'écart entre les lignes de la colonne |
| `--z-field__inline-size` | la largeur du champ (`auto` : celle de son contrôle) |
| `--z-field--label__color` · `__font-size` · `__font-weight` | le label au repos (il prend `--z-state__color` au focus) |
| `--z-field--control__padding` · `__font-size` · `__color` | l'intérieur du contrôle |
| `--z-field--control__background` · `__border-color` · `__radius` | sa surface, son filet, son rayon |
| `--z-field--hint__color` · `__font-size` | l'aide (et la taille de l'erreur) |
| `--z-field--error__color` | le message d'erreur |
| `--z-field--counter__color` | le compteur |
| `--z-field__length` · `--z-field__max` | **posés par le champ** : deux entiers à lire, pas à écrire |

Défauts qui **consomment la peau** — les mêmes tokens que sa couche classless
(`--z-line`, `--z-radius`, `--z-pad-y`, `--z-pad-x`, `--z-font`, `--z-surface`) : un
`<input>` dans un `z-field` et un `<input>` nu se ressemblent, sur HighTech comme sur
Claude. Le filet, le halo et le label lisent `--z-state__color` : accent au repos,
danger en erreur, succès une fois validé — sans une ligne de plus.

```css
z-field:state(error) > label { font-weight: 600; }       /* réagir à un état */
z-field { --z-field--control__radius: 999px; }           /* repeindre une pièce */
```

## Le geste

Au focus, le label et le filet passent à l'humeur du champ et un **halo** s'allume
(`--z-focus-halo`). Quand l'erreur arrive, elle **descend** en fondu sous le contrôle
(`@starting-style` + `display` en `allow-discrete` : rien ne pope) ; quand on la corrige,
elle fond avant de disparaître. Le filet glisse d'une couleur à l'autre. Démo :
`z-field.demo.html` (+ sélecteur de peau).
