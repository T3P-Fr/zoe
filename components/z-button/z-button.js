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
		summary: "A button — inherits all z-element states, skinnable by themes.",
		attributes: [
			{ name: "disabled", type: "boolean", description: "Disabled: blocks interaction." },
			{ name: "loading", type: "boolean", description: "Loading (skeleton sweep, not clickable)." },
			{ name: "busy", type: "boolean", description: "Busy (pulse)." },
			{ name: "error", type: "boolean", description: "Error (danger border + shake)." },
			{ name: "success", type: "boolean", description: "Valid (success border)." }
		],
		events: [{ name: "z-state", description: "Emitted on every state change. detail: { states, changed, on }." }],
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
