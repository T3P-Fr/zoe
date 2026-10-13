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
	avant de partir. La sortie s'ANIME (état `exit`) : le nœud n'est retiré qu'une fois
	l'animation finie. L'auteur peut `preventDefault()` pour confirmer, ou fermer lui-même.

	Doc narrative : z-alert.doc.md · API machine : `static api` ci-dessous.
	Styleguide 13.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Zone cliquable de la croix, en em — accordée au CSS (::after). */
const CLOSE_ZONE_EM = 2.2;

export class ZAlert extends ZElement {
	static api = {
		tag: "z-alert",
		example: `<z-alert tone="success">Vos modifications sont enregistrées.</z-alert>
<z-alert tone="danger" dismissible>Le paiement a été refusé.</z-alert>`,
		members: [
			{ kind: "method", name: "dismiss()", type: "Promise<void>", description: { en: "Closes the alert: fires cancelable `zoe:dismiss`, then plays `exit` and removes the node.", fr: "Ferme l'alerte : émet `zoe:dismiss` (annulable), puis joue `exit` et retire le nœud.", es: "Cierra la alerta: emite `zoe:dismiss` (cancelable), luego reproduce `exit` y quita el nodo." } }
		],
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

	/*
		`dismissible` change le COMPORTEMENT (focusable, fermable), pas le rendu d'un état :
		on l'observe pour rebrancher la focusabilité quand il change, et on l'intercepte
		avant le socle pour qu'il ne devienne pas un :state(dismissible) sans sens.
	*/
	static get observedAttributes() {
		return [...super.observedAttributes, "dismissible"];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) {
			this.setAttribute("role", this.getAttribute("tone") === "danger" ? "alert" : "status");
		}
		this.#syncDismissable();
		this.addEventListener("pointerdown", this.#onPointer);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		if (name === "dismissible") { this.#syncDismissable(); return; }
		super.attributeChangedCallback(name, previous, value);
	}

	/* Fermable ? @returns {boolean} */
	get removableEnabled() {
		return this.hasAttribute("dismissible");
	}

	/*
		Ferme la bannière — prévient d'abord (`zoe:dismiss`, annulable), puis ANIME la sortie
		(état `exit`) avant de retirer le nœud. Sans l'attente, disconnectedCallback
		arriverait trop tard pour animer (même raison que `exit` dans z-element).
		@returns {Promise<void>} résolue une fois le nœud retiré (ou tout de suite si annulé)
	*/
	async dismiss() {
		const allowed = this.dispatchEvent(new CustomEvent("zoe:dismiss", { bubbles: true, cancelable: true }));
		if (!allowed) return;
		await this.play("exit");   /* joue :state(exit) le temps de --z-dur-exit, puis rend la main */
		this.remove();
	}

	/*
		Une bannière fermable est focusable (le clavier doit pouvoir la fermer) ; une
		bannière qui cesse de l'être sort de la tabulation. On ne touche qu'au tabindex
		qu'on a posé nous-mêmes, jamais à celui de l'auteur.
	*/
	#syncDismissable() {
		if (this.removableEnabled) {
			if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
		} else if (this.getAttribute("tabindex") === "0") {
			this.removeAttribute("tabindex");
		}
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
