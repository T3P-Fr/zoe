/*
	============================================================
	z-rating — une note en étoiles, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Une note de 0 à `max` étoiles, qu'on pose au clic ou au clavier. Comme le curseur
	(z-slider), ce fichier ne PEINT rien : il traduit un geste en une VALEUR entière,
	puis pose deux choses dans la cascade —

	    --z-rating__value   la part pleine, en POURCENTAGE (value / max × 100 %)
	    --z-rating__stars   une chaîne de `max` glyphes, pour que le CSS écrive les
	                        étoiles via content:, sans qu'aucune balise soit injectée.

	Le remplissage, les glyphes, le halo de focus sont du CSS qui lit ces deux tokens.
	Zoé n'injecte AUCUN nœud (ADR-0018) : on publie, le CSS dessine.

	    <z-rating value="3"></z-rating>
	    <z-rating value="4" max="5" name="note"></z-rating>
	    <z-rating value="2" readonly></z-rating>

	`role="slider"` : c'est bien un curseur (une valeur bornée qu'on fait varier), et
	les lecteurs d'écran l'annoncent déjà bien. Clavier : ← ↓ retirent une étoile, → ↑
	en ajoutent une, Home met 0, End met le maximum. Au clic, l'étoile visée devient la
	note (cliquer la 3ᵉ → 3). `readonly` montre sans laisser modifier ; `disabled` coupe
	tout.

	DANS UN FORMULAIRE elle part comme un `<input>` : `name` + sa valeur numérique, et
	le reset la ramène à la note écrite dans le HTML d'origine. La plomberie vit dans
	z-element ; ici on décide seulement CE QU'ON ENVOIE.

	Doc narrative : z-rating.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 24.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Le glyphe d'une étoile pleine. La chaîne publiée en compte `max` — le CSS l'écrit
   deux fois (couche vide + couche pleine) et clippe la seconde au pourcentage. */
const STAR = "★";

