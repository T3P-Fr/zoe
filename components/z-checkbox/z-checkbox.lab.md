# z-checkbox — le carnet du labo

> **Statut : finalisée le 2026-07-21.** Ce fichier note ce qui a été tranché, ce que ça
> a coûté au socle, et les pièges qu'on ne veut pas re-découvrir. Rien n'y est en
> attente de décision.

---

## Ce qu'elle sait faire (le contrat tenu)

- **Deux écritures**, un seul comportement : forme courte (`::before`) et forme en
  calques (`z-layer`), mêmes tokens, même peau. Le JS ne sait pas laquelle il porte.
- **Trois valeurs** : décochée · cochée · **indéterminée** (`aria-checked="mixed"`).
- **Participe au formulaire** : `name`, `value`, `required`, reset, `<fieldset disabled>`.
- Accessible : `role="checkbox"`, <kbd>Espace</kbd>, ARIA à jour tout seul.
- Contrôle automatique : `z-checkbox.lab.html`, section 5 — **11/11 le 2026-07-21**.

## Ce que ça a coûté au socle (et pourquoi)

Deux ajouts à `z-element`, tous deux réutilisables par les composants suivants :

| Ajout | Pourquoi il est dans le socle et pas ici |
|---|---|
| `static durableStates` | un composant ajoute ses états durables sans qu'on touche au core à chaque fois. `indeterminate` en est le premier client. |
| `static formAssociated` + `setFormValue` / `setValidity` / `formDisabledCallback` | tout contrôle Zoé aura le même besoin (slider, radio, champ). Écrit une fois ; un composant qui n'appelle jamais `setFormValue` n'envoie rien. |

**La ligne tenue :** le socle porte la *plomberie*, le composant décide de la *valeur*.
C'est ce qui garde « zéro logique métier » vrai.

## Les pièges — payés une fois, notés ici

**`checked = false` ne doit PAS lever l'indétermination.** Première écriture : le setter
`checked` effaçait `indeterminate` (« on vient de trancher »). Résultat vu à l'écran :
un « tout cocher » qui recalcule ses enfants s'efface lui-même, selon l'**ordre** de ses
deux lignes. La case native ne fait pas ça : seul le **geste** tranche, l'API non.

**`required` et `value` ne sont pas des états.** Ils sont observés, mais interceptés
avant le socle — sinon il en ferait des `:state()`, et `:state(value)` ne veut rien dire.

**L'indétermination se peint par un écrasement, pas par un remplacement.** `scale: 1 .28`
sur la *même* pièce que la coche : le passage indéterminée → cochée est une seule
transition continue. Une deuxième pièce aurait fait un saut.

## Ce qui reste ouvert (et n'appartient pas à la case)

- **`z-checkbox-group`** — le « tout cocher » est aujourd'hui trois lignes chez l'auteur
  (démo, section 4). C'est volontaire : la case ne connaît pas ses enfants. Si le motif
  revient sur trois composants, il méritera un outil — pas avant.
- **Le message de validité est en anglais** (comme l'API). L'auteur le remplace d'une
  ligne. Une vraie i18n des messages est une décision de projet, pas de composant.
