# z-kbd

Expliquer un raccourci, c'est montrer la touche — pas écrire « contrôle plus K ».
`z-kbd` dessine un **capuchon de touche** : monospace, filet, un léger relief. Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md), il hérite la taille et l'apparition
douce, et ne fait rien d'autre : affichage pur, aucune interaction.

```html
<p>Appuyez sur <z-kbd>Ctrl</z-kbd> + <z-kbd>K</z-kbd> pour chercher.</p>
```

## En calques

Deux rôles : le fond (le capuchon) et ce qui informe (la légende). Pas de `marker` — une
touche n'a pas d'état à montrer, elle **est** l'information.

```html
<z-kbd>
  <z-layer part="background"></z-layer>
  <z-layer part="infos"><z-layer part="label">Ctrl</z-layer></z-layer>
</z-kbd>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface du capuchon — filet et relief |
| `infos` › `label` | la légende (« Ctrl », « ⌘ », « Échap ») |

Les deux formes lisent les mêmes tokens. Ce que les calques permettent : faire bouger le
capuchon sans emmener la légende — une peau qui « enfonce » la touche, par exemple.

## Combinaisons

Le `+` entre deux touches est **votre** texte : le composant ne compose rien. Une touche
seule ne descend jamais sous `1.6em` de large (`min-width`) : un « K » a la même carrure
qu'un « W », et ne devient pas un timbre-poste.

## Taille

Sans `size`, une touche s'écrit en `--z-font-size-sm` — la petite taille de la peau, un
cran sous le texte courant. Avec `size` (`xs · s · m · l · xl`), le facteur s'applique à
la taille du texte qui l'entoure ; padding, rayon et relief sont en `em` et suivent.

## Accessibilité

Aucun rôle ARIA n'est posé : l'assistance lit la légende telle quelle, ce qui suffit à
une touche. La sémantique native `<kbd>` reste la vôtre — dans un contenu éditorial lu
par les moteurs, écrivez `<kbd>` (la peau l'habille) ; `z-kbd` est fait pour
l'**interface** : le raccourci d'un menu, d'une infobulle, d'une palette de commandes.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-kbd--background__color` | la surface du capuchon — défaut `--z-surface-raised` |
| `--z-kbd--background__border` | la couleur de son filet — défaut `--z-line` |

Le relief (une ombre basse de `.12em` + un liseré clair interne) lit `--z-line` et
`--z-surface-raised` de la peau ; le rayon vaut 60 % de `--z-radius` — une touche est un
peu plus carrée que le reste.

```css
z-kbd {
  --z-kbd--background__color: var(--z-accent-soft);
  --z-kbd--background__border: var(--z-accent);
}
```

## Le geste

Seul `enter` est peint : l'apparition joue `pop` (`--z-dur-enter`, `--z-ease-spring`).
Pas d'`over`, pas de `press` — une touche affichée n'est pas une touche qu'on presse.
Démo : `z-kbd.demo.html` (+ sélecteur de peau).
