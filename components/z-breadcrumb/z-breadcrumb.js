/*
	============================================================
	z-breadcrumb — le fil d'Ariane, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Un composant de STRUCTURE, presque gratuit : l'auteur écrit lui-même les maillons
	(des <a>, un dernier <span aria-current="page">), et Zoé n'injecte RIEN (ADR-0018).
	Le composant apporte les deux seules choses qui manquent à une simple rangée de
	liens : le SENS (role="navigation" + un libellé pour le lecteur d'écran) et le
	RYTHME visuel (le séparateur « › » posé PAR LE CSS entre les maillons, jamais un
	nœud de plus). Le dernier maillon (ou celui en aria-current) se pose en gras : c'est
	« vous êtes ici ».

	    <z-breadcrumb>
	      <a href="/">Accueil</a>
	      <a href="/section">Section</a>
	      <span aria-current="page">Page courante</span>
	    </z-breadcrumb>

	Pourquoi le séparateur en CSS et pas en balise : un « › » est de la décoration, pas
	du contenu — l'ajouter en nœud le ferait lire par le lecteur d'écran et alourdirait
	le DOM de l'auteur pour rien. `> * + *::before` le dessine entre les maillons, un
	trait de la peau, effaçable en une variable.

	Doc narrative : z-breadcrumb.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 21.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZBreadcrumb extends ZElement {
	static api = {
		tag: "z-breadcrumb",
		summary: {
			en: "A breadcrumb trail — you write the links, Zoé adds the meaning (nav + label) and the « › » separators in CSS. Nothing injected.",
			fr: "Un fil d'Ariane — tu écris les liens, Zoé pose le sens (nav + libellé) et les séparateurs « › » en CSS. Rien d'injecté.",
			es: "Una miga de pan — tú escribes los enlaces, Zoé pone el sentido (nav + etiqueta) y los separadores « › » en CSS. Nada inyectado."
		},
		attributes: [
			{ name: "label", type: "string", description: { en: "The accessible name of the navigation (defaults to « Fil d'Ariane »).", fr: "Le nom accessible de la navigation (par défaut « Fil d'Ariane »).", es: "El nombre accesible de la navegación (por defecto « Fil d'Ariane »)." } }
		],
		events: [
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-breadcrumb__separator", description: { en: "The glyph drawn between links (default « › »).", fr: "Le glyphe dessiné entre les liens (défaut « › »).", es: "El glifo dibujado entre los enlaces (por defecto « › »)." } },
			{ name: "--z-breadcrumb__gap", description: { en: "Space around each separator.", fr: "L'espace autour de chaque séparateur.", es: "El espacio alrededor de cada separador." } }
		]
	};

	/*
		On donne le SENS à la rangée de liens : `navigation` + un libellé, pour qu'un
		lecteur d'écran l'annonce comme un fil d'Ariane et non comme une suite de liens
		anonymes. On ne touche à rien si l'auteur a déjà posé son propre role/aria-label.
	*/
	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
		if (!this.hasAttribute("aria-label")) {
			this.setAttribute("aria-label", this.getAttribute("label") || "Fil d'Ariane");
		}
		super.connectedCallback();   /* z-element câble la grammaire d'états */
	}
}

export function defineZBreadcrumb() {
	if (!customElements.get("z-breadcrumb")) customElements.define("z-breadcrumb", ZBreadcrumb);
}
defineZBreadcrumb();
