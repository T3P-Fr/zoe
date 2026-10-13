# Zoé

**HTML-first web components with living states, portable skins and CSS-driven motion.**
Light DOM, zero dependencies, zero build step — and built to be written by humans and AI
agents alike.

```html
<link rel="stylesheet" href="/zoe.css">
<link rel="stylesheet" href="/skins/hightech/hightech.css">
<script type="module" src="/zoe.js"></script>

<z-checkbox name="newsletter">Receive the newsletter</z-checkbox>
<z-button type="submit">Subscribe</z-button>
```

```css
/* paint by redefining a swatch — the state does the rest */
z-checkbox:state(current) { --z-checkbox--marker__background-checked: #ff2d55; }
z-button:state(press)     { --z-button__background-color: #1b4fb0; }
```

## What makes Zoé different

- **States are native.** Every element poses `over`, `press`, `release`, `releaseOut`,
  `drag`, `focus`, `current`, `loading`, `error`, `success`… through `ElementInternals`.
  You style them with `z-x:state(name)` — no classes, no JavaScript of yours.
- **The author owns the DOM.** Zoé never injects a node. Your text stays in your HTML
  (search engines read it), your layers are the ones you wrote
  (`<z-layer part="marker">`), your CSS reaches everything.
- **Skins are portable.** A skin is one CSS file of tokens. Switching skin is switching
  one `<link>`. Two ship with the library: *HighTech* (engineering plate, hairlines, mono)
  and *Claude* (warm ink, serif, spring motion).
- **One grammar, machine-deducible.** `--z-{component}[--{part}]__{css-property}` to
  paint, `z-{component}:state({state})` to react. Doubled separators mark the boundaries,
  so the name of anything can be deduced, never memorised.
- **Sensors give numbers to CSS.** `<z-pointer>`, `<z-scroll>`, `<z-inview>`, `<z-size>`,
  `<z-drag>` pose bare numbers as custom properties; the CSS decides what they move.
- **Everything moves.** Entrances, exits and state changes are animatable; the skin
  decides how.

## Getting started

```bash
git clone <this repository> zoe
cd zoe
npm run dev          # serves http://localhost:5173 — ES modules need HTTP, not file://
```

Then open:

| | |
|---|---|
| `http://localhost:5173/` | the workshop: every component, tool, skin and example |
| `http://localhost:5173/docs/` | the reference documentation, generated from the code, EN / FR / ES |
| `components/z-button/z-button.demo.html` | a component's demo page (each one has one) |

Load the whole library (`zoe.css` + a skin + `zoe.js`) or only the modules you need:
`components/z-button/z-button.js` defines `<z-button>` on its own.

## Writing Zoé

The complete rule set is one page: **[docs/GRAMMAR.md](docs/GRAMMAR.md)**. The short
version:

1. Semantic content stays native HTML (`<h1>`, `<p>`, `<a href>`). Widgets become `z-*`.
2. Short form (`<z-checkbox>Label</z-checkbox>`) or layered form
   (`<z-layer part="…">` inside) — same tokens, same behaviour.
3. React with `z-x:state(name)`. Durable states are attributes: `<z-button loading>`.
4. Paint with the pact: `--z-button__background-color`, `--z-checkbox--marker__size`.
5. Variants on every element: `size="xs|s|m|l|xl"`, `tone="main|complement|soft|success|danger"`,
   `width="full"`.
6. Forms just work: `name`, `value`, `required`, validation, `reset()` — like native inputs.

## For AI agents and editors

Everything is generated from the `static api` block of each element and the CSS it
ships with. One source, several outputs:

| output | for |
|---|---|
| [`llms.txt`](llms.txt) · [`llms-full.txt`](llms-full.txt) | LLMs: grammar + compact reference of every element (+ all narrative docs) |
| `scripts/z-mcp/z-mcp.js` · [`.mcp.json`](.mcp.json) | an **MCP server**: `zoe_grammar`, `zoe_list`, `zoe_get`, `zoe_example`, `zoe_search`, `zoe_skins`, `zoe_lint` |
| [`dist/custom-elements.json`](dist/custom-elements.json) | Custom Elements Manifest (standard) |
| [`dist/vscode.html-custom-data.json`](dist/vscode.html-custom-data.json) | VS Code autocompletion and hover for `<z-*>` (wired in `.vscode/settings.json`) |
| [`dist/zoe.json`](dist/zoe.json) | the full multilingual index behind the documentation and the server |
| `tools/z-lint/z-lint.js` | the console that corrects: unknown tags, states, parts and misspelled tokens, each with the nearest valid name |

**Claude Code** picks the MCP server up from `.mcp.json` when you open this folder. For
Claude Desktop, Cursor or any MCP client, register:

```json
{ "mcpServers": { "zoe": { "command": "node", "args": ["<path to zoe>/scripts/z-mcp/z-mcp.js"] } } }
```

