/*
	============================================================
	z-toast — une notification éphémère, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Cousine de z-alert (même sémantique de région d'état, même croix annulable), mais elle
	VIT et MEURT toute seule : un message qui apparaît, se lit, puis s'efface.

	    <z-toast tone="success">Enregistré.</z-toast>
	    <z-toast tone="danger" dismissible>Le paiement a échoué.</z-toast>
	    <z-toast duration="0" dismissible>Je reste jusqu'à ce qu'on me ferme.</z-toast>

	ACCESSIBLE : `role="status"` (annonce polie) par défaut ; un `tone="danger"` passe
	`role="alert"` (annonce immédiate) — sauf role posé par l'auteur. `dismissible` ajoute
	une croix (peinte, jamais injectée — ADR-0018) qui émet `zoe:dismiss` ANNULABLE avant
	de partir. La sortie s'ANIME (état `exit`) : on ne retire le nœud qu'une fois l'anim finie.

	AUTO-FERMETURE : `duration` (ms, défaut 4000 ; `0` = ne se ferme jamais seule). Le
	survol ET le focus METTENT LE TIMER EN PAUSE — on ne rate pas un message qu'on est en
	train de lire ou de sélectionner ; il reprend là où il en était à la sortie.

	Elle ne gère PAS son placement à l'écran (une pile/un conteneur viendra) — juste la
	carte : son entrée, sa vie, sa sortie.

	Doc narrative : z-toast.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 29.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Zone cliquable de la croix, en em — accordée au CSS (::after). Même valeur que z-alert. */
const CLOSE_ZONE_EM = 2.2;

/* Durée de vie par défaut avant l'auto-fermeture (ms). */
const DEFAULT_DURATION = 4000;

