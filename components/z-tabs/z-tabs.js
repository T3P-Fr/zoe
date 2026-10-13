/*
	============================================================
	z-tabs — des onglets, bâtis SUR z-element (Chemin A)
	------------------------------------------------------------
	Une barre d'onglets qui révèle un panneau à la fois. L'auteur écrit la structure —
	Zoé n'injecte rien (ADR-0018) : il donne les rôles ARIA, le clavier, et fait glisser
	l'indicateur sous l'onglet actif.

	    <z-tabs value="livraison">
	      <div part="tablist">
	        <button part="tab" value="livraison">Livraison</button>
	        <button part="tab" value="retours">Retours</button>
	      </div>
	      <div part="panel" value="livraison">Sous 48 h en France.</div>
	      <div part="panel" value="retours">30 jours, sans justificatif.</div>
	    </z-tabs>

	PIÈCES : `[part=tablist]` = le rail des onglets (role="tablist") ; `[part=tab]` = un
	onglet (role="tab") ; `[part=panel]` = son contenu (role="tabpanel"). On associe un
	onglet à son panneau par un `value` PARTAGÉ, ou, à défaut, par l'ORDRE (1er onglet ↔
	1er panneau).

	ACCESSIBLE pour de vrai : chaque onglet annonce aria-selected et pointe son panneau
	(aria-controls) ; chaque panneau pointe son onglet (aria-labelledby) et se cache
	(`hidden`) quand il n'est pas actif. Roving tabindex : le groupe est UN arrêt de
	tabulation (l'onglet actif porte le focus, les autres en sortent). Clavier : ← → (ou
	↑ ↓) se promènent ET activent, Home/End aux extrémités (activation automatique, APG).

	IMBRIQUABLE : un z-tabs vit à l'intérieur d'un panneau d'un autre z-tabs sans qu'ils
	se volent leurs onglets — tout est SCOPÉ au z-tabs le plus proche (comme #owns dans
	z-element, `closest("z-tabs") === this`).

	Doc narrative : z-tabs.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 28.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;

/* Les touches qui déplacent l'onglet actif, et de combien. Les deux axes marchent : la
   barre peut être en ligne (← →) ou en colonne (↑ ↓). */