Recommended flow for an agent: `zoe_grammar` once, `zoe_get <tag>` for each element it
writes, `zoe_lint` on its HTML/CSS before delivering.

## Repository

```
core/z-element/     the living base: states, form association, declarative triggers
core/z-layer/       the layer: one piece, one role (<z-layer part="…">)
components/z-*/     each component: .js · .css · .doc.md · .demo.html (+ .lab.html)
tools/z-*/          z-contact · z-channel · z-cursor · z-lint · the sensors · z-motion presets
skins/*/            one CSS file of tokens per skin, with its documentation and control board
docs/               the documentation viewer (reads dist/zoe.json) and GRAMMAR.md
scripts/            z-manifest (generator) · z-mcp (MCP server) · check (quality gate) · serve
dist/               generated — never edited by hand
examples/           full-page examples and the demo-page toolkit
```

```bash
npm run manifest     # regenerate dist/, llms.txt, the socle's tag lists, this README's table
npm run check        # the quality gate: complete APIs, aligned lists, no dead link, fresh dist
npm test             # node --test: generator, lint rules, MCP server
```

## Elements

<!-- zoe:elements -->
**core**

| element | what it does | files |
|---|---|---|
| `<z-element>` | The living base: carries interaction states as :state() and emits z-state. | [doc](core/z-element/z-element.doc.md) |
| `<z-layer>` | The pieces of a component — its background, its label, its tick — already painted for you. You only write a layer to take over one precise part. | [doc](core/z-layer/z-layer.doc.md) |

**tools**

| element | what it does | files |
|---|---|---|
| `z-channel` | The channel: two elements sharing the same channel="name" are linked. What changes here moves there — and the CSS decides what. No class, no listener. | [doc](tools/z-channel/z-channel.doc.md) · [lab](tools/z-channel/z-channel.lab.html) |
| `<z-contact>` | Need a click effect across your whole page? Drop this tag anywhere — problem solved. Two effects by default; not to your taste? Make your own in a few lines of CSS. | [doc](tools/z-contact/z-contact.doc.md) · [lab](tools/z-contact/z-contact.lab.html) |
| `<z-cursor>` | The pointer's wake: one flat tag, and the mouse leaves a ribbon behind it. | [doc](tools/z-cursor/z-cursor.doc.md) · [demo](tools/z-cursor/z-cursor.demo.html) |
| `<z-drag>` | Dragging is the single biggest pile of JavaScript in any interface. Wrap it in this tag: the position lands in CSS as a number, and YOU decide what it moves — a position, a rotation, an opacity. Keyboard included. | [doc](tools/z-drag/z-drag.doc.md) · [lab](tools/z-drag/z-drag.lab.html) |
| `<z-inview>` | "Fade it in when it scrolls into view" — the single most common request on the web, and the reason whole libraries get loaded. Wrap it in this tag: the answer arrives in CSS as a number, and the animation stays yours to write. | [doc](tools/z-inview/z-inview.doc.md) · [lab](tools/z-inview/z-inview.lab.html) |
| `z-lint` | The console that corrects: load it in development and every unknown tag, attribute, state, part or misspelled token is reported with the nearest valid name. The browser stays silent; z-lint speaks. | [doc](tools/z-lint/z-lint.doc.md) · [lab](tools/z-lint/z-lint.lab.html) |
| `z-motion` | Shared @keyframes presets — attach them to any state: `animation: pop var(--z-dur) var(--z-ease)`. | [doc](tools/z-motion/z-motion.doc.md) · [lab](tools/z-motion/z-motion.lab.html) |
| `<z-pointer>` | Want a div to follow the mouse? Wrap it in this tag — the position lands in CSS as plain numbers, and every child inherits them. No class, no listener, no JS of yours. | [doc](tools/z-pointer/z-pointer.doc.md) · [lab](tools/z-pointer/z-pointer.lab.html) |
| `<z-scroll>` | A progress bar, a shrinking header, a parallax, a "back to top" that waits its turn — all of them need one thing: how far down are we? Drop this tag and the answer lands in CSS as a number between 0 and 1. | [doc](tools/z-scroll/z-scroll.doc.md) · [lab](tools/z-scroll/z-scroll.lab.html) |
| `<z-size>` | Two questions CSS cannot answer on its own: how big is this box, really — and does its content overflow? Wrap it in this tag and both answers land in CSS as numbers. | [doc](tools/z-size/z-size.doc.md) · [lab](tools/z-size/z-size.lab.html) |

**components**

