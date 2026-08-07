# z-drag — déplacer à la main, sans écrire le déplacement

Le glisser-déposer est **le plus gros paquet de JavaScript de n'importe quelle
interface**. Attraper, suivre, relâcher : trois événements, une capture de pointeur, un
décalage à mémoriser, des limites à surveiller, le tactile qui ne marche pas, et le
clavier qu'on oublie toujours. Réécrit dans chaque projet, jamais tout à fait juste.

```html
<z-drag tabindex="0">tire-moi</z-drag>
<script type="module" src="tools/z-drag/z-drag.js"></script>
<link rel="stylesheet" href="tools/z-drag/z-drag.css">
```

```css
z-drag { translate: calc(var(--z-drag__x) * 1px) calc(var(--z-drag__y) * 1px); }
```

## Le renversement

**L'outil ne déplace rien.** Il pose la position, et c'est le CSS qui décide ce qu'elle
bouge. Ça ressemble à un détail ; c'est tout l'inverse :

```css
/* un curseur horizontal — on ne lit que __x, rien d'autre à configurer */
.curseur { translate: calc(var(--z-drag__x) * 1px) 0; }

/* une molette — le même geste devient une rotation */
.molette { rotate: calc(var(--z-drag__x) * 1deg); }

/* un réglage — le geste devient un volume, une opacité, une couleur */
z-drag   { background: hsl(calc(var(--z-drag__rx) * 120) 65% 50%); }

/* l'objet reste en place, et c'est son ombre qui bouge */
.objet   { box-shadow: calc(var(--z-drag__x) * -0.2px) 8px 20px rgb(0 0 0 / .3); }
```

Aucune liste d'options n'aurait couvert ça. **Un nombre, si.**

## Ce qu'il pose

| Le token | Ce qu'il vaut |
|---|---|
| `--z-drag__x` · `__y` | la position, en pixels **depuis le point de départ** |
| `--z-drag__rx` · `__ry` | avec `bounds` : la **part** parcourue dans les limites, `0→1` |
| `--z-drag__held` | `1` pendant qu'on tient, `0` une fois lâché |

`__held` est celui qu'on oublie et qui fait tout : c'est lui qui **soulève** l'objet sous
le doigt.

```css
z-drag {
  scale: calc(1 + var(--z-drag__held) * .04);
  box-shadow: 0 calc(4px + var(--z-drag__held) * 14px) calc(10px + var(--z-drag__held) * 20px) rgb(0 0 0 / .25);
  transition: scale .18s, box-shadow .18s;
}
```

## `bounds` — rester dans le cadre, et devenir un curseur

```html
<div class="piste"><z-drag bounds axis="x" tabindex="0"></z-drag></div>
```

L'objet ne sort plus de son parent — et **`__rx` s'allume** : la part parcourue, de `0`
à `1`. C'est la valeur d'un curseur, gratuitement, sans qu'aucun composant « slider »
n'ait été écrit.

Le cadre est mesuré **à chaque geste**, jamais mémorisé : la page bouge, les images
arrivent, la fenêtre change — un cadre mémorisé est un cadre faux.

## Où la valeur est lisible — la frontière

Les nombres sont posés **sur le `<z-drag>`**, donc lisibles sur lui et dans ses enfants.
**Jamais sur son parent** : une variable CSS ne remonte pas. C'est la règle de tout Zoé,
et elle a une conséquence pratique qu'il vaut mieux connaître d'avance — la piste d'un
curseur ne peut pas lire la position de sa poignée.

La réponse n'est pas une exception dans l'outil, c'est **d'inverser le sens** : que la
poignée peigne la barre, et que la piste la coupe.

```css
.piste   { position: relative; overflow: hidden; }
.poignee { position: relative; translate: calc(var(--z-drag__x) * 1px) 0; }

/* la barre remplie est peinte par la POIGNÉE, et déborde largement à sa gauche */
.poignee::before {
  content: ""; position: absolute; top: 50%; right: 50%;
  width: 100vw; height: 10px;
  background: var(--z-accent);
}
```

Besoin de la valeur **vraiment ailleurs** — un chiffre en haut de page, un autre
composant ? C'est `z-channel` qu'il te faut : `channel=` traverse la page, là où z-drag ne
descend que dans ses enfants.

## Pourquoi pas `draggable` et `dragstart` ?

La question est juste : le navigateur a **déjà** une API de glisser-déposer
(`draggable="true"`, `dragstart`, `dragover`, `drop`). Elle n'est pas ignorée ici — elle
répond à **une autre question**.

| | |
|---|---|
| **HTML5 Drag & Drop** | *transférer* une donnée : un fichier depuis le bureau, du texte d'une appli à l'autre, d'une fenêtre à l'autre |
| **Pointer Events** *(z-drag)* | *déplacer* un objet dans la page, sous le doigt, image par image |

