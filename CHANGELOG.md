# Changelog

Les évolutions notables de Zoé. Versionnage SemVer (`MAJOR.MINOR.PATCH`).

## [0.9.0] — 2026-10-13

La version « utilisable » : chaque élément est documenté, démontré, et lisible par une IA.

### Ajouté
- **Sept composants** : `z-field` (le champ natif habillé et validé), `z-checkbox-group`,
  `z-pagination` (SEO-correcte : l'auteur écrit les liens), `z-dialog` et `z-drawer` (sur le
  `<dialog>` natif), `z-popover` et `z-menu` (sur l'API Popover native).
- **`z-lint`** — la console qui corrige : balise, attribut, état, pièce ou token mal écrit →
  le nom valide le plus proche. Règles pures partagées avec le serveur MCP.
- **Serveur MCP** (`scripts/z-mcp`, `.mcp.json`) : `zoe_grammar`, `zoe_list`, `zoe_get`,
  `zoe_example`, `zoe_search`, `zoe_skins`, `zoe_lint`, plus les ressources (grammaire,
  llms.txt, index, manifeste, chaque documentation, chaque peau). Zéro dépendance.
- **`docs/GRAMMAR.md`** — la grammaire complète, écrite une fois ; embarquée dans `llms.txt`.
- **`llms.txt` · `llms-full.txt`** à la racine (convention llmstxt.org).
- **`dist/zoe.json`** — l'index complet multilingue, source de la doc, de l'accueil et du MCP.
- **`zoe.js`** — le point d'entrée JS, pendant de `zoe.css`.
- `package.json` (`dev · manifest · check · test · mcp · build`), `.gitattributes` (LF partout),
  `README.md`, `CHANGELOG.md`.
- **`scripts/check.mjs`** — le contrôle de cohérence : api complète, dossier complet, listes
  alignées, liens morts, dist à jour. Tests `node --test` du générateur, des règles de lint
  et du serveur.
- Chaque `static api` porte son **exemple** canonique et ses **membres** JS (trilingues).
- Documentation et page de démo pour les **24 composants** qui n'en avaient pas ; documentation
  de `z-cursor`.

### Changé
- `z-manifest` réécrit en bibliothèque pure + commande : `cssParts`, `cssStates`, `members`
  dans le manifeste standard ; valeurs d'attributs et variants dans l'autocomplétion VSCode ;
  tokens du pacte lus dans le CSS ; listes de balises de `z-element.css` et table du README
  régénérées ; `--strict`.
- Le viewer de doc lit `dist/zoe.json` : exemple rendu en vrai avec son code, calques, tokens,
  API JS ; `z-channel`, `z-lint` et `z-motion` entrent dans le manifeste sans cas particulier.
- L'accueil (`index.html`) se génère depuis l'index : chaque élément y a sa carte.
- `docs/intro.html` décrit le modèle réel (calques écrits par l'auteur, pacte, états, peaux).
- Documentation publique au **vouvoiement**, sans référence personnelle ni « à venir ».

### Retiré
- `Zoe.js` (le « nerf », un modèle non retenu) quitte la racine : `examples/nerf.js`, marqué essai.
- `dist/llms.txt` (remplacé par `llms.txt` à la racine), les dossiers vides `tools/z-grid` et
  `tools/z-stager`, et leurs mentions dans le manifeste.
