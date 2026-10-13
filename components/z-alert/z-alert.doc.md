# z-alert

Une page a besoin de dire ce qui vient de se passer — enregistré, refusé, attention —
sans ouvrir de dialogue ni interrompre. `z-alert` est cette **bannière contextuelle**,
bâtie sur [`z-element`](../../core/z-element/z-element.doc.md) : le variant `tone` donne
la couleur et le sens, le rôle ARIA fait l'annonce, et `dismissible` ajoute une croix
pour la fermer. Rien d'injecté : la croix est **peinte**, pas insérée.

```html
<z-alert tone="success">Vos modifications sont enregistrées.</z-alert>
<z-alert tone="danger" dismissible>Le paiement a été refusé.</z-alert>
```

## En calques

La [structure canonique](../../core/z-layer/z-layer.doc.md) sans `marker` ni `contact` :
une bannière n'a pas de pièce d'état à montrer, et elle ne se presse pas (la croix a sa
propre zone). On n'écrit que les rôles qu'on a.

```html
<z-alert tone="success">
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="icon">✓</z-layer>
    <z-layer part="label">Vos modifications sont enregistrées.</z-layer>
  </z-layer>
</z-alert>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface teintée et son filet gauche — elle peut pulser, respirer, sans emmener le texte |
| `infos` | ce qui informe — déplacé ou caché d'un bloc |
| ↳ `icon` | optionnel, avant le message ; il prend la couleur du ton |
| ↳ `label` | le message |

Les deux formes lisent les mêmes swatches ; la croix de `dismissible` et sa zone sont
communes aux deux.

## Le ton fait le message

`tone` ne peint pas : il pose trois swatches (`--z-tone__fill`, `--z-tone__ink`,
`--z-tone__line`) et la bannière les **boit**. La surface mélange `fill` à 12 % dans le
fond de la peau — doux, lisible sur clair comme sur sombre — et `line` fait le filet
gauche de 3 px qui l'ancre.

| `tone` | La bannière |
|---|---|
| *(aucun)* | neutre : la surface à peine teintée du filet de la peau, un filet gauche gris — une information discrète |
| `main` | l'accent |
| `complement` | la surface pure de la peau et son filet ordinaire |
| `soft` | aucun filet gauche : une surface nue, à peine détachée du fond |
| `success` | la couleur de réussite de la peau |
| `danger` | la couleur de danger — et l'annonce passe en `role="alert"` |

## Fermer : `dismissible`

L'attribut ajoute une **croix** à droite (un `::after`, rien dans votre DOM), rend la
bannière focalisable, et branche deux gestes :

- un clic dans la zone de la croix (les 2,2 em du bord droit) ;
- <kbd>Suppr</kbd> ou <kbd>Retour arrière</kbd> quand la bannière a le focus.

Les deux appellent `dismiss()`, qui fait trois choses dans l'ordre : émettre
`zoe:dismiss` (**annulable**), jouer l'état `exit`, retirer le nœud. La page garde la
main à chaque étape :

```js
const alerte = document.querySelector("z-alert");

alerte.addEventListener("zoe:dismiss", (evenement) => {
  if (!confirm("Masquer cet avertissement ?")) evenement.preventDefault();
});

await alerte.dismiss();   // rend la main une fois le nœud retiré (ou tout de suite si annulé)
```

`preventDefault()` garde la bannière en place : à vous de la fermer plus tard, ou pas.
Une bannière sans `dismissible` n'a ni croix ni focus — elle reste un message que l'on
lit. `dismiss()` marche quand même si vous l'appelez vous-même.

## Accessibilité

Au montage, la bannière prend `role="status"` — une **annonce polie**, lue quand le
lecteur d'écran a fini sa phrase. Avec `tone="danger"`, elle prend `role="alert"` :
l'annonce est **immédiate**. Un `role` que vous avez écrit vous-même n'est jamais
écrasé. Le rôle est décidé au montage : si le ton change à chaud, posez le rôle
vous-même.

Fermable, elle entre dans l'ordre de tabulation (`tabindex="0"`, retiré si l'attribut
part) et montre un anneau de focus à la couleur du ton. Les statuts du socle (`loading`,
`disabled`, `error`) se reflètent en ARIA tout seuls.

## Anatomie & grammaire du pacte

`z-alert` n'expose **aucun token propre** : son apparence est entièrement celle du ton et
de la peau. C'est voulu — une bannière qui se peint à part finit par ne plus ressembler
aux autres messages du site. Ce qu'elle boit :

| Swatch | Peint |
|---|---|
| `--z-tone__fill` | la teinte de la surface (mélangée à 12 % dans `--z-surface`) |
| `--z-tone__line` | le filet gauche (3 px), le filet du cadre (à 40 %), l'icône, l'anneau de focus |
| `--z-line` | le repli des deux quand il n'y a pas de ton : la bannière neutre |
| `--z-accent` | le repli de l'anneau de focus quand il n'y a pas de ton |
| `--z-surface` | le fond dans lequel le ton se mélange |
| `--z-ink` | le texte et la croix |
| `--z-radius` · `--z-border-width` · `--z-font` | la forme et la typo |
| `--z-dur` | la transition de la croix au survol |
| `--z-dur-enter` · `--z-ease-spring` | l'entrée |
| `--z-dur-exit` · `--z-ease` | la sortie |

Pour repeindre une alerte : changez son `tone`, ou — en calques — ciblez la pièce :
`z-alert > [part="background"] { … }`.

## Le geste

À l'arrivée, la bannière **pope** (`enter`, le ressort de la peau). Au survol de la croix,
celle-ci s'allume et prend un disque discret. À la fermeture, `dismiss()` pose `exit` :
la bannière **fond** le temps de `--z-dur-exit`, et le nœud n'est retiré qu'après —
jamais de disparition sèche. Démo : `z-alert.demo.html` (+ sélecteur de peau).
