/*
	============================================================
	z-radio — un bouton radio, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Même anatomie que z-checkbox — un marker (le rond) + un label (VOTRE texte), zéro
	balise injectée — mais une LOI d'usage différente : une radio ne se DÉ-sélectionne
	pas elle-même. On en choisit une AUTRE. C'est le groupe qui éteint la précédente
	(voir z-radio-group) ; seule, une z-radio ne sait que s'allumer.

	    <z-radio value="fr">Français</z-radio>
	    <z-radio value="en" current>English</z-radio>
	    <z-radio value="es" disabled>Español</z-radio>

	`current` = sélectionnée : la même sélection durable que partout dans Zoé, posée
	EXPRÈS par le composant (clic / Espace / Entrée) — jamais par le clic du socle.
	Utilisable seule (elle bascule alors comme un interrupteur… sans jamais s'éteindre),
	mais sa vraie maison est `<z-radio-group>`, qui lui donne l'exclusivité et le clavier.

	Doc narrative : z-radio.doc.md · API machine : `static api` ci-dessous.
	Styleguide 2.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZRadio extends ZElement {
	static api = {
		tag: "z-radio",
		example: `<z-radio value="fr">Français</z-radio>
<z-radio value="en" current>English</z-radio>
<z-radio value="es" disabled>Español</z-radio>`,
		members: [
			{ kind: "field", name: "checked", type: "boolean", description: { en: "Chosen or not — mirrors `current`. Only code can set it to false.", fr: "Choisie ou non — reflet de `current`. Seul le code peut la passer à false.", es: "Elegida o no — reflejo de `current`. Solo el código puede ponerla en false." } },
			{ kind: "field", name: "value", type: "string", description: { en: "The `value` attribute, or the label text when absent.", fr: "L'attribut `value`, ou le texte du label à défaut.", es: "El atributo `value`, o el texto de la etiqueta si falta." } }
		],
		summary: {
			en: "A radio button — z-element states, marker + label anatomy, selects but never unselects itself.",
			fr: "Un bouton radio — états de z-element, anatomie marker + label, se sélectionne mais ne se dé-sélectionne jamais lui-même.",
			es: "Un botón de radio — estados de z-element, anatomía marcador + etiqueta, se selecciona pero nunca se deselecciona solo."
		},
		attributes: [
			{ name: "value", type: "string", description: { en: "The value this radio carries — read by z-radio-group.", fr: "La valeur que porte cette radio — lue par z-radio-group.", es: "El valor que lleva esta radio — leído por z-radio-group." } },
			{ name: "current", type: "boolean", description: { en: "Selected: a durable selection set by the component (click / Space / Enter).", fr: "Sélectionnée : sélection durable posée par le composant (clic / Espace / Entrée).", es: "Seleccionada: selección duradera puesta por el componente (clic / Espacio / Enter)." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivée : coupe l'interaction.", es: "Deshabilitada: bloquea la interacción." } },
			{ name: "error", type: "boolean", description: { en: "Invalid (e.g. a required choice is missing).", fr: "Invalide (ex. un choix requis manque).", es: "Inválida (p. ej. falta una elección requerida)." } },
			{ name: "success", type: "boolean", description: { en: "Valid.", fr: "Validée.", es: "Válida." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when this radio becomes selected. Read `.checked` / `.value`.", fr: "Émis quand cette radio devient sélectionnée. Lire `.checked` / `.value`.", es: "Emitido cuando esta radio queda seleccionada. Leer `.checked` / `.value`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		/*
			LES CALQUES — la structure canonique de Zoé, aux mêmes rôles que z-checkbox.
			Le `dot` d'ici et celui d'une case, c'est le même mot : une skin les peint
			d'un coup. Seule la FORME diffère (rond), et elle porte le sens.
		*/
		layers: [
			{ part: "background", description: { en: "The backdrop of the whole line — usually transparent, it carries effects.", fr: "Le fond de toute la ligne — souvent transparent, il porte les effets.", es: "El fondo de toda la línea — normalmente transparente, lleva los efectos." } },
			{
				part: "marker",
				description: { en: "The round itself (its surface).", fr: "Le rond lui-même (sa surface).", es: "El círculo en sí (su superficie)." },
				children: [
					{ part: "ring", description: { en: "Its outline — animatable on its own.", fr: "Son cerclage — animable seul.", es: "Su cerco — animable por sí solo." } },
					{ part: "dot", description: { en: "The mark that appears once chosen.", fr: "La marque qui apparaît une fois choisie.", es: "La marca que aparece al elegir." } }
				]
			},
			{
				part: "infos",
				description: { en: "What informs — moved, hidden or animated as one block.", fr: "Ce qui informe — déplacé, caché ou animé d'un bloc.", es: "Lo que informa — movido, ocultado o animado en bloque." },
				children: [
					{ part: "icon", optional: true, description: { en: "Optional, before the label.", fr: "Optionnel, avant le label.", es: "Opcional, antes de la etiqueta." } },
					{ part: "label", description: { en: "Your text.", fr: "Votre texte.", es: "Su texto." } }
				]
			},
			{ part: "contact", description: { en: "What receives the gesture — covers (and may overflow) the component, invisible.", fr: "Ce qui reçoit le geste — couvre (et peut déborder) le composant, invisible.", es: "Lo que recibe el gesto — cubre (y puede desbordar) el componente, invisible." } }
		]
	};

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "radio");
		/* Seule, une radio est atteignable au clavier. Dans un groupe, z-radio-group
		   reprend la main (roving tabindex) : une seule tabulation pour tout le groupe. */
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		this.setAttribute("aria-checked", this.hasAttribute("current") ? "true" : "false");
		this.addEventListener("click", this.#onActivate);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	/*
		On étend le pont attribut→ARIA du socle : current d'une radio, c'est aria-checked
		(le socle ne mappe rien pour current — sa sémantique dépend du composant).
	*/
	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "current") this.setAttribute("aria-checked", value !== null ? "true" : "false");
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
	}

	/* La valeur portée (à défaut : le texte du label — le cas courant marche sans rien
	   écrire). @returns {string} */
	get value() {
		return this.getAttribute("value") ?? this.textContent.trim();
	}

	/* @param {string} value */
	set value(value) {
		this.setAttribute("value", value);
	}

	/* Sélectionnée ? @returns {boolean} */
	get checked() {
		return this.hasAttribute("current");
	}

	/* Sélectionne/dé-sélectionne par l'API (le programme, lui, a le droit d'éteindre —
	   c'est le GESTE utilisateur qui ne le peut pas). @param {boolean} value */
	set checked(value) {
		this.setState("current", Boolean(value));
	}

	/* Le clic pointeur sélectionne — et ne dé-sélectionne JAMAIS : c'est toute la
	   différence avec z-checkbox. Re-cliquer sa propre radio ne fait rien (pas même un
	   `change` : rien n'a changé). */
	#onActivate = () => {
		if (this.disabled || this.checked) return;
		this.#select();
	};

	/* Espace ET Entrée sélectionnent (conventions natives de la radio), sans faire
	   défiler la page. Les flèches, elles, appartiennent au GROUPE — on n'y touche pas. */
	#onKey = (event) => {
		if (this.disabled) return;
		if (event.key === " " || event.key === "Spacebar" || event.key === "Enter") {
			event.preventDefault();
			if (!this.checked) this.#select();
		}
	};

	/* Allume current + prévient comme un contrôle de formulaire (le groupe écoute). */
	#select() {
		this.setState("current", true);
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}
}

export function defineZRadio() {
	if (!customElements.get("z-radio")) customElements.define("z-radio", ZRadio);
}
defineZRadio();
