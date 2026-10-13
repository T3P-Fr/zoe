/*
	============================================================
	z-menu — un menu d'actions, bâti SUR z-popover (le pattern ARIA « menu button »)
	------------------------------------------------------------
	Un bouton, une liste d'actions qui s'ouvre dessous : renommer, dupliquer, supprimer.
	`ZMenu extends ZPopover` : l'ancrage, le top layer, la fermeture au clic dehors et
	l'animation sont hérités tels quels ; ici on ajoute ce qui fait d'un panneau un MENU —
	les rôles, le clavier, l'activation d'un item.

	    <z-menu>
	      <z-button part="trigger" type="button">Actions ▾</z-button>
	      <div part="panel">
	        <button part="item" value="rename">Renommer</button>
	        <button part="item" value="duplicate">Dupliquer</button>
	        <hr part="separator">
	        <button part="item" value="delete" tone="danger">Supprimer</button>
	      </div>
	    </z-menu>

	PIÈCES (écrites par l'auteur, Zoé n'injecte rien — ADR-0018) : `trigger` et `panel`
	comme z-popover ; dans le panneau, `item` = une action (un <button>, ou un <a href>
	qui navigue naturellement), `separator` = un trait entre deux groupes.

	ACCESSIBLE pour de vrai (APG « menu button ») : le déclencheur annonce aria-haspopup=
	"menu", le panneau est role="menu", chaque item role="menuitem" avec tabindex="-1" —
	le menu est UN arrêt de tabulation (le déclencheur), le focus se promène DEDANS aux
	flèches. À l'ouverture le focus va au premier item (au dernier si on a ouvert par ↑).
	↓/↑ circulaires, Home/End, une lettre saute à l'item qui commence par elle, Entrée/
	Espace activent, Échap ferme et rend le focus au déclencheur, Tab ferme et continue
	sa route. Les items `disabled` / aria-disabled sont sautés.

	ACTIVER un item (clic ou clavier) émet `select` — ANNULABLE — avec { value, item }
	(`value` = l'attribut `value`, ou le texte de l'item), puis ferme le menu. Un
	`preventDefault()` sur `select` le garde ouvert (un menu de bascules, par exemple).
	Le composant émet, la page décide : zéro logique métier.

	Doc narrative : z-menu.doc.md · API machine : `static api` ci-dessous.
	Styleguide 34.0
	============================================================
*/

import { ZPopover, pointerTarget } from "../z-popover/z-popover.js";

/* Les touches qui déplacent le focus d'un item à l'autre, et de combien. */
const STEP = { ArrowDown: 1, ArrowUp: -1 };

export class ZMenu extends ZPopover {
	static api = {
		tag: "z-menu",
		example: `<z-menu>
  <z-button part="trigger" type="button">Actions ▾</z-button>
  <div part="panel">
    <button part="item" value="rename">Renommer</button>
    <button part="item" value="duplicate">Dupliquer</button>
    <hr part="separator">
    <button part="item" value="delete" tone="danger">Supprimer</button>
  </div>
</z-menu>`,
		members: [
			...ZPopover.api.members,
			{ kind: "field", name: "items", type: "Element[]", description: { en: "The `[part=item]` elements of THIS menu (not those of a nested menu), disabled ones included.", fr: "Les `[part=item]` de CE menu (pas ceux d'un menu imbriqué), désactivés compris.", es: "Los `[part=item]` de ESTE menú (no los de un menú anidado), deshabilitados incluidos." } }
		],
		summary: {
			en: "An actions menu (ARIA menu button) on top of z-popover — roles, roving focus, arrow keys, type-ahead; activating an item fires cancelable `select` then closes.",
			fr: "Un menu d'actions (ARIA menu button) bâti sur z-popover — rôles, focus itinérant, flèches, saut à la lettre ; activer un item émet `select` (annulable) puis ferme.",
			es: "Un menú de acciones (ARIA menu button) sobre z-popover — roles, foco itinerante, flechas, salto por letra; activar un ítem emite `select` (cancelable) y luego cierra."
		},
		attributes: ZPopover.api.attributes,
		events: [
			{ name: "select", description: { en: "Emitted when an item is activated (click, Enter, Space). Bubbles, cancelable: preventDefault() keeps the menu open. detail: { value, item } — value is the item's `value` attribute, or its text.", fr: "Émis quand un item est activé (clic, Entrée, Espace). Bulle, annulable : preventDefault() garde le menu ouvert. detail : { value, item } — value est l'attribut `value` de l'item, ou son texte.", es: "Emitido al activar un ítem (clic, Enter, Espacio). Burbujea, cancelable: preventDefault() mantiene el menú abierto. detail: { value, item } — value es el atributo `value` del ítem, o su texto." } },
			...ZPopover.api.events
		],
		states: ZPopover.api.states,
		layers: [
			{ part: "trigger", description: { en: "The menu button — any focusable element. Gets aria-haspopup=\"menu\", aria-expanded, aria-controls.", fr: "Le bouton du menu — n'importe quel élément focusable. Reçoit aria-haspopup=\"menu\", aria-expanded, aria-controls.", es: "El botón del menú — cualquier elemento enfocable. Recibe aria-haspopup=\"menu\", aria-expanded, aria-controls." } },
			{
				part: "panel",
				description: { en: "The list of actions (role=menu) — anchored, in the top layer, animated by z-popover.", fr: "La liste des actions (role=menu) — ancrée, en top layer, animée par z-popover.", es: "La lista de acciones (role=menu) — anclada, en top layer, animada por z-popover." },
				children: [
					{ part: "item", description: { en: "One action (role=menuitem, tabindex=-1) — a <button> or an <a href>. `value` names it in `select`; `disabled` / aria-disabled skips it.", fr: "Une action (role=menuitem, tabindex=-1) — un <button> ou un <a href>. `value` la nomme dans `select` ; `disabled` / aria-disabled la saute.", es: "Una acción (role=menuitem, tabindex=-1) — un <button> o un <a href>. `value` la nombra en `select`; `disabled` / aria-disabled la salta." } },
					{ part: "separator", optional: true, description: { en: "A rule between two groups of actions (role=separator).", fr: "Un trait entre deux groupes d'actions (role=separator).", es: "Una línea entre dos grupos de acciones (role=separator)." } }
				]
			}
		],
		cssVars: [
			{ name: "--z-popover__x", description: { en: "Set on the panel by the inherited z-popover anchoring — its left edge in the viewport, a bare number of px.", fr: "Posée sur le panneau par l'ancrage hérité de z-popover — son bord gauche dans la fenêtre, un nombre nu de px.", es: "Puesta en el panel por el anclaje heredado de z-popover — su borde izquierdo en la ventana, un número sin unidad en px." } },
			{ name: "--z-popover__y", description: { en: "Set on the panel by the inherited z-popover anchoring — its top edge in the viewport, a bare number of px.", fr: "Posée sur le panneau par l'ancrage hérité de z-popover — son bord haut dans la fenêtre, un nombre nu de px.", es: "Puesta en el panel por el anclaje heredado de z-popover — su borde superior en la ventana, un número sin unidad en px." } }
		]
	};

