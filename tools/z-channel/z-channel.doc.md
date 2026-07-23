# z-channel — le canal : des composants qui se parlent sans se connaître

Deux éléments portent le **même nom de canal**, ils sont reliés. Ce qui change ici bouge
là-bas — et **c'est le CSS qui décide** ce que la valeur pilote. Aucune classe, aucun
`addEventListener`, aucun composant qui en connaît un autre.

```html
<script type="module" src="tools/z-channel/z-channel.js"></script>
```

Le canal ne fait qu'**une** chose : poser `--z-channel-{nom}` sur chacun de ses membres.
Il ne peint rien lui-même — comme le reste de Zoé, il pose un token, ta peau s'en sert.

## L'exemple — un curseur pilote une barre, en CSS pur

Le geste central. Un `<input>` **natif** émet ; un `<div>` vide **lit** ; entre les deux,
un mot commun : `tempo`.

```html
<input type="range" min="0" max="100" channel="tempo">
<div class="barre" channel="tempo"></div>

<style>
  .barre {
    height: 12px;
    width: calc(var(--z-channel-tempo) * 1%);   /* ← la valeur du canal, lue en CSS */
    background: var(--z-accent);
    transition: width .18s var(--z-ease);
  }
</style>
```

Tu glisses le curseur, la barre suit. Rien d'autre à écrire. La `<div>` ne « sait » pas
d'où vient la valeur : elle lit un token, comme elle lirait `--z-accent`.

**Qui émet, qui lit ?** Jamais déclaré, toujours déduit. *Émettre* = avoir une valeur qui
change et lever un événement (un `<input>`, un `z-slider`… leur nature suffit). *Lire* =
gratuit et universel : le token est posé sur **tous** les membres, ton CSS s'en sert ou
pas. Pas de `channel-in` / `channel-out` — deux formes seraient deux choses à retenir.

## Multi-canal — un membre sur plusieurs noms, sans plafond

Un `<div>` peut écouter deux canaux à la fois : `channel="x y"`. Deux noms → deux tokens
posés sur lui.

```html
<input type="range" channel="x"><input type="range" channel="y">
<div class="point" channel="x y"></div>

<style>
  .point {
    position: absolute;
    left: calc(var(--z-channel-x) * 1%);
    top:  calc(var(--z-channel-y) * 1%);
  }
</style>
```

Deux curseurs, un point qui se balade en 2D. Et dans l'autre sens, **un seul** canal peut
piloter autant de propriétés CSS que la peau veut — largeur *et* teinte *et* rotation :
c'est le CSS qui décide, donc la peau.

## Plusieurs sorties — le composant éclate, l'auteur ne mappe rien

Un `z-range` a deux valeurs (`low` / `high`). On **refuse** `channel="prix:low"` : ce
serait une deuxième langue à apprendre. À la place, l'auteur ne donne qu'**un** nom, et le
composant éclate ses sorties avec le séparateur double du pacte :

```html
<z-range channel="prix"></z-range>
<!-- pose : --z-channel-prix--low  et  --z-channel-prix--high -->
```

```css
.fenetre {
  left:  calc(var(--z-channel-prix--low)  * 1%);
  right: calc((100 - var(--z-channel-prix--high)) * 1%);
}
```

C'est exactement la forme du pacte — `--z-{nom}[--{part}]__{prop}` : la part est
optionnelle, elle n'apparaît que quand elle existe. Un composant déclare ses parts par
`static channelParts = ["low", "high"]` ; un `<input>` nu ne l'a pas → une seule sortie,
sa `.value`. **L'outil marche donc sans Zoé, et Zoé marche sans l'outil.**

## Le monde parle au canal — `tune()`

Une valeur peut venir d'ailleurs qu'un doigt : un serveur, une horloge, un `<select>` de
thème. C'est la même porte, pour ce qui n'a pas de rail.

```js
import { tune } from "./tools/z-channel/z-channel.js";

tune("tempo", 70);                    // pousse 70 dans le canal "tempo"
tune("prix", { low: 10, high: 90 });  // plusieurs parts d'un coup
tune("theme", "dark");                // un canal peut ne porter qu'un mot
```

Le canal est **bidirectionnel** : `tune("tempo", 70)` repositionne aussi le curseur qui
émet sur `tempo`. Deux sliders sur le même nom se suivent l'un l'autre, sans une ligne de
liaison.

## La règle à connaître — `channel=` se porte sur la balise

`channel=` va sur la **balise** du composant, jamais dans ses entrailles. Le canal relie
des **hôtes** ; il atteint le dedans par le CSS (le token descend dans la shadow par
héritage), **jamais** par le JS (`querySelectorAll` s'arrête à la frontière). Le dedans
appartient à la peau — il ne se référence pas depuis l'extérieur.

Corollaire pratique : **l'abonnement EST l'attribut.** Poser `channel="x"` fait entrer
dans le canal, le retirer en sort, supprimer l'élément le désabonne. Aucune fuite
possible, et le graphe réactif est le DOM lui-même — `querySelectorAll('[channel~="x"]')`
montre qui écoute.

## Ce qu'on refuse (et pourquoi)

| Tenté | Refusé parce que |
|---|---|
| `channel="prix:low"` | deuxième syntaxe = un mapping à apprendre et à halluciner |
| un objet JSON dans le canal | il faudrait le déballer en JS, on perd le CSS qui lisait tout seul |
| un attribut `pilot=` | le pilote, c'est la ligne CSS |
| un `désabonnement` explicite | l'abonnement est déjà l'attribut — retirer suffit |

## Vérifier

`z-channel.lab.html` (servi en local) : curseur → barre, point 2D à deux canaux, et
`tune()` qui repousse les curseurs. Le **mouvement** se juge à l'œil sur la page servie —
`node scripts/serve.mjs 5173` puis `http://localhost:5173/tools/z-channel/z-channel.lab.html`.
