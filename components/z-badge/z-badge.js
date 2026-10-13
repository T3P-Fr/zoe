/*
	============================================================
	z-badge — une pastille de statut/compteur, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Le composant le plus GRATUIT de la famille : il n'ajoute presque rien. `ZBadge
	extends ZElement` lui donne la grammaire d'états, et surtout les variants `tone`
	et `size` du socle — un badge « succès », « danger » ou petit ne coûte pas une
	ligne de JS de plus. Il ne PEINT que sa pastille (z-badge.css). Preuve vivante que,
	le socle une fois figé, un composant d'affichage tombe presque tout seul.

	    <z-badge>Nouveau</z-badge>
	    <z-badge tone="danger">3</z-badge>
	    <z-badge tone="success" size="s">payé</z-badge>

	Purement DÉCORATIF au sens sémantique : il informe l'œil, il ne se clique pas. Un
	lecteur d'écran lit son texte comme du contenu — c'est voulu (« 3 messages » doit se
	lire). Si le nombre change en direct, l'auteur pose `role="status"` sur son conteneur.

	Doc narrative : z-badge.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 6.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZBadge extends ZElement {
	static api = {
		tag: "z-badge",
		example: `<z-badge>Nouveau</z-badge>
<z-badge tone="danger">3</z-badge>
<z-badge tone="success" size="s">payé</z-badge>`,
		summary: {
			en: "A status/count pill — inherits z-element's tone & size variants, painted by the skin. Almost zero code: the frozen socle does the work.",
			fr: "Une pastille de statut/compteur — hérite les variants tone & size de z-element, peinte par la peau. Presque zéro code : le socle figé fait le travail.",
			es: "Una píldora de estado/conteo — hereda los variantes tone y size de z-element, pintada por el tema. Casi cero código: el zócalo congelado hace el trabajo."
		},
		attributes: [
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Importance/colour, from the socle variant.", fr: "L'importance/la couleur, via le variant du socle.", es: "La importancia/color, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant (everything follows in em).", fr: "Le facteur de taille, via le variant du socle (tout suit en em).", es: "El factor de tamaño, mediante el variante del zócalo (todo sigue en em)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/* Deux rôles suffisent : le FOND (la pastille) et ce qui INFORME (le texte). Pas de
		   marker — un badge n'a pas de pièce d'état à montrer, il EST l'information. */
		layers: [
			{ part: "background", description: { en: "The pill surface — carries tone and effects.", fr: "La surface de la pastille — porte le ton et les effets.", es: "La superficie de la píldora — lleva el tono y los efectos." } },
			{
				part: "infos",
				description: { en: "What informs — the badge's text/number.", fr: "Ce qui informe — le texte/nombre du badge.", es: "Lo que informa — el texto/número del badge." },
				children: [{ part: "label", description: { en: "Your text.", fr: "Votre texte.", es: "Su texto." } }]
			}
		]
	};
}

export function defineZBadge() {
	if (!customElements.get("z-badge")) customElements.define("z-badge", ZBadge);
}
defineZBadge();
