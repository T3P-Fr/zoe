/*
	============================================================
	z-accordion — un GROUPE de z-disclosure (coordination, rien d'autre)
	------------------------------------------------------------
	Une z-disclosure sait s'ouvrir toute seule. L'accordéon n'apporte qu'UNE chose (zéro
	logique métier) : quand il est `exclusive`, l'ouverture de l'un ferme les autres.

	    <z-accordion exclusive>
	      <z-disclosure open>
	        <z-layer part="label">Livraison</z-layer>
	        <z-layer part="panel">Sous 48 h en France.</z-layer>
	      </z-disclosure>
	      <z-disclosure>
	        <z-layer part="label">Retours</z-layer>
	        <z-layer part="panel">30 jours, sans justificatif.</z-layer>
	      </z-disclosure>
	    </z-accordion>

	Pas de rôle ARIA propre : chaque z-disclosure porte déjà le sien (label = bouton
	aria-expanded, panneau inert). L'accordéon n'injecte rien (ADR-0018) et n'ajoute
	aucune sémantique — il ÉCOUTE l'événement `toggle` de ses déplis et coordonne.

	SCOPÉ : il ne voit que les z-disclosure dont il est l'accordéon LE PLUS PROCHE —
	imbriquer un accordéon dans un dépli ne les mélange pas (même loi que z-radio-group).

	Doc narrative : z-accordion.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 27.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";
import "../z-disclosure/z-disclosure.js";

export class ZAccordion extends ZElement {
	static api = {
		tag: "z-accordion",
		summary: {
			en: "A group of z-disclosure — when `exclusive`, opening one closes the others. Coordination only.",
			fr: "Un groupe de z-disclosure — en `exclusive`, ouvrir l'un ferme les autres. Coordination seule.",
			es: "Un grupo de z-disclosure — en `exclusive`, abrir uno cierra los demás. Solo coordinación."
		},
		attributes: [
			{ name: "exclusive", type: "boolean", description: { en: "Only one disclosure open at a time — opening one closes the others.", fr: "Un seul dépli ouvert à la fois — ouvrir l'un ferme les autres.", es: "Solo un desplegable abierto a la vez — abrir uno cierra los demás." } }
		],
		events: [
			{ name: "toggle", description: { en: "Bubbles from the disclosure that opened or closed; the group has already closed the others if exclusive.", fr: "Bulle depuis le dépli qui s'est ouvert/fermé ; le groupe a déjà fermé les autres si exclusive.", es: "Burbujea desde el desplegable que se abrió o cerró; el grupo ya cerró los demás si es exclusive." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-accordion__gap", description: { en: "Space between the stacked disclosures.", fr: "L'écart entre les déplis empilés.", es: "El espacio entre los desplegables apilados." } }
		]
	};

	/*
		`exclusive` change le COMPORTEMENT, pas le rendu : on l'intercepte avant le socle
		pour qu'il ne devienne pas un :state(exclusive), qui ne voudrait rien dire.
	*/
	static #BEHAVIOR_ATTRS = ["exclusive"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZAccordion.#BEHAVIOR_ATTRS];
	}

	/* Le DOM peut arriver après nous, ou changer : on resynchronise le verrou d'exclusivité. */
	#watcher = new MutationObserver(() => { if (this.exclusive) this.#enforceExclusive(); });

	connectedCallback() {
		/* capture : on ferme les autres AVANT que le `toggle` n'atteigne l'écouteur de
		   l'auteur, pour qu'il lise un état déjà cohérent. */
		this.addEventListener("toggle", this.#onToggle, true);
		this.#watcher.observe(this, { childList: true, subtree: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		if (this.exclusive) this.#enforceExclusive();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZAccordion.#BEHAVIOR_ATTRS.includes(name)) {
			if (name === "exclusive" && value !== null) this.#enforceExclusive();
			return;
		}
		super.attributeChangedCallback(name, previous, value);
	}

	/* ── API PUBLIQUE ── */

	/* Un seul dépli ouvert à la fois ? @returns {boolean} */
	get exclusive() {
		return this.hasAttribute("exclusive");
	}

	/* @param {boolean} value */
	set exclusive(value) {
		this.toggleAttribute("exclusive", Boolean(value));
	}

	/* Les déplis de CE groupe (pas ceux d'un accordéon imbriqué). @returns {Element[]} */
	get disclosures() {
		return [...this.querySelectorAll("z-disclosure")]
			.filter((disclosure) => disclosure.closest("z-accordion") === this);
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Un dépli vient de basculer → s'il s'est OUVERT et qu'on est exclusive, on ferme
		les autres. On pose `.open = false` (l'API du dépli), jamais un geste : fermer
		programmatiquement ne rejoue pas l'onde de clic sur des déplis qu'on n'a pas touchés.
	*/
	#onToggle = (event) => {
		const disclosure = event.target;
		if (!this.disclosures.includes(disclosure)) return;   /* un accordéon imbriqué gère les siens */
		if (this.exclusive && disclosure.open) this.#closeOthers(disclosure);
	};

	/* Ferme tous les déplis sauf `keep`. @param {Element} keep */
	#closeOthers(keep) {
		for (const disclosure of this.disclosures) {
			if (disclosure !== keep && disclosure.open) disclosure.open = false;
		}
	}

	/*
		Repasse à l'invariant « au plus un ouvert » : si l'auteur a écrit plusieurs
		<z-disclosure open> sous un accordéon exclusive, le PREMIER gagne (comme deux
		`current` écrits à la main dans un radiogroup).
	*/
	#enforceExclusive() {
		const open = this.disclosures.filter((disclosure) => disclosure.open);
		if (open.length > 1) this.#closeOthers(open[0]);
	}
}

export function defineZAccordion() {
	if (!customElements.get("z-accordion")) customElements.define("z-accordion", ZAccordion);
}
defineZAccordion();
