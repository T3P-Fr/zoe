/*
	============================================================
	z-checkbox — une case à cocher, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Premier composant à ANATOMIE. UNE seule forme (principe « peint, pas posé »,
	2026-10-14) : l'auteur écrit la ligne, les pièces sont PEINTES par z-checkbox.css.
	Zoé n'injecte jamais rien (ADR-0018), et n'exige jamais rien non plus.

	    <z-checkbox>J'accepte les conditions</z-checkbox>
	    <z-checkbox current>Déjà cochée</z-checkbox>
	    <z-checkbox disabled>Indisponible</z-checkbox>

	Les pièces : `marker` (la case, son `ring` et son `dot`) est le ::before ; `contact`
	(la zone du doigt, 44 px au moins, centrée sur la case) est le ::after posé par le
	socle. Le texte est le label. Une peau les peint par les tokens du pacte
	(`--z-checkbox--marker__background`, `--z-checkbox--dot__color`…) et peut animer le
	::before : la case tourne, respire, rebondit, sans que le texte bouge.

	`current` = cochée : une SÉLECTION durable, posée EXPRÈS par le composant (clic /
	Espace) — jamais par le clic du socle (z-element ne touche plus current). ZButton
	héritait des états sans anatomie ; z-checkbox prouve qu'on peut EN AVOIR une sans
	rien fermer du light DOM.

	TROIS valeurs, pas deux : `indeterminate` est l'état d'une case « tout cocher » dont
	les enfants ne sont pas d'accord (aria-checked="mixed"). Un geste la tranche toujours
	dans le sens « oui » — comme la case native.

	    <z-checkbox indeterminate>Tout cocher</z-checkbox>

	ELLE PART DANS LE FORMULAIRE, comme un `<input type=checkbox>` : `name` + `value`
	(défaut « on »), rien envoyé si décochée, `required` refuse la soumission, et le
	reset du formulaire la ramène à son HTML d'origine. La plomberie est dans z-element ;
	ici on décide seulement CE QU'ON ENVOIE.

	Doc narrative : z-checkbox.doc.md · API machine : `static api` ci-dessous.
	Styleguide 1.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZCheckbox extends ZElement {
	static api = {
		tag: "z-checkbox",
		example: `<z-checkbox name="cgu" required>J'accepte les conditions</z-checkbox>
<z-checkbox name="lettre" value="hebdo" current>Recevoir la lettre</z-checkbox>
<z-checkbox indeterminate>Tout cocher</z-checkbox>`,
		members: [
			{ kind: "field", name: "checked", type: "boolean", description: { en: "Checked or not — mirrors `current`. Setting it never clears `indeterminate`.", fr: "Cochée ou non — reflet de `current`. La poser ne lève jamais `indeterminate`.", es: "Marcada o no — reflejo de `current`. Ponerla nunca quita `indeterminate`." } },
			{ kind: "field", name: "indeterminate", type: "boolean", description: { en: "The third value (aria-checked=mixed).", fr: "La troisième valeur (aria-checked=mixed).", es: "El tercer valor (aria-checked=mixed)." } },
			{ kind: "field", name: "value", type: "string", description: { en: "What is submitted when checked (default \"on\").", fr: "Ce qui part quand elle est cochée (défaut « on »).", es: "Lo que se envía al estar marcada (por defecto «on»)." } }
		],
		summary: {
			en: "A checkbox — inherits all z-element states, marker + label anatomy, painted by the skin.",
			fr: "Une case à cocher — hérite tous les états de z-element, anatomie marker + label, peinte par la peau.",
			es: "Una casilla — hereda todos los estados de z-element, anatomía marcador + etiqueta, pintada por el tema."
		},
		attributes: [
			{ name: "current", type: "boolean", description: { en: "Checked: a durable selection set by the component (click / Space).", fr: "Cochée : sélection durable posée par le composant (clic / Espace).", es: "Marcada: selección duradera puesta por el componente (clic / Espacio)." } },
			{ name: "indeterminate", type: "boolean", description: { en: "Neither checked nor unchecked — the state of a 'check all' box whose children disagree. Any click resolves it to checked.", fr: "Ni cochée ni décochée — l'état d'une case « tout cocher » dont les enfants ne sont pas d'accord. Un clic la résout en cochée.", es: "Ni marcada ni desmarcada — el estado de una casilla «marcar todo» cuyos hijos no coinciden. Un clic la resuelve en marcada." } },
			{ name: "name", type: "string", description: { en: "Form field name.", fr: "Nom du champ dans le formulaire.", es: "Nombre del campo en el formulario." } },
			{ name: "value", type: "string", description: { en: "What is submitted when checked (default: \"on\", like the native input).", fr: "Ce qui part dans le formulaire quand elle est cochée (défaut : « on », comme l'input natif).", es: "Lo que se envía cuando está marcada (por defecto «on», como el input nativo)." } },
			{ name: "required", type: "boolean", description: { en: "The form is invalid until this box is checked.", fr: "Le formulaire est invalide tant que la case n'est pas cochée.", es: "El formulario es inválido mientras la casilla no esté marcada." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivée : coupe l'interaction.", es: "Deshabilitada: bloquea la interacción." } },
			{ name: "error", type: "boolean", description: { en: "Invalid (e.g. required and unchecked).", fr: "Invalide (ex. requise et non cochée).", es: "Inválida (p. ej. requerida y sin marcar)." } },
			{ name: "success", type: "boolean", description: { en: "Valid.", fr: "Validée.", es: "Válida." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when the checked state toggles. Read `.checked`.", fr: "Émis quand la coche bascule. Lire `.checked`.", es: "Emitido cuando cambia el marcado. Leer `.checked`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: [...ZElement.api.states, "indeterminate"],
		/*
			LES PIÈCES du composant, dans l'ordre où elles se superposent. Une pièce avec
			`pseudo` est PEINTE par le CSS (rien à écrire) ; sans `pseudo`, c'est du CONTENU
			que l'auteur écrit s'il en a. Les rôles se PARTAGENT entre composants : `dot`
			veut dire la même chose ici et sur une radio, donc une peau les peint d'un coup.
		*/
		layers: [
			{
				part: "marker",
				pseudo: "::before",
				description: { en: "The box itself — painted, nothing to write. Its outline is `ring`, its mark is `dot`.", fr: "La case elle-même — peinte, rien à écrire. Son cerclage est `ring`, sa marque est `dot`.", es: "La casilla en sí — pintada, nada que escribir. Su cerco es `ring`, su marca es `dot`." },
				children: [
					{ part: "ring", pseudo: "::before", description: { en: "The box outline (the border of the painted box).", fr: "Le cerclage de la case (le filet de la pièce peinte).", es: "El cerco de la casilla (el borde de la pieza pintada)." } },
					{ part: "dot", pseudo: "::before", description: { en: "The mark that appears once checked (the box's inner square).", fr: "La marque qui apparaît une fois cochée (le carré au centre de la case).", es: "La marca que aparece al marcar (el cuadrado central de la casilla)." } }
				]
			},
			{ part: "icon", optional: true, description: { en: "Optional content, before the text: `<z-layer part=\"icon\">✳</z-layer>`.", fr: "Contenu optionnel, avant le texte : `<z-layer part=\"icon\">✳</z-layer>`.", es: "Contenido opcional, antes del texto: `<z-layer part=\"icon\">✳</z-layer>`." } },
			{ part: "label", description: { en: "Your text — written directly inside the element.", fr: "Votre texte — écrit directement dans l'élément.", es: "Su texto — escrito directamente en el elemento." } },
			{ part: "contact", pseudo: "::after", description: { en: "The touch zone — invisible, at least --z-contact-zone (44px), centred on the box. Set by the core.", fr: "La zone du doigt — invisible, au moins --z-contact-zone (44px), centrée sur la case. Posée par le socle.", es: "La zona táctil — invisible, al menos --z-contact-zone (44px), centrada en la casilla. Puesta por el núcleo." } }
		]
	};

	/*
		`indeterminate` s'ajoute aux durables du socle : il devient pilotable par
		attribut (<z-checkbox indeterminate>), par setState(), et stylable :state().
	*/
	static durableStates = [...ZElement.durableStates, "indeterminate"];

	/*
		`required` et `value` sont observés SANS être des états : ils changent ce qu'on
		envoie au formulaire, pas ce qu'on peint. On les intercepte donc avant le socle
		(sinon il en ferait des :state(), et `:state(value)` ne veut rien dire).
	*/
	static #FORM_ATTRS = ["required", "value"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZCheckbox.#FORM_ATTRS];
	}

	/* L'état de départ, celui que le formulaire restaure au reset (défaut natif). */
	#defaultChecked = false;
	#defaultIndeterminate = false;
	#captured = false;

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "checkbox");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		if (!this.#captured) {
			this.#captured = true;   /* le HTML d'origine, lu UNE fois : re-monter n'est pas re-naître */
			this.#defaultChecked = this.hasAttribute("current");
			this.#defaultIndeterminate = this.hasAttribute("indeterminate");
		}
		this.#syncAria();
		this.#syncForm();
		this.addEventListener("click", this.#onActivate);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	/*
		On étend le pont attribut→ARIA du socle : current d'une case, c'est aria-checked
		(le socle, lui, ne mappe rien pour current car sa sémantique dépend du composant).
	*/
	attributeChangedCallback(name, previous, value) {
		if (ZCheckbox.#FORM_ATTRS.includes(name)) { this.#syncForm(); return; }
		super.attributeChangedCallback(name, previous, value);
		if (name === "current" || name === "indeterminate") {
			this.#syncAria();
			this.#syncForm();
		}
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
	}

	/* Cochée ? @returns {boolean} */
	get checked() {
		return this.hasAttribute("current");
	}

	/*
		Coche/décoche par l'API. Elle NE lève PAS l'indétermination — comme la case
		native, les deux sont indépendants : seul le GESTE de l'utilisateur tranche.
		Sinon un « tout cocher » qui recalcule ses enfants s'effacerait lui-même selon
		l'ordre des deux lignes (piège vu à l'écran, le 2026-07-21).
		@param {boolean} value
	*/
	set checked(value) {
		this.setState("current", Boolean(value));
	}

	/* Ni cochée ni décochée ? @returns {boolean} */
	get indeterminate() {
		return this.hasAttribute("indeterminate");
	}

	/* @param {boolean} value */
	set indeterminate(value) {
		this.setState("indeterminate", Boolean(value));
	}

	/* Ce qui part dans le formulaire quand elle est cochée. @returns {string} */
	get value() {
		return this.getAttribute("value") ?? "on";
	}

	/* @param {string} value */
	set value(value) {
		this.setAttribute("value", value);
	}

	/* Le formulaire est remis à zéro → on revient au HTML d'origine. */
	formResetCallback() {
		this.setState("indeterminate", this.#defaultIndeterminate);
		this.setState("current", this.#defaultChecked);
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

	/*
		Bascule + prévient comme un contrôle de formulaire (événement change).
		Une case INDÉTERMINÉE se résout en COCHÉE, quel que soit son `current` — c'est le
		comportement natif : le geste tranche toujours dans le sens « oui ».
	*/
	#toggle() {
		if (this.indeterminate) {
			this.setState("indeterminate", false);
			this.setState("current", true);
		} else {
			this.setState("current", !this.checked);
		}
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}

	/* aria-checked a TROIS valeurs : "mixed" est celle que l'indétermination annonce. */
	#syncAria() {
		this.setAttribute("aria-checked", this.indeterminate ? "mixed" : String(this.checked));
	}

	/*
		Ce qui part dans le formulaire : la valeur si cochée, RIEN sinon (une case
		décochée n'apparaît pas dans les données — sémantique native). Une case
		indéterminée ne compte pas comme cochée.
	*/
	#syncForm() {
		const on = this.checked && !this.indeterminate;
		this.setFormValue(on ? this.value : null);
		/* Message en anglais comme le reste de l'API ; l'auteur le remplace quand il veut
		   par `box.setValidity("Coche cette case")`. */
		this.setValidity(this.required && !on ? "Please check this box to continue." : "");
	}
}

export function defineZCheckbox() {
	if (!customElements.get("z-checkbox")) customElements.define("z-checkbox", ZCheckbox);
}
defineZCheckbox();
