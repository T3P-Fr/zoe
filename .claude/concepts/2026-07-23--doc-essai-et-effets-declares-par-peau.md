# La doc comme essai + les effets déclarés par la peau — session du 2026-07-22 → 23

Pas de branche de concept : tout s'est fait sur `master`, en 18 commits. Cette fiche
existe pour que le BILAN ne se perde pas. La session a commencé par une refonte de la
doc (« elle ne rend pas hommage au concept ») et a fini par trancher, sous l'insistance
de Christophe, le vrai modèle des effets de clic : **déclarés par la peau, découverts.**

## Bilan — 2026-07-23

**Points forts :**
- **La doc ouvre sur l'ESSAI, plus sur la plomberie.** La porte incruste la démo « cinq
  nombres » en live (« ne me dis pas qu'elle roule, fais-moi l'essai »). Typo propre
  (fini le monospace de terminal imposé par la peau). Table des attributs = `Valeurs`
  concrètes au lieu d'un `Type` muet, chaque valeur sur SA ligne alignée avec son rôle
  (rowspan), un seul format partout (uniformité).
- **Parité attribut/token sur z-contact** : `size · width · duration · color` se règlent
  au CHOIX en attribut (`<z-contact duration="2s">`) OU en CSS — l'attribut POSE le
  token. Un attribut inconnu (`wobble`) n'est jamais bloqué mais Zoé prévient en console
  (le danger silencieux meurt). Démo à réglages temps réel + bascule attribut/CSS.
- **`state` × `when` sur z-element** : déclencheurs déclaratifs. `state="coucou"` lève un
  état par son nom — avec ou sans règle `:state()`, quel que soit l'ordre. `when="press
  +2s"` le conditionne (geste + délai). Vérifié.
- **LE gros — les effets de clic DÉCLARÉS PAR LA PEAU.** Chaque recette pose
  `@property --z-contact__fx--<nom>` (découvrable comme un état) et SCOPE ses règles par
  `[fx="<nom>"]` → plusieurs coexistent sans se mélanger. Une peau n'importe que les
  siennes : HighTech → implode/explode/morph ; Claude → ink. z-contact DÉCOUVRE les
  `--z-contact__fx--*` chargés (récursif dans les `@import`) ; le sélecteur de la démo et
  le tableau se remplissent tout seuls et changent avec la peau. Prouvé à l'écran :
  HighTech joue `explode`, Claude ne le joue PAS (non chargé).
- **Claude a sa signature `ink`** (encre chaude), écrite sans toucher au moteur.

**Décisions — le pourquoi :**
- **L'effet appartient à la peau, DÉCLARÉ et DÉCOUVERT — pas figé par un attribut.** On
  ne connaît pas d'avance ce qu'un user déclarera : on le découvre (comme `--z-state__`).
  `fx` est ramené à son seul rôle : coupe-circuit (`none`). La page ne choisit jamais
  l'effet.
- **Chemin en zigzag, assumé.** J'ai d'abord proposé le scope (coexistence), Christophe a
  dit « qu'ils s'entretuent, pas qu'ils s'empilent » → j'ai fait un lien unique échangé →
  il a précisé le vrai modèle (`@property` par peau, découverte, scope par nom). Le scope
  par nom réconcilie tout : ils coexistent SANS se mélanger, et une peau ne charge que les
  siens. Sa méthode est la bonne : tester/retester avant de graver.
- **La VOIX de la doc** : parler au BESOIN, pas à la plomberie interne (« c'est quand tu
  parles comme ça que ça hic ! ») ; vouvoiement chaleureux, pas le tutoiement copain ;
  uniformité (« le cerveau humain est fainéant »).

**Ce qui reste / limites :**
- **L'encre « de OUF »** : la vraie encre liquide (métaballe via filtre SVG « goo » en
  data-URI) casse en Chrome headless (référence de filtre invalide → élément invisible) ;
  repli fiable en dégradés + volée de box-shadow. À pousser dans un vrai navigateur ou via
  le hook `Zoe.contact.effect()`.
- **La doc narrative à revoir** (dit par Christophe) : `z-contact.doc.md` doit EXPLIQUER le
  modèle déclaré/découvert, et le tableau des props doit se lire comme « ce que la peau
  déclare ».
- Rien n'est encore en mémoire longue (« garde » pas donné).

**Verdict :** **à garder** (déjà sur master) · **à continuer** (doc narrative + encre de OUF).
