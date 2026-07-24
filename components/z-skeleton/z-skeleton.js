/*
	============================================================
	z-skeleton — un leurre de chargement qui scintille, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Le placeholder gris qui occupe la place d'un contenu pas encore arrivé, avec un
	reflet qui balaye (shimmer) pour dire « ça charge, ne pars pas ». `ZSkeleton extends
	ZElement` lui donne la grammaire d'états (dont `enter`, pour ne jamais poper sec) ;
	il n'ajoute quasi rien — c'est un composant d'AFFICHAGE pur, peint par z-skeleton.css.

	    <z-skeleton></z-skeleton>                       (un bloc)
	    <z-skeleton radius="pill" h="1em"></z-skeleton>  (une ligne de texte)
	    <z-skeleton radius="circle" w="3em" h="3em"></z-skeleton>  (un avatar)

	Sémantiquement INVISIBLE : c'est un LEURRE, pas du contenu. Il porte `aria-hidden`
	pour qu'un lecteur d'écran ne l'annonce pas — la zone est vide pour lui, comme il se
	doit tant que le vrai contenu n'est pas là (l'auteur pose `aria-busy` sur le conteneur
	s'il veut signaler l'attente). Rien de cliquable, aucune valeur métier.

	Les tailles `w`/`h` sont des RACCOURCIS de confort : l'auteur peut tout aussi bien
	styler la boîte lui-même (width/height en CSS). On ne pose que ce qui est fourni.

	Doc narrative : z-skeleton.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 18.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZSkeleton extends ZElement {
	static api = {
		tag: "z-skeleton",
		summary: {
			en: "A shimmering loading placeholder (skeleton). Purely visual and aria-hidden — a decoy holding the space until real content arrives.",
			fr: "Un leurre de chargement qui scintille (skeleton). Purement visuel et aria-hidden — il occupe la place jusqu'à l'arrivée du vrai contenu.",
			es: "Un marcador de carga que brilla (skeleton). Puramente visual y aria-hidden — un señuelo que ocupa el lugar hasta que llega el contenido real."
		},
		attributes: [
			{ name: "w", type: "string", description: { en: "Convenience width (any CSS length, e.g. \"12em\"). You may style the box yourself instead.", fr: "Largeur de confort (toute longueur CSS, ex. \"12em\"). Tu peux aussi styler la boîte toi-même.", es: "Ancho de conveniencia (cualquier longitud CSS, ej. \"12em\"). También puedes estilizar la caja tú mismo." } },
			{ name: "h", type: "string", description: { en: "Convenience height (any CSS length, e.g. \"1em\").", fr: "Hauteur de confort (toute longueur CSS, ex. \"1em\").", es: "Altura de conveniencia (cualquier longitud CSS, ej. \"1em\")." } },
			{ name: "radius", type: "\"pill\" | \"circle\"", description: { en: "\"pill\" for a text line, \"circle\" for an avatar. Default: the skin's radius.", fr: "\"pill\" pour une ligne de texte, \"circle\" pour un avatar. Défaut : le rayon de la peau.", es: "\"pill\" para una línea de texto, \"circle\" para un avatar. Predeterminado: el radio del tema." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		/* Un seul rôle : le FOND qui scintille. Un skeleton n'a rien à informer ni à
		   marquer — il EST la surface d'attente. */
		layers: [
			{ part: "background", description: { en: "The shimmering surface — the decoy block itself.", fr: "La surface qui scintille — le bloc-leurre lui-même.", es: "La superficie que brilla — el bloque señuelo en sí." } }
		]
	};

	/* w, h et radius sont des raccourcis d'affichage : observés pour refléter la boîte,
	   ce ne sont PAS des états (ils ne passent pas par le socle). */
	static #BOX_ATTRS = ["w", "h", "radius"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZSkeleton.#BOX_ATTRS];
	}

	connectedCallback() {
		/* Leurre visuel, pas du contenu : on le cache aux technologies d'assistance. */
		if (!this.hasAttribute("aria-hidden")) this.setAttribute("aria-hidden", "true");
		this.#sync();
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		/* Les raccourcis de boîte se reflètent en style inline, sans toucher au socle. */
		if (ZSkeleton.#BOX_ATTRS.includes(name)) { this.#sync(); return; }
		super.attributeChangedCallback(name, previous, value);
	}

	/* Largeur de confort. @returns {string} */
	get w() {
		return this.getAttribute("w") ?? "";
	}

	/* @param {string} v */
	set w(v) {
		this.setAttribute("w", String(v));
	}

	/* Hauteur de confort. @returns {string} */
	get h() {
		return this.getAttribute("h") ?? "";
	}

	/* @param {string} v */
	set h(v) {
		this.setAttribute("h", String(v));
	}

	/*
		Reflète les raccourcis de boîte en variables inline lues par le CSS. On ne pose
		QUE ce qui est fourni : sans `w`/`h`, le CSS garde ses défauts (bloc pleine
		largeur), l'auteur reste libre de styler la boîte à la main.
	*/
	#sync() {
		const w = this.getAttribute("w");
		const h = this.getAttribute("h");
		if (w) this.style.setProperty("--z-skeleton__width", w);
		else this.style.removeProperty("--z-skeleton__width");
		if (h) this.style.setProperty("--z-skeleton__height", h);
		else this.style.removeProperty("--z-skeleton__height");
	}
}

export function defineZSkeleton() {
	if (!customElements.get("z-skeleton")) customElements.define("z-skeleton", ZSkeleton);
}
defineZSkeleton();
