# Journal de collaboration — Zoé

## Historique

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
