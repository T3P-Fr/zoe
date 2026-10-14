# Zoé — the grammar

> The complete rule set for writing Zoé. One page. Everything else (the generated
> manifest, `llms.txt`, the MCP server) is derived from the same source as this page:
> the `static api` block of each element and the CSS it ships with.

Zoé extends HTML with **custom elements** that carry **interaction states**
(`:state()`), are **painted by a skin** (one CSS file of tokens) and **move** (every
state change is animatable). Everything lives in the **light DOM**: the author's HTML
stays the author's HTML, Zoé never injects a node.

## 1. Loading

```html
<link rel="stylesheet" href="/zoe.css">                      <!-- the library -->
<link rel="stylesheet" href="/skins/hightech/hightech.css">  <!-- one skin, last -->
<script type="module" src="/zoe.js"></script>                <!-- every element -->
```

Only one component needed? Import its module alone: `components/z-button/z-button.js`.
Pages must be served over HTTP (`npm run dev`): ES modules do not load from `file://`.

## 2. Writing an element

**One form.** The author writes the content; the pieces are painted:

```html
<z-checkbox>Receive the newsletter</z-checkbox>
<z-button><z-layer part="icon">★</z-layer> Favourite</z-button>
```

An element is **one node**. Its pieces are not tags: the CSS paints them on the host and
on its two pseudo-elements — `::before` is the piece that moves on its own (a
`background` or a `marker`), `::after` is `contact`, the touch zone. There is nothing to
write and no second form. Zoé never generates a node (ADR-0018) and never requires one.

Each component declares **its own anatomy** (the `layers` of its API). A piece with a
`pseudo` is painted; a piece without one is **content** the author writes when they have
it (`<z-layer part="icon">`), and it takes its place in the flow without changing the
form. The **lexicon is shared**: `background`, `marker`, `ring`, `dot`, `icon`, `label`,
`contact` mean the same thing in every component — never invent a synonym for an
existing role, and never name a part after a CSS property (`part="border"` is
forbidden; the piece is `ring`).

Universal pieces:

| part | role | where |
|---|---|---|
| `background` | the surface and its outline, behind the text | `::before` — the host stays transparent, so the surface can move without the text |
| `marker` | the piece that shows state (box, dot, fill, track); `ring` is its outline, `dot` its mark | `::before` — one painted piece, several names of the pact |
| `icon` · `label` | what informs; the label **is** the element's text | content, in flow |
| `contact` | the touch zone — invisible, at least `--z-contact-zone` (44px), centred, overflows a small element; a release inside it counts as `release` | `::after`, set by the core for every interactive element |

A component has one `::before`: it is `background` **or** `marker`, never both (a button
paints its surface, a checkbox its box). An author who needs one more piece writes a
`<z-layer part="…">`: content, placed by its role (`core/z-layer/z-layer.css`), never a
mode.

## 3. States — `z-x:state(name)`

Every Zoé element poses its states itself through `ElementInternals.states`. One
selector form, no exception, no "is this one native?" list:

```css
z-button:state(over)    { … }
z-button:state(press)   { … }
z-button:state(current) { … }
```

| state | kind | when |
|---|---|---|
| `default` | rest | no status is active |
| `over` | transient | pointer is on the element |
| `press` | transient | pointer is down (held even if it leaves — pointer capture) |
| `release` | transient | pointer released **inside** — the gesture succeeds |
| `releaseOut` | transient | pointer released **outside** — the gesture is cancelled |
| `drag` | transient | pressed and moved beyond 4 px |
| `focus` | transient | keyboard focus (like `:focus-visible`) |
| `enter` | transient | just mounted — the entrance animation |
| `exit` | transient | played by whoever removes the element (`await el.play("exit")`) |
| `current` | durable | selected: checked box, active tab, chosen radio |
| `select` · `unselect` | transient | played automatically when `current` toggles |
| `loading` · `disabled` · `error` · `success` | durable status | set by attribute or `setState()` |
| `from-<status>` | transient | sequence: `:state(success):state(from-loading)` |

**Durable states are attributes.** `<z-button loading>` ⟺ `btn.setState("loading")`
⟺ `z-button:state(loading)`. The attribute is the source of truth. A component adds its
own (`indeterminate`, `open`, `held`…) — they are listed in its API.

**Declarative triggers** — `state="name: condition, …"`:

