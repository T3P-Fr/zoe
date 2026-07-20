/*
	overlay.js — LA scène des effets de pointeur, au-dessus de TOUT (patron z-contact).

	Modèle (ADR z-contact, insight Christophe 2026-07-14) : une RECETTE persistante
	(les attributs `fx`/`trail` sur une zone) ; le RENDU, lui, est répliqué dans un
	overlay unique, plein écran, en `position:fixed` et `z-index` maximal.

	GARANTIE « toujours au-dessus » PAR CONSTRUCTION, pas par un z-index qu'on espère
	assez haut : à chaque effet, on RÉ-INJECTE l'overlay en DERNIER dans <body>. Le
	dernier nœud appendu gagne l'empilement à z-index égal → l'effet passe même
	par-dessus une modale ouverte APRÈS. Rien n'est permanent : l'overlay se vide,
	l'effet naît/meurt, et renaît au sommet.

	`pointer-events:none` → la scène ne vole jamais un clic à la page en dessous.
*/

let layer = null;

/*
	Renvoie l'overlay, en le (re)plaçant EN DERNIER dans <body> pour rester au sommet.
	À appeler à CHAQUE naissance d'effet (impact, fuse, ruban) : la ré-insertion
	garantit l'empilement le plus haut sans course au z-index.
	@returns {HTMLElement}
*/
export function topLayer() {
	if (!layer) {
		layer = document.createElement("z-overlay");
		layer.setAttribute("aria-hidden", "true");
	}
	/* Ré-injection en dernier = re-hisse au-dessus de tout ce qui a été ajouté depuis. */
	if (layer.parentNode !== document.body || layer.nextSibling) {
		document.body.appendChild(layer);
	}
	return layer;
}

/*
	Vide la scène (fin d'inactivité, reset). L'overlay lui-même reste, prêt à resservir.
*/
export function clearLayer() {
	if (layer) layer.replaceChildren();
}
