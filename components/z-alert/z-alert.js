/*
	============================================================
	z-alert — un message contextuel, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Une bannière qui informe ou alerte. `ZAlert extends ZElement` → tone/size hérités : la
	couleur du message (info, succès, danger) vient du variant `tone`, sans une ligne de
	plus. Il ajoute la sémantique de région d'état et, en option, un bouton de fermeture.

	    <z-alert>Enregistré.</z-alert>
	    <z-alert tone="danger" dismissible>Le paiement a échoué.</z-alert>
	    <z-alert tone="success">Tout est à jour.</z-alert>

	ACCESSIBLE : `role="status"` par défaut (annonce polie) ; un message de danger passe
	`role="alert"` (annonce immédiate) — sauf si l'auteur a posé son propre role. `dismissible`
	ajoute une croix (peinte, jamais injectée — ADR-0018) qui émet `zoe:dismiss` ANNULABLE
	avant de retirer la bannière : l'auteur peut `preventDefault()` pour animer ou confirmer.

	Doc narrative : z-alert.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 13.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Zone cliquable de la croix, en em — accordée au CSS (::after). */
const CLOSE_ZONE_EM = 2.2;

export class ZAlert extends ZElement {
	static api = {
		tag: "z-alert",
		summary: {
			en: "A contextual message — tone drives the colour, role=status (or alert for danger). Optionally dismissible.",
			fr: "Un message contextuel — le ton donne la couleur, role=status (ou alert pour un danger). Fermable en option.",
			es: "Un mensaje contextual — el tono da el color, role=status (o alert para peligro). Descartable opcionalmente."
		},
		attributes: [
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "The kind of message — drives colour and, for danger, the live politeness.", fr: "Le type de message — donne la couleur et, pour un danger, l'urgence d'annonce.", es: "El tipo de mensaje — da el color y, para peligro, la urgencia de anuncio." } },
			{ name: "dismissible", type: "boolean", description: { en: "Adds a × ; closes on click (on the ×) or Delete/Backspace when focused.", fr: "Ajoute une × ; ferme au clic (sur la ×) ou Suppr/Retour arrière au focus.", es: "Añade una × ; cierra al clic (en la ×) o Supr/Retroceso con foco." } }
		],
		events: [
			{ name: "zoe:dismiss", description: { en: "Cancelable — fired before closing. preventDefault() to handle it yourself.", fr: "Annulable — émis avant la fermeture. preventDefault() pour le gérer soi-même.", es: "Cancelable — emitido antes de cerrar. preventDefault() para gestionarlo uno mismo." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "background", description: { en: "The banner surface — carries the tone.", fr: "La surface de la bannière — porte le ton.", es: "La superficie del banner — lleva el tono." } },
			{
				part: "infos",
				description: { en: "What informs — icon + message.", fr: "Ce qui informe — icône + message.", es: "Lo que informa — icono + mensaje." },
				children: [
					{ part: "icon", optional: true, description: { en: "Optional status icon.", fr: "Icône de statut optionnelle.", es: "Icono de estado opcional." } },
					{ part: "label", description: { en: "The message.", fr: "Le message.", es: "El mensaje." } }
				]
			}
		]
	};

	connectedCallback() {
		if (!this.hasAttribute("role")) {
			this.setAttribute("role", this.getAttribute("tone") === "danger" ? "alert" : "status");
		}
		if (this.removableEnabled) this.#syncDismissable();
		this.addEventListener("pointerdown", this.#onPointer);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "dismissible") this.#syncDismissable();
	}

	/* Fermable ? @returns {boolean} */
	get removableEnabled() {
		return this.hasAttribute("dismissible");
	}

	/* Ferme la bannière — prévient d'abord (`zoe:dismiss`, annulable). */
	dismiss() {
		const allowed = this.dispatchEvent(new CustomEvent("zoe:dismiss", { bubbles: true, cancelable: true }));
		if (allowed) this.remove();
	}

	/* Une bannière fermable est focusable (le clavier doit pouvoir la fermer). */
	#syncDismissable() {
		if (this.removableEnabled && !this.hasAttribute("tabindex")) this.tabIndex = 0;
	}

	/* Clic dans la zone de la croix (bord droit) → fermeture. */
	#onPointer = (event) => {
		if (!this.removableEnabled) return;
		const rect = this.getBoundingClientRect();
		const em = parseFloat(getComputedStyle(this).fontSize) || 16;
		if (event.clientX >= rect.right - CLOSE_ZONE_EM * em) {
			event.preventDefault();
			this.dismiss();
		}
	};

	/* Clavier : Suppr / Retour arrière ferme la bannière focalisée. */
	#onKey = (event) => {
		if (!this.removableEnabled) return;
		if (event.key === "Delete" || event.key === "Backspace") {
			event.preventDefault();
			this.dismiss();
		}
	};
}

export function defineZAlert() {
	if (!customElements.get("z-alert")) customElements.define("z-alert", ZAlert);
}
defineZAlert();
