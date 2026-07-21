/*
	============================================================
	code — le HTML de l'exemple, MONTRÉ À CÔTÉ de son rendu
	------------------------------------------------------------
	Une démo qui montre un composant sans montrer ce qu'on a TAPÉ pour l'obtenir ne
	sert à rien : on voit le résultat, on ne peut pas le refaire. Ce module colle donc
	le code source de chaque exemple JUSTE À CÔTÉ de son rendu — jamais en bas de page,
	jamais derrière un clic (loi de la vue : la cause et l'effet se touchent).

	Usage : marquer les blocs d'exemple, importer le module.

	    <div class="stack" data-code>…</div>        une rangée PAR EXEMPLE
	    <form class="stack" data-code="bloc">…</form>   tout le bloc en un seul code
	    import "…/examples/code.js";

	Par défaut, chaque enfant direct a SON code en face de lui : l'œil relie une case à
	sa ligne sans traverser l'écran. `data-code="bloc"` est l'exception — quand c'est
	l'ensemble qui fait sens (un formulaire), pas chaque champ.

	Ce qui est montré, c'est le HTML QUE TU AS ÉCRIT : les attributs que les composants
	se posent tout seuls (role, tabindex, aria-*) sont retirés — sinon on apprendrait à
	les écrire à la main, ce qui est exactement le contraire du but.
	============================================================
*/

/* Ce que les composants ajoutent d'eux-mêmes : jamais à recopier, donc jamais montré. */
const AUTO = ["role", "tabindex", "aria-checked", "aria-disabled", "aria-busy", "aria-invalid", "aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-orientation", "aria-label"];

const CSS = `
	/*
		justify-items: start — sans lui la grille ÉTIRE chaque exemple sur toute la
		colonne : un bouton devient pleine largeur et ne ressemble plus à ce qu'il est.
		Le <pre>, lui, doit s'étirer : il se remet en stretch juste après.
	*/
	.z-exemple { display: grid; grid-template-columns: minmax(12rem, 1fr) minmax(0, 1.1fr); gap: .8rem 1.2rem; align-items: center; justify-items: start; }
	.z-exemple > .z-code { justify-self: stretch; }
	.z-exemple > .z-code {
		margin: 0; padding: .7rem .9rem; overflow-x: auto;
		background: color-mix(in srgb, currentColor 5%, transparent);
		border-left: 2px solid color-mix(in srgb, currentColor 18%, transparent);
		border-radius: 4px;
		font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: pre; tab-size: 2; opacity: .85;
	}
	.z-exemple > .z-code b { font-weight: 600; opacity: 1; color: var(--z-accent, #06f); }
	@media (max-width: 720px) { .z-exemple { grid-template-columns: 1fr; } }
`;

/*
	Le HTML de l'exemple, lisible : attributs automatiques retirés, indentation refaite.
	@param {Element} bloc le conteneur de l'exemple
	@returns {string} le code à afficher
*/
function source(bloc) {
	return [...bloc.children].map((enfant) => indente(propre(enfant), 0)).join("\n");
}

/*
	Une copie de l'exemple débarrassée de ce que les composants se posent tout seuls.
	@param {Element} element
	@returns {Element} la copie, jamais le nœud vivant
*/
function propre(element) {
	const copie = element.cloneNode(true);
	for (const noeud of [copie, ...copie.querySelectorAll("*")]) {
		AUTO.forEach((attribut) => noeud.removeAttribute(attribut));
		if (noeud.getAttribute("style") === "") noeud.removeAttribute("style");
	}
	return copie;
}

/*
	Ré-indente un élément et sa descendance. On ne relit pas l'innerHTML du document :
	il porte l'indentation de la PAGE (déjà imbriquée), pas celle de l'exemple.
	@param {Element} element
	@param {number} niveau
	@returns {string}
*/
function indente(element, niveau) {
	const marge = "  ".repeat(niveau);
	const balise = element.tagName.toLowerCase();
	const attributs = [...element.attributes].map((a) => (a.value === "" ? ` ${a.name}` : ` ${a.name}="${a.value}"`)).join("");
	const ouvrante = `${marge}&lt;<b>${balise}</b>${echappe(attributs)}&gt;`;
	const fermante = `&lt;/<b>${balise}</b>&gt;`;

	/* Un élément sans enfant élément tient sur une ligne : l'exemple doit rester court. */
	if (!element.children.length) return `${ouvrante}${echappe(element.textContent.trim())}${fermante}`;

	const dedans = [...element.children].map((enfant) => indente(enfant, niveau + 1)).join("\n");
	return `${ouvrante}\n${dedans}\n${marge}${fermante}`;
}

/* @param {string} texte @returns {string} */
function echappe(texte) {
	return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Le <pre> d'un exemple. @param {string} html @returns {HTMLPreElement} */
function bloc(html) {
	const code = document.createElement("pre");
	code.className = "z-code";
	code.innerHTML = html;
	return code;
}

function monte() {
	const marques = document.querySelectorAll("[data-code]");
	if (!marques.length) return;
	document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);

	for (const zone of marques) {
		/* Tout le bloc d'un coup : quand c'est l'ENSEMBLE qui fait sens (un formulaire). */
		if (zone.dataset.code === "bloc") {
			const paire = document.createElement("div");
			paire.className = "z-exemple";
			const code = bloc(source(zone));
			zone.replaceWith(paire);
			paire.append(zone, code);
			continue;
		}

		/*
			Le cas courant : une RANGÉE par exemple. On lit tous les codes AVANT de toucher
			au DOM — sinon la grille qu'on installe change ce qu'on est en train de lire.
		*/
		const exemples = [...zone.children];
		const codes = exemples.map((exemple) => indente(propre(exemple), 0));
		zone.classList.add("z-exemple");
		zone.style.display = "grid";   /* la .stack d'origine est un flex : on la reprend */
		exemples.forEach((exemple, rang) => exemple.after(bloc(codes[rang])));
	}
}

/* Après le parsing ET après la définition des composants (le module est importé en
   dernier dans les pages) : on lit un DOM complet. */
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", monte);
else monte();
