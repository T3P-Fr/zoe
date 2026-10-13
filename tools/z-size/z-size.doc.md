# z-size — la taille réelle, et le débordement, dits au CSS

Deux questions que le CSS ne sait pas poser seul.

**« Quelle taille fait vraiment cette boîte ? »** Les requêtes de conteneur répondent par
oui/non à des paliers fixés d'avance. Elles ne donnent pas de **nombre**, donc rien à
interpoler : pour un texte qui grandit *continûment* avec sa boîte, il faut la mesure
elle-même.

**« Est-ce que ça déborde ? »** Aucune réponse en CSS. Aucune. C'est **la** question sans
réponse du langage — et la raison pour laquelle tant d'interfaces affichent une ombre de
bord ou une flèche « voir la suite » qui ne correspond à rien.

```html
<z-size>
  <p>ce texte grandit avec sa boîte</p>
</z-size>

<script type="module" src="tools/z-size/z-size.js"></script>
```

```css
z-size p { font-size: calc(14px + var(--z-size__w) * 0.012px); }
```

## Ce qu'il pose

| Le token | Ce qu'il vaut |
|---|---|
| `--z-size__w` · `__h` | la taille **intérieure**, en pixels (bordures et barre de défilement exclues) |
| `--z-size__ratio` | largeur ÷ hauteur — **au-dessus de 1 elle est couchée, en dessous elle est debout** |
| `--z-size__over` | `1` si le contenu déborde, d'un côté ou de l'autre |
| `--z-size__over-x` · `__over-y` | le débordement, côté par côté |

## L'ombre qui ne ment pas

Le geste que tout le monde rate : l'ombre de bord, ou la flèche « voir la suite »,
affichée **en permanence** parce que personne ne sait dire si ça déborde vraiment.

```css
.suite {
  opacity: var(--z-size__over-y);      /* elle n'existe que s'il y a une suite */
  transition: opacity .2s;
}
```

Ajoutez un paragraphe, agrandissez la fenêtre, laissez une image finir de charger : elle
apparaît et disparaît **au bon moment**, sans un mot de plus.

## La forme, pas la taille

`__ratio` répond à une question que les requêtes de conteneur ne posent pas : cette boîte
est-elle **couchée ou debout** ? Elles ne connaissent qu'une dimension à la fois.

```css
/* un interrupteur 0/1 : 1 quand la boîte est plus haute que large.
   Le facteur 1000 rend la bascule franche, clamp() la borne. */
z-size { --debout: clamp(0, (1 - var(--z-size__ratio)) * 1000, 1); }

/* couchée : l'image prend la moitié · debout : elle prend toute la largeur */
.image { flex-basis: calc(50% + var(--debout) * 50%); }
```

Et le cas simple, souvent le seul dont on ait besoin :

```css
.image { aspect-ratio: var(--z-size__ratio); }   /* elle épouse la forme de sa boîte */
```

## Ce qu'il n'est pas

**Un remplaçant des requêtes de conteneur.** Elles restent meilleures pour *changer de
mise en page à un palier* — une colonne devient deux : c'est un **basculement**, pas une
interpolation, et le CSS le fait très bien tout seul.

z-size sert quand la réponse est **un nombre qui glisse**, ou quand la question est le
**débordement**. Les deux outils vont ensemble ; le montrer honnêtement vaut mieux que de
prétendre remplacer ce qui marche déjà.

## Le coût

Trois choses à surveiller, et une seule ne suffit pas :

- la **boîte** change de taille → `ResizeObserver` sur elle-même ;
- un **enfant** change de taille sans que la boîte bouge (une image qui finit de charger,
  un texte qui se replie) → le débordement change, la boîte non. **C'est le piège
  classique** : on observe l'élément, on croit avoir tout couvert, et l'ombre ment dès la
  première image en retard ;
- un enfant est **ajouté ou retiré** → il n'était pas encore observé.

Le navigateur ne prévient que quand quelque chose bouge vraiment : une page immobile ne
coûte rien. Un pixel de tolérance évite qu'une ombre clignote sur un arrondi de rendu, et
une boîte de hauteur nulle a une proportion de `0` — jamais l'infini d'une division par
zéro, qui rendrait invalide chaque règle qui en dépend.
