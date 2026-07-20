/*
	============================================================
	z-layer — LE CALQUE : une couche, un rôle
	------------------------------------------------------------
	La deuxième brique du noyau, à côté de z-element. Là où z-element porte les ÉTATS
	(le vivant), z-layer porte les PIÈCES (le visible). Un composant Zoé, c'est une pile
	de calques qui jouent chacun UN rôle :

	    <z-checkbox>
	      <z-layer part="background"></z-layer>
	      <z-layer part="marker"></z-layer>
	      <z-layer part="ring"></z-layer>
	      <z-layer part="dot"></z-layer>
	      <z-layer part="label">J'accepte</z-layer>
	    </z-checkbox>

	POURQUOI UNE balise + un rôle, et pas une balise PAR rôle
	---------------------------------------------------------
	Un dictionnaire ne tient pas (z-track, z-thumb, z-tick, z-fill… un mot de plus à
	chaque composant), une grammaire oui. Une seule balise à apprendre, un ensemble de
	rôles OUVERT : un composant — ou l'éditeur Zoé — peut inventer le sien sans qu'on
	touche au noyau.

	Et surtout : ça donne enfin au pacte sa traduction en HTML. Le `--{part}` du CSS
	existait déjà, il lui manquait son élément.

	    --z-checkbox--marker__background      ce que la SKIN peint
	    z-checkbox z-layer[part="marker"]     ce que le CSS vise
	    <z-layer part="marker">               ce que l'AUTEUR écrit

	Trois écritures, UN mot : `marker`.

	`part` est l'attribut du web standard (celui de `::part()`) : aujourd'hui inerte en
	light DOM, donc gratuit — et si un composant passe un jour en shadow, il est déjà là.

	LES RÔLES SE PARTAGENT ENTRE COMPOSANTS. Le `dot` d'une case et celui d'une radio,
	c'est le même mot : une skin les peint d'un coup. Un rôle = une intention, jamais une
	propriété CSS (`z-layer part="border"` est INTERDIT — c'est `ring`, la pièce, pas la
	bordure, la propriété).

	CE CALQUE NE DÉCIDE DE RIEN. Il ne se positionne pas, ne se peint pas, ne s'anime
	pas : c'est le CSS du composant qui place chaque rôle, et la skin qui le peint. Une
	brique bête — donc elle ne peut pas se tromper.

	Doc narrative : z-layer.doc.md · API machine : `static api` ci-dessous.
	Styleguide 0.2
	============================================================
*/

export class ZLayer extends HTMLElement {
	static api = {
		tag: "z-layer",
		summary: {
			en: "A layer: one piece of a component, carrying one role (part). Painted by the skin, placed by the component.",
			fr: "Un calque : une pièce d'un composant, portant un rôle (part). Peint par la peau, placé par le composant.",
			es: "Una capa: una pieza de un componente, con un rol (part). Pintada por el tema, colocada por el componente."
		},
		attributes: [
			{
				name: "part",
				type: "string",
				description: {
					en: "The role this layer plays (background, marker, ring, dot, label, icon…). Shared across components: the same word means the same thing everywhere.",
					fr: "Le rôle que joue ce calque (background, marker, ring, dot, label, icon…). Partagé entre composants : le même mot veut dire la même chose partout.",
					es: "El rol de esta capa (background, marker, ring, dot, label, icon…). Compartido entre componentes: la misma palabra significa lo mismo en todas partes."
				}
			}
		],
		events: [],
		states: []
	};

	/*
		Le rôle joué par ce calque. On lit l'attribut `part` tel quel — aucune
		normalisation, aucune valeur par défaut : un calque sans rôle est une erreur
		d'auteur qui doit se voir, pas un cas à rattraper en douce.
		@returns {string}
	*/
	get role() {
		return this.getAttribute("part") || "";
	}

	/* @param {string} value */
	set role(value) {
		this.setAttribute("part", value);
	}
}

export function defineZLayer() {
	if (!customElements.get("z-layer")) customElements.define("z-layer", ZLayer);
}
defineZLayer();
