# z-radio-group

Le **niveau groupe** de Zoé : une [`z-radio`](../z-radio/z-radio.doc.md) seule sait
s'allumer, pas éteindre sa voisine. Le groupe apporte les trois choses qu'un choix
unique exige — et rien d'autre (zéro logique métier).

```html
<z-radio-group value="en">
  <z-radio value="fr">Français</z-radio>
  <z-radio value="en">English</z-radio>
  <z-radio value="es">Español</z-radio>
</z-radio-group>
```

## 1. L'exclusivité

Une s'allume → les autres s'éteignent. Le groupe écoute le `change` qui bulle et fait
le ménage. Écrire deux `current` à la main ? Le premier gagne, le groupe recadre au
montage.

## 2. Le clavier

<kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> se promènent **et choisissent**
(convention ARIA : dans un radiogroup, naviguer *c'est* choisir), circulairement.
<kbd>Home</kbd> / <kbd>End</kbd> vont aux extrémités. Les deux axes marchent — que tu
poses tes radios en colonne ou en ligne.

**Roving tabindex** : le groupe est **un seul** arrêt de tabulation. Le choix courant
porte le focus, les autres sortent du chemin. Sans ça, 6 choix = 6 tabulations.

## 3. La valeur

```js
group.value;               // → "en"
group.value = "fr";        // choisit (silencieux : c'est le programme, pas l'utilisateur)
group.selected;            // → la <z-radio> choisie
group.radios;              // → ses radios (pas celles d'un groupe imbriqué)

group.addEventListener("change", () => console.log(group.value));
```

Le groupe **n'invente pas d'événement** : le `change` de la radio choisie bulle à
travers lui, et comme il écoute en *capture*, `.value` est déjà à jour quand ton
écouteur se déclenche.

L'attribut `value` en HTML = **présélection déclarative**, honorée tant que rien n'est
encore choisi ; le groupe le tient ensuite à jour.

## Scopé

Un groupe ne voit que les radios dont il est le groupe **le plus proche** — la même loi
que l'imbrication dans `z-element`. Deux groupes emboîtés ne se volent pas leurs choix.

## Mise en page & statuts

| Token | Peint |
|---|---|
| `--z-radio-group__direction` | `column` (défaut) ou `row` |
| `--z-radio-group__gap` | l'écart entre les choix |
| `--z-radio-group__align` | l'alignement transversal |

`disabled` sur le groupe **descend** sur ses radios (elles ne connaissent pas le
groupe : c'est lui qui sait qu'il enferme un choix). `error` se pose aussi sur le
**groupe** — « choisis-en un » n'est le défaut d'aucune radio en particulier.

Démo : `z-radio-group.demo.html` (+ sélecteur de peau).
