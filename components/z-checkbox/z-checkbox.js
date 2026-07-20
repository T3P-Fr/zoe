/*
	============================================================
	z-checkbox — une case à cocher, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Premier composant à ANATOMIE, et il s'écrit de DEUX façons — Zoé n'injecte jamais
	rien (ADR-0018), c'est l'auteur (ou l'éditeur Zoé) qui décide du niveau de détail :

	    FORME COURTE — le CSS peint l'hôte, un `::before` fait la case
	    <z-checkbox>J'accepte les conditions</z-checkbox>
	    <z-checkbox current>Déjà cochée</z-checkbox>
	    <z-checkbox disabled>Indisponible</z-checkbox>

	    FORME EN CALQUES — chaque pièce est un élément, donc animable SEULE
	    <z-checkbox>
	      <z-layer part="background"></z-layer>
	      <z-layer part="marker"></z-layer>
	      <z-layer part="ring"></z-layer>
	      <z-layer part="dot"></z-layer>
	      <z-layer part="label">J'accepte les conditions</z-layer>
	    </z-checkbox>

	Les deux lisent les MÊMES tokens (`--z-checkbox--marker__background`,
	`--z-checkbox--dot__color`…) : une skin écrite pour l'une marche sur l'autre. Le
	comportement, lui, est identique — ce fichier ne sait même pas quelle forme il porte.

	`current` = cochée : une SÉLECTION durable, posée EXPRÈS par le composant (clic /
	Espace) — jamais par le clic du socle (z-element ne touche plus current). ZButton
	héritait des états sans anatomie ; z-checkbox prouve qu'on peut EN AVOIR une sans
	rien fermer du light DOM.

	Doc narrative : z-checkbox.doc.md · API machine : `static api` ci-dessous.
	Styleguide 1.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZCheckbox extends ZElement {
	static api = {
		tag: "z-checkbox",
		summary: {
			en: "A checkbox — inherits all z-element states, marker + label anatomy, painted by the skin.",
			fr: "Une case à cocher — hérite tous les états de z-element, anatomie marker + label, peinte par la peau.",
			es: "Una casilla — hereda todos los estados de z-element, anatomía marcador + etiqueta, pintada por el tema."
		},
		attributes: [
			{ name: "current", type: "boolean", description: { en: "Checked: a durable selection set by the component (click / Space).", fr: "Cochée : sélection durable posée par le composant (clic / Espace).", es: "Marcada: selección duradera puesta por el componente (clic / Espacio)." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivée : coupe l'interaction.", es: "Deshabilitada: bloquea la interacción." } },
			{ name: "error", type: "boolean", description: { en: "Invalid (e.g. required and unchecked).", fr: "Invalide (ex. requise et non cochée).", es: "Inválida (p. ej. requerida y sin marcar)." } },
			{ name: "success", type: "boolean", description: { en: "Valid.", fr: "Validée.", es: "Válida." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when the checked state toggles. Read `.checked`.", fr: "Émis quand la coche bascule. Lire `.checked`.", es: "Emitido cuando cambia el marcado. Leer `.checked`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		/*
			LES CALQUES du composant — la liste des rôles qu'il connaît, dans l'ordre où on
			les écrit. C'est ce que l'éditeur Zoé produira, et ce que la doc affiche.
			Les rôles se PARTAGENT entre composants : `dot` veut dire la même chose ici et
			sur une radio, donc une skin peut les peindre d'un coup.
		*/
		layers: [
			{ part: "background", description: { en: "The backdrop of the whole line — usually transparent, it carries effects.", fr: "Le fond de toute la ligne — souvent transparent, il porte les effets.", es: "El fondo de toda la línea — normalmente transparente, lleva los efectos." } },
			{
				part: "marker",
				description: { en: "The box itself (its surface).", fr: "La case elle-même (sa surface).", es: "La casilla en sí (su superficie)." },
				children: [
					{ part: "ring", description: { en: "The box outline — animatable on its own (it can spin, dash…).", fr: "Le cerclage de la case — animable seul (il peut tourner, pointiller…).", es: "El cerco de la casilla — animable por sí solo (puede girar, punteado…)." } },
					{ part: "dot", description: { en: "The mark that appears once checked.", fr: "La marque qui apparaît une fois cochée.", es: "La marca que aparece al marcar." } }
				]
			},
			{
				part: "infos",
				description: { en: "What informs — moved, hidden or animated as one block.", fr: "Ce qui informe — déplacé, caché ou animé d'un bloc.", es: "Lo que informa — movido, ocultado o animado en bloque." },
				children: [
					{ part: "icon", optional: true, description: { en: "Optional, before the label.", fr: "Optionnel, avant le label.", es: "Opcional, antes de la etiqueta." } },
					{ part: "label", description: { en: "Your text.", fr: "Ton texte.", es: "Tu texto." } }
				]
			},
			{ part: "contact", description: { en: "What receives the gesture — covers (and may overflow) the component, invisible.", fr: "Ce qui reçoit le geste — couvre (et peut déborder) le composant, invisible.", es: "Lo que recibe el gesto — cubre (y puede desbordar) el componente, invisible." } }
		]
	};

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "checkbox");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		/* aria-checked reflète current dès le montage (attributeChangedCallback prend
		   ensuite le relais à chaque bascule). */
		this.setAttribute("aria-checked", this.hasAttribute("current") ? "true" : "false");
		this.addEventListener("click", this.#onActivate);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	/*
		On étend le pont attribut→ARIA du socle : current d'une case, c'est aria-checked
		(le socle, lui, ne mappe rien pour current car sa sémantique dépend du composant).
	*/
	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "current") this.setAttribute("aria-checked", value !== null ? "true" : "false");
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
	}

	/* Cochée ? @returns {boolean} */
	get checked() {
		return this.hasAttribute("current");
	}

	/* Coche/décoche par l'API. @param {boolean} value */
	set checked(value) {
		this.setState("current", Boolean(value));
	}

	/* Le clic pointeur bascule la coche (le socle a émis release ; nous, on décide). */
	#onActivate = () => {
		if (this.disabled) return;
		this.#toggle();
	};

	/* Espace bascule (convention native de la case), sans faire défiler la page. */
	#onKey = (event) => {
		if (this.disabled) return;
		if (event.key === " " || event.key === "Spacebar") {
			event.preventDefault();
			this.#toggle();
		}
	};

	/* Bascule current + prévient comme un contrôle de formulaire (événement change). */
	#toggle() {
		this.setState("current", !this.checked);
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}
}

export function defineZCheckbox() {
	if (!customElements.get("z-checkbox")) customElements.define("z-checkbox", ZCheckbox);
}
defineZCheckbox();
