# z-dialog

Une boîte modale bâtie sur le `<dialog>` **natif** et sur
[`z-element`](../../core/z-element/z-element.doc.md). Vous écrivez le `<dialog>` à
l'intérieur ; le navigateur fournit ce qu'aucun script ne réimplémente sans faute ; Zoé
ajoute les **états**, l'**entrée et la sortie animées**, les **déclencheurs déclaratifs**
et le **light-dismiss**. Zéro balise injectée : le light DOM reste le vôtre.

```html
<z-dialog id="confirm" light-dismiss>
  <dialog>
    <header part="header"><h2>Supprimer ce fichier ?</h2></header>
    <p part="body">Cette action est définitive.</p>
    <footer part="footer">
      <z-button type="button" command="close" tone="soft">Annuler</z-button>
      <z-button type="button" command="close" value="delete" tone="danger">Supprimer</z-button>
    </footer>
  </dialog>
</z-dialog>
<z-button type="button" commandfor="confirm" command="show-modal">Supprimer…</z-button>
```

## Pourquoi un `<dialog>` natif dedans

Une modale réécrite en `<div>` doit refaire, à la main et sans erreur : le **top layer**
(passer au-dessus de tout, quel que soit le `z-index` du voisin), le **piège de focus**
(<kbd>Tab</kbd> ne sort jamais de la boîte), la **page rendue inerte** (plus rien ne se
clique ni ne se lit derrière), <kbd>Échap</kbd>, le **retour du focus** au déclencheur à
la fermeture, `returnValue` et `<form method="dialog">`. Le `<dialog>` fait tout ça,
annoncé correctement aux lecteurs d'écran, dans tous les navigateurs — personne ne le
refait mieux. Zoé ne touche donc qu'à ce qui lui manque : il n'a **pas d'états**, il
**apparaît et disparaît sec**, et il ne connaît pas vos `z-button`.

## Ouvrir, fermer

