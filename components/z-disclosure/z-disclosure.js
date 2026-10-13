/*
	============================================================
	z-disclosure — un dépli (titre → contenu), bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Un titre qu'on active pour révéler un contenu. `ZDisclosure extends ZElement` : la
	grammaire d'états héritée ; il ajoute la mécanique d'ouverture et son accessibilité.

	    <z-disclosure open>
	      <z-layer part="label">Ce que Zoé garde natif</z-layer>
	      <z-layer part="panel">Titres, paragraphes, liens… lus par Google.</z-layer>
	    </z-disclosure>

	DEUX pièces : `label` = le déclencheur (bouton, focusable, aria-expanded), `panel` =
	le contenu repliable. On ne les injecte pas (ADR-0018) : l'auteur les écrit, le
	composant leur donne leur rôle. `open` = ouvert (attribut + état stylable `:state(open)`).

	ACCESSIBLE pour de vrai : le label devient un `role="button"` qui annonce ouvert/fermé
	(aria-expanded) et pointe le panneau (aria-controls) ; le panneau fermé passe `inert`
	(hors tabulation ET hors lecture d'écran) — un contenu caché ne doit pas se faire lire.

	Doc narrative : z-disclosure.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 12.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;

export class ZDisclosure extends ZElement {
	static api = {
		tag: "z-disclosure",
		example: `<z-disclosure open>
  <z-layer part="label">Ce que Zoé garde natif</z-layer>
  <z-layer part="panel">Titres, paragraphes, liens — lus par les moteurs de recherche.</z-layer>
</z-disclosure>`,
		members: [
			{ kind: "field", name: "open", type: "boolean", description: { en: "Open or closed — mirrors the attribute.", fr: "Ouvert ou fermé — reflet de l'attribut.", es: "Abierto o cerrado — reflejo del atributo." } },
			{ kind: "method", name: "toggle()", type: "void", description: { en: "Opens or closes, and fires `toggle`.", fr: "Ouvre ou ferme, et émet `toggle`.", es: "Abre o cierra, y emite `toggle`." } }
		],
		summary: {
			en: "A disclosure (title → collapsible content) — inherits z-element states, accessible (aria-expanded/controls, inert when closed), animatable.",
			fr: "Un dépli (titre → contenu repliable) — hérite les états de z-element, accessible (aria-expanded/controls, inert fermé), animable.",
			es: "Un desplegable (título → contenido plegable) — hereda los estados de z-element, accesible (aria-expanded/controls, inert cerrado), animable."
		},
		attributes: [
			{ name: "open", type: "boolean", description: { en: "Open: reveals the panel.", fr: "Ouvert : révèle le panneau.", es: "Abierto: revela el panel." } }
		],
		events: [
			{ name: "toggle", description: { en: "Emitted when it opens or closes. Read `.open`.", fr: "Émis à l'ouverture ou la fermeture. Lire `.open`.", es: "Emitido al abrir o cerrar. Leer `.open`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: [...ZElement.api.states, "open"],
		layers: [
			{ part: "label", description: { en: "The trigger — a button that reveals/hides the panel.", fr: "Le déclencheur — un bouton qui révèle/masque le panneau.", es: "El disparador — un botón que revela/oculta el panel." } },
			{ part: "panel", description: { en: "The collapsible content.", fr: "Le contenu repliable.", es: "El contenido plegable." } }
		]
	};

	static durableStates = [...ZElement.durableStates, "open"];

	#label = null;
	#panel = null;

	connectedCallback() {
		this.#label = this.querySelector(":scope > [part=label]");
		this.#panel = this.querySelector(":scope > [part=panel]");
		if (this.#panel && !this.#panel.id) this.#panel.id = `z-disclosure-panel-${++uid}`;
		if (this.#label) {
			if (!this.#label.hasAttribute("role")) this.#label.setAttribute("role", "button");
			if (!this.#label.hasAttribute("tabindex")) this.#label.tabIndex = 0;
			if (this.#panel) this.#label.setAttribute("aria-controls", this.#panel.id);
		}
		this.#sync();
		/* Le clic n'agit que sur le LABEL (pas sur tout le contenu du panneau). */
		this.addEventListener("click", this.#onClick);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "open") this.#sync();
	}

	/* Ouvert ? @returns {boolean} */
	get open() {
		return this.hasAttribute("open");
	}

	/* @param {boolean} value */
	set open(value) {
		this.setState("open", Boolean(value));
	}

	/* Ouvre/ferme et prévient (événement toggle). */
	toggle() {
		this.open = !this.open;
		this.dispatchEvent(new Event("toggle", { bubbles: true }));
	}

	#onClick = (event) => {
		if (this.#label && this.#label.contains(event.target)) this.toggle();
	};

	#onKey = (event) => {
		if (!this.#label || !this.#label.contains(event.target)) return;
		if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
			event.preventDefault();
			this.toggle();
		}
	};

	/*
		Reflète l'état d'ouverture partout : aria-expanded sur le déclencheur, et `inert`
		sur le panneau fermé — il sort de la tabulation ET de la lecture d'écran, sans
		casser l'animation de hauteur (contrairement à `hidden`, qui la tuerait).
	*/
	#sync() {
		if (this.#label) this.#label.setAttribute("aria-expanded", String(this.open));
		if (this.#panel) this.#panel.inert = !this.open;
	}
}

export function defineZDisclosure() {
	if (!customElements.get("z-disclosure")) customElements.define("z-disclosure", ZDisclosure);
}
defineZDisclosure();
