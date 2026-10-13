/*
	============================================================
	z-code — du code affiché, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Montre du code tel qu'écrit : en BLOC par défaut (comme un <pre>, la mise en page
	préservée, débordement horizontal qui défile) ou EN LIGNE avec `inline` (une puce
	monospace au fil du texte, comme un <code>). `ZCode extends ZElement` pour la
	cohérence de la famille ; c'est un composant d'AFFICHAGE, peint par z-code.css.

	    <z-code>npm install zoe</z-code>              (un bloc)
	    Tape <z-code inline>npm i</z-code> pour lancer. (une puce en ligne)

	Le CONTENU est le code — Zoé n'injecte rien (ADR-0018), n'échappe rien, ne colore pas
	la syntaxe : ce que tu écris est ce qui s'affiche. Pas de rôle ARIA particulier (du
	texte reste du texte pour un lecteur d'écran) ; l'auteur qui veut la sémantique native
	imbrique un vrai <pre><code> à l'intérieur, c'est son droit.

	Doc narrative : z-code.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 19.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZCode extends ZElement {
	static api = {
		tag: "z-code",
		example: `<z-code>npm run dev
# http://localhost:5173</z-code>
<p>Installez avec <z-code inline>npm install</z-code>.</p>`,
		members: [
			{ kind: "field", name: "inline", type: "boolean", description: { en: "Mirrors the `inline` attribute.", fr: "Reflet de l'attribut `inline`.", es: "Reflejo del atributo `inline`." } }
		],
		summary: {
			en: "Displays code as written — a block by default (pre-like, scrolls horizontally) or inline with `inline` (a monospace chip). No syntax highlighting, nothing injected.",
			fr: "Affiche du code tel qu'écrit — en bloc par défaut (comme <pre>, défile à l'horizontale) ou en ligne avec `inline` (une puce monospace). Pas de coloration, rien d'injecté.",
			es: "Muestra código tal como se escribe — un bloque por defecto (como <pre>, se desplaza horizontal) o en línea con `inline` (una píldora monoespaciada). Sin resaltado, nada inyectado."
		},
		attributes: [
			{ name: "inline", type: "boolean", description: { en: "Render as an inline chip in a line of text instead of a block.", fr: "Rendu en puce au fil du texte au lieu d'un bloc.", es: "Se renderiza como una píldora en línea en vez de un bloque." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/* Deux rôles : le FOND (la surface creusée) et ce qui INFORME (le code lui-même).
		   Pas de marker — du code n'a pas de pièce d'état, il EST le contenu. */
		layers: [
			{ part: "background", description: { en: "The sunken code surface.", fr: "La surface de code, creusée.", es: "La superficie de código, hundida." } },
			{
				part: "infos",
				description: { en: "What informs — the code itself.", fr: "Ce qui informe — le code lui-même.", es: "Lo que informa — el código en sí." },
				children: [{ part: "label", description: { en: "Your code text.", fr: "Votre texte de code.", es: "Su texto de código." } }]
			}
		]
	};

	/* `inline` change la forme mais n'est pas un état d'interaction : on l'observe pour
	   le refléter en CSS via l'attribut lui-même (`&[inline]`), pas via :state(). */
	static get observedAttributes() {
		return [...super.observedAttributes, "inline"];
	}

	attributeChangedCallback(name, previous, value) {
		/* `inline` est un attribut de FORME (pas un état) : on ne le passe pas au socle,
		   le CSS le lit directement. */
		if (name === "inline") return;
		super.attributeChangedCallback(name, previous, value);
	}

	/* En ligne ? @returns {boolean} */
	get inline() {
		return this.hasAttribute("inline");
	}

	/* @param {boolean} v */
	set inline(v) {
		this.toggleAttribute("inline", Boolean(v));
	}
}

export function defineZCode() {
	if (!customElements.get("z-code")) customElements.define("z-code", ZCode);
}
defineZCode();
