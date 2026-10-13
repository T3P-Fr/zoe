# z-pagination

La pagination **SEO-correcte**. Vous écrivez les liens — de vrais `<a href>`, lus par les
moteurs, c'est le [contrat SEO](../../docs/contrat-seo.md) — et Zoé pose le **sens**, la
**page courante**, les **bornes**, la **fenêtre** d'affichage et le **clavier**. Rien n'est
généré : ce qui est dans votre source est ce que le crawler lit, et ce que vous déboguez.

```html
<z-pagination page="3" siblings="1" label="Pages des résultats">
  <a part="prev" href="?p=2">Précédent</a>
  <a href="?p=1">1</a>
  <a href="?p=2">2</a>
  <a href="?p=3">3</a>
  <a href="?p=4">4</a>
  <a href="?p=5">5</a>
  <a href="?p=12">12</a>
  <a part="next" href="?p=4">Suivant</a>
</z-pagination>
```

| Pièce | Rôle |
|---|---|
| un enfant direct sans `part` (ou `part="page"`) | une **page** — son texte est son numéro |
| `[part="prev"]` · `[part="next"]` | les deux bornes, optionnelles |

## 1. La page courante

L'attribut `page` dit laquelle : le lien dont le **texte** est ce nombre reçoit
`aria-current="page"` (le sens) et l'attribut `current` (la grammaire Zoé pour
« sélectionné », que le CSS peint). Les autres les perdent.

Sans `page`, le composant lit le lien que **vous** avez marqué `aria-current="page"` —
une page rendue par le serveur n'a rien d'autre à écrire. Sans l'un ni l'autre, la
première page est courante.

```js
pager.page;          // → 3
pager.page = 5;      // déplace la marque et la fenêtre (silencieux : c'est le programme)
pager.last;          // → 12 — le plus grand nombre lu dans les liens
pager.pages;         // → les liens de page, dans l'ordre
```

## 2. Les bornes

Sur la première page, `[part="prev"]` est **mort** : `aria-disabled="true"`, l'attribut
`disabled` (le CSS l'estompe et coupe le pointeur) et `tabindex="-1"` (un `<a href>`
resterait tabulable sinon). Même chose pour `[part="next"]` sur la dernière — la
dernière étant le **plus grand nombre** lu dans vos liens, pas le dernier enfant. Le
lien reste écrit : le crawler le lit, l'utilisateur ne le clique plus.

`disabled` sur l'hôte gèle toute la navigation : plus un lien ne répond, la courante
s'estompe.

## 3. La fenêtre

`siblings` (défaut `1`) dit combien de pages restent visibles de chaque côté de la
courante. Au-delà, un lien reçoit `far` et le CSS le **cache** — sauf la première et la
dernière, qui restent toujours. Un lien visible devant lequel des pages manquent reçoit
`gap` : le CSS dessine « … » devant lui, en `::before`, jamais en nœud.

Le trou se voit **que les pages soient cachées par la fenêtre ou absentes de votre
liste** : avec l'exemple ci-dessus (1 à 5, puis 12), le « … » se pose devant 12 même
si rien n'est `far`. Vous pouvez donc écrire les douze liens (le crawler les lit tous,
la fenêtre n'en montre que cinq) ou seulement ceux que le serveur a choisis — le rendu
est le même.

La fenêtre se recalcule à chaque changement : `page`, `siblings`, ou vos liens
eux-mêmes (ajoutés, retirés, renumérotés).

## 4. Qui pilote — le lien, ou l'application

Au clic sur une page, prev ou next, le composant émet `change` — `bubbles`,
`cancelable`, `detail: { page }` — **avant** que le lien n'agisse. Deux cas :

- **le lien navigue** (il a un `href`, vous ne dites rien) : le composant ne touche à
  rien. C'est le web : la page suivante arrive du serveur, avec sa propre pagination ;
- **l'application pilote** : vous faites `event.preventDefault()`, **ou** l'élément
  cliqué n'a pas de `href` — un `<button type="button">`, par exemple. Le composant pose
  alors `page` lui-même ; à vous de charger les résultats.

```js
pager.addEventListener("change", (event) => {
  event.preventDefault();            // je prends la main
  charger(event.detail.page);        // la courante est déjà déplacée
});
```

Pour une pagination **sans navigation** (un tableau rechargé en place), écrivez des
`<button type="button">` plutôt que des `<a>` sans `href` : un `<a>` sans `href` n'est
ni focusable ni un lien pour le lecteur d'écran, un bouton est les deux.

Cliquer la page courante ne change rien : le lien fait sa vie.

## Accessibilité

`role="navigation"` sur l'hôte, nommé par `label` (défaut « Pagination ») — ou par
l'`aria-label` / `aria-labelledby` que vous aviez déjà écrit. La courante porte
`aria-current="page"` ; les bornes mortes `aria-disabled="true"`. Les liens cachés
(`far`, `display: none`) sortent de l'arbre d'accessibilité ; le « … » est un `::before`,
donc muet.

Chaque lien reste **un vrai lien, tabulable** — pas de roving : une pagination n'est pas
un widget, c'est une liste de destinations. <kbd>←</kbd> <kbd>→</kbd> déplacent le focus
entre les liens visibles (un confort), <kbd>Home</kbd> / <kbd>End</kbd> vont aux
extrémités, sans boucler.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-pagination__gap` | l'écart entre les pastilles |
| `--z-pagination--page__size` | le côté d'une pastille (carrée au repos, elle s'allonge pour « Précédent ») |
| `--z-pagination--page__padding` | son padding horizontal |
| `--z-pagination--page__radius` | son rayon (repli : `--z-radius`) |
| `--z-pagination--page__color` · `__background` · `__border-color` | une pastille au repos |
| `--z-pagination--page__color-current` · `__background-current` | la courante (repli : `--z-accent-ink` sur `--z-accent`) |
| `--z-pagination--ellipsis__size` · `__color` | le « … » : sa largeur, sa couleur |

Défauts qui **consomment la peau** (`--z-line`, `--z-radius`, `--z-accent`,
`--z-accent-ink`, `--z-ink-soft`, `--z-disabled`) : juste sur HighTech (angles, filets,
mono) comme sur Claude (arrondi, chaud).

```css
z-pagination { --z-pagination--page__radius: 50%; }          /* des ronds */
z-pagination > [current] { font-weight: 400; }                 /* réagir à la marque */
```

## Le geste

Rien ne pope : la couleur des pastilles **glisse** d'un état à l'autre (survol en
accent, courante pleine). Quand la courante change, la nouvelle pastille **arrive en
ressort** (`pop`, le preset de z-motion — sobre sur HighTech, rebondi sur Claude). Le
« … » reste hors flux : la rangée ne saute pas quand la fenêtre se déplace. Démo :
`z-pagination.demo.html` (+ sélecteur de peau).
