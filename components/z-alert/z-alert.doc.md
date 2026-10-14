# z-alert

Une bannière qui dit ce qui vient de se passer : enregistré, refusé, attention. Elle ne
bloque rien et n'ouvre rien.

```html
<z-alert tone="success">Vos modifications sont enregistrées.</z-alert>
<z-alert tone="danger" dismissible>Le paiement a été refusé.</z-alert>
```

Trois choses à connaître : le **message** (votre texte), le **ton** (`tone` : la couleur
et le sens), la **croix** (`dismissible` : pour la fermer). C'est tout. Zéro JavaScript.

## Utiliser

| Vous voulez | Vous écrivez |
|---|---|
| une information discrète | `<z-alert>…</z-alert>` |
| une réussite | `<z-alert tone="success">…</z-alert>` |
| un problème, annoncé tout de suite aux lecteurs d'écran | `<z-alert tone="danger">…</z-alert>` |
| que l'utilisateur puisse la fermer | ajoutez `dismissible` |

La croix ferme au clic, ou avec <kbd>Suppr</kbd> / <kbd>Retour arrière</kbd> quand la
bannière a le focus. La bannière s'efface en fondu avant de disparaître : jamais de
disparition sèche.

## Peindre 🖌️

Vous ne choisissez pas une couleur : vous dites ce que le message **veut dire**, et la
peau le peint. Changez de peau, toutes les bannières suivent.

| `tone` | Ce que ça dit | Ce qu'on voit |
|---|---|---|
| *(aucun)* | une information | une surface à peine teintée, un filet gris à gauche |
| `main` | mettre en avant | la couleur d'accent de la peau |
| `complement` | neutre | la surface de la peau et son filet ordinaire |
| `soft` | discret | pas de filet, une surface nue |
| `success` | réussi | la couleur de réussite de la peau |
| `danger` | problème | la couleur de danger de la peau |

Une bannière n'a **aucune couleur à elle**. Pour la repeindre, vous changez le ton ou la
peau, jamais la bannière. C'est voulu : des messages peints chacun à part finissent par
ne plus se ressembler.

Le mouvement : elle arrive en surgissant, la croix s'allume au survol, elle part en
fondu. Les durées sont celles de la peau (`--z-dur-enter`, `--z-dur-exit`). Démo :
`z-alert.demo.html`, avec le sélecteur de peau en haut.

## Brancher </>

**Fermer depuis votre code** : une ligne.

```js
await alerte.dismiss();   // fondu, puis le nœud est retiré
```

**Savoir qu'elle se ferme** (croix, clavier, ou votre appel) : l'événement `zoe:dismiss`,
émis **avant** la fermeture.

```js
alerte.addEventListener("zoe:dismiss", () => console.log("fermée"));
```

**Empêcher la fermeture** : le même événement est annulable, comme `cancel` sur un
`<dialog>` natif. Utile quand c'est l'utilisateur qui clique la croix et que vous voulez
confirmer d'abord.

```js
alerte.addEventListener("zoe:dismiss", (evenement) => {
  if (!confirm("Masquer cet avertissement ?")) evenement.preventDefault();
});
```

Si c'est vous qui fermez et que vous voulez confirmer, pas besoin d'événement :
`if (confirm("…")) await alerte.dismiss();`.

**Lecteurs d'écran** : la bannière s'annonce toute seule. `role="status"` (annonce
polie, à la fin de la phrase en cours) ; avec `tone="danger"`, `role="alert"` (annonce
immédiate). Un `role` que vous écrivez vous-même n'est jamais écrasé. Le rôle est posé à
l'arrivée : si vous changez le ton à chaud, posez le rôle vous-même.

Fermable, la bannière entre dans l'ordre de tabulation et montre un anneau de focus à la
couleur du ton.

Attributs, événements et états complets : la référence, plus bas.

## Sous le capot

Pour aller plus loin, ou pour écrire une peau.

**La bannière en pièces.** Comme tout élément Zoé, elle peut s'écrire en pièces
(`z-layer`), chacune animable à part : le fond peut pulser sans emmener le texte. Même
rendu, mêmes couleurs que la forme courte.

```html
<z-alert tone="success">
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="icon">✓</z-layer>
    <z-layer part="label">Vos modifications sont enregistrées.</z-layer>
  </z-layer>
</z-alert>
```

Pas de `marker` ni de `contact` : rien à cocher, rien à presser (la croix a sa propre
zone). Le rôle de chaque pièce : la section « Calques », plus bas. Pour cibler une
pièce : `z-alert > [part="background"] { … }`.

**Comment le ton peint.** `tone` ne peint pas lui-même : il pose trois couleurs
(`--z-tone__fill`, `--z-tone__ink`, `--z-tone__line`) et la bannière les utilise. La
surface est `fill` mélangé à 12 % dans `--z-surface` (lisible sur clair comme sur
sombre) ; `line` fait le filet gauche de 3 px, le cadre à 40 %, l'icône et l'anneau de
focus. Sans ton, `--z-line` et `--z-accent` prennent le relais.

**La croix** est peinte (`::after`), jamais insérée dans votre HTML. Sa zone de clic :
les 2,2 em du bord droit.

**`dismiss()` en trois temps** : émettre `zoe:dismiss` (annulable), jouer l'état `exit`,
retirer le nœud. La promesse rend la main une fois le nœud retiré, ou tout de suite si
la fermeture a été annulée.

**Ce qu'elle lit dans la peau** : `--z-surface`, `--z-ink` (texte et croix), `--z-line`,
`--z-accent`, `--z-radius`, `--z-border-width`, `--z-font`, `--z-dur` (survol de la
croix), `--z-dur-enter` et `--z-ease-spring` (entrée), `--z-dur-exit` et `--z-ease`
(sortie). Bâtie sur `z-element` : les statuts `loading`, `disabled`, `error` se
reflètent en ARIA tout seuls.
