# z-motion — les presets de mouvement

Une bibliothèque de `@keyframes` prêts à brancher sur n'importe quel état, dans les deux
chemins. Des **gestes purs** (transform/opacity) : la couleur reste à ton CSS, les durées
et easings viennent de la peau (tokens).

**Charger :** `<link rel="stylesheet" href="tools/z-motion/z-motion.css">`.

**Utiliser :**
```css
z-checkbox:state(select) > z-render[part=marker] { animation: pop var(--z-dur-select) var(--z-ease-spring); }
z-state:state(error) > button { animation: shake .35s var(--z-ease); }
z-card:state(loading)::before { animation: shimmer 1.1s linear infinite; }
```

**Le menu :**
| Famille | Presets |
|---|---|
| entrée dirigée | `slideLeft` `slideRight` `slideUp` `slideDown` |
| sortie dirigée | `slideOutLeft` `slideOutRight` `slideOutUp` `slideOutDown` |
| emphase | `pop` `shake` `pulse` `spin` |
| fondu | `fadeIn` `fadeOut` |
| surface | `shimmer` (skeleton) · `ripple` (onde, pour un `::after`) |

Ajouter un preset = un `@keyframes` de plus ici. Il devient dispo partout.
