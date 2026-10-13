/*
	============================================================
	z-kbd — une touche de clavier, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Le plus GRATUIT après z-badge : pur affichage, aucune interaction. Il montre une
	touche (« Ctrl », « ⌘ », « Échap ») avec le look d'un capuchon de clavier —
	monospace, filet, petit relief, coins arrondis. `ZKbd extends ZElement` lui donne la
	taille (variant du socle) et l'apparition douce ; il ne PEINT que sa touche.

	    <z-kbd>Ctrl</z-kbd> + <z-kbd>C</z-kbd>
	    <z-kbd size="s">Échap</z-kbd>

	Le contenu EST la touche. Aucun rôle ARIA n'est posé : l'assistance lit le texte tel
	quel (« Ctrl »), ce qui suffit à une touche. La sémantique native `<kbd>` reste celle
	de l'auteur (contrat SEO : lu par les moteurs → natif, habillé par la peau) ; z-kbd
	sert l'INTERFACE (raccourcis d'un menu, d'une infobulle), pas le contenu éditorial.

	Doc narrative : z-kbd.doc.md · API machine : `static api` ci-dessous.
	Styleguide 17.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZKbd extends ZElement {
	static api = {
		tag: "z-kbd",
		example: `<p>Appuyez sur <z-kbd>Ctrl</z-kbd> + <z-kbd>K</z-kbd> pour chercher.</p>`,
		summary: {
			en: "A keyboard key cap — pure display, monospace, bordered with a subtle key relief. Inherits size.",
			fr: "Un capuchon de touche clavier — affichage pur, monospace, fileté avec un léger relief de touche. Hérite size.",
			es: "Una tecla de teclado — visualización pura, monoespaciada, con borde y un ligero relieve de tecla. Hereda size."
		},
		attributes: [
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant (everything follows in em).", fr: "Le facteur de taille, via le variant du socle (tout suit en em).", es: "El factor de tamaño, mediante el variante del zócalo (todo sigue en em)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/* Deux rôles suffisent : le FOND (le capuchon) et ce qui INFORME (la touche). Pas
		   de marker — une touche n'a pas de pièce d'état à montrer, elle EST l'information. */
		layers: [
			{ part: "background", description: { en: "The key cap surface — border and relief.", fr: "La surface du capuchon — filet et relief.", es: "La superficie de la tecla — borde y relieve." } },
			{
				part: "infos",
				description: { en: "What informs — the key's text.", fr: "Ce qui informe — le texte de la touche.", es: "Lo que informa — el texto de la tecla." },
				children: [{ part: "label", description: { en: "The key legend (e.g. \"Ctrl\").", fr: "La légende de la touche (ex. « Ctrl »).", es: "La leyenda de la tecla (ej. « Ctrl »)." } }]
			}
		]
	};
}

export function defineZKbd() {
	if (!customElements.get("z-kbd")) customElements.define("z-kbd", ZKbd);
}
defineZKbd();
