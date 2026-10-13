# Journal de collaboration — Zoé

## Historique

## Session du 2026-10-13 — LA FINITION (carte blanche)

**Impact (1-5) :** 5

**Fait :**
- Branche `finition`, fusionnée dans `master`. 48 éléments (2 core · 10 tools · 36 composants),
  65 pages, `npm run check` vert, 27 tests, 72 démos × peaux sans erreur console.
- **IA/MCP** : `docs/GRAMMAR.md`, `llms.txt` + `llms-full.txt` à la racine, `dist/zoe.json`,
  serveur MCP `scripts/z-mcp` (7 outils, `.mcp.json`), `tools/z-lint` (la console qui corrige),
  `example` + `members` dans chaque `static api`.
- **7 composants neufs** : z-field, z-checkbox-group, z-pagination, z-dialog, z-drawer,
  z-popover, z-menu. **24 docs + démos** écrites pour les composants orphelins, 14 bugs corrigés.
- **Socle** : fix de la capture du pointeur (un `<button>` natif dans un z-element reçoit son click).
- **Doc pro** : viewer sur zoe.json, accueil généré, intro réécrite, vouvoiement, zéro prénom,
  README, CHANGELOG, package.json, zoe.js. Fiche : `.claude/concepts/2026-10-13--finition-mcp-doc-pro.md`.

**En cours :**
- Rien. Tout est commité sur `master` (non poussé).

**Décisions :**
- Le natif reste natif : z-field enveloppe `<input>`, z-dialog enveloppe `<dialog>`, z-popover
  s'appuie sur l'API Popover, z-pagination laisse l'auteur écrire ses liens.
- Une source (le code) → toutes les sorties ; le rouge (`npm run check`) décide.

**Prochain pas :**
- **L'œil de Christophe sur le mouvement** des sorties animées neuves (tag, alert, dialog,
  drawer, popover, menu). Trancher les écarts de nommage tokens ↔ rôles et la piste trop
  pâle de HighTech. Décider la licence.

## Session du 2026-08-07 — les CAPTEURS

**Impact (1-5) :** 5

**Fait :**
- 10 commits sur `jeu-memory` (`734c07a`..`acfecdb`), 45 fichiers, +4395/−85. **Cinq
  capteurs** livrés entiers (`.js` + `.css` + `.doc.md` + `.lab.html`, inscrits partout,
  manifeste régénéré) : `z-pointer` · `z-scroll` · `z-inview` · `z-size` · `z-drag`.
- **`z-contact` gagne le deuxième temps** (se tient sous le doigt, conclut au
  relâchement) avec sa recette `charge` et un effet écrit par un AUTEUR en CSS seul.
- La **loi « jamais une démo sans son code »** énoncée par Christophe : 12 pages sur 18
  la respectent désormais.
- Deux dégâts silencieux arrêtés : **Prettier** cassait les transtypages JSDoc à chaque
  sauvegarde ; **z-manifest** écrasait `.vscode/settings.json` en entier.

**En cours :**
- Tout est commité sur `jeu-memory`. **Non fusionnée** — elle attend l'œil de Christophe.

**Décisions :**
- **Les capteurs sont une FAMILLE** : ils ne peignent rien, ils posent des nombres NUS
  (un nombre se multiplie ; une longueur ne donne que des longueurs) sur eux-mêmes, et
  l'héritage CSS les livre. Une seule exception justifiée : `z-scroll page` → `:root`.
- **`@property <number>`** partout, pour deux raisons dont une invisible : un nombre typé
  s'anime, et sa valeur de départ tue le `var()` invalide qui efface un calque en silence.
- **Pointer Events, pas `draggable`/`dragstart`** : le natif TRANSFÈRE une donnée, il ne
  DÉPLACE pas un objet (photo bitmap, rien au doigt, pas de position continue, pas de
  clavier). Réponse écrite dans la doc — la question se reposera.
- **L'état ET le nombre** (`z-drag:state(held)` + `--z-drag__held`) : un sélecteur
  bascule, un nombre s'interpole. Aucun ne couvre l'autre.
- **Une variable ne remonte pas au parent** → on inverse le sens (la poignée peint la
  barre) plutôt que d'inventer une exception dans l'outil.

**Prochain pas :**
- **Le geste, à l'œil** — rien n'a été manipulé par personne. Puis les 8 pages de démo
  restantes, et des `node --test` sur le cadre de `z-drag` et la traversée de `z-inview`.

## Session du 2026-07-23 → 24

**Impact (1-5) :** 5

**Fait :**
- 5 commits sur master (`243fc3c`..`bb8a4f6`). **Le canal porté dans zoé** (outil autonome
  `channel=`, `tune()` bidirectionnel, fiche vivante dans le viewer). **La doc à source
  unique** : le narratif du `.doc.md` s'affiche enfin (mini-Markdown maison), doublons de
  tables retirés. **`state`/`when` fusionnés** en un attribut `state="armed: press +2s,
  glow: over, busy"` (vérifié 7/7). Fix z-channel qui cassait le manifeste.
