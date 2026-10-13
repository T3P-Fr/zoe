/*
	============================================================
	z-card — une carte-surface qui contient du contenu libre, sur z-element (Chemin A)
	------------------------------------------------------------
	La surface d'accueil de Zoé : un cadre qui pose un fond, un filet et du radius,
	puis laisse l'auteur y mettre ce qu'il veut (titre, texte, boutons, image). `ZCard
	extends ZElement` → ton & taille gratuits (variants du socle) et toute la grammaire
	d'états, sans une ligne de plus.

	    <z-card>Contenu libre.</z-card>
	    <z-card tone="soft">Une note discrète.</z-card>
	    <z-card interactive>Toute la carte est cliquable.</z-card>

	INTERACTIVE, fait proprement : par défaut une carte n'est qu'une surface (elle
	informe l'œil, elle ne se clique pas). Avec `interactive`, elle DEVIENT un bouton —
	  · elle réagit au survol (élévation + filet accent, peints en CSS) ;
	  · elle devient focusable (role=button + tabindex) ;
	  · le CLAVIER l'active comme un bouton natif : Entrée agit tout de suite, Espace au
	    relâché (sans faire défiler la page) ; les deux émettent un vrai `click`.
	Sans `interactive`, aucun de ces branchements — la carte reste un conteneur inerte.

	Doc narrative : z-card.doc.md · API machine : `static api` ci-dessous.
	Styleguide 15.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZCard extends ZElement {
	static api = {
		tag: "z-card",
		example: `<z-card>
  <h3>Titre de la carte</h3>
  <p>Contenu libre : texte, images, autres composants.</p>
</z-card>
<z-card interactive tone="soft">Toute la carte est cliquable.</z-card>`,
		members: [
			{ kind: "field", name: "interactive", type: "boolean", description: { en: "Mirrors the `interactive` attribute.", fr: "Reflet de l'attribut `interactive`.", es: "Reflejo del atributo `interactive`." } }
		],
		summary: {
			en: "A surface card holding free content — inherits tone & size; optionally interactive (hover + clickable, role=button).",
			fr: "Une carte-surface qui contient du contenu libre — hérite tone & size ; interactive en option (survol + cliquable, role=button).",
			es: "Una tarjeta-superficie que contiene contenido libre — hereda tone y size; interactiva opcionalmente (hover + clicable, role=button)."
		},
		attributes: [
			{ name: "interactive", type: "boolean", description: { en: "The whole card reacts to hover (elevation + accent border) and becomes focusable/clickable — role=button, Enter/Space fire a click.", fr: "Toute la carte réagit au survol (élévation + filet accent) et devient focusable/cliquable — role=button, Entrée/Espace émettent un clic.", es: "Toda la tarjeta reacciona al hover (elevación + borde de acento) y se vuelve enfocable/clicable — role=button, Enter/Espacio emiten un clic." } },
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Importance/colour, from the socle variant.", fr: "L'importance/la couleur, via le variant du socle.", es: "La importancia/color, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant (everything follows in em).", fr: "Le facteur de taille, via le variant du socle (tout suit en em).", es: "El factor de tamaño, mediante el variante del zócalo (todo sigue en em)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/*
			LES CALQUES — la surface, un visuel de tête optionnel, ce qui informe. On
			n'écrit que les rôles qu'on a : le FOND (la surface), le MEDIA (une image/visuel
			en tête, optionnel) et INFOS (le label, le titre de la carte).
		*/
		layers: [
			{ part: "background", description: { en: "The card surface — radius, border, elevation.", fr: "La surface de la carte — radius, filet, élévation.", es: "La superficie de la tarjeta — radio, borde, elevación." } },
			{ part: "media", optional: true, description: { en: "Optional visual at the head of the card (image, banner).", fr: "Visuel optionnel en tête de carte (image, bannière).", es: "Visual opcional en la cabecera de la tarjeta (imagen, banner)." } },
			{
				part: "infos",
				description: { en: "What informs — the card's content block.", fr: "Ce qui informe — le bloc de contenu de la carte.", es: "Lo que informa — el bloque de contenido de la tarjeta." },
				children: [{ part: "label", description: { en: "The card's title/text.", fr: "Le titre/texte de la carte.", es: "El título/texto de la tarjeta." } }]
			}
		]
	};

	/* On observe `interactive` EN PLUS des états du socle, sinon un changement dynamique
	   ne rebrancherait pas la sémantique bouton. @returns {string[]} */
	static get observedAttributes() {
		return [...super.observedAttributes, "interactive"];
	}

	connectedCallback() {
		this.#syncInteractive();
		this.addEventListener("keydown", this.#onKey);
		this.addEventListener("keyup", this.#onKeyUp);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "interactive") this.#syncInteractive();
	}

	/* Interactive ? (la carte est cliquable). @returns {boolean} */
	get interactive() {
		return this.hasAttribute("interactive");
	}

	/* @param {boolean} value */
	set interactive(value) {
		this.toggleAttribute("interactive", Boolean(value));
	}

	/*
		Une carte interactive EST un bouton pour l'assistance : rôle + focusabilité. Une
		carte inerte n'en a aucun (elle ne doit pas se retrouver dans l'ordre de tabulation
		ni s'annoncer « bouton »). On ne pose que ce que l'auteur n'a pas déjà écrit.
	*/
	#syncInteractive() {
		if (this.interactive) {
			if (!this.hasAttribute("role")) this.setAttribute("role", "button");
			if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
		} else {
			if (this.getAttribute("role") === "button") this.removeAttribute("role");
			if (this.getAttribute("tabindex") === "0") this.removeAttribute("tabindex");
		}
	}

	/*
		LE CLAVIER du bouton natif, seulement quand la carte est interactive : Entrée agit
		tout de suite, Espace au relâché (et ne fait pas défiler la page entre-temps).
	*/
	#onKey = (event) => {
		if (!this.interactive) return;
		if (event.key === "Enter") { event.preventDefault(); this.click(); }
		else if (this.#isSpace(event)) event.preventDefault();   /* pas de défilement */
	};

	#onKeyUp = (event) => {
		if (!this.interactive) return;
		if (this.#isSpace(event)) { event.preventDefault(); this.click(); }
	};

	/* @param {KeyboardEvent} event @returns {boolean} */
	#isSpace(event) {
		return event.key === " " || event.key === "Spacebar";
	}
}

export function defineZCard() {
	if (!customElements.get("z-card")) customElements.define("z-card", ZCard);
}
defineZCard();
