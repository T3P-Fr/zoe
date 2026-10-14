# ROADMAP — ce qu'il reste à faire

> **Audit du 2026-10-13 (Claude, lead tech).** Verdict : l'idée est déjà révolutionnaire.
> Ce qui manque, c'est la **preuve** et la **portée**. Rien ne démontre encore que Zoé
> tient entre des mains qui ne sont pas les nôtres. Cette page est la liste, dans
> l'ordre. On la coche **au commit**, jamais avant.

**Qui fait quoi** — 👁 Christophe (l'œil, la décision) · 🤖 Claude (l'exécution, la
preuve). **Une case se coche quand sa preuve existe** (un test vert, une page qui
s'ouvre, un chiffre), pas quand le code est écrit.

---

## 1 · Prouver que ça tient — EN PREMIER

- [ ] **Tests en navigateur du socle et des composants.** 🤖
  Aujourd'hui : 27 tests, tous sur l'outillage (manifeste, lint, MCP). Socle et
  36 composants : zéro test de comportement.
  **Fini quand** : `npm test` lance un navigateur headless (1) et vérifie, par
  composant : les états posés, le clavier, le formulaire, le swap de peau sans erreur
  console. Ordre : z-element complet · z-button · z-checkbox · z-field · z-dialog, puis un
  par composant.

- [ ] **Trois bugs de socle** (`core/z-element/z-element.js`). 🤖
  - Chaque z-element pose un écouteur `keydown` sur `window` à la connexion, jamais
    retiré : mille boutons = mille écouteurs. → un seul écouteur au niveau du module.
  - Les états déclarés en CSS (`@property --z-state__x`) sont lus une fois, au premier
    appel, puis figés : une feuille chargée après = états invisibles, en silence. → Claude
    propose dans `z-element.lab.md`, Christophe tranche. 👁
  - `CSSPropertyRule` sans garde : un navigateur qui ne l'a pas plante la définition de
    TOUS les composants. → une garde, et l'élément se dégrade en HTML nu.
  **Fini quand** : pour chacun, un test rouge avant, vert après.

- [ ] **Robustesse de base.** 🤖
  - `:not(:defined)` : avant le JS, les éléments s'affichent nus (FOUC). Une règle dans
    `core/z-element.css`.
  - `prefers-reduced-motion` : présent dans 4 fichiers sur 50, pour une bibliothèque
    dont le pitch est « tout bouge ». → une règle globale dans `tools/z-motion`.
    👁 **à trancher** : zéro mouvement, ou mouvement court ?
  - Propriétés logiques (droite-à-gauche) : 4 composants sur 36. → les 36.
  **Fini quand** : la planche de chaque peau, en `dir="rtl"` et en reduced-motion, ne
  casse rien à l'écran de Christophe. 👁

## 2 · Livrer — rendre Zoé prenable par quelqu'un d'autre

- [ ] **Licence.** 👁 décide (2). 🤖 pose `LICENSE` + le champ dans `package.json`.
- [ ] **Bundle.** 🤖 `npm run build` sort `dist/zoe.min.css` + `dist/zoe.min.js`.
  Aujourd'hui une page charge 45 `@import` en cascade et 570 Ko de JS brut. Le confort
  auteur (zéro build, modules lisibles) ne change pas : le bundle est une sortie de plus
  du manifeste.
  **Fini quand** : une page avec les 2 fichiers minifiés = identique à l'écran, 2 requêtes
  au lieu de 50.
- [ ] **npm + CDN.** 👁 le nom (vérifier que `zoe-components` est libre) et le go.
  🤖 `private: false`, publication, le README dit `npm i` et l'URL CDN.
- [ ] **CI.** 🤖 `check` + `test` à chaque commit (3). **Fini quand** : un badge vert.
- [ ] **La doc en ligne.** 👁 choisit l'hébergement. 🤖 déploie `docs/` + `index.html`.
- [ ] **Mode sombre dans les deux peaux.** ⛔ loi des peaux : depuis la source, sinon
  on demande. 🤖 propose, 👁 valide à l'écran.

## 3 · Montrer — le pourquoi en dix secondes

- [ ] **Le hero de `index.html`.** Aujourd'hui : une grille de 48 cartes. Il faut UN
  geste : le même HTML, deux peaux, un slider sur un canal, l'onde au clic, et le code
  juste à côté. 🤖 propose **un** essai (jamais six). 👁 tranche.
- [ ] **Le swap sur un vrai site.** Une page existante (blog, boutique) habillée par la
  couche classless, sans toucher son HTML. 👁 choisit le site. 🤖 fait.
  C'est la démo qui vaut plus que les 36 réunies.
- [ ] **Le bench IA.** Le pari « une IA déduit la grammaire au lieu de mémoriser » se
  mesure : N prompts → N pages → `z-lint` à zéro erreur. 🤖 écrit le bench, publie le
  chiffre dans le README. **Fini quand** : le chiffre est là, reproductible.
- [ ] **Interop.** Une page Astro, React, Vue, Svelte chacune dans `examples/`, et un
  paragraphe sur le rendu serveur (4). 🤖.
- [ ] **Types pour les dev TypeScript.** Un `.d.ts` généré depuis le manifeste. La JSDoc
  reste la source ; TypeScript n'entre pas dans le code. 🤖.

## 4 · L'écosystème de peaux — la promesse centrale

Deux peaux, du même auteur, ne prouvent pas un écosystème.

- [ ] **Skin starter.** `skins/_starter/` : les tokens globaux, commentés, prêts à
  remplir. 🤖.
- [ ] **Le theme-builder qui EXPORTE.** `examples/theme-builder.html` sort un fichier
  `.css` de peau. 🤖 fait, 👁 teste en vrai.
- [ ] **Relookr branché.** Relookr lit `dist/zoe.json`, écrit les tokens en direct,
  exporte la peau. Dépôt à part (`d:/Dev/relookr`), `vendor/zoe/` jamais touché.
  👁 décide quand.
- [ ] **Une troisième peau, portée d'une source qui n'est pas de nous.** La preuve de
  portabilité. 👁 fournit la source. 🤖 porte, sans réécrire.

---

## Ce qu'on ne fait PAS

- Pas de TypeScript dans le code. Pas de framework dans le cœur. Pas de balise injectée.
- Pas de réécriture du socle « pour faire propre ». On corrige, on teste, on garde.
- Pas de composant de plus tant que la section 1 n'est pas verte.

## Comment on avance

1. Une ligne = une branche annoncée (`/ouvreConcept`). Fini **et** vérifié = commit, et
   la case se coche dans le même commit.
2. Ce qui porte 👁 attend le « garde » de Christophe. Claude ne grave rien avant.
3. Chaque case cochée nomme sa preuve (le test, la page, le chiffre). Sans preuve, pas de
   coche.
4. Cette page se lit en début de session, après `ZOE.md`. Elle remplace le « prochain
   pas » du journal pour tout ce qui est structurel.

---

(1) Playwright ou Puppeteer en `devDependency` seulement : le cœur reste à zéro
dépendance. Un seul navigateur (Chromium) suffit pour commencer.
(2) MIT est le choix par défaut d'un composant web ouvert : adoptable sans juriste.
Si l'intention est de garder une main sur les peaux commerciales, la question se pose
peau par peau, pas sur le cœur.
(3) Un fichier `.github/workflows/check.yml` : `npm ci`, `npm run check`, `npm test`.
Rien d'autre.
(4) Le light DOM est le meilleur candidat du marché pour le rendu serveur : le HTML est
déjà complet avant le JS. Il suffit de le dire et de le montrer sur une page Astro.
