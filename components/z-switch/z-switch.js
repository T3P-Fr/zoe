/*
	============================================================
	z-switch — un interrupteur on/off, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	La cousine ACTIVE de la case : même mécanique (`current` = allumé, clic / Espace,
	participation au formulaire), mais la sémantique d'un INTERRUPTEUR — `role="switch"`,
	un effet immédiat (« activé/désactivé »), pas un choix qu'on validera plus tard.
	`ZSwitch extends ZElement` → toute la grammaire d'états héritée, on ne réécrit rien.

	    <z-switch>Notifications</z-switch>
	    <z-switch current>Déjà activé</z-switch>
	    <z-switch disabled>Indisponible</z-switch>

	IL FAIT CE QU'UN INTERRUPTEUR FAIT : le clavier l'active (Espace), il bascule au clic,
	`disabled` coupe tout. DANS UN FORMULAIRE il part comme un `<input type=checkbox>` :
	`name` + `value` (défaut « on »), rien envoyé si éteint, et le reset le ramène à son
	HTML d'origine. La plomberie de formulaire vit dans z-element ; ici on décide juste
	CE QU'ON ENVOIE.

	Différence avec z-checkbox, tranchée à l'usage : pas d'`indeterminate` (un interrupteur
	est allumé ou éteint, jamais « peut-être »), et `role="switch"` au lieu de `checkbox`.

	Doc narrative : z-switch.doc.md · API machine : `static api` ci-dessous.
	Styleguide 8.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZSwitch extends ZElement {
	static api = {
		tag: "z-switch",
		example: `<z-switch name="notifications">Notifications</z-switch>
<z-switch current>Mode sombre</z-switch>
<z-switch disabled>Indisponible</z-switch>`,
		members: [
			{ kind: "field", name: "checked", type: "boolean", description: { en: "On or off — mirrors `current`.", fr: "Allumé ou éteint — reflet de `current`.", es: "Encendido o apagado — reflejo de `current`." } },
			{ kind: "field", name: "value", type: "string", description: { en: "What is submitted when on (default \"on\").", fr: "Ce qui part quand il est allumé (défaut « on »).", es: "Lo que se envía al estar encendido (por defecto «on»)." } }
		],
		summary: {
			en: "An on/off switch — inherits all z-element states, form-bound, painted by the skin. Immediate effect, unlike a checkbox validated later.",
			fr: "Un interrupteur on/off — hérite tous les états de z-element, lié au formulaire, peint par la peau. Effet immédiat, contrairement à une case qu'on validera.",
			es: "Un interruptor on/off — hereda todos los estados de z-element, ligado al formulario, pintado por el tema. Efecto inmediato, a diferencia de una casilla que se validará más tarde."
		},
		attributes: [
			{ name: "current", type: "boolean", description: { en: "On: a durable state set by the component (click / Space).", fr: "Allumé : état durable posé par le composant (clic / Espace).", es: "Encendido: estado duradero puesto por el componente (clic / Espacio)." } },
			{ name: "name", type: "string", description: { en: "Form field name.", fr: "Nom du champ dans le formulaire.", es: "Nombre del campo en el formulario." } },
			{ name: "value", type: "string", description: { en: "What is submitted when on (default: \"on\").", fr: "Ce qui part dans le formulaire quand il est allumé (défaut : « on »).", es: "Lo que se envía cuando está encendido (por defecto «on»)." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivé : coupe l'interaction.", es: "Deshabilitado: bloquea la interacción." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when it toggles. Read `.checked`.", fr: "Émis quand il bascule. Lire `.checked`.", es: "Emitido cuando cambia. Leer `.checked`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		/* Anatomie de l'interrupteur : le FOND, le MARKER (la piste) avec son DOT (la
		   pastille qui glisse), et ce qui INFORME (le label). Le dot est la seule pièce
		   qui bouge d'un état à l'autre — comme le `dot` de la case, même rôle, même token. */
		layers: [
			{ part: "background", description: { en: "The backdrop of the whole line — usually transparent, it carries effects.", fr: "Le fond de toute la ligne — souvent transparent, il porte les effets.", es: "El fondo de toda la línea — normalmente transparente, lleva los efectos." } },
			{
				part: "marker",
				description: { en: "The track (the rail the thumb slides on).", fr: "La piste (le rail sur lequel glisse la pastille).", es: "La pista (el riel sobre el que se desliza el pulgar)." },
				children: [{ part: "dot", description: { en: "The thumb — slides from off to on.", fr: "La pastille — glisse d'éteint à allumé.", es: "El pulgar — se desliza de apagado a encendido." } }]
			},
			{
				part: "infos",
				description: { en: "What informs — moved, hidden or animated as one block.", fr: "Ce qui informe — déplacé, caché ou animé d'un bloc.", es: "Lo que informa — movido, ocultado o animado en bloque." },
				children: [{ part: "label", description: { en: "Your text.", fr: "Votre texte.", es: "Su texto." } }]
			},
			{ part: "contact", description: { en: "What receives the gesture — invisible, may overflow.", fr: "Ce qui reçoit le geste — invisible, peut déborder.", es: "Lo que recibe el gesto — invisible, puede desbordar." } }
		]
	};

	/* L'état de départ, restauré au reset du formulaire (défaut natif). */
	#defaultOn = false;
	#captured = false;

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "switch");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		if (!this.#captured) {
			this.#captured = true;   /* le HTML d'origine, lu UNE fois : re-monter n'est pas re-naître */
			this.#defaultOn = this.hasAttribute("current");
		}
		this.#syncAria();
		this.#syncForm();
		this.addEventListener("click", this.#onActivate);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "current") { this.#syncAria(); this.#syncForm(); }
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
	}

	/* Allumé ? @returns {boolean} */
	get checked() {
		return this.hasAttribute("current");
	}

	/* @param {boolean} value */
	set checked(value) {
		this.setState("current", Boolean(value));
	}

	/* Ce qui part dans le formulaire quand il est allumé. @returns {string} */
	get value() {
		return this.getAttribute("value") ?? "on";
	}

	/* @param {string} value */
	set value(value) {
		this.setAttribute("value", value);
	}

	/* Le formulaire est remis à zéro → on revient au HTML d'origine. */
	formResetCallback() {
		this.setState("current", this.#defaultOn);
	}

	/* Le clic bascule (le socle a émis release ; nous, on décide de l'effet durable). */
	#onActivate = () => {
		if (this.disabled) return;
		this.#toggle();
	};

	/* Espace bascule (convention native), sans faire défiler la page. */
	#onKey = (event) => {
		if (this.disabled) return;
		if (event.key === " " || event.key === "Spacebar") {
			event.preventDefault();
			this.#toggle();
		}
	};

	/* Bascule + prévient comme un contrôle de formulaire (événement change). */
	#toggle() {
		this.setState("current", !this.checked);
		this.dispatchEvent(new Event("change", { bubbles: true }));
	}

	/* role="switch" annonce son état par aria-checked (true/false). */
	#syncAria() {
		this.setAttribute("aria-checked", String(this.checked));
	}

	/* Ce qui part dans le formulaire : la valeur si allumé, RIEN sinon (sémantique native). */
	#syncForm() {
		this.setFormValue(this.checked ? this.value : null);
	}
}

export function defineZSwitch() {
	if (!customElements.get("z-switch")) customElements.define("z-switch", ZSwitch);
}
defineZSwitch();
