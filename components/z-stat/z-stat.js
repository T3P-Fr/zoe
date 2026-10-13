/*
	============================================================
	z-stat — une tuile de statistique (KPI), bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Un composant d'AFFICHAGE presque gratuit, dans la lignée de z-badge : il n'ajoute
	aucune ligne de JS de comportement. Trois pièces que l'auteur écrit lui-même (Zoé
	n'injecte rien, ADR-0018) — l'intitulé, le grand nombre, et la variation — et le
	CSS les met en tuile verticale. Le seul réglage est `trend` : il colore la variation
	(vert / rouge) et lui pose une flèche, PAR LE CSS (lu directement dans l'attribut,
	donc zéro JS).

	    <z-stat trend="up">
	      <span part="label">Chiffre d'affaires</span>
	      <strong part="value">1,24 M€</strong>
	      <span part="delta">+12,4 %</span>
	    </z-stat>

	Purement informatif : ça se lit, ça ne se clique pas. L'ordre HTML (label → value →
	delta) fait aussi l'ordre de lecture ; le CSS ne fait que l'espacer et le colorer.

	Doc narrative : z-stat.doc.md · API machine : `static api` ci-dessous.
	Styleguide 22.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZStat extends ZElement {
	static api = {
		tag: "z-stat",
		example: `<z-stat trend="up">
  <span part="label">Chiffre d'affaires</span>
  <strong part="value">1,24 M€</strong>
  <span part="delta">+12,4 %</span>
</z-stat>`,
		summary: {
			en: "A KPI tile — a label, a big number, an optional delta. `trend` colours the delta (success/danger) and gives it an arrow, in pure CSS.",
			fr: "Une tuile de KPI — un intitulé, un grand nombre, une variation optionnelle. `trend` colore la variation (succès/danger) et lui pose une flèche, en CSS pur.",
			es: "Una ficha de KPI — un rótulo, un gran número, una variación opcional. `trend` colorea la variación (éxito/peligro) y le pone una flecha, en CSS puro."
		},
		attributes: [
			{ name: "trend", type: "\"up\" | \"down\"", description: { en: "Direction of the delta: up (success + ↑) or down (danger + ↓). Absent = neutral (soft ink).", fr: "Le sens de la variation : up (succès + ↑) ou down (danger + ↓). Absent = neutre (ink atténué).", es: "El sentido de la variación: up (éxito + ↑) o down (peligro + ↓). Ausente = neutro (tinta suave)." } },
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Importance/colour of the tile, from the socle variant.", fr: "L'importance/la couleur de la tuile, via le variant du socle.", es: "La importancia/color de la ficha, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant (everything follows in em).", fr: "Le facteur de taille, via le variant du socle (tout suit en em).", es: "El factor de tamaño, mediante el variante del zócalo (todo sigue en em)." } }
		],
		events: [
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		/* Trois pièces écrites par l'auteur : ce qui NOMME (label), ce qui COMPTE (value),
		   ce qui a BOUGÉ (delta, optionnel). Le fond est la tuile elle-même, peinte sur l'hôte. */
		layers: [
			{ part: "label", description: { en: "The caption — small, soft, often spaced capitals.", fr: "L'intitulé — petit, atténué, souvent en capitales espacées.", es: "El rótulo — pequeño, suave, a menudo en mayúsculas espaciadas." } },
			{ part: "value", description: { en: "The big number.", fr: "Le grand nombre.", es: "El gran número." } },
			{ part: "delta", description: { en: "The variation (optional) — coloured and arrowed by `trend`.", fr: "La variation (optionnelle) — colorée et fléchée par `trend`.", es: "La variación (opcional) — coloreada y con flecha según `trend`." } }
		]
	};
}

export function defineZStat() {
	if (!customElements.get("z-stat")) customElements.define("z-stat", ZStat);
}
defineZStat();
