# « PEINT, PAS POSÉ » — branche `peint-pas-pose`, session du 2026-10-14

**Mandat (Christophe) :** « Résous-le. La seule chose qu'on garde de l'esprit Flash,
c'est une hit area, j'ai encore eu le problème avec des petits boutons sur tel. Invente
un principe, break the games. Sois libre. »

**Le problème qu'on résout :** la loi des calques du 2026-07-20 donnait DEUX formes à
chaque composant (courte / en calques). Prix mesuré : chaque état écrit deux fois dans
17 CSS, un seul calque ajouté (une icône) qui faisait basculer la forme courte, et
personne ne disait laquelle choisir. Le principe du calque est simple ; son prix ne
l'était pas.

## Le principe

**UNE forme. L'auteur écrit le contenu, Zoé PEINT les pièces, et le doigt a sa place.**

```
l'hôte     la boîte, la typo, LE TEXTE
::before   LA pièce qui bouge seule : `background` (bouton) OU `marker` (case, radio)
::after    `contact` : la zone du doigt, ≥ --z-contact-zone (44 px), posée par le SOCLE
contenu    `icon`, et toute pièce de plus : un <z-layer part="…"> écrit par l'auteur,
           en flux, qui ne change jamais la forme
```

Trois lois :

1. **Rien à écrire.** Un élément est un seul nœud ; ses pièces sont ses pseudo-éléments.
   Plus de `:has(z-layer)`, plus de mode. Un `z-layer` ajouté est du contenu, jamais un
   basculement.
2. **La grammaire ne bouge pas.** `--z-checkbox--marker__size` nomme une pièce peinte ;
   une peau ne voit pas la différence. L'anatomie se déclare dans `static api.layers`
   avec le `pseudo` de chaque pièce peinte (`::before` / `::after`) ; sans pseudo, c'est
   du contenu.
3. **Le contact est universel et garanti.** Tout élément interactif reçoit du socle un
   `::after` invisible, centré, d'au moins `--z-contact-zone` (token de peau : HighTech
   44 px, Claude 48 px), qui déborde si le dessin est plus petit. z-element juge « lâché
   dedans » sur cette zone (`elementsFromPoint`), pas sur la boîte visible. La liste des
   éléments qui la reçoivent est DÉDUITE de l'API (une pièce `contact` en `::after`) et
   régénérée par z-manifest (marqueur `zoe:contact` dans z-element.css).

Ce que ça coûte, à connaître : chaque composant n'a qu'UN `::before` pour sa pièce
mobile (bouton = surface, case = marker). Le halo du clic, qui vivait sur un `::after`
dédié, devient le preset `halo` de z-motion : l'ombre de la pièce grandit et se fond.
Même signature, zéro pseudo de plus. Deux petites cibles plus proches que la zone se
chevauchent : la suivante dans le DOM gagne la bande commune. Ce n'est pas la zone qu'il
faut réduire, c'est l'écart : c'est le bug qu'elle rend visible.

## Ce qui a été livré (l'essai : socle + 2 composants canoniques)

- **Socle** : `z-element.css` (section 0.5.5, le contact), `z-element.js` (« dedans » par
  `elementsFromPoint`, token `--z-contact-zone` dans l'API), `z-motion.css` (preset
  `halo`), les deux peaux (`--z-contact-zone`).
- **z-manifest** : `pseudo` dans les calques normalisés, `contactTags` +
  `regenerateContactList` (testés), llms.txt dit « painted / content ».
- **z-button** et **z-checkbox** : CSS réécrits en une forme (le fond / la case en
  `::before`, le contact en `::after`), `static api.layers` avec `pseudo`, démos
  (section « le fond est une pièce », section « sur téléphone » avec la zone visible et
  réglable), docs au patron utiliser · peindre · brancher · sous le capot.
- **La loi** : `ZOE.md` (loi des pièces, remplace la loi des calques), `GRAMMAR.md`
  (§2, §5, §6, §11), `z-layer` (doc + en-tête : contenu seulement).
- **Viewer** : la colonne des pièces affiche le pseudo d'une pièce peinte.

## Ce qui reste (l'extension, avec le « garde »)

- Les **34 autres composants** : retirer `:has(z-layer)` et la forme en calques (15 CSS),
  déclarer `pseudo` et `contact` dans leur API (z-radio, z-switch, z-slider, z-tabs,
  z-segmented, z-rating, z-pagination, z-stepper, z-menu, z-tag, z-alert, z-disclosure…).
  Le contact de z-alert se pose sur la croix, celui de z-slider sur le curseur.
- Les **18 démos** qui montrent encore la forme en calques.
- `core/z-layer/z-layer.css` : ne garder que le placement du contenu (`icon`, `label`) ;
  retirer background/marker/ring/dot/contact. `z-layer.anatomie.txt`.
- La mémoire et le journal de l'ancienne loi : laissés en historique, jamais réécrits.

## Preuve

- `npm run check` vert, `npm test` vert (28 tests, dont la liste du contact).
- Démo z-button section 6 : trois boutons `xs` (24 px), zone visible, réglage de
  `--z-contact-zone` en direct ; un tap à 10 px du bouton le déclenche.
- Démo z-checkbox section 2 : même preuve sur une case de 15 px.
- Capture CDP : un `click` dispatché à 8 px sous un bouton `xs` arrive au bouton.
