/*
	============================================================
	z-contact-effect — LE CHARGEUR D'EFFET : un seul <link>, ÉCHANGÉ
	------------------------------------------------------------
	Un effet de clic se comporte comme une PEAU : on le REMPLACE, on ne l'empile pas.
	Deux recettes qui visent `z-overlay z-contact z-foreground` se mélangeraient (l'une
	garde son fond, l'autre son filet…) — un « frankenstein ». On l'interdit à la racine :
	il n'existe qu'UN <link> d'effet à la fois. Charger le suivant efface entièrement le
	précédent — ils s'entretuent, ils ne s'empilent jamais.

	La peau déclare sa signature en token `--z-contact-fx` (claude → ink, hightech → morph) ;
	ce module la charge dans l'unique lien. Une page — ou la démo de la doc — peut l'écraser
	via `setContactEffect(fx)`. `fx="none"` (ou vide) retire le lien : aucun effet.
	============================================================
*/

const ROOT = new URL("../../", import.meta.url).href;   /* …/zoé/ */
const LINK_ID = "z-contact-fx";

/*
	Charge la recette `<fx>` dans l'unique lien d'effet — ou le retire pour « none »/vide.
	Toujours ré-appendu en dernier : il gagne la cascade, et il est SEUL de toute façon.
	@param {string} fx  le nom de l'effet (implode · explode · morph · ink…) ou "none"
*/
export function setContactEffect(fx) {
	const name = (fx || "").trim().toLowerCase();
	let link = document.getElementById(LINK_ID);
	if (!name || name === "none") { link?.remove(); return; }
	if (!link) { link = document.createElement("link"); link.id = LINK_ID; link.rel = "stylesheet"; }
	document.head.append(link);
	link.href = `${ROOT}tools/z-contact/effects/${name}.css`;
}

/* Lit la signature de la peau active (--z-contact-fx sur :root) et la charge. */
export function syncContactEffectFromSkin() {
	setContactEffect(getComputedStyle(document.documentElement).getPropertyValue("--z-contact-fx"));
}

/* Au chargement : une frame pour laisser la peau s'appliquer, puis on synchronise. */
if (typeof document !== "undefined" && typeof requestAnimationFrame === "function") {
	requestAnimationFrame(syncContactEffectFromSkin);
}