	#focusLast = false;   /* ouvert par ↑ : le focus ira au DERNIER item, pas au premier */
	/* Les items peuvent arriver après nous, ou changer : on recâble leurs rôles. */
	#watcher = new MutationObserver(() => this.#wireItems());

	connectedCallback() {
		super.connectedCallback();   /* z-popover résout trigger + panel, pose popover, aria-controls, puis z-element */
		if (this.trigger) this.trigger.setAttribute("aria-haspopup", "menu");
		if (this.panel) {
			if (!this.panel.hasAttribute("role")) this.panel.setAttribute("role", "menu");
			this.#watcher.observe(this.panel, { childList: true, subtree: true });
		}
		this.#wireItems();
		this.addEventListener("click", this.#onItemClick);
		this.addEventListener("keydown", this.#onKeyDown);
		this.addEventListener("keyup", this.#onKeyUp);
		this.addEventListener("pointerover", this.#onPointerOver);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
	}

	/*
		On étend le reflet de `open` du parent : un menu qui S'OUVRE donne le focus à un
		item (APG) — le premier, ou le dernier si on est arrivé par ↑. Le parent a déjà
		montré le panneau quand on passe ici, donc le focus prend.
	*/
	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "open" && value !== null && this.isConnected) this.#focusEdge();
	}

	/* ── API PUBLIQUE ── */

	/* Les items de CE menu (pas ceux d'un menu imbriqué), désactivés compris. @returns {Element[]} */
	get items() {
		if (!this.panel) return [];
		return [...this.panel.querySelectorAll("[part=item]")]
			.filter((item) => item.closest("z-menu") === this);
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Donne leur rôle aux pièces écrites par l'auteur. tabindex=-1 sur CHAQUE item, sans
		exception : le menu est un seul arrêt de tabulation (le déclencheur), le focus
		circule dedans aux flèches — et Tab en sort. Un <a href> perd donc sa place dans
		la tabulation, c'est voulu. Idempotent : rappelé à chaque mutation.
	*/
	#wireItems() {
		for (const item of this.items) {
			if (!item.hasAttribute("role")) item.setAttribute("role", "menuitem");
			item.tabIndex = -1;
		}
		if (!this.panel) return;
		for (const separator of this.panel.querySelectorAll("[part=separator]")) {
			if (separator.closest("z-menu") === this && !separator.hasAttribute("role")) separator.setAttribute("role", "separator");
		}
	}

	/* Les items qu'on peut atteindre : ni `disabled`, ni aria-disabled. @returns {Element[]} */
	#usable() {
		return this.items.filter((item) => !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true");
	}

	/* L'item atteignable qui contient `target` (un clic peut viser une icône dedans). @returns {Element|null} */
	#itemOf(target) {
		return this.#usable().find((item) => item.contains(target)) ?? null;
	}

	/* Le focus entre dans le menu : premier item, ou dernier si on a ouvert par ↑. */
	#focusEdge() {
		const usable = this.#usable();
		const target = this.#focusLast ? usable[usable.length - 1] : usable[0];
		this.#focusLast = false;
		target?.focus();
	}

