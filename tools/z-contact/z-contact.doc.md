# z-contact — l'effet au point de contact

Le clic laisse une trace **là où le doigt a touché**. Un seul écouteur global, **zéro
câblage par composant** : tu écris la recette **une fois**, à plat, et toute la page
répond.

```html
<z-contact></z-contact>
<script type="module" src="tools/z-contact/z-contact.js"></script>
<link rel="stylesheet" href="tools/z-contact/z-contact.css">
```

La page dit seulement **« le moteur tourne ici »**. Ce qu'on voit, c'est la **peau** qui
le décide.

> **Porté, pas réécrit.** Ce moteur vient de l'ancien repo (`packages/core/src/fx/`) —
> il est *intouchable* : on le déplace, on ne le refait pas. Seul l'effet `morph` et la
> reprise de la scène `z-overlay` sont neufs.

## Le catalogue d'effets — une peau en prend un

Un effet = **un fichier CSS**, chargé par personne par défaut. La peau importe celui
qui est sa signature :

```css
/* skins/hightech/hightech.css — en tête de fichier */
@import url("../../tools/z-contact/effects/morph.css");
```

| Recette | Le geste |
|---|---|
| `effects/morph.css` | un **rond naît sous la souris** et meurt en prenant la **forme du composant** touché (taille **et** rayon) — la signature de HighTech |
| `effects/implode.css` | un anneau converge vers le centre pendant qu'un point s'y condense |
| `effects/explode.css` | un anneau jaillit du centre, épais → fin |
| *(rien d'importé)* | aucun effet au curseur — le cas de la peau **Claude**, qui signe avec l'onde de ses composants |

**Pourquoi la peau et pas la page.** Tant que l'effet était écrit dans le HTML
(`<z-contact fx="morph">`), il s'appliquait à **toutes** les peaux : le régler pour
HighTech le changeait pour Claude. Un effet de clic n'est pas de la plomberie, c'est
une signature — il appartient à la peau, comme la couleur ou le rayon. `fx` ne reste
qu'un **coupe-circuit** : `fx="none"` éteint tout sur une page.

**`morph` en trois temps** : le rond **existe** sous la souris (~18 % du temps — sans ce
palier, la courbe mange le départ et l'œil ne voit qu'un trait qui file) · il s'ouvre
vers la boîte du composant · il s'éteint pile en l'épousant. Un **contour**, jamais un
aplat : le remplissage masquerait le composant à l'instant où on le regarde.

Il ne décide d'aucune forme, il la **lit** : le moteur recopie la boîte de la cible sur
l'effet (`--z-contact--target__w/h/radius` + l'écart `dx/dy` jusqu'à son centre). Rayon
0 sur HighTech, arrondi sur une peau ronde — sans une ligne de plus.

## Pourquoi une source déclarée « à plat »

`<z-contact>` n'enveloppe rien. La plateforme a déjà une cascade globale (DOM,
événements) : une déclaration suffit, pas besoin du wrapper/provider que React est
*contraint* d'utiliser. **Opt-in** : sans source écrite, il ne se passe rien. Plusieurs
sources dans la page ? **La dernière gagne**, les autres passent en `disabled` — comme
la dernière règle CSS à spécificité égale.

## Les couches

L'effet respecte l'anatomie Zoé : `z-foreground` = l'onde/l'anneau, `z-marker` = le point
central (implode seul). Ce sont de **vrais éléments**, donc skinnables :
`z-contact z-foreground { … }`. Le rendu est répliqué dans un `z-overlay` plein écran,
**ré-injecté en dernier** dans `<body>` à chaque impact : il passe au-dessus de tout,
même d'une modale ouverte après — par construction, pas par un `z-index` qu'on espère
assez haut.

## Ce que la peau règle

| Token | Effet |
|---|---|
| `--z-contact-size` | la taille du rond de départ |
| `--z-contact-width` | l'épaisseur du contour |
| `--z-contact-duration` | la durée |
| `--z-contact-color` | la couleur (défaut : l'accent **de l'élément touché**) |

HighTech les pose déjà : rond de 20 px, filet 1,5 px, **0,3 s** (elle répond sec), cobalt.

## Vérifier

`z-contact.check.html` **fige** l'effet à trois instants (un effet transitoire ne se
prouve pas sur une capture). Le mouvement réel, lui, se juge à l'œil sur la page servie.

Coupé sous `prefers-reduced-motion`. Émet `zoe:contact` sur la cible (fx, position,
durée, type de pointeur) — de quoi brancher un son ou un enchaînement.
