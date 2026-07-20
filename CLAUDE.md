# Zoé — les lois de travail

**Avant tout : lire [`ZOE.md`](./ZOE.md)** (le manifeste : ce qu'EST Zoé, en une page).
L'état de reprise (branche, derniers pas, décisions) est réinjecté tout seul par
`.claude/session-start.js`. **Ne jamais repartir de zéro. Ne jamais réinventer un
pattern déjà défini.** Si l'envie de « concevoir » arrive : STOP, lire, aligner.

## ⛔ LOI DES PEAUX — une peau ne se réécrit JAMAIS, elle se PORTE

Une peau (`skins/*/`) est tirée d'une **source** qui vit dans son propre dossier
(`skins/<peau>/source/`) et qui est nommée dans son CSS (`--z-skin-source`) et dans sa
`doc.md`.

- **Avant de toucher une valeur** : ouvrir la source, comparer. Pas de mémoire, pas
  d'à-peu-près.
- **Après toute modification** (de la peau **ou** d'un composant) : ouvrir la planche de
  contrôle `skins/<peau>/<peau>.demo.html` — les composants à gauche, la source à
  droite. Un écart se **voit**.
- **Si la source manque** : s'arrêter et demander. Ne pas redessiner « dans l'esprit de ».
- La charte de la peau est en **tête de son CSS**, écrite en **interdits**. Elle prime
  sur toute intuition esthétique.

*Pourquoi cette loi : HighTech a été réécrite de mémoire une fois, et a perdu son
essence (angle 0, filets, halo au clic, mono, cobalt rare). Christophe a dû relutter
pour la faire revenir. Ça ne doit plus arriver.*

## Le geste, on ne le juge pas sur une capture

Un screenshot prouve le **rendu**, jamais le **mouvement**. Toute animation se valide à
l'écran de Christophe. On sert **toujours en local** (`node scripts/serve.mjs 5177`),
jamais en `file://`.

## Le contrat d'un composant

Un dossier `components/z-x/` = `z-x.js` · `z-x.css` · `z-x.doc.md` · `z-x.demo.html`
(+ `z-x.check.html` si la logique est non triviale). `static api` dans le JS →
`z-manifest` le publie partout (VSCode, doc, `llms.txt`) : rien à inscrire à la main.

- **Structure figée** (Chemin A) = skin portable. Zéro balise injectée : le light DOM
  appartient à l'auteur.
- **Zéro logique métier**, accessible (rôle + ARIA + clavier), tout skinnable et animable.
- Toute page de démo/test porte le **sélecteur de peau** (`examples/skin-switch.js`) :
  un composant qui casse au swap se voit à l'instant.

## Style de code — ODE2JS

JS pur (jamais TypeScript) · JSDoc sur l'exporté · 2 espaces (tabs dans l'existant :
suivre le fichier) · fonctions courtes · commentaires qui disent le **pourquoi**.

## LOI DU CSS — un commentaire n'existe que s'il APPREND quelque chose

Deux obligations, une interdiction. C'est tout.

**Obligatoire — l'en-tête du fichier** (`Styleguide x.0`) : ce que ce CSS peint, ce
qu'il exige (peau, tokens, autres fichiers), et ce qu'il ne fait **pas**.

**Obligatoire — un bloc KSS par section** (`Styleguide x.y`) : le rôle de la section et
son parti pris. Format KSS : bloc `/* … */` multi-lignes, jamais sur une seule ligne.

**Interdit — commenter ce que le code dit déjà.** Un commentaire ne se pose sur une
règle QUE s'il porte une information absente du code :

| Ça s'écrit | Ça ne s'écrit pas |
|---|---|
| un **piège** (défaut de navigateur, ordre de cascade, unité qui trompe) | la paraphrase de la déclaration |
| une **décision** et son prix (« deux formes = chaque état écrit deux fois ») | le nom d'un token, qui se lit déjà |
| un **pourquoi** non déductible (« box-shadow et pas outline : l'outline n'épouse pas le rayon partout ») | une valeur évidente |

```css
/* ❌ bruit — le nom du token le dit */
/* Le rayon vient de la peau : 0 sur HighTech, 9px sur Claude. */
border-radius: var(--z-radius);

/* ✅ ça sauve deux heures à quelqu'un */
/* box-shadow et pas outline : l'outline n'épouse pas le border-radius partout. */
box-shadow: 0 0 0 3px …;
```

**L'absence de commentaire est un signal** : « rien de piégeux ici ». Elle n'a de valeur
que si on ne commente pas à vide — un fichier commenté partout ne signale plus rien.

**La grammaire s'apprend dans la DOC, pas dans le CSS.** Comment lire `:has()`, `&`,
`> [part=…]` : c'est une section de la doc, écrite **une fois**. Un fichier de composant
qui ré-enseigne la grammaire l'écrit deux fois — et ce qui est écrit deux fois divergera.

**Cohérence intégrale :** toucher à un composant = réviser **tout** son dossier (JS,
CSS, doc.md, JSDoc, démos). Une JSDoc fausse = une recherche inutile programmée pour
plus tard.

## Commits

Dès qu'un bloc est fini **et vérifié** (écran + check), je commite seul. On ne demande
que pour push / merge / irréversible.