	/*
		Active un item : `select` part — annulable — PUIS le menu se ferme. L'auteur qui
		fait preventDefault() garde le menu ouvert (un menu de bascules). Un <a href>
		navigue de lui-même : on ne touche pas à son clic.
		@param {Element} item
	*/
	#activate(item) {
		const value = item.getAttribute("value") ?? item.textContent.trim();
		const allowed = this.dispatchEvent(new CustomEvent("select", {
			bubbles: true,
			cancelable: true,
			detail: { value, item }
		}));
		if (allowed) this.open = false;
	}

	/* Le clic sur un item l'active (le clic sur le déclencheur, lui, est à z-popover).
	   `pointerTarget` : le socle capture le pointeur sur l'hôte, le clic d'un <button>
	   natif arrive donc SUR l'hôte — on retrouve l'item sous le doigt (piège documenté
	   dans z-popover.js). */
	#onItemClick = (event) => {
		if (this.disabled) return;
		const item = this.#itemOf(pointerTarget(event, this));
		if (item) this.#activate(item);
	};

	/*
		Le survol DÉPLACE le focus (APG) : un seul item est « en main » à la fois, celui
		sous le pointeur — et les flèches repartent de là, comme dans un menu natif.
	*/
	#onPointerOver = (event) => {
		const item = this.#itemOf(event.target);
		if (item && item !== document.activeElement) item.focus({ preventScroll: true });
	};

	/*
		LE CLAVIER DU MENU. Sur le déclencheur : ↓ ouvre et focalise le premier item, ↑
		ouvre et focalise le dernier (Entrée/Espace, c'est le bouton qui s'en charge : son
		clic bascule). Dans le menu : flèches circulaires, Home/End, saut à la lettre,
		Entrée active tout de suite, Espace au relâché (comme un bouton natif — et on
		empêche la page de défiler entre-temps), Tab ferme SANS être retenu : le focus
		continue sa route dans la page. Échap est à z-popover (ferme + rend le focus).
		SCOPÉ : une touche venue d'un menu imbriqué ne vise aucun de nos items.
	*/
	#onKeyDown = (event) => {
		if (this.disabled) return;
		if (this.trigger && this.trigger.contains(event.target)) { this.#onTriggerKey(event); return; }
		const usable = this.#usable();
		const index = usable.findIndex((item) => item.contains(event.target));
		if (index === -1) return;   /* pas un de mes items */

		if (event.key in STEP) {
			event.preventDefault();
			usable[(index + STEP[event.key] + usable.length) % usable.length].focus();
		} else if (event.key === "Home") {
			event.preventDefault();
			usable[0].focus();
		} else if (event.key === "End") {
			event.preventDefault();
			usable[usable.length - 1].focus();
		} else if (event.key === "Enter") {
			event.preventDefault();
			usable[index].click();
		} else if (this.#isSpace(event)) {
			event.preventDefault();   /* pas de défilement ; l'activation vient au relâché */
		} else if (event.key === "Tab") {
			this.open = false;
		} else {
			this.#jumpToLetter(event, usable, index);
		}
	};

	/* Espace active au RELÂCHÉ, comme le bouton natif et z-button. */
	#onKeyUp = (event) => {
		if (this.disabled || !this.#isSpace(event)) return;
		const item = this.#itemOf(event.target);
		if (item) { event.preventDefault(); item.click(); }
	};

	/* ↓ / ↑ sur le déclencheur : ouvrir et entrer par le bon bout. @param {KeyboardEvent} event */
	#onTriggerKey(event) {
		if (!(event.key in STEP)) return;
		event.preventDefault();
		this.#focusLast = event.key === "ArrowUp";
		if (this.open) this.#focusEdge();
		else this.open = true;
	}

	/*
		Une lettre tapée : le focus saute au PROCHAIN item (après le courant, en boucle)
		dont le texte commence par elle. Les raccourcis (Ctrl, Alt, Cmd) ne sont pas des lettres.
		@param {KeyboardEvent} event @param {Element[]} usable @param {number} from
	*/
	#jumpToLetter(event, usable, from) {
		if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
		const letter = event.key.toLowerCase();
		for (let step = 1; step <= usable.length; step++) {
			const item = usable[(from + step) % usable.length];
			if (item.textContent.trim().toLowerCase().startsWith(letter)) {
				event.preventDefault();
				item.focus();
				return;
			}
		}
	}

	/* @param {KeyboardEvent} event @returns {boolean} */
	#isSpace(event) {
		return event.key === " " || event.key === "Spacebar";
	}
}

export function defineZMenu() {
	if (!customElements.get("z-menu")) customElements.define("z-menu", ZMenu);
}
defineZMenu();
