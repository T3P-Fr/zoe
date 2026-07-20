# Socle, variants et sillage — la session du 2026-07-20 → 21

Pas de branche de concept : tout s'est fait sur `master`, en 17 commits. Cette fiche
existe pour que le BILAN ne se perde pas — les décisions de fond de cette session
valent plus que le code qu'elle a produit.

## Bilan — 2026-07-21

**Points forts :**
- **L'effet du clic appartient à la peau, plus à la page.** Les 6 pages écrivaient
  `<z-contact fx="morph">` en dur : changer l'effet pour HighTech le changeait pour
  Claude. Un effet = un fichier dans `tools/z-contact/effects/`, chargé par personne ;
  la peau importe le sien. Le moteur JS n'a pas bougé d'une ligne.
- **Les variants `size · tone · width`**, sur z-element, en CSS pur, zéro JS. Le facteur
  de taille est appliqué à UN endroit (`font-size`) et tout suit, parce que tout est en
  `em`. Les facteurs appartiennent à la peau.
- **z-cursor sauvé** de l'ancien repo — porté, pas réécrit. Une balise à poser, deux
  effets (le ruban qui suit, le trait qui fuse d'un clic à l'autre), et une queue par
  peau : plume qui traîne chez Claude, tracé d'instrument chez HighTech.
- **Le pupitre** : tous les paramètres d'un composant en direct, GÉNÉRÉS depuis son
  `static api`. Un attribut ajouté au code y apparaît tout seul.
- **L'atelier** : une porte d'entrée (`index.html`), `ZOE.cmd` en double-clic, et un
  garde-fou qui explique le `file://` au lieu d'une page morte et muette.

**Décisions — le pourquoi :**
- **`busy` tué** : il doublonnait `loading` (même sens, même ARIA). Deux mots pour une
  idée divergent toujours.
- **`exit` branché** : il était déclaré partout, joué nulle part — il mentait. Le socle
  ne peut pas le poser (disconnectedCallback arrive trop tard), il rend `play()`
  attendable ; c'est celui qui RETIRE qui joue la sortie.
- **`shape` retiré** : la forme appartient à la peau (`--z-radius`), pas à l'auteur. Un
  auteur ne doit pas pouvoir arrondir une peau à angle 0 depuis son HTML.
- **8 crans de taille → 5** : chaque cran se vérifie à l'œil sur chaque composant, et
  `xxs/xxl/xxxl` se ressemblent trop. En rajouter un coûtera une ligne.
- **Pas de base `z-ui`** : la frontière n'est pas « interactif / visuel » mais
  « composant / outil », et elle existe déjà dans les dossiers.
- **Pas de Shadow DOM** : il ne résout pas le problème qu'on lui prêtait (les variables
  CSS traversent sa capsule). `@property { inherits: false }` le fait en une ligne.
- **La loi du CSS recalibrée** : écrite le matin (« chaque règle commentée, sans
  exception »), corrigée le soir sur remarque de Christophe — elle produisait du bruit
  et faisait ré-enseigner la grammaire dans chaque fichier. Désormais : en-tête + bloc
  KSS obligatoires, commentaire de règle SEULEMENT s'il apprend quelque chose.
- **Ma méthode recadrée** (le vrai résultat de la journée) : je gravais des lois dans
  l'heure, donc chaque changement d'avis devenait un défaire/refaire. « Décider seul »
  ≠ « graver seul ». Rien ne se grave avant qu'il l'ait vu bouger.

**Ce qui reste / limites :**
- **Les peaux n'habillent AUCUN élément** : 0 sélecteur, face à 522 lignes de style
  privé éparpillées dans les pages. « Mon HighTech commun » n'existe pas encore.
- **Les états peignent en dur** (`loading`, `error`, `success`) au lieu de poser des
  tokens — d'où les sélecteurs `&:not(:has(z-layer)):state(success)`, illisibles pour
  un humain.
- **La spécificité de notre CSS n'est pas neutralisée** (`:where()`) : une règle simple
  d'auteur pourrait perdre, et c'est le mur exactement là où on promet qu'il n'y en a pas.
- **z-cursor lit ses tokens sur `:root`** : `z-cursor { --z-trail-thickness: 20 }` ne
  fait rien, et un pont JS compense. La voie CSS doit marcher là où on l'attend.
- **Trop de portes** : demo / check / essai / doc pour un même composant.
- Noms de tokens hérités (`--z-contact-*`, `--z-trail-*`) hors grammaire.

**Verdict : à garder.** Rien n'est à jeter ; tout est à ranger. Les décisions de fond
prises en fin de session (pas de plafond, sélecteurs en voie principale, l'échelle de
complexité HTML → CSS → jamais JS) valent plus que le code écrit avant elles, et c'est
elles qui dictent la suite.

## La suite, dans l'ordre

1. **Les peaux habillent le HTML nu** — les 522 lignes tombent, HighTech existe enfin.
2. **z-cursor lit ses tokens sur sa balise** — le pont JS disparaît.
3. **z-button entièrement en tokens** + `:where()` — les états cessent de peindre, les
   sélecteurs monstrueux disparaissent, et la règle de l'auteur gagne sans `!important`.
4. **La doc devient LA page** — le pupitre par section, les démos s'y fondent.
