# z-slider — le carnet du labo

> **Statut : proposé, rien n'est gravé.** Ce fichier note une idée et son prix, pas
> une décision. Rien n'est appliqué au composant tant que Christophe n'a pas dit
> « garde ». Écrit le 2026-07-21.

---

## La proposition — le curseur n'est pas un composant, c'est une capacité

### D'où elle vient

En portant la peau HighTech, j'ai ouvert `source/FullConcept--HighTech.html` et compté
ce qu'elle contient côté curseurs :

| Le composant, dans la source | Ce qu'il est vraiment |
|---|---|
| `Slider` | un nombre entre 0 et 1, sur une piste |
| `VSlider` | le même, piste couchée |
| `RangeSlider` | **deux** nombres sur une piste |
| `Scrubber` | le même, piste épaisse |
| `Gauge` (SL-11) | le même, sur un arc de cercle |
| `Knob` (SL-09) | le même, sur 270° |
| `XYPad` (SL-10) | **deux** nombres, un par axe |
| champ à glisser (SL-06) | le même, écrit en chiffres |

Huit composants. Tous les frameworks en font huit — un fichier chacun, une doc chacun,
une API chacun. Or **ils font la même chose** : traduire un geste en un nombre entre 0
et 1. Ce qui diffère n'est pas le comportement, c'est la **géométrie que la peau leur
donne**.

### Ce que je propose

> Le curseur n'est pas un composant. C'est une **capacité** : `progress`.

```
z-slider   = progress + une piste            ← ce qui existe aujourd'hui
knob       = progress + un arc de 270°       ← même JS, peau ronde
jauge      = progress, sans geste            ← disabled
scrubber   = progress + une piste épaisse
range      = deux progress sur un élément
XY pad     = un progress par axe
```

Une seule mécanique JS ; autant d'objets qu'il y a de peaux. Et le neuvième — un
potentiomètre en spirale, une réglette de mixage — **ne se demande à personne** : il
s'écrit en peau.

### Les deux gestes qui l'ouvrent

**1. Renommer le nombre.** `--z-slider__progress` devient `--z-progress`.

Ce n'est pas cosmétique. Tant qu'il porte le nom du composant, il lui appartient et
personne d'autre ne le lit. Nommé par son **rôle** (loi « nom = RÔLE, jamais la prop »),
il appartient à Zoé : n'importe quel CSS de la page s'en sert, y compris un composant
qui n'est pas un curseur.

**2. Deux axes au lieu d'un.** `--z-progress-x` et `--z-progress-y`.

Un slider en utilise un. Un pad XY, deux. Ça ne coûte rien à celui qui n'en veut qu'un,
et ça évite d'inventer une deuxième mécanique le jour où le pad arrive.

### Le gain réel

Ce n'est **pas** d'écrire moins de code — la mécanique du slider est déjà écrite.

C'est que le catalogue de 155 atomes en perd **sept**, et que ces sept-là passent du
statut de « composants à maintenir » à celui de **peaux** : de la marchandise pour
l'écosystème, pas de la dette.

### Le prix, dit franchement

- **Le knob et la jauge ne sont pas des pistes.** Placer une poignée sur un arc demande
  du `trigonométrie` en CSS (`sin()`/`cos()`, disponibles) — c'est faisable, mais ce
  sera plus retors que `left: calc(progress * 100%)`. À prouver avant de promettre.
- **Deux poignées (range) touchent au JS**, pas seulement à la peau : il faut savoir
  laquelle on attrape. C'est le seul des huit qui n'est pas gratuit.
- **Un renommage casse ce qui existe.** Aujourd'hui : la démo, la doc, la peau HighTech.
  C'est peu — c'est maintenant qu'il faut le faire, ou jamais.

### La preuve à faire avant de graver

**Un knob, monté sur le slider existant, sans toucher une ligne de JS.** Si le knob sort
d'une peau seule, la proposition tient. S'il faut du JS, elle tombe et on garde huit
composants.

C'est la seule preuve qui vaut : elle se voit à l'écran, en mouvement.

### Ce que la preuve a donné — `z-slider.lab.html`, 2026-07-21

Le knob, la jauge et le scrubber tournent sur `<z-slider>` **sans une ligne de JS
ajoutée**. Que du CSS posé sur `--z-slider__progress`.

- **Le knob** — le `marker` cesse de remplir une piste : il devient le **pivot** et
  tourne ; le `dot` n'est qu'un trait accroché à son extrémité, et il ne sait même pas
  qu'il tourne. Le cadran est un `conic-gradient` évidé par un masque. **La
  trigonométrie n'a pas servi.**