```html
<z-element state="armed: press +2s, glow: over, busy">…</z-element>
```

`armed` turns on 2 s after the press, `glow` on hover, `busy` immediately. Conditions
are a gesture (any state of the element, optional `+delay`) or a clock (`every 2s`).

**CSS can declare a state**: `@property --z-state__glow {}` → Zoé discovers it, and
`<z-element glow>` / `:state(glow)` work.

Transient durations are read from the cascade: `--z-dur-release`, `--z-dur-enter`,
`--z-dur-exit`… One source for the JS timer and the CSS animation.

## 4. Variants — `size · tone · width`

Pure CSS attributes available on every element:

| attribute | values |
|---|---|
| `size` | `xs` · `s` · `m` (default) · `l` · `xl` — one factor on `font-size`; everything inside is in `em` and follows |
| `tone` | `main` (default) · `complement` · `soft` · `success` · `danger` — sets `--z-tone__fill/ink/line` |
| `width` | `auto` (default) · `full` |

## 5. Painting — the pact

```
--z-{component}[--{part}]__{css-property}      what you paint
z-{component}:state({state})                   when
```

- `--` (double dash) is the **component → part** boundary; `__` is the **subject →
  property** boundary; single `-` joins words inside a name. Boundaries are doubled,
  words stay simple — the name is machine-deducible.
- `{css-property}` is the **exact CSS name**, never abbreviated: `background-color`,
  not `bg`.
- Omit the part when the property has a natural layer: `--z-button__color` paints the
  text, `--z-button--marker__background` paints the marker's fill.

```css
z-button                  { --z-button__background-color: #2d6cdf; }
z-button:state(press)     { --z-button__background-color: #1b4fb0; }
z-checkbox:state(current) { --z-checkbox--marker__background-checked: #ff2d55; }
```

**A state redefines a swatch**; everything that drinks the swatch follows, and the
override stays local (it descends into the element, never leaks to siblings or parents).

Component CSS consumes tokens with a fallback to the **skin's global tokens**:
`var(--z-button__background-color, var(--z-accent))`. Two levels, two names: a global
token (`--z-accent`) is never also a component variable.

**Targeting a piece** — a painted piece is a pseudo-element of the component; a content
piece is a direct child, by role:

```css
z-button::before                  { scale: 1.04; }     /* the surface breathes, the text stays */
z-checkbox:state(current)::before { rotate: 90deg; }   /* the box turns when checked */
z-button > [part=icon]            { color: #ff2d55; }  /* content: direct child, by role */
```

- `>` keeps a nested component from being repainted by its parent's CSS.
- `::part()` does **not** apply: Zoé is light DOM. Use `::before` / `::after` for painted
  pieces and `> [part=…]` for content.

## 6. Skins

A skin is **one CSS file of tokens** on `:root`, plus optional per-component overrides
and the classless layer that dresses native HTML (`article`, `form`…). Switching skin =
switching one `<link>`. The global vocabulary every skin provides:

```
--z-page --z-surface --z-surface-raised --z-surface-sunken      surfaces
--z-ink --z-ink-soft --z-line --z-line-soft                       ink & rules
--z-accent --z-accent-ink --z-accent-soft --z-focus-halo         the accent
--z-success --z-danger --z-disabled                              meaning
--z-font --z-font-title --z-font-size --z-font-size-sm           type
--z-font-weight --z-font-weight-strong --z-letter
--z-radius --z-radius-pill --z-border-width --z-gap --z-pad-x --z-pad-y
--z-dur --z-dur-enter --z-dur-exit --z-dur-release --z-dur-releaseOut
--z-dur-select --z-dur-unselect --z-dur-open --z-dur-close
--z-ease --z-ease-spring
--z-scale-base --z-scale-xs --z-scale-s --z-scale-m --z-scale-l --z-scale-xl
--z-contact-fx --z-contact-size --z-contact-width --z-contact-duration --z-contact-color
--z-contact-zone                                                 the touch zone minimum
```

Each state also exposes `--z-state__color` (accent at rest, danger on `error`, success
on `success`, disabled when `disabled`): paint halos and rings with it and they stay in
tune without a line.

## 7. Tools

Tools apply to any HTML, Zoé element or not.

- **`<z-contact>`** — one tag anywhere in the page, and every interactive element gets
  the skin's click effect at the pointer position. `fx="none"` to disable.