`open` est l'attribut **source de vérité** : posé par le composant quand la boîte
s'ouvre, retiré quand elle se ferme, et reflété en `:state(open)`. Vous pouvez l'écrire
dans le HTML (`<z-dialog open>` s'ouvre au chargement) ou passer par l'API :

```js
const boite = document.querySelector("#confirm");
boite.show();                  // dialog.showModal() + l'entrée (état enter)
await boite.close("ok");       // joue la sortie (état exit), PUIS dialog.close("ok")
boite.toggle();                // l'un ou l'autre
boite.open = false;            // même chose que close(), donc animé
boite.returnValue;             // la value du déclencheur qui a fermé ("ok")
boite.dialog;                  // votre <dialog>, si vous voulez lui parler
```

L'ordre dans `close()` compte : la sortie se joue **avant** `dialog.close()` — dans
l'autre ordre, la boîte disparaît avant d'avoir bougé. Un `<dialog>` fermé par un autre
chemin (vous appelez `dialog.close()` vous-même) retire quand même l'attribut `open` et
émet `close`.

| Événement | Quand | Détail |
|---|---|---|
| `open` | la boîte est ouverte (bulle) | — |
| `close` | la boîte est fermée, sortie jouée (bulle) | `detail.returnValue` |
| `cancel` | <kbd>Échap</kbd>, clic sur le fond, `request-close` (bulle, **annulable**) | `preventDefault()` garde la boîte ouverte |
| `z-state` | chaque changement d'état | `{ states, changed, on }` |

## Les déclencheurs déclaratifs

Aucun JavaScript pour ouvrir ni fermer : c'est le standard **Invoker Commands**
(`commandfor` + `command`), que z-dialog lit lui-même — vos `z-button` ne sont pas des
`<button>` natifs, le navigateur ne lirait jamais leurs attributs.

| Sur le déclencheur | Effet |
|---|---|
| `commandfor="confirm" command="show-modal"` | ouvre la boîte dont l'**id du z-dialog** est `confirm` |
| `commandfor="confirm" command="close"` | la ferme ; sa `value` devient `returnValue` |
| `commandfor="confirm" command="request-close"` | la ferme comme <kbd>Échap</kbd> (passe par `cancel`) |
| `commandfor="confirm" command="toggle"` | ouvre ou ferme (propre à Zoé) |
| `command="close"` **à l'intérieur**, sans `commandfor` | ferme la boîte qui le contient |

`commandfor` vise toujours le **z-dialog** (son id), jamais le `<dialog>` interne. La
raison : un navigateur qui connaît déjà l'API native l'applique aux cibles qui sont des
`<dialog>` — en visant le vôtre, il l'ouvrirait **sec**, sans états ni animation, et
z-dialog devrait courir derrière. En visant le z-dialog, le natif ignore la commande (ce
n'est pas un `<dialog>`) et Zoé la joue : rien n'est fait deux fois.

## Échap, le fond, le formulaire

- <kbd>Échap</kbd> : le natif voudrait fermer sec. z-dialog intercepte son événement
  `cancel`, émet le sien (annulable), puis ferme **en animé**.
- `light-dismiss` : un clic sur le fond (le voile) ferme, par le même chemin que
  <kbd>Échap</kbd>. L'appui **et** le relâché doivent être sur le fond : sélectionner du
  texte dans la boîte et lâcher dehors ne la ferme pas.
- `<form method="dialog">` : la soumission ferme la boîte — après validation, comme en
  natif, et `returnValue` reçoit la `value` du bouton soumetteur. z-dialog l'intercepte
  pour jouer la sortie d'abord. Le natif ne vide pas `returnValue` à l'annulation : si
  vous en dépendez, remettez-le à `""` dans l'événement `open`.

Refuser une fermeture (un brouillon non vide) tient en trois lignes, pour les trois
chemins à la fois :

```js
boite.addEventListener("cancel", (evenement) => {
  if (brouillon.value.trim()) evenement.preventDefault();
});
```

## `placement`

`center` (défaut) · `top` · `bottom` · `left` · `right`. Le centre **surgit** ; chaque
bord **glisse** depuis son côté, la boîte calée contre lui à `--z-dialog__offset` du
bord. Pour un panneau collé au bord sur toute sa hauteur, c'est
[`z-drawer`](../z-drawer/z-drawer.doc.md) : le même composant, le même code, une autre
géométrie.

## Accessibilité

Le `<dialog>` porte le rôle, le piège de focus, l'inertie de la page et le retour du
focus. z-dialog y ajoute un **nom** : à l'ouverture, si vous n'avez pas écrit
`aria-label` ni `aria-labelledby`, il pointe votre premier titre (`h1`…`h6`) — le
lecteur d'écran annonce « Supprimer ce fichier ?, dialogue ». Le focus entre dans la
boîte sur son premier élément focalisable ; posez `autofocus` sur celui que vous voulez.
Le défilement de la page est bloqué tant qu'une boîte est ouverte.

## Anatomie & grammaire du pacte

Trois rôles optionnels, posés sur **vos** éléments dans le `<dialog>` (directement, ou à
travers un `<form>`) : `header` (la ligne de titre), `body` (le contenu), `footer` (les
actions, en ligne, poussées à droite). Un `<dialog>` qui n'en a aucun est peint aussi.

| Token | Peint |
|---|---|
| `--z-dialog__width` | la largeur de la boîte (repli `min(32em, 90vw)`) |
| `--z-dialog__padding` | l'intérieur (repli `1.4em 1.6em`) |
| `--z-dialog__background` · `__color` | la surface et l'encre (repli : surface surélevée, encre de la peau) |
| `--z-dialog__border-color` | le filet de la boîte (repli `--z-line`) |
| `--z-dialog__radius` | le rayon (repli `--z-radius`) |
| `--z-dialog__shadow` | l'ombre portée — `none` sur une peau qui s'interdit l'élévation |
| `--z-dialog__offset` | la distance au bord pour les placements `top · bottom · left · right` |
| `--z-dialog__gap` | l'espace entre header, body et footer |
| `--z-dialog--backdrop__background` | le voile derrière (repli : encre à 45 %) |
| `--z-dialog--header__font-size` · `__border-color` | la taille du titre, le filet sous le header (transparent par défaut) |
| `--z-dialog--footer__gap` · `__border-color` | l'écart entre les actions, le filet au-dessus du footer |

Défauts qui **consomment la peau** : HighTech coupe l'ombre et allume les filets d'un
bloc de tokens ; Claude n'écrit rien et garde l'arrondi, la surface chaude et le ressort.

## Le geste

Rien ne pope sec. À l'ouverture, le voile **fond** et la boîte **surgit** du fond
(translation + léger grossissement, sur la courbe `--z-ease-spring` de la peau : un
ressort qui dépasse chez Claude, net chez HighTech). À la fermeture, le même trajet se
rejoue **à l'envers**, le voile se dissipe, et seulement alors le natif cache la boîte.
Les durées sont celles du socle — `--z-dur-enter` et `--z-dur-exit` — la même horloge
pour le minuteur JS et l'animation CSS. Démo : `z-dialog.demo.html` (+ sélecteur de
peau).
