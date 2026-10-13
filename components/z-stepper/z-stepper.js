/*
	============================================================
	z-stepper — un incrémenteur autour d'un <input> natif (Chemin B)
	------------------------------------------------------------
	Ici Zoé ENTOURE le standard au lieu de le remplacer : l'auteur met un vrai
	`<input type="number">` dedans, et z-stepper lui ajoute deux zones cliquables — un
	« − » à gauche, un « + » à droite — peintes en CSS (::before / ::after). Zoé
	n'injecte AUCUNE balise (ADR-0018) : les boutons sont dessinés, leur zone est
	détectée en JS au pointerdown (comme la croix de z-tag), et l'input reste la SOURCE
	DE VÉRITÉ.

	    <z-stepper>
	      <input type="number" value="3" min="0" max="9" step="1">
	    </z-stepper>

	POURQUOI un input natif dedans : le formulaire, le clavier (↑/↓ déjà gérés par
	l'input), la saisie directe, la validation min/max — tout ça, le navigateur le fait
	déjà parfaitement. z-stepper n'ajoute QUE les deux boutons et l'accessibilité de
	groupe (`role="group"` + `aria-label`). Rien à câbler côté formulaire : c'est
	l'input qui part dans les données.

	Aux bornes, le bouton concerné se DÉSACTIVE visuellement : on reflète `at-min` /
	`at-max` sur l'hôte pour que le CSS les grise. On déclenche un vrai événement `input`
	(et `change`) sur l'input à chaque cran, pour que tout écouteur natif suive.

	Doc narrative : z-stepper.doc.md · API machine : `static api` ci-dessous.
	Styleguide 25.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* La largeur d'une zone bouton (− ou +), en em — accordée au CSS (padding + ::before/::after). */
const BUTTON_ZONE_EM = 2.2;