| element | what it does | files |
|---|---|---|
| `<z-accordion>` | A group of z-disclosure — when `exclusive`, opening one closes the others. Coordination only. | [doc](components/z-accordion/z-accordion.doc.md) · [demo](components/z-accordion/z-accordion.demo.html) |
| `<z-alert>` | A contextual message — tone drives the colour, role=status (or alert for danger). Optionally dismissible. | [doc](components/z-alert/z-alert.doc.md) · [demo](components/z-alert/z-alert.demo.html) |
| `<z-avatar>` | An identity chip — an image if given, otherwise the initials. role=img with an alt from name. Inherits tone/size. | [doc](components/z-avatar/z-avatar.doc.md) · [demo](components/z-avatar/z-avatar.demo.html) |
| `<z-avatar-group>` | A stack of overlapping z-avatar, each ringed in the page colour to stand out. On hover, the avatar lifts and comes to the front. Nothing injected. | [doc](components/z-avatar-group/z-avatar-group.doc.md) · [demo](components/z-avatar-group/z-avatar-group.demo.html) |
| `<z-badge>` | A status/count pill — inherits z-element's tone & size variants, painted by the skin. Almost zero code: the frozen socle does the work. | [doc](components/z-badge/z-badge.doc.md) · [demo](components/z-badge/z-badge.demo.html) |
| `<z-breadcrumb>` | A breadcrumb trail — you write the links, Zoé adds the meaning (nav + label) and the « › » separators in CSS. Nothing injected. | [doc](components/z-breadcrumb/z-breadcrumb.doc.md) · [demo](components/z-breadcrumb/z-breadcrumb.demo.html) |
| `<z-button>` | A button — inherits all z-element states, skinnable by themes. | [doc](components/z-button/z-button.doc.md) · [demo](components/z-button/z-button.demo.html) · [lab](components/z-button/z-button.lab.html) |
| `<z-card>` | A surface card holding free content — inherits tone & size; optionally interactive (hover + clickable, role=button). | [doc](components/z-card/z-card.doc.md) · [demo](components/z-card/z-card.demo.html) |
| `<z-checkbox>` | A checkbox — inherits all z-element states, marker + label anatomy, painted by the skin. | [doc](components/z-checkbox/z-checkbox.doc.md) · [demo](components/z-checkbox/z-checkbox.demo.html) · [lab](components/z-checkbox/z-checkbox.lab.html) |
| `<z-checkbox-group>` | A group of z-checkbox: a list value, a 'check all' master, 'at least one' required, one name for FormData. | [doc](components/z-checkbox-group/z-checkbox-group.doc.md) · [demo](components/z-checkbox-group/z-checkbox-group.demo.html) |
| `<z-code>` | Displays code as written — a block by default (pre-like, scrolls horizontally) or inline with `inline` (a monospace chip). No syntax highlighting, nothing injected. | [doc](components/z-code/z-code.doc.md) · [demo](components/z-code/z-code.demo.html) |
| `<z-dialog>` | A modal box on the native <dialog> — adds states, animated open/close, declarative triggers (commandfor/command) and light-dismiss. | [doc](components/z-dialog/z-dialog.doc.md) · [demo](components/z-dialog/z-dialog.demo.html) |
| `<z-disclosure>` | A disclosure (title → collapsible content) — inherits z-element states, accessible (aria-expanded/controls, inert when closed), animatable. | [doc](components/z-disclosure/z-disclosure.doc.md) · [demo](components/z-disclosure/z-disclosure.demo.html) |
| `<z-divider>` | A separator — a plain rule, or two rules framing a centred label. role=separator + aria-orientation. | [doc](components/z-divider/z-divider.doc.md) · [demo](components/z-divider/z-divider.demo.html) |
| `<z-drawer>` | A modal side panel — a z-dialog glued to an edge: full height, slides in from its side. Same API, same triggers. | [doc](components/z-drawer/z-drawer.doc.md) · [demo](components/z-drawer/z-drawer.demo.html) |
| `<z-field>` | A form field around a NATIVE control: links label, hint and error, mirrors its validity into error/success, poses filled. Nothing replaced, nothing injected. | [doc](components/z-field/z-field.doc.md) · [demo](components/z-field/z-field.demo.html) |
| `<z-kbd>` | A keyboard key cap — pure display, monospace, bordered with a subtle key relief. Inherits size. | [doc](components/z-kbd/z-kbd.doc.md) · [demo](components/z-kbd/z-kbd.demo.html) |
| `<z-menu>` | An actions menu (ARIA menu button) on top of z-popover — roles, roving focus, arrow keys, type-ahead; activating an item fires cancelable `select` then closes. | [doc](components/z-menu/z-menu.doc.md) · [demo](components/z-menu/z-menu.demo.html) |
| `<z-meter>` | A gauge (role=meter): a scalar measurement within a range, coloured by low/high/optimum thresholds. Not a progress bar — it shows a state, not an advance. | [doc](components/z-meter/z-meter.doc.md) · [demo](components/z-meter/z-meter.demo.html) |
| `<z-pagination>` | SEO-correct pagination: you write real links, Zoé poses the meaning, the current page, the bounds, the window and the keyboard. Nothing generated. | [doc](components/z-pagination/z-pagination.doc.md) · [demo](components/z-pagination/z-pagination.demo.html) |
| `<z-popover>` | A floating panel anchored to its trigger — native Popover API (top layer, light-dismiss, Escape), JS anchoring that flips when it overflows, animated in and out. | [doc](components/z-popover/z-popover.doc.md) · [demo](components/z-popover/z-popover.demo.html) |
| `<z-progress>` | A progress bar — inherits z-element states + tone/size, painted by the skin. value/max → a percentage the CSS draws. | [doc](components/z-progress/z-progress.doc.md) · [demo](components/z-progress/z-progress.demo.html) |
| `<z-radio>` | A radio button — z-element states, marker + label anatomy, selects but never unselects itself. | [doc](components/z-radio/z-radio.doc.md) · [demo](components/z-radio/z-radio.demo.html) |
| `<z-radio-group>` | A group of z-radio: single choice, arrow-key navigation, roving tabindex, one value. | [doc](components/z-radio-group/z-radio-group.doc.md) · [demo](components/z-radio-group/z-radio-group.demo.html) · [lab](components/z-radio-group/z-radio-group.lab.html) |
| `<z-rating>` | A star rating — a slider from 0 to max, set by click or keyboard, painted by the skin. | [doc](components/z-rating/z-rating.doc.md) · [demo](components/z-rating/z-rating.demo.html) |
| `<z-segmented>` | A segmented control: single choice among 2–5 options, with an indicator that slides under the current one. | [doc](components/z-segmented/z-segmented.doc.md) · [demo](components/z-segmented/z-segmented.demo.html) |
| `<z-skeleton>` | A shimmering loading placeholder (skeleton). Purely visual and aria-hidden — a decoy holding the space until real content arrives. | [doc](components/z-skeleton/z-skeleton.doc.md) · [demo](components/z-skeleton/z-skeleton.demo.html) |
| `<z-slider>` | A value slider — poses progress (0→1) in the cascade, the skin paints everything. | [doc](components/z-slider/z-slider.doc.md) · [demo](components/z-slider/z-slider.demo.html) · [lab](components/z-slider/z-slider.lab.html) |
| `<z-spinner>` | A loading spinner — inherits tone/size, role=status with an accessible label. The ring spins in CSS. | [doc](components/z-spinner/z-spinner.doc.md) · [demo](components/z-spinner/z-spinner.demo.html) |
| `<z-stat>` | A KPI tile — a label, a big number, an optional delta. `trend` colours the delta (success/danger) and gives it an arrow, in pure CSS. | [doc](components/z-stat/z-stat.doc.md) · [demo](components/z-stat/z-stat.demo.html) |
| `<z-stepper>` | A number stepper wrapping a native <input>: paints − / + zones, the input stays the source of truth. | [doc](components/z-stepper/z-stepper.doc.md) · [demo](components/z-stepper/z-stepper.demo.html) |
| `<z-switch>` | An on/off switch — inherits all z-element states, form-bound, painted by the skin. Immediate effect, unlike a checkbox validated later. | [doc](components/z-switch/z-switch.doc.md) · [demo](components/z-switch/z-switch.demo.html) |
| `<z-tabs>` | Tabs — author writes tabs + panels, z-tabs gives roles, keyboard, and a sliding indicator. Nestable. | [doc](components/z-tabs/z-tabs.doc.md) · [demo](components/z-tabs/z-tabs.demo.html) |
| `<z-tag>` | A tag/chip for keywords, filters, categories — inherits tone & size; optionally removable. | [doc](components/z-tag/z-tag.doc.md) · [demo](components/z-tag/z-tag.demo.html) |
| `<z-toast>` | An ephemeral notification — tone drives colour, auto-closes after `duration` (paused on hover/focus), animated in and out. | [doc](components/z-toast/z-toast.doc.md) · [demo](components/z-toast/z-toast.demo.html) |
| `<z-tooltip>` | A hint bubble shown on hover and keyboard focus — accessible via a [part=tip] piece wired with aria-describedby. | [doc](components/z-tooltip/z-tooltip.doc.md) · [demo](components/z-tooltip/z-tooltip.demo.html) |
<!-- /zoe:elements -->

## Principles

- **Web standards first.** Custom elements, `ElementInternals`, `:state()`, `<dialog>`,
  the Popover API, form association. No framework, no shadow DOM, no build.
- **Accessible by construction.** Roles, ARIA, keyboard and focus are the component's
  job, not the author's.
- **No business logic in a component.** It emits, the page decides. Security is
  server-side.
- **Written twice, it will diverge.** Documentation, autocompletion and the AI reference
  are generated from the code — never maintained by hand.