Quatre raisons qui ferment le débat, et aucune n'est une question de goût :

- **Elle ne déplace pas l'élément, elle en photographie un fantôme.** Le navigateur prend
  une image bitmap et promène *celle-là* ; l'objet réel ne bouge pas. Ce fantôme n'est ni
  stylable, ni animable — **tout le principe de Zoé tombe** : il n'y a plus rien que le
  CSS puisse décider.
- **Elle ne marche pas au doigt.** L'API native n'a jamais fonctionné sur mobile. À elle
  seule, cette ligne suffirait.
- **Elle ne donne pas de position continue.** Les événements sont espacés, et
  `clientX/clientY` sont notoirement peu fiables pendant le geste (jusqu'à `0,0` sur le
  dernier). On ne peut pas coller au doigt avec ça.
- **Elle n'offre aucun chemin au clavier**, et le curseur est décidé par le système
  (`dropEffect`), pas par ta feuille de style.

**Les deux sont des standards** ; le tout est de prendre celui dont c'est le métier. Et
le jour où le besoin sera vraiment « **dépose ton fichier ici** », c'est l'API native
qu'il faudra — un autre outil, `z-drop`, qui n'aurait rien à voir avec celui-ci.

## L'état, et le nombre — les deux

Le pacte de Zoé dit qu'un état s'écrit `z-drag:state(held)`. Il est là, posé nativement
(`CustomStateSet`), **et** il double le token `--z-drag__held`. Ce n'est pas deux formes
pour la même chose : ce sont deux usages qu'aucune des deux ne couvre seule.

```css
/* l'ÉTAT — pour ce qui bascule : un curseur, une bordure, un z-index */
z-drag:state(held) { cursor: grabbing; z-index: 10; }

/* le NOMBRE — pour ce qui s'interpole : un sélecteur ne sait pas faire ça */
z-drag { scale: calc(1 + var(--z-drag__held) * .06); }
```

## Le clavier n'est pas une option

Un objet qu'on ne peut déplacer qu'à la souris est un objet que **certains ne peuvent pas
déplacer du tout**. Avec `tabindex="0"`, les **flèches** le déplacent (10 px avec `Maj`).

**Un objet borné sur un axe *est* un curseur** : `<z-drag bounds axis="x">` reçoit donc
`role="slider"`, son orientation, et une valeur `0→100` **tenue à jour à chaque
mouvement** — c'est ce qu'un lecteur d'écran sait annoncer.

Un objet libre en deux dimensions, lui, n'a **aucun équivalent ARIA**. On ne lui invente
pas de rôle — surtout pas `application`, qui couperait la navigation du lecteur d'écran
sur toute la zone. Il garde son étiquette : plus honnête qu'un mot qui promet ce qu'il ne
tient pas. Et rien de tout cela n'écrase ce que tu as écrit toi-même.

`tabindex` n'est pas posé d'office, et c'est délibéré : rendre focusable ce qui ne devait
pas l'être **casse l'ordre de tabulation d'une page entière**. La console te le rappelle
une fois, gentiment.

## `zoe:drop` — le seul moment où la page a quelque chose à faire

```js
document.addEventListener("zoe:drop", (e) => {
  localStorage.setItem("position", JSON.stringify(e.detail));   // { x, y, rx, ry }
});
```

Pendant le geste, il n'y a rien à faire : le CSS suit tout seul. **Au relâchement**, en
revanche, une page veut souvent ranger, enregistrer, ou décider où l'objet est tombé.

## Le tactile — le piège qui ne se voit pas

`touch-action: none` est dans le CSS de l'outil, et ce n'est pas de la décoration :
**sans elle, rien ne marche au doigt**. Le navigateur garde le geste pour faire défiler
la page et n'envoie jamais les mouvements. C'est le piège du glisser-déposer tactile — et
il est invisible sur un ordinateur : la démo marche à la souris, on livre, et ça ne marche
sur aucun téléphone.

Avec `axis`, l'autre direction est **rendue à la page** (`pan-y` / `pan-x`) : tirer un
curseur horizontal n'empêche pas de faire défiler verticalement.

## Le coût

Un écouteur d'appui sur l'objet ; le suivi n'est branché **que pendant le geste**. La
capture du pointeur amène tout le reste à nous, même si la main sort de l'objet ou de la
fenêtre — c'est ce qui manque à la plupart des glisser-déposer écrits à la main, où
l'objet « décroche » dès qu'on va vite. L'écriture est groupée à une par image, et souris
comme clavier passent par **la même porte** : un seul endroit où les limites s'appliquent,
donc deux chemins qui ne peuvent pas diverger.