export class ZToast extends ZElement {
	static api = {
		tag: "z-toast",
		summary: {
			en: "An ephemeral notification — tone drives colour, auto-closes after `duration` (paused on hover/focus), animated in and out.",
			fr: "Une notification éphémère — le ton donne la couleur, se ferme seule après `duration` (en pause au survol/focus), animée à l'entrée et à la sortie.",
			es: "Una notificación efímera — el tono da el color, se cierra sola tras `duration` (en pausa al pasar el ratón/foco), animada al entrar y salir."
		},
		attributes: [
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "The kind of message — drives colour and, for danger, the live politeness.", fr: "Le type de message — donne la couleur et, pour un danger, l'urgence d'annonce.", es: "El tipo de mensaje — da el color y, para peligro, la urgencia de anuncio." } },
			{ name: "duration", type: "number", description: { en: "Milliseconds before it auto-closes (default 4000). `0` never auto-closes.", fr: "Millisecondes avant l'auto-fermeture (défaut 4000). `0` ne se ferme jamais seule.", es: "Milisegundos antes de cerrarse sola (por defecto 4000). `0` no se cierra sola." } },
			{ name: "dismissible", type: "boolean", description: { en: "Adds a × ; closes on click (on the ×) or Delete/Backspace when focused.", fr: "Ajoute une × ; ferme au clic (sur la ×) ou Suppr/Retour arrière au focus.", es: "Añade una × ; cierra al clic (en la ×) o Supr/Retroceso con foco." } }
		],
		events: [
			{ name: "zoe:dismiss", description: { en: "Cancelable — fired before closing. preventDefault() to handle it yourself.", fr: "Annulable — émis avant la fermeture. preventDefault() pour le gérer soi-même.", es: "Cancelable — emitido antes de cerrar. preventDefault() para gestionarlo uno mismo." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "background", description: { en: "The card surface — carries the tone.", fr: "La surface de la carte — porte le ton.", es: "La superficie de la tarjeta — lleva el tono." } },
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
		`duration` change le COMPORTEMENT (le minuteur), pas le rendu : on l'intercepte
		avant le socle pour qu'il ne devienne pas un :state(duration).
	*/
	static #BEHAVIOR_ATTRS = ["duration"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZToast.#BEHAVIOR_ATTRS];
	}

	#timer = 0;          /* le setTimeout de l'auto-fermeture (0 = aucun) */
	#remaining = 0;      /* ms restants quand on met en pause */
	#startedAt = 0;      /* horodatage du dernier (re)démarrage, pour calculer le restant */
	#closing = false;    /* déjà en train de partir : on ne rejoue pas la sortie */

	connectedCallback() {
		if (!this.hasAttribute("role")) {
			this.setAttribute("role", this.getAttribute("tone") === "danger" ? "alert" : "status");
		}
		if (this.removableEnabled && !this.hasAttribute("tabindex")) this.tabIndex = 0;

		/* Survol ET focus mettent le minuteur en pause — on ne perd pas un message qu'on
		   lit. Ils utilisent des écouteurs À nous, en plus de ceux du socle (over/focus). */
		this.addEventListener("pointerenter", this.#pause);
		this.addEventListener("pointerleave", this.#resume);
		this.addEventListener("focusin", this.#pause);
		this.addEventListener("focusout", this.#resume);
		this.addEventListener("pointerdown", this.#onPointer);
		this.addEventListener("keydown", this.#onKey);

		super.connectedCallback();   /* z-element câble la grammaire + joue `enter` */
		this.#start();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearTimeout(this.#timer);
	}

	attributeChangedCallback(name, previous, value) {
		if (ZToast.#BEHAVIOR_ATTRS.includes(name)) {
			if (name === "duration" && this.isConnected) this.#start();   /* nouvelle durée → on relance */
			return;
		}
		super.attributeChangedCallback(name, previous, value);
	}

	/* ── API PUBLIQUE ── */

	/* Durée de vie en ms (0 = jamais d'auto-fermeture). @returns {number} */
	get duration() {
		const raw = this.getAttribute("duration");
		if (raw === null) return DEFAULT_DURATION;
		const parsed = Number(raw);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DURATION;
	}

	/* @param {number} value */
	set duration(value) {
		this.setAttribute("duration", String(value));
	}

	/* Fermable à la main ? @returns {boolean} */
	get removableEnabled() {
		return this.hasAttribute("dismissible");
	}

	/*
		Ferme le toast — prévient d'abord (`zoe:dismiss`, annulable), puis ANIME la sortie
		(état `exit`) avant de retirer le nœud. Sans l'attente, disconnectedCallback
		arriverait trop tard pour animer (même raison que `exit` dans z-element).
		@returns {Promise<void>}
	*/
	async dismiss() {
		if (this.#closing) return;
		const allowed = this.dispatchEvent(new CustomEvent("zoe:dismiss", { bubbles: true, cancelable: true }));
		if (!allowed) return;   /* l'auteur a pris la main (preventDefault) */
		this.#closing = true;
		clearTimeout(this.#timer);
		await this.play("exit");   /* joue :state(exit) le temps de --z-dur-exit, puis rend la main */
		this.remove();
	}

	/* ── MÉCANIQUE INTERNE : le minuteur pausable ── */

	/* (Re)démarre le minuteur depuis le début. `duration = 0` → il ne se ferme jamais seul. */
	#start() {
		clearTimeout(this.#timer);
		this.#remaining = this.duration;
		if (this.#remaining <= 0) return;   /* persistant : à la charge de l'auteur / de la croix */
		this.#run();
	}

	/* Arme le timeout pour le temps restant et note l'instant du départ. */
	#run() {
		this.#startedAt = Date.now();
		this.#timer = setTimeout(() => this.dismiss(), this.#remaining);
	}

	/* Met en pause : on éteint le timeout et on retient ce qu'il restait à courir. */
	#pause = () => {
		if (!this.#timer) return;
		clearTimeout(this.#timer);
		this.#timer = 0;
		this.#remaining -= Date.now() - this.#startedAt;
	};

	/* Reprend là où on s'était arrêté (jamais depuis le début : le lecteur n'a pas fini). */
	#resume = () => {
		if (this.#timer || this.#closing) return;
		if (this.#remaining > 0) this.#run();
	};

	/* Clic dans la zone de la croix (bord droit) → fermeture. Même géométrie que z-alert. */
	#onPointer = (event) => {
		if (!this.removableEnabled) return;
		const rect = this.getBoundingClientRect();
		const em = parseFloat(getComputedStyle(this).fontSize) || 16;
		if (event.clientX >= rect.right - CLOSE_ZONE_EM * em) {
			event.preventDefault();
			this.dismiss();
		}
	};

	/* Clavier : Suppr / Retour arrière ferme le toast focalisé. */
	#onKey = (event) => {
		if (!this.removableEnabled) return;
		if (event.key === "Delete" || event.key === "Backspace") {
			event.preventDefault();
			this.dismiss();
		}
	};
}

export function defineZToast() {
	if (!customElements.get("z-toast")) customElements.define("z-toast", ZToast);
}
defineZToast();