- **`channel="name"`** — elements sharing a channel are linked: the emitter's value
  lands on every member as `--z-channel-name` (a bare number). Multi-output components
  split with the pact's separator: `--z-channel-name--low`. `Zoe.tune(name, value)`
  writes from JS.
- **Sensors** — they paint nothing and pose **bare numbers** on themselves, inherited by
  every descendant: `<z-pointer>` (`--z-pointer--local__x/__y/__rx/__ry/__in`),
  `<z-scroll>` (`--z-scroll__ry` 0→1, `__y`, `__dir`, `__top`, `__end`…), `<z-inview>`
  (`--z-inview__in`, `__ratio`, `__seen`, `__cross`), `<z-size>` (`--z-size__w`, `__h`,
  `__ratio`, `__over`), `<z-drag>` (`--z-drag__x/__y/__rx/__ry`, `__held`,
  `:state(held)`). Multiply a number to turn it into anything: `calc(var(--x) * 1px)`,
  `* 360deg`, `* 100%`.
- **`z-motion`** — shared `@keyframes`: `pop`, `shake`, `pulse`, `spin`, `fadeIn/Out`,
  `slideUp/Down/Left/Right` (+ `slideOut*`), `shimmer`, `ripple`.
- **`<z-cursor>`** — a ribbon following the pointer, skinned by the skin.

## 8. Events and JS

HTML first: no JS is required for an element to exist. When needed:

```js
const box = document.querySelector("z-checkbox");
box.addEventListener("change", () => box.checked);
box.addEventListener("z-state", (e) => e.detail);   // { states, changed, on }
box.setState("loading"); box.setState("loading", false);
await box.play("exit"); box.remove();                // animated removal
```

Component events (`change`, `input`, `toggle`, `select`, `zoe:dismiss`, `zoe:remove`…)
bubble and, where it makes sense, are cancelable. A component **emits, the page decides**:
zero business logic inside a component. Security is server-side.

## 9. Forms

Every Zoé input is form-associated: `name`, `value`, `required`, `disabled` (also via
`<fieldset disabled>`), native validation and `form.reset()` work as on native inputs.
Submission uses `FormData` as usual. A `<z-field>` wraps a **native** `<input>`,
`<textarea>` or `<select>` and mirrors its validity into `error` / `success`.

## 10. SEO contract

**Read by search engines → native HTML, dressed by the skin. Clicked → `z-*`.**
Headings, paragraphs, links, images, lists stay native. Only widgets (buttons, tabs,
dialogs, sliders) become Zoé elements. Never generate semantics from JS
(`<z-text h1>` is wrong; `<h1>` inside `<z-reveal>` is right).

## 11. Dead forms — never write these

| wrong | why | right |
|---|---|---|
| `.z-press`, `.is-over` | states are not classes | `z-x:state(press)` |
| `[state="press"]` | an element is `over` **and** `press` at once | `:state(press)` |
| `--z-button-bg`, `--z-button--bg` | abbreviation; single dash as boundary | `--z-button__background-color` |
| `--z__color` | leaks into children by inheritance | `--z-button__color` |
| `--z-button__color--press` | state suffix | `z-button:state(press) { --z-button__color: … }` |
| `role="marker"` | `role` belongs to ARIA | `part="marker"` |
| `<z-marker>`, `<z-label>` | a tag per role — a dictionary, not a grammar | `<z-layer part="marker">` |
| `::part(label)` | shadow-DOM only; Zoé is light DOM | `> [part=label]` |
| `part="border"` | a CSS property, not a role | `part="ring"` |
| `busy` | a second word for `loading` | `loading` |
| `<z-layer part="background">`, `part="marker"`, `part="contact"` | painted pieces are never written — the CSS does them | nothing: `<z-checkbox>Label</z-checkbox>` |
| `:has(z-layer)` | there is one form, not two | `z-x::before` |

## 12. Checklist for a generated page

1. `zoe.css` + one skin + `zoe.js` (or the needed modules).
2. Semantic content in native HTML; widgets as `z-*`.
3. Attributes from the element's API only (see `llms.txt` / `zoe_get`).
4. Paint with `--z-{component}[--{part}]__{property}`; react with `:state()`.
5. One `<z-contact>` if the page wants the skin's click effect.
6. Serve over HTTP; load `tools/z-lint/z-lint.js` in development — unknown tags,
   attributes, states and misspelled tokens are reported in the console with the
   nearest valid name.