export class ZRating extends ZElement {
	static api = {
		tag: "z-rating",
		example: `<z-rating value="3"></z-rating>
<z-rating value="4" max="5" name="note"></z-rating>
<z-rating value="2" readonly></z-rating>`,
		members: [
			{ kind: "field", name: "value", type: "number", description: { en: "The rating, an integer in [0, max].", fr: "La note, un entier dans [0, max].", es: "La nota, un entero en [0, max]." } },
			{ kind: "field", name: "max", type: "number", description: { en: "Number of stars (default 5).", fr: "Nombre d'étoiles (défaut 5).", es: "Número de estrellas (por defecto 5)." } },
			{ kind: "field", name: "readonly", type: "boolean", description: { en: "Shown but not editable.", fr: "Affichée mais non modifiable.", es: "Mostrada pero no editable." } }
		],
		summary: {
			en: "A star rating — a slider from 0 to max, set by click or keyboard, painted by the skin.",
			fr: "Une note en étoiles — un curseur de 0 à max, posé au clic ou au clavier, peint par la peau.",
			es: "Una valoración con estrellas — un deslizador de 0 a max, puesto por clic o teclado, pintado por el tema."
		},
		attributes: [
			{ name: "value", type: "number", description: { en: "Current rating, an integer in [0, max]. Clamped and rounded.", fr: "Note courante, un entier dans [0, max]. Bornée et arrondie.", es: "Valoración actual, un entero en [0, max]. Limitada y redondeada." } },
			{ name: "max", type: "number", description: { en: "Number of stars (default 5).", fr: "Nombre d'étoiles (défaut 5).", es: "Número de estrellas (por defecto 5)." } },
			{ name: "readonly", type: "boolean", description: { en: "Shown but not editable — a rating you display.", fr: "Affichée mais non modifiable — une note qu'on montre.", es: "Mostrada pero no editable — una valoración que se enseña." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivée : coupe l'interaction.", es: "Deshabilitada: bloquea la interacción." } },
			{ name: "name", type: "string", description: { en: "Form field name.", fr: "Nom du champ dans le formulaire.", es: "Nombre del campo en el formulario." } },
			{ name: "required", type: "boolean", description: { en: "The form is invalid while the rating is 0.", fr: "Le formulaire est invalide tant que la note est à 0.", es: "El formulario es inválido mientras la valoración sea 0." } }
		],
		events: [
			{ name: "input", description: { en: "Emitted on every value change, including during keyboard steps. Read `.value`.", fr: "Émis à chaque changement de valeur, y compris aux crans clavier. Lire `.value`.", es: "Emitido en cada cambio de valor, incluidos los pasos de teclado. Leer `.value`." } },
			{ name: "change", description: { en: "Emitted once the gesture is over (click done, key up).", fr: "Émis une fois le geste terminé (clic fait, touche relevée).", es: "Emitido al terminar el gesto (clic hecho, tecla arriba)." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-rating__value", description: { en: "The filled part, as a percentage — the CSS clips the full layer to it.", fr: "La part pleine, en pourcentage — le CSS y clippe la couche pleine.", es: "La parte llena, en porcentaje — el CSS recorta la capa llena a ella." } },
			{ name: "--z-rating__stars", description: { en: "A string of `max` glyphs, written by content: without any injected node.", fr: "Une chaîne de `max` glyphes, écrite via content: sans nœud injecté.", es: "Una cadena de `max` glifos, escrita con content: sin nodo inyectado." } }
		],
		/*
			LES CALQUES — les rôles se PARTAGENT entre composants : `marker` est ici la rangée
			d'étoiles (l'état rendu visible), `contact` la zone du geste. Une peau qui connaît
			ces mots peint la note d'un coup.
		*/
		layers: [
			{ part: "background", description: { en: "The backdrop of the row — usually transparent, it carries effects.", fr: "Le fond de la rangée — souvent transparent, il porte les effets.", es: "El fondo de la fila — normalmente transparente, lleva los efectos." } },
			{ part: "marker", description: { en: "The stars: an empty row with a filled row clipped to the value.", fr: "Les étoiles : une rangée vide et une rangée pleine clippée à la valeur.", es: "Las estrellas: una fila vacía y una fila llena recortada al valor." } },
			{ part: "contact", description: { en: "What receives the gesture — covers the row, invisible.", fr: "Ce qui reçoit le geste — couvre la rangée, invisible.", es: "Lo que recibe el gesto — cubre la fila, invisible." } }
		]
	};

	/*
		`value`, `max`, `readonly` sont observés. `value`/`max` ne sont PAS des états
		(ils changent ce qu'on peint et envoie, pas un :state()), on les intercepte donc
		avant le socle. `readonly` non plus — il ne peint pas, il bloque le geste.
	*/
	static get observedAttributes() {
		return [...super.observedAttributes, "value", "max", "readonly"];
	}

	/* La note d'origine, restaurée au reset du formulaire (défaut natif). */
	#defaultValue = 0;
	#captured = false;

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "slider");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		if (!this.#captured) {
			this.#captured = true;   /* le HTML d'origine, lu UNE fois : re-monter n'est pas re-naître */
			this.#defaultValue = this.value;
		}
		this.addEventListener("pointerdown", this.#onDown);
		this.addEventListener("keydown", this.#onKey);
		this.addEventListener("keyup", this.#onKeyUp);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		/* On repose la valeur au montage : elle borne, arrondit, publie tokens + ARIA
		   d'un coup — rien ne peut être incohérent au premier rendu. */
		this.#apply(this.value, { silent: true });
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
		if (name === "readonly") this.setAttribute("aria-readonly", value !== null ? "true" : "false");
		/* value/max déplacent la note ou l'échelle : on re-borne et on republie tout. */
		if (name === "value" || name === "max") this.#apply(this.value, { silent: true });
	}

	/* ── API PUBLIQUE ── */

	/* La note courante, déjà bornée et arrondie. @returns {number} */
	get value() {
		return this.#clamp(this.#num("value", 0));
	}

	/* Pose la note (bornée, publiée, envoyée au formulaire). @param {number} next */
	set value(next) {
		this.#apply(Number(next));
	}

	/* Le nombre d'étoiles. @returns {number} */
	get max() {
		const raw = Math.round(this.#num("max", 5));
		return raw > 0 ? raw : 5;
	}

	/* @param {number} value */
	set max(value) {
		this.setAttribute("max", String(value));
	}

	/* Affichée mais non modifiable ? @returns {boolean} */
	get readonly() {
		return this.hasAttribute("readonly");
	}

	/* @param {boolean} value */
	set readonly(value) {
		this.toggleAttribute("readonly", Boolean(value));
	}

	/* Le formulaire est remis à zéro → on revient à la note d'origine. */
	formResetCallback() {
		this.#apply(this.#defaultValue, { silent: true });
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Peut-on encore modifier la note ? (ni désactivée, ni en lecture seule). */
	get #editable() {
		return !this.disabled && !this.readonly;
	}

	/* Lit un attribut numérique, avec sa valeur de repli. */
	#num(name, fallback) {
		const raw = parseFloat(this.getAttribute(name));
		return Number.isFinite(raw) ? raw : fallback;
	}

	/* Borne dans [0, max] et arrondit à l'entier : une note est un compte d'étoiles. */
	#clamp(raw) {
		const value = Math.round(Number.isFinite(raw) ? raw : 0);
		return Math.min(this.max, Math.max(0, value));
	}

	/*
		LE SEUL point qui change la note. Il borne, écrit l'attribut (source de vérité),
		publie les deux tokens, met l'ARIA à jour, envoie au formulaire, PUIS prévient —
		dans cet ordre, pour qu'un écouteur de `input` lise un composant déjà cohérent.
		@param {number} raw
		@param {{silent?: boolean}} [options] silent : republie sans émettre (montage, reset)
	*/
	#apply(raw, { silent = false } = {}) {
		const next = this.#clamp(raw);
		const changed = String(next) !== this.getAttribute("value");
		if (changed) this.setAttribute("value", String(next));

		const percent = this.max > 0 ? (next / this.max) * 100 : 0;
		this.style.setProperty("--z-rating__value", `${percent}%`);
		this.style.setProperty("--z-rating__stars", `"${STAR.repeat(this.max)}"`);

		this.setAttribute("aria-valuenow", String(next));
		this.setAttribute("aria-valuemin", "0");
		this.setAttribute("aria-valuemax", String(this.max));
		this.setAttribute("aria-valuetext", `${next}/${this.max}`);

		this.setFormValue(String(next));
		this.setValidity(this.required && next === 0 ? "Please give a rating to continue." : "");

		if (changed && !silent) this.dispatchEvent(new Event("input", { bubbles: true }));
	}

	/*
		Le clic pose la note visée : on lit le ratio du point sur la rangée, on le
		convertit en compte d'étoiles (arrondi au SUPÉRIEUR, pour que le tout premier
		pixel de la 3ᵉ étoile donne bien 3, pas 2). Cliquer à gauche du tout début met 0.
	*/
	#onDown = (event) => {
		if (!this.#editable) return;
		const rect = this.getBoundingClientRect();
		const ratio = (event.clientX - rect.left) / rect.width;
		this.#apply(Math.ceil(Math.min(1, Math.max(0, ratio)) * this.max));
		this.dispatchEvent(new Event("change", { bubbles: true }));
	};

	/*
		Le clavier suit la convention native du curseur : les deux axes marchent, une
		étoile à la fois. Home vide la note, End la remplit. On coupe le défilement de la
		page sous nos flèches.
	*/
	#onKey = (event) => {
		if (!this.#editable) return;
		const bond = {
			ArrowRight: 1, ArrowUp: 1,
			ArrowLeft: -1, ArrowDown: -1
		}[event.key];

		if (bond !== undefined) {
			event.preventDefault();
			this.#apply(this.value + bond);
			return;
		}
		if (event.key === "Home") { event.preventDefault(); this.#apply(0); }
		if (event.key === "End") { event.preventDefault(); this.#apply(this.max); }
	};

	/* La touche relevée clôt le geste (comme le clic terminé), via `change`. */
	#onKeyUp = (event) => {
		const clos = ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", "Home", "End"];
		if (this.#editable && clos.includes(event.key)) this.dispatchEvent(new Event("change", { bubbles: true }));
	};
}

export function defineZRating() {
	if (!customElements.get("z-rating")) customElements.define("z-rating", ZRating);
}
defineZRating();
