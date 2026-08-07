# Les CAPTEURS — branche `jeu-memory`, session du 2026-08-07

**Le nom de la branche ne décrit plus son contenu.** Elle est née pour un jeu de memory
(l'exemple existe, il est commité) et a fini par accoucher d'une **famille d'outils** :
cinq capteurs qui répondent en nombres aux questions que le CSS ne sait pas poser seul.
La fiche porte le nom de la branche pour qu'on la retrouve ; son sujet, lui, est ailleurs.

10 pas (`734c07a` → `acfecdb`), 45 fichiers, +4395 / −85. Non fusionnée.

## Bilan — 2026-08-07

**Points forts :**

- **Une FAMILLE, pas cinq outils** — `z-pointer` · `z-scroll` · `z-inview` · `z-size` ·
  `z-drag`. Où est la souris · où en est la page · qu'est-ce qu'on voit · quelle taille
  ça fait · où la main a posé l'objet. Aucun ne peint : chacun **pose des nombres sur
  lui-même**, et l'héritage CSS les livre jusqu'au dernier enfant. Le nom « capteurs »
  est acté dans `ZOE.md`.
- **`z-contact` gagne le DEUXIÈME temps** : une recette qui déclare
  `--z-contact__release--<nom>` se tient sous le doigt et conclut au relâchement
  (`state(press)` → `state(release)`, `zoe:release`, multitouch par `pointerId`,
  garde-fou 15 s). Première recette : `charge`. Démontrée par un effet écrit par un
  AUTEUR, en CSS seul (`examples/contact-effets/`).
- **Chaque outil livré ENTIER** : `.js` avec `static api` EN/FR/ES · `.css` en
  `:where()` (la seule forme exigée) · `.doc.md` narratif · `.lab.html` vivant · inscrit
  à `zoe.css`, à l'accueil, à `ZOE.md`. Manifeste régénéré → doc, autocomplétion VSCode
  et `llms.txt` ont suivi sans une ligne de plus (38 éléments).
- **La loi « jamais une démo sans son code » énoncée par Christophe et appliquée** :
  12 pages sur 18 montrent désormais le code qui les produit, juste sous le rendu.
- **Deux dégâts silencieux trouvés et arrêtés** : Prettier réécrivait le dépôt à chaque
  sauvegarde et cassait les transtypages `/** @type */ (el)` — checkJs devenait aveugle
  sans qu'aucun test ne bronche ; et `z-manifest` écrasait `.vscode/settings.json` en
  entier, effaçant le garde-fou une heure après sa pose. Les deux corrigés.

**Décisions (le pourquoi) :**

- **Des nombres NUS, jamais des longueurs.** Un nombre se multiplie : `* 1px` une
  distance, `* 360deg` un angle, `* 100%` une part. Une longueur ne donnerait que des
  longueurs. C'est la règle du carnet couleur — poser un nombre, jamais peindre.
- **`@property <number>` pour les 30 tokens**, pour DEUX raisons dont une invisible : un
  nombre typé **s'anime** (une transition sur la variable fait traîner un calque, sans
  une image de JS), et il a une **valeur de départ** — sans elle, un `var()` non défini
  rend la déclaration invalide et efface le calque en silence.
- **Un outil pose sur LUI-MÊME.** Une seule exception, et elle se justifie :
  `z-scroll page` pose sur `:root`, parce que le défilement de la page n'appartient à
  aucun coin du document.
- **Une variable ne remonte jamais au parent** — donc la piste d'un curseur ne peut pas
  lire sa poignée. La réponse n'est PAS une exception dans l'outil : on **inverse le
  sens** (la poignée peint la barre, la piste la coupe). Une exception aurait coûté plus
  cher que la contrainte.
- **`z-inview__seen` ne redescend jamais** : une entrée en scène ne se rejoue pas, sinon
  remonter la page donne le tournis. Et `__cross` existe parce que `__ratio` **sature**
  dès que l'élément tient à l'écran — il fallait un nombre qui continue de monter.
- **Pointer Events, PAS l'API `draggable`/`dragstart`** (question de Christophe, réponse
  écrite dans la doc car elle se reposera) : le natif sert à TRANSFÉRER une donnée, pas à
  DÉPLACER un objet. Il promène une photo bitmap ni stylable ni animable (tout le
  principe de Zoé tombe), ne marche pas au doigt, ne donne pas de position continue, et
  n'offre aucun chemin au clavier.
- **L'état ET le nombre, pas l'un OU l'autre** — `z-drag:state(held)` (natif,
  `CustomStateSet`) à côté de `--z-drag__held`. Ce ne sont pas deux formes pour la même
  chose : un sélecteur **bascule** (un curseur, un z-index, qui n'ont pas d'entre-deux),
  un nombre **s'interpole**. Aucun des deux ne couvre l'autre.
- **Le clavier n'est pas une option** : un objet borné sur un axe EST un curseur → rôle
  `slider` + valeur tenue à jour ; un objet libre en 2D n'a AUCUN équivalent ARIA et n'en
  reçoit donc pas (surtout pas `application`, qui couperait le lecteur d'écran).
- **Le code d'une démo se GÉNÈRE quand c'est possible** (`data-code` + `examples/code.js`
  lit le DOM vivant) plutôt que de s'écrire à la main : un extrait écrit peut devenir
  faux, celui-là ne peut pas mentir.
- **Honnêteté envers le dev lead, écrite dans les docs** : `z-scroll` recoupe en partie
  `animation-timeline` ; `z-size` ne remplace pas les requêtes de conteneur (le palier
  reste à elles, le nombre qui glisse est à nous). Dire où le natif fait mieux vaut mieux
  que de prétendre le remplacer.

**Ce qui reste / limites :**

- **RIEN N'A ÉTÉ JUGÉ À L'ŒIL.** Les pages se chargent, le JS est vérifié, le manifeste
  voit 38 éléments — mais le GESTE (l'inertie du drag, le tempo d'inview, la vitesse du
  parallaxe) n'a été manipulé par personne. C'est la limite principale de cette branche.
- **8 pages de démo** sans leur code : `z-button.lab` · `z-slider.lab` · `memory` ·
  `nerf.lab` · `palette-vivante` · `theme-builder` · `trois-variables` · `hightech.demo`.
- **Aucun test automatisé** sur les capteurs (la logique non triviale — le cadre de
  `z-drag`, la traversée de `z-inview` — mériterait `node --test`).
- `skins/couleur.lab.md` : l'échelle à quatorze crans est **posée, pas tranchée** — elle
  contredit le §2 et attend un arbitrage.
- Deux mises de côté à jeter quand Christophe le dira (`git stash list`) : le churn du
  formateur dans zoé, et le même dans l'archive.
- `z-drag` émet `zoe:drop` à **chaque** flèche du clavier — voulu (chaque pas est une
  pose), mais bavard si quelqu'un enregistre à chaque événement.

**Verdict : à garder** — sous réserve de l'œil de Christophe sur le geste. La branche est
cohérente, tout est commité, rien n'est cassé ; ce qui manque n'est pas du travail, c'est
un jugement.
