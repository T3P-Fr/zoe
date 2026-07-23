# Le canal dans zoé + la doc à source unique + la fusion `state`/`when` — session du 2026-07-23 → 24

Pas de branche de concept : tout s'est fait sur `master`, en 5 commits (`243fc3c`..`bb8a4f6`).
Cette fiche existe pour que le BILAN ne se perde pas. La session a porté le **canal** dans le
nouveau repo, transformé la **doc** en source unique (le narratif s'affiche enfin), et **fusionné
`state`/`when`** en un seul attribut — la forme que Christophe a validée « limpide ».

## Bilan — 2026-07-24

**Points forts :**
- **Le canal (`z-channel`) est dans zoé**, porté depuis la source éprouvée (jamais réécrit de
  mémoire). Outil autonome : `channel="x y"` sur la BALISE pose `--z-channel-{nom}`, le CSS pilote,
  multi-canal gratuit, `tune()` bidirectionnel. Il marche sur du HTML nu. Essai vivant vérifié à
  l'écran (`tools/z-channel/z-channel.lab.html`).
- **La doc a une SOURCE UNIQUE.** Le narratif du `.doc.md` — jusqu'ici écrit à la main puis JAMAIS
  affiché — se rend maintenant dans le viewer (mini-Markdown maison, zéro dépendance). Le structuré
  reste au `static api`. Tables en doublon retirées (z-contact, z-slider ; radio-group complété d'un
  token). Fini d'écrire la doc deux fois.
- **`state` et `when` fusionnent en un attribut** : `state="armed: press +2s, glow: over, busy"` — la
  virgule sépare, `:` introduit la condition (optionnelle), le sujet (l'état) toujours en tête. Deux
  familles : GESTE (`press +2s`) et HORLOGE (`every 2s` = un pouls). Vérifié 7/7
  (`core/z-element/z-element.states.lab.html`). Le `when` séparé est mort.
- **Un tool-attribut (sans balise) a sa fiche dans le viewer** — z-channel documenté comme les
  composants ; mécanisme réutilisable pour z-motion.
- **Bug attrapé** : z-channel s'armait à l'import et cassait le générateur de manifeste (faux DOM) —
  durci, manifeste + llms.txt régénérés.

**Décisions (le pourquoi) :**
- **Fusion `state`/`when`** : deux attributs perdaient Christophe (la charge de mémorisation humaine
  = mon taux d'hallucination). Une seule forme, sujet en tête, cohérente avec `--z-…__prop`.
- **`state` / `when` / `channel` restent distincts** : l'état est LOCAL (ne fuit pas — le geste
  central) ; le canal TRAVERSE (fuit exprès, par le CSS jamais par le JS). Des opposés
  complémentaires — les fusionner détruirait le geste central. `when` = la charnière (traduit un fait
  local en un autre).
- **Un canal transporte une VALEUR, pas un état** — sinon on rouvre la fuite qu'on a fermée.
- **Narratif (`.doc.md`) et structuré (`static api`) = une source chacun, le viewer assemble** —
  cohérent avec « le POURQUOI s'écrit dans le composant et REMONTE dans la doc ».
- **`::part()` NON adopté** : testé sous Chromium, il ne matche PAS le light DOM (la spec le réserve
  au Shadow DOM). Le sélecteur humain que Christophe visait — `[part=background]` — marche déjà
  partout, sans capsule. `::part` était un faux ami.

**Ce qui reste / limites :**
- z-checkbox / z-radio documentent encore leurs tokens dans le `.doc.md` (pas dans le `static api`) —
  pas de doublon, mais incohérent avec radio-group ; à migrer pour la cohérence.
- `every` (horloge) : implémenté (pouls via `flash`), à confirmer par l'ŒIL de Christophe sur le
  mouvement réel.
- Reformuler la page z-element pour que `[part=background]` saute aux yeux comme LE sélecteur humain
  (proposé, en attente de go).
- Switch doc pinceau/code : concept gardé, chantier NON ouvert.

**Verdict :** à garder — c'est déjà sur `master`. Le socle des états est désormais **une seule
forme**, et la doc ne s'écrit plus en double.
