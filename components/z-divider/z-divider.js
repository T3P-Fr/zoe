/*
	============================================================
	z-divider — un séparateur, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Le trait qui sépare deux blocs. Purement décoratif à l'œil, mais SÉMANTIQUE pour
	l'assistance : `role="separator"` + `aria-orientation`, posés par le JS. `ZDivider
	extends ZElement` → la taille (variant du socle) et l'apparition douce sont gratuites.

	    <z-divider></z-divider>              → un simple filet 1px
	    <z-divider>ou</z-divider>            → deux filets encadrent le mot « ou »
	    <z-divider orientation="vertical"></z-divider>  → un filet vertical, haut d'1em

	Le rendu se décide en CSS selon ce que l'auteur écrit (Zoé n'injecte rien, ADR-0018) :
	vide → une ligne continue ; avec du texte (ou un `[part=label]`) → deux lignes qui
	poussent de part et d'autre du label centré. Le JS ne fait que la sémantique ARIA.

	Doc narrative : z-divider.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 16.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZDivider extends ZElement {
	static api = {
		tag: "z-divider",
		example: `<z-divider></z-divider>
<z-divider>ou</z-divider>
<z-divider orientation="vertical"></z-divider>`,
		members: [
			{ kind: "field", name: "orientation", type: "\"horizontal\" | \"vertical\"", description: { en: "Mirrors the attribute.", fr: "Reflet de l'attribut.", es: "Reflejo del atributo." } }
		],
		summary: {
			en: "A separator — a plain rule, or two rules framing a centred label. role=separator + aria-orientation.",
			fr: "Un séparateur — un simple filet, ou deux filets encadrant un label centré. role=separator + aria-orientation.",
			es: "Un separador — un filete simple, o dos filetes enmarcando una etiqueta centrada. role=separator + aria-orientation."
		},
		attributes: [
			{ name: "orientation", type: "\"horizontal\" | \"vertical\"", description: { en: "Direction of the rule: horizontal (default) or vertical (a short 1em stroke).", fr: "Le sens du filet : horizontal (défaut) ou vertical (un court trait d'1em).", es: "La dirección del filete: horizontal (predeterminado) o vertical (un trazo corto de 1em)." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant (label and stroke follow in em).", fr: "Le facteur de taille, via le variant du socle (label et trait suivent en em).", es: "El factor de tamaño, mediante el variante del zócalo (etiqueta y trazo siguen en em)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/* Un seul rôle réel : ce qui INFORME (le label optionnel au centre). Les deux
		   filets sont peints en CSS (::before/::after) — ils ne sont pas des pièces. */
		layers: [
			{
				part: "infos",
				description: { en: "What informs — the centred label, if any.", fr: "Ce qui informe — le label centré, s'il y en a un.", es: "Lo que informa — la etiqueta centrada, si la hay." },
				children: [{ part: "label", optional: true, description: { en: "Optional centred text (the two rules frame it).", fr: "Texte centré optionnel (les deux filets l'encadrent).", es: "Texto centrado opcional (los dos filetes lo enmarcan)." } }]
			}
		]
	};

	/* On observe `orientation` EN PLUS des états du socle, pour refléter l'ARIA à chaque
	   changement. @returns {string[]} */
	static get observedAttributes() {
		return [...super.observedAttributes, "orientation"];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
		this.#syncOrientation();
		super.connectedCallback();   /* z-element câble la grammaire d'états */
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "orientation") this.#syncOrientation();
	}

	/* L'orientation du filet. @returns {"horizontal"|"vertical"} */
	get orientation() {
		return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
	}

	/* @param {string} value */
	set orientation(value) {
		this.setAttribute("orientation", value);
	}

	/* Reflète l'orientation en ARIA (aria-orientation n'est utile qu'à la verticale, mais
	   on la pose toujours pour être explicite envers l'assistance). */
	#syncOrientation() {
		this.setAttribute("aria-orientation", this.orientation);
	}
}

export function defineZDivider() {
	if (!customElements.get("z-divider")) customElements.define("z-divider", ZDivider);
}
defineZDivider();