- **Ma mémoire refactorisée** (~/.claude) : noyau « COMMENT J'AGIS » + déclencheur « humain »,
  format `FAIS/JAMAIS/À LA PLACE`, la fiche « lis l'intention pas la forme ».

**En cours :**
- Rien, tout est commité et sur master.

**Décisions :**
- `state`/`when` fusionnent (deux formes perdaient Christophe) ; state/when/channel restent
  distincts (l'état ne fuit pas, le canal traverse — opposés complémentaires).
- Doc : une source par info (narratif au `.doc.md`, structuré au `static api`).
- `::part()` écarté — testé, il ne matche pas le light DOM ; `[part=background]` est le
  vrai sélecteur humain, et il marche déjà.

**Prochain pas :**
- Migrer les tokens z-checkbox/z-radio dans leur `static api` (cohérence). Faire juger le
  mouvement `every` à Christophe. Éventuellement reformuler la doc autour de `[part=]`.

## Session du 2026-07-22 → 23

**Impact (1-5) :** 5

**Fait :**
- 18 commits sur master. La doc ouvre sur l'ESSAI (démo « cinq nombres » live), typo
  propre, table `Valeurs`/`Rôle` alignée (rowspan), démo z-contact à réglages temps réel.
- **Parité attribut/token** sur z-contact (size/width/duration/color en attribut OU en
  CSS) + warn sur attribut inconnu. **`state` × `when`** sur z-element (déclencheurs
  déclaratifs). Peau Claude dotée de sa signature `ink`.
- **LE modèle des effets tranché** : déclarés par la peau (`@property --z-contact__fx--*`),
  découverts (récursif dans les `@import`), scopés `[fx=<nom>]`. HighTech → implode/
  explode/morph ; Claude → ink. Sélecteur + doc dynamiques, changent avec la peau.

**En cours :**
- Rien de non commité. Rien n'est poussé. Tout sur master.

**Décisions :**
- **L'effet appartient à la peau, DÉCLARÉ et DÉCOUVERT, pas figé par attribut** (`fx` =
  coupe-circuit). On ne connaît pas d'avance ce qu'un user déclare → on le découvre.
- **Zigzag assumé** (scope → lien unique → déclaré/découvert/scopé) : le scope par nom
  réconcilie « coexistent sans se mélanger » et « une peau ne charge que les siens ».
- **Voix de la doc** : parler au besoin (pas à la plomberie), vouvoyer, uniformité.

**Prochain pas :**
- Réécrire `z-contact.doc.md` pour EXPLIQUER le modèle déclaré/découvert (« la doc à
  revoir »). Pousser l'encre « de OUF » (goo SVG en vrai navigateur, ou hook JS).

## Session du 2026-07-20 → 21

**Impact (1-5) :** 5

**Fait :**
- 17 commits, +3341/−571. L'effet du clic descend dans les PEAUX (catalogue
  `effects/`), les variants `size · tone · width` arrivent sur z-element en CSS pur,
  z-cursor est sauvé de l'ancien repo (une balise, deux effets, une queue par peau),
  le pupitre génère tous les paramètres d'un composant depuis son `static api`.
- L'atelier existe : `index.html`, `ZOE.cmd` en double-clic, garde-fou `file://`.
- `busy` tué, `exit` branché, doc z-element à deux étages + « lire un sélecteur Zoé ».

**En cours :**
- Rien, tout est commité. Rien n'est poussé.

**Décisions :**
- **Un effet de clic est une SIGNATURE, pas de la plomberie** : il appartient à la peau,
  jamais à la page.
- **Pas de Shadow DOM, pas de base `z-ui`** : les variables CSS traversent la capsule
  (donc elle ne sert pas), et la frontière est le dossier (components/ vs tools/).
- **Ma méthode recadrée** (le vrai résultat) : je gravais dans l'heure, donc chaque
  changement d'avis devenait un défaire/refaire. « Décider seul » ≠ « graver seul ».
- **Pas de plafond** : « ça couvre 90 % » est le réflexe qui fait que tous les
  frameworks se ressemblent. Les sélecteurs (`:state()` + `[part=]`) deviennent la voie
  PRINCIPALE — un token est une liste blanche, donc un mur ; un sélecteur, non.
- **L'échelle de complexité** (sa vision) : HTML pour tous, CSS pour aller plus loin,
  JS jamais exigé de l'auteur.

**Prochain pas :**
- Les peaux habillent le HTML nu (522 lignes de style privé à faire tomber), puis
  z-button entièrement en tokens + `:where()` pour que la règle de l'auteur gagne.

## Session du 2026-07-19

**Impact (1-5) :** 4

**Fait :**
- Pilotage auto (.claude) + 3 commandes globales /salut /fin /nettoie

**En cours :**
- Rien, tout est commité

**Décisions :**
- Auto (ETAT.md) pour le brut, JOURNAL.md pour les décisions — les deux injectés au démarrage

**Prochain pas :**
- Reprendre les composants z-* dans components/
