/*
	============================================================
	z-button — un bouton, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	`ZButton extends ZElement` : il hérite de TOUTE la palette d'états (over, press,
	release, releaseOut, focus, loading, error, success…) sans en écrire une
	ligne. Il n'ajoute que sa sémantique de bouton (rôle ARIA, focusabilité) et peint
	le sien dans z-button.css. Structure figée → skinnable par les peaux.

	    <z-button>Envoyer</z-button>
	    <z-button loading>Chargement…</z-button>
	    <z-button disabled>Indisponible</z-button>

	IL FAIT CE QU'UN BOUTON FAIT — sinon ce n'est pas un bouton, c'est un div qui y
	ressemble :
	  · le CLAVIER l'active (Entrée et Espace, comme le natif) ;
	  · dans un <form>, `type` décide : submit (défaut) · reset · button (rien) ;
	  · `disabled` coupe tout, pointeur comme clavier.

	    <form>
	      <z-button type="submit">Envoyer</z-button>
	      <z-button type="reset">Réinitialiser</z-button>
	    </form>

	Doc narrative : z-button.doc.md · API machine : `static api` ci-dessous.
	Styleguide 1.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZButton extends ZElement {
	static api = {
		tag: "z-button",
		example: `<z-button>Envoyer</z-button>
<z-button tone="soft">Annuler</z-button>
<z-button loading>Chargement…</z-button>
<form>
  <z-button type="submit">Valider</z-button>
  <z-button type="reset" tone="soft">Réinitialiser</z-button>
</form>`,
		members: [
			{ kind: "field", name: "type", type: "\"submit\" | \"reset\" | \"button\"", description: { en: "What it does inside a form (mirrors the attribute; default submit).", fr: "Ce qu'il fait dans un formulaire (reflet de l'attribut ; submit par défaut).", es: "Lo que hace en un formulario (reflejo del atributo; submit por defecto)." } }
		],
		summary: {
			en: "A button — inherits all z-element states, skinnable by themes.",
			fr: "Un bouton — hérite tous les états de z-element, habillable par les peaux.",
			es: "Un botón — hereda todos los estados de z-element, con temas intercambiables."
		},
		attributes: [
			{ name: "type", type: "\"submit\" | \"reset\" | \"button\"", description: { en: "What it does inside a form: submit (default), reset, or nothing.", fr: "Ce qu'il fait dans un formulaire : soumettre (défaut), réinitialiser, ou rien.", es: "Lo que hace en un formulario: enviar (predeterminado), restablecer o nada." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivé : coupe l'interaction.", es: "Deshabilitado: bloquea la interacción." } },
			{ name: "loading", type: "boolean", description: { en: "Loading (skeleton sweep, not clickable).", fr: "En chargement (balayage skeleton, non cliquable).", es: "Cargando (barrido skeleton, no clicable)." } },
			{ name: "error", type: "boolean", description: { en: "Error (danger border + shake).", fr: "En erreur (liseré danger + secousse).", es: "Error (borde de peligro + sacudida)." } },
			{ name: "success", type: "boolean", description: { en: "Valid (success border).", fr: "Validé (liseré succès).", es: "Válido (borde de éxito)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/*
			LES PIÈCES du bouton, dans l'ordre où elles se superposent. Une pièce avec
			`pseudo` est PEINTE par le CSS (rien à écrire) ; sans `pseudo`, c'est du CONTENU
			que l'auteur écrit s'il en a. Pas de `marker` : un bouton n'a pas de pièce d'état
			à montrer. Ce que la pièce `background` débloque : le FOND bouge sans emmener le
			texte (il gonfle, glisse, clignote).
		*/
		layers: [
			{ part: "background", pseudo: "::before", description: { en: "The button's surface and outline — painted, a piece of its own: it can move without the text.", fr: "La surface et le filet du bouton — peinte, une pièce à part : elle peut bouger sans le texte.", es: "La superficie y el borde del botón — pintada, una pieza propia: puede moverse sin el texto." } },
			{ part: "icon", optional: true, description: { en: "Optional content, before the text: `<z-layer part=\"icon\">★</z-layer>`.", fr: "Contenu optionnel, avant le texte : `<z-layer part=\"icon\">★</z-layer>`.", es: "Contenido opcional, antes del texto: `<z-layer part=\"icon\">★</z-layer>`." } },
			{ part: "label", description: { en: "Your text — written directly inside the element.", fr: "Votre texte — écrit directement dans l'élément.", es: "Su texto — escrito directamente en el elemento." } },
			{ part: "contact", pseudo: "::after", description: { en: "The touch zone — invisible, at least --z-contact-zone (44px), centred on the button. Set by the core.", fr: "La zone du doigt — invisible, au moins --z-contact-zone (44px), centrée sur le bouton. Posée par le socle.", es: "La zona táctil — invisible, al menos --z-contact-zone (44px), centrada en el botón. Puesta por el núcleo." } }
		]
	};

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "button");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		this.addEventListener("keydown", this.#onKey);
		this.addEventListener("keyup", this.#onKeyUp);
		this.addEventListener("click", this.#onClick);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
	}

	/* Ce qu'il fait dans un formulaire. @returns {"submit"|"reset"|"button"} */
	get type() {
		const written = this.getAttribute("type");
		return written === "reset" || written === "button" ? written : "submit";
	}

	/* @param {string} value */
	set type(value) {
		this.setAttribute("type", value);
	}

	/*
		LE CLAVIER, celui du bouton natif : Entrée agit tout de suite, Espace au RELÂCHÉ
		(et ne fait pas défiler la page entre-temps). Sans ça, `role="button"` est un
		mensonge — l'élément a l'air d'un bouton pour un lecteur d'écran, mais rien ne
		l'active sans souris.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		if (event.key === "Enter") { event.preventDefault(); this.click(); }
		else if (this.#isSpace(event)) event.preventDefault();   /* pas de défilement */
	};

	#onKeyUp = (event) => {
		if (this.disabled) return;
		if (this.#isSpace(event)) { event.preventDefault(); this.click(); }
	};

	/* @param {KeyboardEvent} event @returns {boolean} */
	#isSpace(event) {
		return event.key === " " || event.key === "Spacebar";
	}

	/*
		Le clic — le vrai comme celui du clavier (this.click() passe par ici). Un bouton
		désactivé ne laisse RIEN passer : on stoppe la propagation, sinon un <form> ou un
		parent qui écoute agirait quand même.
	*/
	#onClick = (event) => {
		if (this.disabled) { event.stopImmediatePropagation(); event.preventDefault(); return; }
		this.#actOnForm();
	};

	/* submit / reset : on délègue au formulaire, jamais on ne réimplémente. */
	#actOnForm() {
		const formulaire = this.form;
		if (!formulaire || this.type === "button") return;
		/* requestSubmit et pas submit() : lui seul déclenche la VALIDATION et l'événement
		   `submit` — submit() les saute tous les deux, silencieusement. */
		if (this.type === "submit") formulaire.requestSubmit();
		else formulaire.reset();
	}
}

export function defineZButton() {
	if (!customElements.get("z-button")) customElements.define("z-button", ZButton);
}
defineZButton();
