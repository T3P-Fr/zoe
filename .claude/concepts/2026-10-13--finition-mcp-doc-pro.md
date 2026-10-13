# La FINITION — branche `finition`, session du 2026-10-13

**Mandat :** carte blanche (« revois l'intégralité, finis-le, optimise pour les usages
IA/MCP, crée autant de composants que nécessaire, doc professionnelle »). Aucune question
posée en retour : les décisions sont ici.

## Ce qui a été livré

**Le socle « une source, toutes les sorties »**
- `scripts/z-manifest` réécrit (lib pure + commande + tests) : `dist/zoe.json` (index
  complet, trilingue : attributs, événements, états, calques, variables, tokens lus dans
  le CSS, membres JS, exemple, chemins), CEM standard, autocomplétion VSCode, `llms.txt`
  et `llms-full.txt` à la racine, listes de balises de `z-element.css`, table du README.
- Chaque `static api` porte `example` (HTML canonique) et `members` (API JS).
- `docs/GRAMMAR.md` : la grammaire écrite une fois, embarquée dans `llms.txt`.
- `scripts/z-mcp` : serveur MCP zéro dépendance (`zoe_grammar · zoe_list · zoe_get ·
  zoe_example · zoe_search · zoe_skins · zoe_lint`), `.mcp.json`, tests réels sur stdio.
- `tools/z-lint` : la console qui corrige (règles pures partagées avec le MCP, lab vivant).
- `scripts/check.mjs` : le rouge décide. `npm test` : 27 tests.
- `package.json`, `zoe.js`, `.gitattributes` (LF), `README.md`, `CHANGELOG.md`.

**Les composants** — 29 → 36 : `z-field`, `z-checkbox-group`, `z-pagination`,
`z-dialog`, `z-drawer`, `z-popover`, `z-menu`. Les 24 composants sans doc ni démo en
ont désormais une ; 14 bugs réels corrigés au passage (z-tabs en boucle sur `value`,
z-tag/z-alert qui partaient sec, z-spinner invisible en `soft`, z-switch en calques,
z-rating/z-divider/z-stepper avec des `:state()` parasites, z-disclosure `disabled`…).

**Le socle** — `z-element` ne capture plus le pointeur quand l'appui vise un contrôle
natif de l'auteur : avant, un `<button>` dans un `<z-element>` ne recevait jamais son
`click` (Chrome 154, Pointer Events niveau 3). Prouvé aux vrais clics (CDP), releaseOut
conservé.

**La doc** — viewer réécrit sur `zoe.json` (exemple rendu + code, calques, tokens, API JS),
accueil généré, `intro.html` sur le vrai modèle, vouvoiement partout, zéro prénom, zéro
« à venir ». Le « nerf » (Zoe.js) est devenu `examples/nerf.js`, essai non retenu.

## Décisions

- **z-field enveloppe le natif**, ne le remplace jamais (formulaire, clavier, validation,
  messages traduits : le navigateur). `z-dialog` sur `<dialog>` natif, `z-popover` sur
  l'API Popover : Web Standards First, et l'accessibilité vient du natif.
- **z-pagination SEO-correcte** : l'auteur écrit les `<a href>`, Zoé pose le sens, la
  fenêtre et le clavier. Rien n'est généré.
- **Les tokens globaux d'une peau ont le droit de porter un préfixe de composant**
  (`--z-contact-fx`) : z-lint les accepte avant de juger la grammaire.
- **Les durées des boîtes = `--z-dur-enter/exit`**, pas `open/close` : `play()` lit
  `--z-dur-<mot>`, une seule horloge.
- `examples/code.js` : liste `AUTO` élargie (aria-*, ids générés, `style` à variables) —
  le code montré est le HTML tapé.

## Ce qui reste / limites

- **Le mouvement n'a été jugé par personne** (loi : un screenshot ne prouve rien d'une
  animation). Les sorties animées neuves (z-tag, z-alert, z-dialog, z-drawer, z-popover)
  sont à voir à l'œil.
- Écarts de nommage tokens ↔ rôles laissés tels quels (z-spinner `ring`, z-switch
  `track/thumb`, z-meter `track/fill`) : une décision de pacte, pas une correction.
- `z-meter` ne reproduit pas exactement la sémantique `<meter>` natif (documenté).
- HighTech : `--z-surface-sunken` ≈ `--z-page` → pistes de jauges quasi invisibles ; à
  trancher côté peau (loi des peaux : pas touché).
- `z-card`/`z-code` en taille absolue (`--z-font-size`) : `size` d'un conteneur ne les
  fait pas grandir.
- Licence non déclarée dans `package.json` (à décider).

**Verdict : à garder, fusionnée dans `master`.** Le dépôt est utilisable : `npm run dev`,
l'accueil, la doc, le MCP.
