# z-toast

Un enregistrement réussi, un paiement refusé : il faut le dire, puis laisser l'écran
tranquille. z-toast est une notification **éphémère** — elle apparaît, se lit, s'efface
toute seule. Cousine de `z-alert` (même sémantique de région d'état, même croix
annulable), mais elle **vit et meurt** : un minuteur, une pause quand on la lit, une
sortie animée. Bâtie sur [`z-element`](../../core/z-element/z-element.doc.md).

```html
<z-toast tone="success">Enregistré.</z-toast>
<z-toast tone="danger" dismissible duration="0">Le paiement a échoué.</z-toast>
```

Elle ne gère **pas** son placement à l'écran : elle est la carte, votre page est la pile
(voir plus bas).

## En calques

Forme courte : le CSS peint la carte sur l'hôte. Forme en calques
([`z-layer`](../../core/z-layer/z-layer.doc.md)) : la surface et l'information sont deux
pièces.

```html
<z-toast tone="success" duration="0">
  <z-layer part="background"></z-layer>
  <z-layer part="infos">
    <z-layer part="icon">✓</z-layer>
    <z-layer part="label">Enregistré.</z-layer>
  </z-layer>
</z-toast>
```

| Rôle | La pièce |
|---|---|
| `background` | la surface de la carte — porte le `tone` |
| `infos` | ce qui informe — icône + message |
| ↳ `icon` | optionnelle, colorée par le `tone` |
| ↳ `label` | le message |

## Elle vit, puis s'efface — `duration`

`duration` est sa durée de vie en millisecondes : **4000** par défaut, `0` pour ne jamais
se fermer seule (une erreur de paiement attend qu'on la lise). Changer l'attribut relance
le minuteur depuis le début.

Le **survol** et le **focus** mettent le minuteur **en pause** : on ne perd pas un message
qu'on est en train de lire ou de sélectionner. À la sortie du pointeur, il reprend **là
où il en était** — jamais depuis le début.

```js
toast.duration;        // → 4000
toast.duration = 8000; // relance pour 8 s
```

## La fermer — `dismissible`, `dismiss()`, `zoe:dismiss`

```html
<z-toast dismissible>Avec une croix.</z-toast>
```

`dismissible` ajoute une croix peinte (`::after`, jamais injectée) dont la zone est le
bord droit (2,2 em), et rend la carte focalisable : <kbd>Suppr</kbd> ou
<kbd>Retour arrière</kbd> la ferment au clavier. `toast.dismiss()` fait la même chose
depuis le code.

Tout passe par **un seul chemin** — croix, clavier, minuteur, API — et ce chemin
**prévient d'abord** : `zoe:dismiss`, annulable, qui bulle. `preventDefault()` et la
carte reste ; si c'était le minuteur qui parlait, il est consommé : elle attend alors
votre `dismiss()`.

```js
pile.addEventListener("zoe:dismiss", (event) => {
  console.log("part :", event.target.textContent);
});
```

## La sortie animée

Fermer n'arrache pas le nœud : `dismiss()` joue l'état `exit` (le temps de
`--z-dur-exit`, lu dans la peau), **attend** la fin, puis retire la carte. Sans cette
attente, la disparition serait invisible — `disconnectedCallback` arrive trop tard pour
animer. L'entrée, elle, est posée par le socle (`enter`) au montage.

```js
await toast.dismiss();   // rend la main une fois la carte partie
```

## La pile : à vous

Où les notifications s'empilent est une décision de **page** — coin bas droit, haut
centre, au-dessus d'une barre — pas une propriété d'une carte. z-toast se contente
d'être prête à flotter (une ombre la décolle du fond). Une pile tient en quelques lignes :

```css
.pile {
  position: fixed; right: 1rem; bottom: 1rem; z-index: 1000;
  display: flex; flex-direction: column; gap: .6rem;
}
```

```js
const toast = document.createElement("z-toast");
toast.setAttribute("tone", "success");
toast.textContent = "Enregistré.";
pile.append(toast);      // elle entre en glissant, vivra 4 s, sortira en glissant
```

## Accessibilité

- `role="status"` (annonce polie) par défaut ; `tone="danger"` passe `role="alert"`
  (annonce immédiate) — sauf si vous posez votre propre `role`.
- `dismissible` → un arrêt de tabulation, fermeture au clavier, halo de focus.
- Le focus met le minuteur en pause : un utilisateur au clavier a le temps de lire.

## Anatomie & grammaire du pacte

z-toast ne lit **aucun token `--z-toast…`** : la carte se repeint par le `tone`. Le socle
pose `--z-tone__fill` et `--z-tone__line` pour chaque `tone` ; le composant y ajoute un
défaut neutre (`--z-line`) pour une carte sans `tone`, afin qu'elle ait toujours une
couleur à mélanger.

| Token | Peint |
|---|---|
| `--z-tone__fill` | le fond, mélangé à 12 % dans `--z-surface-raised` |
| `--z-tone__line` | le filet (à 40 %), la barre de 3 px à gauche, l'icône, le halo de focus |

Pour recolorer une carte, redéfinissez ces deux tokens sur elle. Le reste boit la peau :
`--z-radius`, `--z-ink`, `--z-font`, `--z-font-size`, `--z-border-width`, `--z-dur-enter`
et `--z-dur-exit`, `--z-ease-spring` et `--z-ease`.

## Le geste

Elle **entre** par la droite en glissant d'1,5 em avec un très léger zoom (`z-toast-in`,
ressort de la peau) et **sort** par le même chemin (`z-toast-out`, `--z-dur-exit`, en
accélérant). La croix dort à 55 % et s'allume au survol. Démo : `z-toast.demo.html`
(+ sélecteur de peau).