export class ZStepper extends ZElement {
	static api = {
		tag: "z-stepper",
		example: `<z-stepper aria-label="Quantité">
  <input type="number" name="qty" value="3" min="0" max="9" step="1">
</z-stepper>`,
		members: [
			{ kind: "field", name: "value", type: "number", description: { en: "The inner input's value.", fr: "La valeur de l'input interne.", es: "El valor del input interno." } },
			{ kind: "method", name: "stepUp() · stepDown()", type: "void", description: { en: "One increment up or down — the same path as the − / + zones.", fr: "Un cran vers le haut ou le bas — le même chemin que les zones − / +.", es: "Un paso arriba o abajo — el mismo camino que las zonas − / +." } }
		],
		summary: {
			en: "A number stepper wrapping a native <input>: paints − / + zones, the input stays the source of truth.",
			fr: "Un incrémenteur autour d'un <input> natif : peint les zones − / +, l'input reste la source de vérité.",
			es: "Un incrementador alrededor de un <input> nativo: pinta las zonas − / +, el input sigue siendo la fuente de verdad."
		},
		attributes: [
			{ name: "aria-label", type: "string", description: { en: "Names the group for assistive tech (e.g. \"Quantity\").", fr: "Nomme le groupe pour les technologies d'assistance (ex. « Quantité »).", es: "Nombra el grupo para tecnologías de asistencia (p. ej. «Cantidad»)." } },
			{ name: "disabled", type: "boolean", description: { en: "Disables the − / + zones (the input keeps its own disabled state).", fr: "Désactive les zones − / + (l'input garde son propre disabled).", es: "Deshabilita las zonas − / + (el input conserva su propio disabled)." } },
			{ name: "at-min", type: "boolean", description: { en: "Set by z-stepper (read-only): the value cannot go lower — the CSS greys the − zone.", fr: "Posé par z-stepper (lecture seule) : la valeur ne peut plus descendre — le CSS grise la zone −.", es: "Puesto por z-stepper (solo lectura): el valor no puede bajar más — el CSS atenúa la zona −." } },
			{ name: "at-max", type: "boolean", description: { en: "Set by z-stepper (read-only): the value cannot go higher — the CSS greys the + zone.", fr: "Posé par z-stepper (lecture seule) : la valeur ne peut plus monter — le CSS grise la zone +.", es: "Puesto por z-stepper (solo lectura): el valor no puede subir más — el CSS atenúa la zona +." } }
		],
		events: [
			{ name: "input", description: { en: "Fired ON THE INNER INPUT at each step, so native listeners follow.", fr: "Émis SUR L'INPUT INTERNE à chaque cran, pour que les écouteurs natifs suivent.", es: "Emitido EN EL INPUT INTERNO en cada paso, para que los oyentes nativos sigan." } },
			{ name: "change", description: { en: "Fired on the inner input after a step (like leaving a native field).", fr: "Émis sur l'input interne après un cran (comme en quittant un champ natif).", es: "Emitido en el input interno tras un paso (como al salir de un campo nativo)." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-stepper__button-width", description: { en: "Width reserved for each − / + zone (match BUTTON_ZONE_EM if overridden).", fr: "Largeur réservée à chaque zone − / + (accorder à BUTTON_ZONE_EM si modifiée).", es: "Ancho reservado para cada zona − / + (acordar con BUTTON_ZONE_EM si se cambia)." } },
			{ name: "--z-stepper__field-width", description: { en: "Width of the native input in the middle.", fr: "Largeur de l'input natif au centre.", es: "Ancho del input nativo en el centro." } },
			{ name: "--z-stepper--background__color", description: { en: "The frame's background.", fr: "Le fond du cadre.", es: "El fondo del marco." } },
			{ name: "--z-stepper--button__color", description: { en: "Colour of the − / + signs at rest.", fr: "La couleur des signes − / + au repos.", es: "El color de los signos − / + en reposo." } }
		]
		/* Pas de `layers` : l'anatomie est l'<input> natif que l'auteur écrit (Chemin B),
		   les deux boutons sont des pseudo-éléments — aucune pièce `z-layer` n'est peinte. */
	};

	/* L'input natif qu'on pilote — trouvé à la connexion, jamais créé (Chemin B). */
	#input = null;

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "group");
		this.#input = this.querySelector("input");
		this.addEventListener("pointerdown", this.#onPointer);
		/* Une saisie directe (l'utilisateur tape dans l'input) doit aussi rafraîchir l'état
		   des bornes : on réécoute l'input pour re-griser − / + au bon moment. */
		if (this.#input) this.#input.addEventListener("input", this.#syncBounds);
		super.connectedCallback();   /* z-element câble la grammaire d'états */
		this.#syncBounds();
	}

	disconnectedCallback() {
		super.disconnectedCallback?.();
		if (this.#input) this.#input.removeEventListener("input", this.#syncBounds);
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.#syncBounds();
	}

	/* ── API PUBLIQUE ── */

	/* La valeur courante de l'input, en nombre. @returns {number} */
	get value() {
		return this.#input ? parseFloat(this.#input.value) || 0 : 0;
	}

	/* Pose la valeur (bornée) sur l'input et prévient. @param {number} next */
	set value(next) {
		this.#step(Number(next) - this.value);
	}

	/* Ajoute un cran (+step). @returns {void} */
	stepUp() {
		this.#step(this.#stepSize);
	}

	/* Retire un cran (−step). @returns {void} */
	stepDown() {
		this.#step(-this.#stepSize);
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Les bornes lues sur l'input (source de vérité). Absentes = ±Infini. */
	get #min() {
		const raw = this.#input ? parseFloat(this.#input.min) : NaN;
		return Number.isFinite(raw) ? raw : -Infinity;
	}
	get #max() {
		const raw = this.#input ? parseFloat(this.#input.max) : NaN;
		return Number.isFinite(raw) ? raw : Infinity;
	}
	get #stepSize() {
		const raw = this.#input ? parseFloat(this.#input.step) : NaN;
		return Number.isFinite(raw) && raw > 0 ? raw : 1;
	}

	/*
		Le clic : on ne bouge que si le pointeur tombe dans la ZONE d'un bouton — le tiers
		gauche (−) ou le tiers droit (+), pas le centre (où l'input reçoit la frappe).
		La largeur des zones est accordée au CSS (BUTTON_ZONE_EM ↔ padding).
	*/
	#onPointer = (event) => {
		if (this.disabled || !this.#input) return;
		const rect = this.getBoundingClientRect();
		const em = parseFloat(getComputedStyle(this).fontSize) || 16;
		const zone = BUTTON_ZONE_EM * em;
		if (event.clientX <= rect.left + zone) {
			event.preventDefault();       /* ne pas voler le focus à l'input pendant qu'on décrémente */
			this.stepDown();
		} else if (event.clientX >= rect.right - zone) {
			event.preventDefault();
			this.stepUp();
		}
	};

	/*
		LE SEUL point qui change la valeur. Il borne dans [min, max], écrit l'input (la
		source de vérité), déclenche `input` puis `change` dessus (pour que le formulaire
		natif et tout écouteur suivent), et met l'état des bornes à jour.
		@param {number} delta
	*/
	#step(delta) {
		if (!this.#input || this.#input.disabled) return;
		const next = Math.min(this.#max, Math.max(this.#min, this.value + delta));
		if (next === this.value) { this.#syncBounds(); return; }   /* déjà à la borne : rien à émettre */
		this.#input.value = String(next);
		this.#input.dispatchEvent(new Event("input", { bubbles: true }));
		this.#input.dispatchEvent(new Event("change", { bubbles: true }));
		this.#syncBounds();
	}

	/*
		Reflète les bornes sur l'hôte pour que le CSS grise le bon bouton : `at-min` quand
		on ne peut plus descendre, `at-max` quand on ne peut plus monter. Un stepper sans
		input, ou désactivé, grise les deux.
	*/
	#syncBounds = () => {
		const dead = this.disabled || !this.#input || this.#input.disabled;
		this.toggleAttribute("at-min", dead || this.value <= this.#min);
		this.toggleAttribute("at-max", dead || this.value >= this.#max);
	};
}

export function defineZStepper() {
	if (!customElements.get("z-stepper")) customElements.define("z-stepper", ZStepper);
}
defineZStepper();
