# z-element — la base vivante

---

# ① EN CLAIR

## Le code que tu n'écris plus

Un bouton qui réagit vraiment — survol, appui, lâché dedans, lâché à côté, glissé,
focus clavier — coûte ça, à la main, sur **chaque** composant du projet :

```js
btn.addEventListener("pointerenter", () => btn.classList.add("is-over"));
btn.addEventListener("pointerleave", () => btn.classList.remove("is-over"));
btn.addEventListener("pointerdown",  () => btn.classList.add("is-press"));
btn.addEventListener("pointerup",    (e) => { /* dedans ? dehors ? annulé ? */ });
// + le glissé, + le focus clavier, + retirer les écouteurs au démontage…
```

Avec z-element :

```html
<z-element><button>Envoyer</button></z-element>
```
```css
z-element:state(over)  { background: orange; }
z-element:state(press) { transform: scale(.97); }
```

z-element surveille l'élément et **écrit dessus ce qui lui arrive**, en `:state()` —
un sélecteur natif du navigateur, pas une classe inventée. Tu ne décris plus que
l'apparence. Zéro JavaScript, zéro dépendance, rien à nettoyer.

> Si tu as fait du Flash : ce sont les images-clés `Up / Over / Down` d'un bouton.
> Une quinzaine au lieu de trois, dessinées en CSS, sur n'importe quel élément.

## Les mots que Zoé pose toute seule

Elle les tient à jour toute seule. Tu n'écris que le CSS.

| État | Posé quand |
|---|---|
| `default` | au repos, rien en cours |
| `over` | le pointeur est dessus |
| `press` | l'appui est en cours |
| `release` | on relâche **sur** l'élément — le clic est validé |
| `releaseOut` | on relâche **à côté** — le geste est annulé |
| `drag` | l'appui a glissé (au-delà de 4 px) |
| `focus` | l'élément prend le focus, souris ou clavier |
| `enter` | il vient d'arriver dans la page |

## Les mots que tu poses, toi

Ceux-là viennent de ton application, pas du geste : z-element ne peut pas savoir que
ton formulaire est invalide ni que ta requête est partie. Tu les poses en attribut :

```html
<z-element loading>Envoi en cours…</z-element>
<z-element error>Mot de passe refusé</z-element>
```

| État | Sens |
|---|---|
| `loading` | un traitement est en cours |
| `disabled` | **le seul qui agit** : il coupe l'interaction |
| `error` | l'opération a échoué |
| `success` | l'opération a réussi |
| `current` | l'élément **sélectionné** : onglet ouvert, case cochée |

Depuis ton JavaScript, c'est le même état :

```js
btn.setState("loading");         // pose
btn.setState("loading", false);  // retire
```

## Le trajet d'un clic

```
default  ⇄  over  →  press  →  release      lâché dessus : le clic compte
                            ↘  releaseOut   lâché à côté : annulé
```

Puis retour à `default`. **Rien ne reste cliqué** : un bouton n'est pas un
interrupteur. Un élément qui reste allumé, c'est `current` — une sélection, posée
exprès par ton code, jamais par le clic.

---

# ② POUR ALLER PLUS LOIN

Pour le développeur qui branche Zoé dans un vrai projet.

## Lire un sélecteur Zoé

Avant tout le reste : savoir **déchiffrer une ligne**. Personne n'est né en le sachant,
et il n'y a que cinq morceaux à connaître.

```css
z-button:has(z-layer):state(focus) > [part=background] { … }
```

> « Peins **le calque `background`** posé directement dans un **z-button** qui **a des
> calques** et qui est **en focus**. »

Ça se lit **de droite à gauche** : la cible est à la fin, tout ce qui la précède
sont des conditions.

| Morceau | Traduction |
|---|---|
| `z-button` | le composant |
| `&` | le composant lui-même, quand on écrit dans son bloc (voir plus bas) |
| `:state(focus)` | **quand** il est dans cet état |
| `:has(z-layer)` | **s'il contient** au moins un calque → l'auteur a écrit la forme longue |
| `>` | son **enfant direct** (pas un petit-fils) |
| `[part=background]` | la pièce qui joue **ce rôle** |

**À quoi sert `:has()`.** Un composant Zoé s'écrit de deux façons : court
(`<z-button>Envoyer</z-button>`) ou en calques. `:has(z-layer)` est l'**aiguillage**
entre les deux — il évite de peindre un calque qui n'existe pas.

