/*
	============================================================
	z-state (tool) — DÉCORER TON PROPRE ÉLÉMENT d'états (Chemin B)
	------------------------------------------------------------
	`<z-state>` entoure l'élément de TON choix (ton `<button>`, ta carte…) et lui
	donne toute la palette d'états de Zoé — SANS que tu écrives une ligne d'état.
	Tu écris ensuite TON CSS contre TA structure, avec les presets de z-motion.

	    <z-state>
	      <button><img src="…"> Envoyer</button>
	    </z-state>

	C'est le MÊME moteur que core/z-element (z-state extends z-element) : « z-state,
	dans son concept, EST le z-element ». Ici, il est juste enregistré sous la balise
	`<z-state>` pour l'usage décorateur.

	Voir tools/z-state/z-state.doc.md · core/z-element pour le moteur.
	Styleguide tool.state
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZState extends ZElement {
	/* Même API que la base — z-state EST z-element, en décorateur. */
	static api = {
		tag: "z-state",
		summary: "Décore ton propre élément d'états (Chemin B). Même moteur que z-element.",
		attributes: ZElement.api.attributes,
		events: ZElement.api.events,
		states: ZElement.api.states,
		cssVars: ZElement.api.cssVars
	};
}

export function defineZState() {
	if (!customElements.get("z-state")) customElements.define("z-state", ZState);
}
defineZState();
