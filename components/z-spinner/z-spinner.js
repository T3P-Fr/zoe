/*
	============================================================
	z-spinner — un indicateur d'attente, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Le plus minuscule : `ZSpinner extends ZElement` pour hériter tone/size, et il n'ajoute
	qu'une sémantique d'attente — `role="status"` + un libellé lu par les lecteurs d'écran.
	Le mouvement (l'anneau qui tourne) est peint en CSS ; ici, presque rien.

	    <z-spinner></z-spinner>
	    <z-spinner tone="main" size="l"></z-spinner>
	    <z-spinner label="Envoi en cours…"></z-spinner>

	`label` = le texte d'accessibilité (défaut « Chargement… »). Visuellement, il n'y a que
	l'anneau ; un lecteur d'écran, lui, annonce l'attente. Le look (vitesse, épaisseur)
	appartient au CSS et à la peau — ici, la structure et l'accessibilité.

	Doc narrative : z-spinner.doc.md · API machine : `static api` ci-dessous.
	Styleguide 10.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

const DEFAULT_LABEL = "Chargement…";

export class ZSpinner extends ZElement {
	static api = {
		tag: "z-spinner",
		example: `<z-spinner label="Chargement des commandes"></z-spinner>
<z-spinner size="s" tone="soft"></z-spinner>`,
		summary: {
			en: "A loading spinner — inherits tone/size, role=status with an accessible label. The ring spins in CSS.",
			fr: "Un indicateur d'attente — hérite tone/size, role=status avec un libellé accessible. L'anneau tourne en CSS.",
			es: "Un indicador de espera — hereda tone/size, role=status con una etiqueta accesible. El anillo gira en CSS."
		},
		attributes: [
			{ name: "label", type: "string", description: { en: "Accessible text read by screen readers (default: \"Chargement…\").", fr: "Le texte d'accessibilité lu par les lecteurs d'écran (défaut : « Chargement… »).", es: "El texto accesible leído por los lectores de pantalla (predeterminado: «Chargement…»)." } },
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Colour, from the socle variant.", fr: "La couleur, via le variant du socle.", es: "El color, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant.", fr: "Le facteur de taille, via le variant du socle.", es: "El factor de tamaño, mediante el variante del zócalo." } }
		],
		events: [
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [{ part: "marker", description: { en: "The spinning ring.", fr: "L'anneau qui tourne.", es: "El anillo que gira." } }]
	};

	static #ATTRS = ["label"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZSpinner.#ATTRS];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "status");
		this.#syncLabel();
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZSpinner.#ATTRS.includes(name)) { this.#syncLabel(); return; }
		super.attributeChangedCallback(name, previous, value);
	}

	/* Le texte d'attente. @returns {string} */
	get label() {
		return this.getAttribute("label") || DEFAULT_LABEL;
	}

	/* @param {string} v */
	set label(v) {
		this.setAttribute("label", v);
	}

	/* L'anneau n'a pas de texte visible → aria-label porte l'annonce. */
	#syncLabel() {
		this.setAttribute("aria-label", this.label);
	}
}

export function defineZSpinner() {
	if (!customElements.get("z-spinner")) customElements.define("z-spinner", ZSpinner);
}
defineZSpinner();