**À quoi sert `>`.** Il empêche un composant **imbriqué** dans un autre de se faire
repeindre par le CSS de son parent. Sans lui, un `z-button` posé dans une carte
hériterait des règles de la carte.

**Pourquoi pas `::part()`**, qui serait plus lisible ? Parce qu'elle n'existe **que pour
le Shadow DOM** — une capsule scellée où le CSS de la page n'entre pas. Zoé est en
**light DOM** : ton HTML reste le tien, ton CSS l'atteint directement, il n'y a aucun
sceau à percer. `::part()` ne trouverait rien à traverser et ne sélectionnerait rien,
**sans le moindre message d'erreur**.

**Le `&` et l'imbrication.** Tout ce qui concerne un composant tient dans un seul bloc ;
`&` y désigne le composant lui-même. Les deux écritures ci-dessous sont identiques :

```css
z-button { … }
z-button:state(over) { … }
z-button > [part=label] { … }
```
```css
z-button {
	…
	&:state(over) { … }
	> [part=label] { … }
}
```

## Deux chemins d'utilisation

- **Chemin A — étendre.** Un composant Zoé hérite de tout : `class ZButton extends ZElement {}`.
- **Chemin B — enrouler.** `<z-element><button>…</button></z-element>` : ta structure
  reste la tienne, Zoé n'injecte aucune balise. (C'est ce qu'on appelait « z-state » —
  c'était le même moteur, un seul nom désormais.)

## Trois voies pour poser un état, une seule vérité

```html
<z-element loading>…</z-element>        <!-- déclaratif : l'attribut fait foi -->
```
```js
el.setState("loading");                 // impératif
el.toggleState("current");
```
```css
@property --z-state__glow {}            /* le CSS crée l'état : Zoé le découvre */
z-element:state(glow) { … }             /* → pilotable <z-element glow> */
```

Pour les états **durables**, l'attribut est la source de vérité : `setState()` ne fait
que le poser ou le retirer. Ce que tu lis dans le HTML est ce qui est vrai.

Un `setState("nimporteQuoi")` fonctionne aussi : le mot est posé directement en
`:state()` sans passer par un attribut. Utile pour un état maison ponctuel.

## Transitoire ou durable

- **Transitoire** — posé puis retiré tout seul (`over`, `press`, `release`, `enter`…).
  Sa durée se règle en CSS : `--z-dur-<mot>` (`--z-dur-release`, `--z-dur-enter`).
- **Durable** — porté par un attribut, il reste jusqu'à ce que tu l'enlèves
  (`current`, `loading`, `disabled`, `error`, `success`).

`select` / `unselect` sont des gestes transitoires joués **automatiquement** quand
`current` change — de quoi animer une sélection sans rien câbler.

## `exit` — le seul état que le socle ne peut pas jouer

Quand un élément est retiré du DOM, il est **déjà parti** : plus rien ne peut s'animer.
C'est donc **celui qui retire** qui joue la sortie. Le socle rend simplement `play()`
attendable :

```js
await el.play("exit");   // pose :state(exit), attend --z-dur-exit
el.remove();             // et seulement là, on retire
```

C'est ce que fera `z-stager`. Le socle ne connaît pas z-stager : il fournit l'attente,
pas la politique.

## Composer

```css
z-element:state(over):state(current) { … }            /* deux à la fois (ET) */
z-parent:state(drag) z-element:state(over) { … }      /* une relation entre deux */
z-element:state(success):state(from-loading) { … }    /* une séquence : arrivé DE loading */
```

Les `z-element` imbriqués ne se marchent pas dessus : le plus proche du pointeur gagne.

## Écouter

```js
el.addEventListener("z-state", (e) => e.detail);  // { states, changed, on }
el.states;                                         // les états actifs à l'instant
```

## Accessibilité

Les statuts se reflètent tout seuls : `loading` → `aria-busy`, `disabled` →
`aria-disabled`, `error` → `aria-invalid`.

## Les lois

- `current` n'est **pas** un état d'interaction — jamais posé par un clic.
- Le light DOM appartient à l'auteur : Zoé n'injecte aucune balise.
- Tout état a un visuel redéfinissable en CSS — donc skinnable, donc animable.
- Un seul mot par idée : pas de `busy` **et** `loading`, deux mots pour un sens finissent
  toujours par diverger.