- **La jauge** — un knob à 180° avec `disabled`. Le pourcentage écrit par `counter()`.
- **Le scrubber** — trois tokens, zéro règle de structure.

Ce qui NE sort pas de la peau, et c'est net :

- **le geste rotatif** : on glisse encore horizontalement sur la largeur du rond.
  Utilisable, mais ce n'est pas un potentiomètre. Un vrai geste rotatif touche au JS ;
- **le range (deux poignées)** : il faut savoir laquelle on attrape. Le seul des huit
  qui coûte vraiment du JS.

**Verdict : six sur huit sortent de la peau.** Restent deux décisions — le geste
rotatif, le range. Deux, pas six.

**Le piège qui a tué le premier jet**, noté pour ne pas le repayer : écrire `top: auto`
**après** `inset: 0` remet la boîte à zéro de haut. Rien ne s'affichait, et rien ne le
disait — pas d'erreur, pas de warning, une page vide.

---

## L'idée de Christophe : annoter par composant plutôt que d'alourdir la mémoire globale

> « Plutôt que d'alourdir la mémoire globale, on fait des annotations par composant,
> que tu saches facilement où en est chacun sans tout charger. »
> — 2026-07-21

**Elle n'est pas inutile : elle est juste, et c'est déjà ce que ce fichier fait.** Mais
elle a une condition, sans laquelle elle se retourne.

### Pourquoi elle est juste

Une mémoire globale qui grossit devient une **taxe fixe** : je la relis en entier à
chaque session, même pour toucher un seul composant. Et plus elle grossit, plus j'y
cherche mal — le bruit noie le signal.

Un `z-x.lab.md` par dossier inverse la charge : l'information vit **à côté du code
qu'elle concerne**, et elle n'est lue que quand on ouvre ce dossier. C'est le même
principe que la loi de cohérence intégrale (la JSDoc vit dans la fonction), appliqué à
l'état d'avancement.

### La condition, sans laquelle ça casse

**Un index reste indispensable.** Si l'état n'existe QUE dans 155 fichiers, alors pour
savoir « où on en est » je dois les ouvrir tous les 155 — j'ai remplacé un gros fichier
par cent cinquante-cinq, et j'ai perdu.

Le bon montage est exactement celui de `MEMORY.md` :

```
.ai/00-memory/current-state.md   ← UNE ligne par composant : son état, sa date
components/z-x/z-x.lab.md        ← le détail, les pourquoi, la dette, les preuves
```

L'index dit **où regarder**. Le fichier dit **quoi**. Je charge l'index (léger, toujours),
et je n'ouvre le lab que du composant que je touche.

### La règle qui en découle

| Ça va dans `z-x.lab.md` | Ça va dans l'index |
|---|---|
| une proposition et son prix | une ligne : « z-slider — proposition capacité, à trancher » |
| une dette connue, un écart assumé | l'état : brouillon · vivant · figé |
| un piège payé une fois | rien — c'est local par nature |
| le verdict d'une preuve | la date du dernier pas |

**Ce qu'il ne faut PAS faire** : recopier le contenu du lab dans l'index. Ce qui est
écrit deux fois divergera — c'est la seule loi qui n'a jamais été prise en défaut ici.

**Statut : GARDÉ** (Christophe, 2026-07-21 — « Au fait, GARDES »). Le principe s'applique
désormais à tout composant : un `z-x.lab.md` dans son dossier, une ligne dans l'index.

*Reste en attente d'un go séparé : le renommage `--z-slider__progress` → `--z-progress`
et la bascule « capacité ». Ce sont d'autres décisions, elles n'ont pas été validées ici.*

---

## Dette connue du composant (à traiter, hors proposition)

- **L'étiquette n'affiche qu'un entier.** `counter()` n'accepte rien d'autre. « 40 % »
  ou « 12,50 € » passent par le calque `label` écrit à la main. Documenté dans
  `z-slider.doc.md`, assumé.
- **La forme courte ne porte pas de halo au clic.** Ses deux pseudos sont pris (`::before`
  = tout le dessin, `::after` = l'étiquette). Le halo n'existe qu'en forme en calques.
  Écart entre les deux formes — le seul.
- **Les graduations irrégulières** (`[part="tick"]` + `--z-tick__at`) n'existent qu'en
  forme en calques, par construction : un dégradé ne fait pas de positions arbitraires.