const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export class ZTabs extends ZElement {
	static api = {
		tag: "z-tabs",
		example: `<z-tabs value="livraison">
  <div part="tablist">
    <button part="tab" value="livraison">Livraison</button>
    <button part="tab" value="retours">Retours</button>
  </div>
  <div part="panel" value="livraison">Sous 48 h en France.</div>
  <div part="panel" value="retours">30 jours, sans justificatif.</div>
</z-tabs>`,
		members: [
			{ kind: "field", name: "value", type: "string", description: { en: "The active tab's value. Setting it selects without firing `change`.", fr: "La valeur de l'onglet actif. La poser sélectionne sans émettre `change`.", es: "El valor de la pestaña activa. Ponerlo selecciona sin emitir `change`." } },
			{ kind: "field", name: "selectedIndex", type: "number", description: { en: "Index of the active tab (-1 when none).", fr: "L'index de l'onglet actif (-1 si aucun).", es: "Índice de la pestaña activa (-1 si ninguna)." } },
			{ kind: "field", name: "tabs · panels", type: "Element[]", description: { en: "The `[part=tab]` and `[part=panel]` children of THIS z-tabs.", fr: "Les enfants `[part=tab]` et `[part=panel]` de CE z-tabs.", es: "Los hijos `[part=tab]` y `[part=panel]` de ESTE z-tabs." } },
			{ kind: "field", name: "selectedTab", type: "Element | null", description: { en: "The active tab.", fr: "L'onglet actif.", es: "La pestaña activa." } }
		],
		summary: {
			en: "Tabs — author writes tabs + panels, z-tabs gives roles, keyboard, and a sliding indicator. Nestable.",
			fr: "Des onglets — l'auteur écrit onglets + panneaux, z-tabs donne rôles, clavier et un indicateur glissant. Imbriquable.",
			es: "Pestañas — el autor escribe pestañas + paneles, z-tabs da roles, teclado y un indicador deslizante. Anidable."
		},
		attributes: [
			{ name: "value", type: "string", description: { en: "The active tab's value — set it to preselect, read it to know the choice.", fr: "La valeur de l'onglet actif — la poser présélectionne, la lire donne le choix.", es: "El valor de la pestaña activa — ponerlo preselecciona, leerlo da la elección." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when the active tab changes. Read `.value` / `.selectedIndex`.", fr: "Émis quand l'onglet actif change. Lire `.value` / `.selectedIndex`.", es: "Emitido cuando cambia la pestaña activa. Leer `.value` / `.selectedIndex`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "tablist", description: { en: "The rail that holds the tabs (role=tablist).", fr: "Le rail qui porte les onglets (role=tablist).", es: "El riel que sostiene las pestañas (role=tablist)." } },
			{ part: "tab", description: { en: "A tab (role=tab) — active one carries aria-selected + current.", fr: "Un onglet (role=tab) — l'actif porte aria-selected + current.", es: "Una pestaña (role=tab) — la activa lleva aria-selected + current." } },
			{ part: "panel", description: { en: "A tab's content (role=tabpanel) — hidden unless active.", fr: "Le contenu d'un onglet (role=tabpanel) — caché sauf s'il est actif.", es: "El contenido de una pestaña (role=tabpanel) — oculto salvo si está activa." } }
		],
		cssVars: [
			{ name: "--z-tabs__indicator-x", description: { en: "Set by z-tabs — the active tab's left offset (drives the sliding underline).", fr: "Posée par z-tabs — le décalage gauche de l'onglet actif (pilote le soulignement glissant).", es: "Puesta por z-tabs — el desplazamiento izquierdo de la pestaña activa (mueve el subrayado deslizante)." } },
			{ name: "--z-tabs__indicator-w", description: { en: "Set by z-tabs — the active tab's width.", fr: "Posée par z-tabs — la largeur de l'onglet actif.", es: "Puesta por z-tabs — el ancho de la pestaña activa." } }
		]
	};

	/*
		`value` change le CHOIX, pas le rendu de l'hôte : on l'intercepte avant le socle
		pour qu'il ne devienne pas un :state(value), qui ne voudrait rien dire (même règle
		que `value` sur z-checkbox).
	*/
	static #BEHAVIOR_ATTRS = ["value"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZTabs.#BEHAVIOR_ATTRS];
	}

	#tablist = null;
	/* Le DOM peut arriver après nous, ou changer : on recâble rôles + associations. */
	#watcher = new MutationObserver(() => this.#wireStructure());
	/* La barre peut être redimensionnée (fenêtre, police) : l'indicateur suit. */
	#resizer = new ResizeObserver(() => this.#moveIndicator());

	connectedCallback() {
		this.addEventListener("click", this.#onClick);
		this.addEventListener("keydown", this.#onKey);
		this.#watcher.observe(this, { childList: true, subtree: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		this.#wireStructure();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
		this.#resizer.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZTabs.#BEHAVIOR_ATTRS.includes(name)) {
			if (name === "value" && value !== null) this.#select(this.#tabByValue(value), false);
			return;
		}
		super.attributeChangedCallback(name, previous, value);
	}

	/* ── API PUBLIQUE ── */

	/* Les onglets de CE z-tabs (pas ceux d'un z-tabs imbriqué). @returns {Element[]} */
	get tabs() {
		return [...this.querySelectorAll("[part=tab]")]
			.filter((tab) => tab.closest("z-tabs") === this);
	}

	/* Les panneaux de CE z-tabs. @returns {Element[]} */
	get panels() {
		return [...this.querySelectorAll("[part=panel]")]
			.filter((panel) => panel.closest("z-tabs") === this);
	}

	/* L'onglet actif, s'il y en a un. @returns {Element|null} */
	get selectedTab() {
		return this.tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? null;
	}

	/* L'index de l'onglet actif (-1 si aucun). @returns {number} */
	get selectedIndex() {
		return this.tabs.indexOf(this.selectedTab);
	}

	/* @param {number} index */
	set selectedIndex(index) {
		this.#select(this.tabs[index] ?? null, false);
	}

	/* La valeur de l'onglet actif (son `value`, ou son index en chaîne). @returns {string} */
	get value() {
		const tab = this.selectedTab;
		if (!tab) return "";
		return tab.getAttribute("value") ?? String(this.tabs.indexOf(tab));
	}

	/* Choisit par la valeur, SANS événement (c'est le programme qui parle). @param {string} value */
	set value(value) {
		this.#select(this.#tabByValue(String(value)), false);
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Câble (ou recâble) toute la structure écrite par l'auteur : rôles ARIA, ids et
		liens croisés onglet↔panneau, puis choisit l'onglet de départ. Idempotent — on peut
		l'appeler à chaque mutation du DOM sans rien casser.
	*/
	#wireStructure() {
		const tabs = this.tabs;
		if (!tabs.length) return;

		/* Le rail : role=tablist sur le [part=tablist] s'il existe (sinon l'auteur a mis
		   les onglets à plat — les rôles d'onglet suffisent, mais on prévient en dev). */
		this.#resizer.disconnect();
		this.#tablist = [...this.querySelectorAll("[part=tablist]")].find((el) => el.closest("z-tabs") === this) ?? null;
		if (this.#tablist) {
			if (!this.#tablist.hasAttribute("role")) this.#tablist.setAttribute("role", "tablist");
			this.#resizer.observe(this.#tablist);
		}

		/* Chaque onglet ↔ son panneau : ids, role, aria-controls / aria-labelledby. */
		for (const tab of tabs) {
			const panel = this.#panelFor(tab);
			if (!tab.id) tab.id = `z-tab-${++uid}`;
			if (panel && !panel.id) panel.id = `z-tabpanel-${++uid}`;
			if (!tab.hasAttribute("role")) tab.setAttribute("role", "tab");
			if (panel) {
				tab.setAttribute("aria-controls", panel.id);
				if (!panel.hasAttribute("role")) panel.setAttribute("role", "tabpanel");
				panel.setAttribute("aria-labelledby", tab.id);
				if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;   /* un panneau focusable (APG) */
			}
		}

		/* Onglet de départ : `value` de l'hôte → l'onglet déjà marqué actif → le premier. */
		const wanted = this.getAttribute("value");
		const start = (wanted !== null && this.#tabByValue(wanted))
			|| this.selectedTab
			|| tabs[0];
		this.#select(start, false);
	}

	/*
		Active `tab` : aria-selected, `current`, roving tabindex, panneaux montrés/cachés,
		indicateur déplacé. `emit` = faux quand c'est le programme (value=, wire) qui parle ;
		vrai quand c'est un GESTE de l'utilisateur (clic, flèche) → on émet `change`.
		@param {Element|null} tab  @param {boolean} [emit]
	*/
	#select(tab, emit = true) {
		const tabs = this.tabs;
		if (!tab || !tabs.includes(tab)) return;
		const changed = tab !== this.selectedTab;

		for (const one of tabs) {
			const active = one === tab;
			one.setAttribute("aria-selected", String(active));
			/* `current` = l'onglet actif (grammaire Zoé). Sur un élément simple c'est un
			   attribut que le CSS peint ; il double aria-selected pour rester stylable. */
			one.toggleAttribute("current", active);
			one.tabIndex = active && !this.disabled ? 0 : -1;   /* roving : un seul arrêt */
			const panel = this.#panelFor(one);
			if (panel) panel.hidden = !active;
		}
		if (this.hasAttribute("value")) this.setAttribute("value", tab.getAttribute("value") ?? String(tabs.indexOf(tab)));

		this.#moveIndicator();
		if (emit && changed) this.dispatchEvent(new Event("change", { bubbles: true }));
	}

	/* Le panneau d'un onglet : par `value` partagé si présent, sinon par l'ORDRE.
	   @param {Element} tab  @returns {Element|null} */
	#panelFor(tab) {
		const value = tab.getAttribute("value");
		const panels = this.panels;
		if (value !== null) {
			const byValue = panels.find((panel) => panel.getAttribute("value") === value);
			if (byValue) return byValue;
		}
		return panels[this.tabs.indexOf(tab)] ?? null;
	}

	/* L'onglet portant cette valeur (ou null). @param {string} value @returns {Element|null} */
	#tabByValue(value) {
		return this.tabs.find((tab) => (tab.getAttribute("value") ?? String(this.tabs.indexOf(tab))) === value) ?? null;
	}

	/*
		L'indicateur glissant : on MESURE l'onglet actif (position + largeur dans le rail)
		et on pose deux variables CSS ; le soulignement, lui, glisse tout seul (transform +
		transition au ressort, côté CSS). Le JS ne fait que donner la cible, jamais l'anim.
	*/
	#moveIndicator() {
		const tab = this.selectedTab;
		const host = this.#tablist ?? this;
		if (!tab) return;
		const from = host.getBoundingClientRect();
		const rect = tab.getBoundingClientRect();
		host.style.setProperty("--z-tabs__indicator-x", `${rect.left - from.left + host.scrollLeft}px`);
		host.style.setProperty("--z-tabs__indicator-w", `${rect.width}px`);
	}

	/* Le clic sur un onglet l'active (le socle a déjà émis release ; nous, on choisit). */
	#onClick = (event) => {
		if (this.disabled) return;
		const tab = this.tabs.find((one) => one.contains(event.target));
		if (tab) this.#select(tab);
	};

	/*
		Flèches : on se promène ET on active (activation automatique APG). Home/End vont
		aux extrémités. Circulaire. SCOPÉ : la touche bulle depuis un onglet ; si ce n'est
		pas l'un des nôtres, un z-tabs imbriqué l'a déjà traitée — on ne s'en mêle pas.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		const tabs = this.tabs;
		const usable = tabs.filter((tab) => !tab.hasAttribute("disabled") && tab.getAttribute("aria-disabled") !== "true");
		if (!usable.includes(event.target)) return;   /* pas un de mes onglets */
		if (!usable.length) return;

		const from = usable.indexOf(event.target);
		let next;
		if (event.key === "Home") next = 0;
		else if (event.key === "End") next = usable.length - 1;
		else if (STEP[event.key] !== undefined) next = (from + STEP[event.key] + usable.length) % usable.length;
		else return;

		event.preventDefault();   /* la page ne défile pas sous nos flèches */
		const tab = usable[next];
		tab.focus();
		this.#select(tab);
	};
}

export function defineZTabs() {
	if (!customElements.get("z-tabs")) customElements.define("z-tabs", ZTabs);
}
defineZTabs();
