/*
	============================================================
	z-progress — une barre de progression, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	`ZProgress extends ZElement` : la grammaire d'états + les variants tone/size hérités.
	Il n'ajoute que sa sémantique de barre — `role="progressbar"` et les valeurs ARIA —
	et publie un token que le CSS lit pour dessiner le remplissage.

	    <z-progress value="60"></z-progress>
	    <z-progress value="3" max="4"></z-progress>
	    <z-progress indeterminate></z-progress>

	`value` sur `max` (défaut 100) → un pourcentage, posé dans `--z-progress__value` : le
	CSS n'a qu'à en faire une largeur. `indeterminate` = on ne sait pas encore combien
	(un balayage tourne, aria-valuenow disparaît, comme le veut la norme).

	Zoé n'injecte rien (ADR-0018) : la barre est peinte (::before ou calque `marker`),
	jamais ajoutée. Pas de logique métier ici — on affiche un nombre, c'est tout.

	Doc narrative : z-progress.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 9.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZProgress extends ZElement {
	static api = {
		tag: "z-progress",
		example: `<z-progress value="40"></z-progress>
<z-progress value="3" max="5" tone="success"></z-progress>
<z-progress indeterminate></z-progress>`,
		members: [
			{ kind: "field", name: "value", type: "number", description: { en: "Current amount (mirrors the attribute).", fr: "La quantité actuelle (reflet de l'attribut).", es: "La cantidad actual (reflejo del atributo)." } },
			{ kind: "field", name: "max", type: "number", description: { en: "The total (default 100).", fr: "Le total (défaut 100).", es: "El total (predeterminado 100)." } },
			{ kind: "field", name: "indeterminate", type: "boolean", description: { en: "Unknown amount — a sweep animates.", fr: "Quantité inconnue — un balayage anime.", es: "Cantidad desconocida — un barrido anima." } }
		],
		summary: {
			en: "A progress bar — inherits z-element states + tone/size, painted by the skin. value/max → a percentage the CSS draws.",
			fr: "Une barre de progression — hérite les états de z-element + tone/size, peinte par la peau. value/max → un pourcentage que le CSS dessine.",
			es: "Una barra de progreso — hereda los estados de z-element + tone/size, pintada por el tema. value/max → un porcentaje que el CSS dibuja."
		},
		attributes: [
			{ name: "value", type: "number", description: { en: "Current amount (0…max).", fr: "La quantité actuelle (0…max).", es: "La cantidad actual (0…max)." } },
			{ name: "max", type: "number", description: { en: "The total (default 100).", fr: "Le total (défaut 100).", es: "El total (predeterminado 100)." } },
			{ name: "indeterminate", type: "boolean", description: { en: "Unknown amount — a sweep animates, aria-valuenow is dropped.", fr: "Quantité inconnue — un balayage s'anime, aria-valuenow disparaît.", es: "Cantidad desconocida — un barrido se anima, aria-valuenow desaparece." } },
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Fill colour, from the socle variant.", fr: "La couleur du remplissage, via le variant du socle.", es: "El color del relleno, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant.", fr: "Le facteur de taille, via le variant du socle.", es: "El factor de tamaño, mediante el variante del zócalo." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: [...ZElement.api.states, "indeterminate"],
		layers: [
			{ part: "background", description: { en: "The track (the empty rail).", fr: "La piste (le rail vide).", es: "La pista (el riel vacío)." } },
			{ part: "marker", description: { en: "The fill — its width is the progress.", fr: "Le remplissage — sa largeur est la progression.", es: "El relleno — su ancho es el progreso." } }
		]
	};

	/* `value`, `max` et `indeterminate` sont observés ; indeterminate est aussi un état. */
	static durableStates = [...ZElement.durableStates, "indeterminate"];
	static #NUM_ATTRS = ["value", "max"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZProgress.#NUM_ATTRS];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "progressbar");
		this.#sync();
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZProgress.#NUM_ATTRS.includes(name)) { this.#sync(); return; }
		super.attributeChangedCallback(name, previous, value);
		if (name === "indeterminate") this.#sync();
	}

	/* La quantité actuelle. @returns {number} */
	get value() {
		return Number(this.getAttribute("value")) || 0;
	}

	/* @param {number} v */
	set value(v) {
		this.setAttribute("value", String(v));
	}

	/* Le total. @returns {number} */
	get max() {
		const m = Number(this.getAttribute("max"));
		return m > 0 ? m : 100;
	}

	/* @param {number} v */
	set max(v) {
		this.setAttribute("max", String(v));
	}

	/* Inconnu ? @returns {boolean} */
	get indeterminate() {
		return this.hasAttribute("indeterminate");
	}

	/* @param {boolean} v */
	set indeterminate(v) {
		this.setState("indeterminate", Boolean(v));
	}

	/*
		Publie le pourcentage pour le CSS et tient les valeurs ARIA à jour. Sur
		`indeterminate`, aria-valuenow est RETIRÉ (norme WAI-ARIA : on ne prétend pas
		connaître une valeur qu'on n'a pas).
	*/
	#sync() {
		const ratio = Math.max(0, Math.min(1, this.value / this.max));
		this.style.setProperty("--z-progress__value", `${(ratio * 100).toFixed(2)}%`);
		this.setAttribute("aria-valuemin", "0");
		this.setAttribute("aria-valuemax", String(this.max));
		if (this.indeterminate) this.removeAttribute("aria-valuenow");
		else this.setAttribute("aria-valuenow", String(this.value));
	}
}

export function defineZProgress() {
	if (!customElements.get("z-progress")) customElements.define("z-progress", ZProgress);
}
defineZProgress();
