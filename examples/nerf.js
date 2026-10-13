/*
	============================================================
	nerf.js — UNE EXPÉRIENCE : le CSS réclame une couche, le script la pose
	------------------------------------------------------------
	⚠ CE FICHIER N'EST PAS LE MODÈLE DE ZOÉ. Il vit dans examples/ parce que c'est un
	essai (examples/nerf.lab.html), pas une brique du noyau. Le modèle tranché est celui
	de core/z-layer : l'AUTEUR écrit ses calques (`<z-layer part="…">`), Zoé n'injecte
	rien (ADR-0018). Ici, au contraire, le script lit les feuilles de style et CRÉE un
	`<div class="z-background">` dès qu'une règle le réclame — deux formes pour une
	couche, exactement ce que la loi « une seule forme » interdit dans le produit.
	Gardé comme trace d'une piste explorée le 2026-07-25 : si l'idée revient, elle a déjà
	son code et son banc d'essai.

	LE NERF : le CSS réclame une couche, le script la pose à son rôle.
	L'auteur n'écrit QUE le sens (`<z-button>Envoyer</z-button>`) ; c'est le CSS qui
	déclare les couches de dessin. Dès qu'une règle vise `z-button > .z-background`, ce
	cœur la lit, crée le `<div>` manquant et le pose là où son RÔLE le veut (background =
	au fond).

	La règle d'or (elle lève ADR-0018) : **Zoé injecte le DESSIN, jamais le SENS.**
	Les couches sont des `<div>` muets, marqués `data-z-layer` — de VRAIS nœuds
	inspectables et hackables, pas des `::before` cachés. Le sens (le texte, le rôle
	ARIA) reste ce que TU écris.

	Portée de cette graine (volontairement minuscule) : on couvre `background`, on scanne
	au chargement, une fois. Le reste (autres rôles, MutationObserver, placement dans un
	vrai Zoe-layers.css) viendra APRÈS, une fois ce cœur prouvé.

	Styleguide examples.nerf
	============================================================
*/

/*
	Le PLACEMENT canonique par rôle — « le nom dit la place ». Le placement (position,
	z-index) appartient à Zoé ; la PEINTURE (couleur, rayon) appartient au CSS de l'auteur
	ou de la peau. C'est la frontière : Zoé range, le CSS peint.
	@type {Record<string, { at: "back" | "front", css: Record<string, string> }>}
*/
const PLACEMENT = {
	/* le fond : derrière le contenu (z-index négatif → le texte en flux passe devant). */
	background: { at: "back", css: { position: "absolute", inset: "0", zIndex: "-1" } }
	/* hitArea, marker… : ajoutés quand le nerf est validé. */
};

/*
	Lit toutes les feuilles de style et récolte, par balise, les rôles de couche réclamés.
	Un sélecteur `z-button > .z-background` déclare : « la balise z-button veut une couche
	background ». On ignore les feuilles cross-origin (polices importées) — illisibles, et
	elles ne réclament pas de couche de toute façon.
	@returns {Map<string, Set<string>>} balise → ensemble de rôles
*/
function scanRequests() {
	const byTag = new Map();
	/* tag = `z-…` NON précédé d'un point (sinon on attraperait le `.z-x` lui-même comme
	   balise) ; puis, dans le même sélecteur, un `.z-<rôle>`. */
	const re = /(?<![.\w-])(z-[a-z][\w-]*)[^,{}]*?\.z-([a-zA-Z][\w-]*)/g;
	for (const sheet of document.styleSheets) {
		let rules;
		try { rules = sheet.cssRules; } catch { continue; }   /* cross-origin : on saute */
		collect(rules, byTag, re);
	}
	return byTag;
}

/*
	Parcourt les règles. On lit le sélecteur ET on récurse : depuis le CSS imbriqué, une
	CSSStyleRule porte À LA FOIS un `selectorText` ET une liste `cssRules` (ses règles
	filles). Piège vécu : tester `if (rule.cssRules)` en premier saute la lecture de TOUTE
	règle (chaque style rule a désormais un `cssRules`, vide mais présent). Donc les deux,
	jamais l'un OU l'autre. `matchAll` évite tout partage d'état du `lastIndex` global.
*/
function collect(rules, byTag, re) {
	for (const rule of rules) {
		if (rule.selectorText) {
			for (const [, tag, role] of rule.selectorText.matchAll(re)) {
				if (!byTag.has(tag)) byTag.set(tag, new Set());
				byTag.get(tag).add(role);
			}
		}
		if (rule.cssRules) collect(rule.cssRules, byTag, re);   /* @media, @layer, imbriqué */
	}
}

/*
	Pose les couches réclamées sur chaque instance — sauf celles que l'auteur a DÉJÀ
	écrites (Zoé ne double pas ce qui existe). L'hôte reçoit `position: relative` : l'ancre
	dont les couches absolute ont besoin.
	@param {Map<string, Set<string>>} byTag
*/
function apply(byTag) {
	for (const [tag, roles] of byTag) {
		for (const host of document.querySelectorAll(tag)) {
			/* L'ancre des couches absolute. `isolation: isolate` crée un CONTEXTE
			   D'EMPILEMENT propre : sans lui, une couche en z-index négatif (le fond)
			   fuirait derrière la page entière au lieu de rester derrière le contenu. */
			if (!host.style.position) host.style.position = "relative";
			host.style.isolation = "isolate";
			for (const role of roles) {
				if (host.querySelector(`:scope > .z-${role}`)) continue;   /* déjà écrite */
				const layer = document.createElement("div");
				layer.className = `z-${role}`;
				layer.dataset.zLayer = "généré";   /* inspectable : c'est Zoé qui l'a posée */
				place(host, layer, role);
			}
		}
	}
}

/*
	Range une couche selon son rôle. Rôle connu → sa place canonique. Rôle inventé
	(`z-cacahuete`) → posé en neutre, et Zoé PRÉVIENT (jamais de casse silencieuse) : à
	l'auteur de lui donner sa place. Pas de plafond, juste un filet.
	@param {HTMLElement} host @param {HTMLElement} layer @param {string} role
*/
function place(host, layer, role) {
	const p = PLACEMENT[role];
	if (p) {
		Object.assign(layer.style, p.css);
		if (p.at === "back") host.prepend(layer);
		else host.append(layer);
	} else {
		host.append(layer);
		console.warn(`Zoé : rôle inconnu « ${role} » — je pose la couche en neutre. Donne-lui sa place (position, z-index).`);
	}
}

/* Le nerf tourne une fois, quand le DOM et les feuilles sont là. */
export function run() {
	apply(scanRequests());
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
else run();
