/*
	contact-source.js — LA GOUVERNANCE des sources `<z-contact>`.

	POURQUOI ce fichier existe
	--------------------------
	`z-contact` a deux visages : l'effet ÉPHÉMÈRE (répliqué dans l'overlay au clic /
	au mouvement) et la SOURCE — un `<z-contact fx="…" trail="…">` que l'auteur écrit
	dans sa page pour porter la RECETTE (les attributs). Comme la source est un élément
	persistant, on peut en écrire plusieurs (copier-coller, deux composants qui en
	déposent chacun un…). Deux recettes globales qui se contredisent = comportement
	imprévisible.

	POURQUOI la DÉCLARATION (à plat) et pas l'ENCAPSULATION (wrapper)
	----------------------------------------------------------------
	On écrit `<z-contact fx trail>` UNE fois, à plat — on n'enveloppe RIEN. Choix
	assumé (décision produit) : l'encapsulation (façon React/Flutter, wrapper + provider)
	alourdit le HTML de nesting illisible. React y est CONTRAINT (en JS pur, un enfant
	ne « voit » pas une config globale sans un parent qui la lui passe). Zoé n'a pas
	cette contrainte : la plateforme a DÉJÀ une cascade globale (DOM, events, custom
	elements) → une déclaration à plat suffit, tout le DOM peut la « lire ». Copier
	l'encapsulation, ce serait importer le workaround de React sans avoir son problème.
	(On gagne en étant ce que l'autre ne PEUT pas être : plat, sans build, drop-in.)
	L'encapsulation reste possible en OPTION (envelopper une zone pour une recette
	locale), mais le DÉFAUT est la déclaration.

	LA RÈGLE (décision du 2026-07-14)
	------------------------------------------
	Parmi toutes les sources écrites dans la page, **seule la DERNIÈRE alimente** le
	moteur ; **toutes les autres passent en `disabled`** (`<z-contact disabled>`). La
	dernière déclarée gagne — comme la dernière règle CSS gagne à spécificité égale.
	Pourquoi désactiver les autres plutôt que les additionner : deux recettes globales
	qui se contredisent (une dit implode, l'autre explode) = comportement imprévisible.
	Une seule vérité active à la fois → lisible et déterministe. Un `MutationObserver`
	surveille le DOM et ré-applique cette règle à chaud (ajout, retrait, changement d'attribut).

	CE QUI EST une source, CE QUI N'EN EST PAS
	------------------------------------------
	- Source = un `<z-contact>` écrit par l'auteur, VIVANT dans le DOM normal.
	- PAS une source = les copies éphémères que le moteur crée DANS `<z-overlay>` (ce
	  sont des rendus, pas des recettes) → on les ignore en excluant le sous-arbre overlay.
*/

/*
	La source active courante (la dernière non-disabled), ou `null` si aucune source
	n'est écrite dans la page. Le moteur (contact.js / cursor.js) la lit comme la
	recette GLOBALE, quand aucune zone plus proche ne surcharge `fx` / `trail`.
	@type {HTMLElement | null}
*/
let active = null;

/*
	Renvoie toutes les sources `<z-contact>` écrites dans la page — c.-à-d. tous les
	`<z-contact>` SAUF les copies éphémères vivant dans `<z-overlay>` (des rendus, pas
	des recettes).
	@returns {HTMLElement[]}
*/
function sources() {
	return Array.from(document.querySelectorAll("z-contact"))
		.filter((el) => !el.closest("z-overlay"));
}

/*
	Applique la règle « la dernière alimente, les autres disabled ». Idempotent : on
	ne touche l'attribut `disabled` que s'il doit changer (évite une boucle infinie
	avec le MutationObserver qui, sinon, réagirait à sa propre écriture).
*/
function enforce() {
	const all = sources();
	/* La dernière source déclarée est la gagnante ; s'il n'y en a aucune, active = null. */
	active = all[all.length - 1] || null;

	for (const el of all) {
		const shouldDisable = el !== active;
		/* N'écrire QUE si l'état diffère → pas de mutation inutile, pas de boucle. */
		if (shouldDisable && !el.hasAttribute("disabled")) el.setAttribute("disabled", "");
		if (!shouldDisable && el.hasAttribute("disabled")) el.removeAttribute("disabled");
	}
}

/*
	L'observateur : ré-applique la règle dès que l'arbre bouge ou qu'un attribut
	pertinent d'une source change. `attributeFilter` limite le bruit aux attributs
	qui décident de la gouvernance (`disabled`) et de la recette (`fx` / `trail`).
	@type {MutationObserver | null}
*/
let observer = null;

/*
	Démarre la surveillance des sources `<z-contact>`. Appelé une fois par le moteur
	(startContact). On applique la règle immédiatement (état initial de la page) puis
	on observe les changements. Garde-fou : ne démarre qu'une fois.
*/
export function startContactSources() {
	if (observer) return;
	enforce();
	observer = new MutationObserver(enforce);
	observer.observe(document.documentElement, {
		childList: true,      /* ajout/retrait de sources */
		subtree: true,        /* n'importe où dans la page */
		attributes: true,
		attributeFilter: ["disabled", "fx", "trail"],
	});
}

/*
	La recette GLOBALE courante = la source active (la dernière écrite, non-disabled).
	Le moteur l'interroge en dernier recours, quand aucune zone plus proche du point
	de contact ne porte l'attribut demandé.
	@returns {HTMLElement | null}
*/
export function activeSource() {
	return active;
}
