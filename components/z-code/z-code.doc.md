# z-code

Montrer une commande, un extrait, un chemin — **tel qu'écrit**, à la police à chasse fixe,
sur une surface qui le détache du texte. `z-code` le fait de deux façons : en **bloc** par
défaut (comme un `<pre>`, la mise en page gardée, les longues lignes qui défilent) ou **en
ligne** avec `inline` (une puce au fil d'une phrase, comme un `<code>`). Bâti sur
[`z-element`](../../core/z-element/z-element.doc.md) pour la cohérence de la famille ;
c'est un composant d'affichage. Rien d'injecté, rien d'échappé, rien de coloré : votre
contenu est le code.

```html
<z-code>npm run dev
# http://localhost:5173</z-code>
<p>Installez avec <z-code inline>npm install</z-code>.</p>
```

## Bloc ou en ligne

| Forme | Ce qui change |
|---|---|
| bloc *(défaut)* | `white-space: pre` — chaque espace et chaque retour compte ; les longues lignes **défilent** à l'horizontale au lieu de casser la boîte ; tabulation de 2 |
| `inline` | `display: inline`, padding serré, calé sur la ligne de base — la puce ne casse pas l'interligne |

En bloc, écrivez le contenu **au ras de la balise** : l'indentation de votre HTML ferait
partie du code affiché. `inline` est un attribut de **forme**, pas un état : il se lit en
CSS par `z-code[inline]`, jamais par `:state()`. `code.inline = true` le reflète.

## Ce qui s'affiche est ce que vous écrivez

Le contenu est du HTML : un `<` s'écrit `&lt;`, un `&` s'écrit `&amp;`. Zoé n'échappe
rien — c'est votre texte, et rien ne doit s'y glisser à votre place. Aucune coloration de
syntaxe non plus : si vous en voulez une, vos `<span>` sont les bienvenus à l'intérieur.

## En calques (bloc)

Deux rôles — le fond creusé et ce qui informe. Pas de `marker`, pas de `contact` : du
code n'a pas d'état à montrer et ne reçoit aucun geste.

```html
<z-code><z-layer part="background"></z-layer><z-layer part="infos"><z-layer part="label">npm run dev</z-layer></z-layer></z-code>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface creusée et son filet — elle peut changer de teinte sans toucher au texte |
| `infos` | ce qui informe |
| ↳ `label` | votre code |

Les calques s'écrivent **sur une ligne** : le bloc est en `white-space: pre`, et un retour
entre deux `<z-layer>` deviendrait une ligne vide dans le rendu. La forme en calques vaut
pour le bloc ; la puce `inline` reste en forme courte.

## Accessibilité

Aucun rôle : du code est du **texte**, et un lecteur d'écran le lit comme tel. Pour la
sémantique native, imbriquez un vrai `<pre><code>` dans le bloc, ou écrivez votre
`<code>` dans la puce — c'est votre DOM. Le composant n'est pas focalisable ; le bloc qui
déborde garde le défilement natif de son `overflow`.

## Anatomie & grammaire du pacte

| Token | Peint |
|---|---|
| `--z-code--background__color` | la surface creusée (repli : `--z-surface-sunken`, puis `--z-line`) |
| `--z-code--background__border` | son filet (repli : `--z-line`) |
| `--z-code--background__radius` | ses coins (repli : `--z-radius` en bloc, `.35em` en ligne) |
| `--z-code--infos__color` | la couleur du code (repli : `--z-ink`) |

Défauts qui **consomment la peau** : `--z-font-size-sm` (la taille) et `--z-border-width`.
La police est une pile monospace du système (`ui-monospace`, Cascadia, Fira, Consolas) :
une peau qui veut la sienne pose `font-family` sur `z-code`.

```css
.sombre {
  --z-code--background__color: #1d1a17;
  --z-code--infos__color: #f3ece0;
  --z-code--background__border: transparent;
}
```

## Le geste

Aucun, et c'est un choix : du code ne bouge pas — pas d'entrée animée, pas de survol. Ce
qui doit attirer l'œil, c'est ce qui est écrit dedans. Démo : `z-code.demo.html`
(+ sélecteur de peau).
