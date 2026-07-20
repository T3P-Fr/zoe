/*
	pupitre.js — LE PUPITRE : tous les paramètres d'un composant, en direct.
	------------------------------------------------------------
	Une page de composant ne montre pas un tableau d'attributs : elle les MONTE. Chaque
	attribut devient une commande, on la touche, le composant réagit sous les yeux.

	IL SE GÉNÈRE, IL NE S'ÉCRIT PAS. Il lit le `static api` de la classe vivante — la
	même source que le manifeste, la doc et l'autocomplétion. Conséquence : un attribut
	ajouté au composant APPARAÎT ICI tout seul, et il ne peut jamais en manquer un. Un
	pupitre écrit à la main aurait divergé dès le premier ajout.

	Il ajoute d'office les VARIANTS communs (size · tone · width) : ils viennent de
	z-element, donc ils ne figurent pas dans l'api de chaque composant — mais ils
	s'appliquent à tous.

	Usage, une ligne dans la page :

	    import { pupitre } from "../../examples/pupitre.js";
	    pupitre("#demo");                 // sur l'élément visé

	Styleguide outil.pupitre
*/

/*
	Les variants du socle (core/z-element/z-element.css). Ils ne sont dans l'api d'aucun
	composant : ils appartiennent à la base, et s'appliquent partout.
*/
const VARIANTS = [
	{ name: "size", values: ["", "xs", "s", "m", "l", "xl"], role: "la place qu'il prend" },
	{ name: "tone", values: ["", "main", "complement", "soft"], role: "l'importance qu'il a" },
	{ name: "width", values: ["", "auto", "full"], role: "sa largeur" }
];

/*
	Monte le pupitre juste AVANT le composant visé — le réglage et son effet dans le même
	regard (jamais la commande en haut et le résultat en bas).
	@param {string|Element} cible  le composant à piloter (sélecteur ou élément)
	@returns {Element|null} le pupitre monté, ou null si la cible est introuvable
*/
export function pupitre(cible) {
	const sujet = typeof cible === "string" ? document.querySelector(cible) : cible;
	if (!sujet) return null;

	const tag = sujet.tagName.toLowerCase();
	const api = customElements.get(tag)?.api;

	const boite = document.createElement("div");
	boite.className = "pupitre";
	boite.append(titre(`<${tag}> — tous ses paramètres`));

	/* Les attributs PROPRES au composant, lus dans son api. */
	for (const attribut of api?.attributes || []) {
		boite.append(commande(sujet, attribut));
	}

	/* Puis les variants du socle, communs à tous. */
	for (const variant of VARIANTS) {
		boite.append(commande(sujet, { ...variant, type: "enum", description: variant.role }));
	}

	/* Et la lecture des états, qui ne se règlent pas : ils ARRIVENT. */
	boite.append(lecteurEtats(sujet));

	sujet.parentNode.insertBefore(boite, sujet);
	return boite;
}

/* Une commande = une ligne. Booléen → interrupteur ; liste → choix ; sinon → champ. */
function commande(sujet, attribut) {
	const ligne = document.createElement("label");
	ligne.className = "pupitre-ligne";

	const nom = document.createElement("code");
	nom.textContent = attribut.name;

	let champ;
	if (attribut.type === "boolean") {
		champ = document.createElement("input");
		champ.type = "checkbox";
		champ.checked = sujet.hasAttribute(attribut.name);
		champ.addEventListener("change", () => sujet.toggleAttribute(attribut.name, champ.checked));
	} else if (attribut.values) {
		champ = document.createElement("select");
		for (const valeur of attribut.values) {
			const option = document.createElement("option");
			option.value = valeur;
			option.textContent = valeur || "— défaut —";
			champ.append(option);
		}
		champ.value = sujet.getAttribute(attribut.name) || "";
		champ.addEventListener("change", () => {
			if (champ.value) sujet.setAttribute(attribut.name, champ.value);
			else sujet.removeAttribute(attribut.name);
		});
	} else {
		champ = document.createElement("input");
		champ.type = "text";
		champ.value = sujet.getAttribute(attribut.name) || "";
		champ.placeholder = "—";
		champ.addEventListener("input", () => {
			if (champ.value) sujet.setAttribute(attribut.name, champ.value);
			else sujet.removeAttribute(attribut.name);
		});
	}

	const role = document.createElement("span");
	role.className = "pupitre-role";
	role.textContent = texte(attribut.description);

	ligne.append(nom, champ, role);
	return ligne;
}

/*
	Les ÉTATS ne se règlent pas ici : ils arrivent au geste (survol, appui, glissé) ou
	sont posés par le code. On les LIT — le pupitre écoute `z-state` et allume le mot
	correspondant. C'est la différence entre un variant (ce que l'élément EST) et un état
	(ce qui lui ARRIVE), rendue visible.
*/
function lecteurEtats(sujet) {
	const boite = document.createElement("div");
	boite.className = "pupitre-etats";
	boite.append(titre("ses états — ils arrivent, ils ne se règlent pas"));

	const mots = new Map();
	const liste = document.createElement("div");
	liste.className = "pupitre-mots";

	for (const mot of customElements.get(sujet.tagName.toLowerCase())?.api?.states || []) {
		const puce = document.createElement("code");
		puce.className = "pupitre-mot";
		puce.textContent = mot;
		mots.set(mot, puce);
		liste.append(puce);
	}

	const allumer = (actifs) => {
		const set = new Set(actifs);
		for (const [mot, puce] of mots) puce.classList.toggle("on", set.has(mot));
	};

	sujet.addEventListener("z-state", (event) => allumer(event.detail.states));
	requestAnimationFrame(() => allumer(sujet.states || []));

	boite.append(liste);
	return boite;
}

/* Une description d'api est soit une chaîne, soit { en, fr, es } — ici on parle français. */
function texte(description) {
	if (!description) return "";
	return typeof description === "string" ? description : (description.fr || description.en || "");
}

function titre(contenu) {
	const element = document.createElement("p");
	element.className = "pupitre-titre";
	element.textContent = contenu;
	return element;
}
