/*
	============================================================
	z-button — un bouton, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	`ZButton extends ZElement` : il hérite de TOUTE la palette d'états (over, press,
	release, releaseOut, focus, loading, busy, error, success…) sans en écrire une
	ligne. Il n'ajoute que sa sémantique de bouton (rôle ARIA, focusabilité) et peint
	le sien dans z-button.css. Structure figée → skinnable par les peaux.

	    <z-button>Envoyer</z-button>
	    <z-button loading>Chargement…</z-button>
	    <z-button disabled>Indisponible</z-button>

	Doc narrative : z-button.doc.md · API machine : `static api` ci-dessous.
	Styleguide 1.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZButton extends ZElement {
	static api = {
		tag: "z-button",
		summary: {
			en: "A button — inherits all z-element states, skinnable by themes.",
			fr: "Un bouton — hérite tous les états de z-element, habillable par les peaux.",
			es: "Un botón — hereda todos los estados de z-element, con temas intercambiables."
		},
		attributes: [
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivé : coupe l'interaction.", es: "Deshabilitado: bloquea la interacción." } },
			{ name: "loading", type: "boolean", description: { en: "Loading (skeleton sweep, not clickable).", fr: "En chargement (balayage skeleton, non cliquable).", es: "Cargando (barrido skeleton, no clicable)." } },
			{ name: "busy", type: "boolean", description: { en: "Busy (pulse).", fr: "Occupé (pulse).", es: "Ocupado (pulso)." } },
			{ name: "error", type: "boolean", description: { en: "Error (danger border + shake).", fr: "En erreur (liseré danger + secousse).", es: "Error (borde de peligro + sacudida)." } },
			{ name: "success", type: "boolean", description: { en: "Valid (success border).", fr: "Validé (liseré succès).", es: "Válido (borde de éxito)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states
	};

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "button");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}
}

export function defineZButton() {
	if (!customElements.get("z-button")) customElements.define("z-button", ZButton);
}
defineZButton();
