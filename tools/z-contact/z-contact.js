/*
	contact.js — l'IMPACT au point de contact (l'axe `fx` de z-contact). Chaque appui
	sur un élément interactif fait naître un effet LÀ où le pointeur a touché, RÉPLIQUÉ
	dans l'overlay au-dessus de tout (overlay.js). L'effet est choisi par l'attribut
	`fx` (hérité du plus proche ancêtre) — `implode` (défaut) ou `explode` ; `none` le
	coupe. « contact » vaut pour souris, doigt et stylet (pas « click », faux sur tactile).

	z-contact a DEUX axes : `fx` (l'impact, ici) et `trail` (le sillage, cursor.js) —
	même composant, deux attributs. UN seul écouteur global (capture) ; zéro câblage par
	composant. À chaque contact on émet `zoe:contact` (fx, pointerType, taille) pour que
	d'autres briques réagissent (son, analytics, enchaînement). Skins = effets riches.
*/
import { topLayer } from "./z-overlay.js";
import { activeSource, startContactSources } from "./z-contact-source.js";

const INTERACTIVE =
	"a[href], button, input, select, textarea, label, [role='button'], [tabindex]," +
	" z-button, z-number, z-switch, z-checkbox, z-radio, z-tab, z-tabs, z-slider," +
	" z-range, z-segmented, z-rating, z-toggle";

let enabled = true;

/*
	Registre d'effets JS. Les effets de base (implode, explode) sont 100% CSS via
	`z-contact[contact="…"]` — rien à enregistrer. Les effets RICHES (boule de feu,
	particules, canvas…) se branchent ici, sans toucher au cœur.
*/
const effects = new Map();

function reduced() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/*
	Effet choisi = attribut `fx` de la SOURCE déclarée (le dernier <z-contact> actif,
	fourni par le watcher). Pas de source dans la page = pas d'effet : z-contact est
	OPT-IN, on le DÉCLARE pour activer les effets de la page. Défaut d'une source
	sans `fx` = « implode ».
	@returns {string}
*/
function effectOf() {
	const src = activeSource();
	return src ? (src.getAttribute("fx") || "implode").toLowerCase() : "none";
}

function onPointerDown(event) {
	if (!enabled || reduced()) return;
	const target = event.target.closest?.(INTERACTIVE);
	if (!target) return;
	if (target.matches?.("[disabled], [aria-disabled='true'], [data-no-contact]")) return;
	const effect = effectOf();
	if (effect === "none") return;
	spawn(event, target, effect);
}

/*
	Fait naître un <z-contact> au point de contact. L'effet (`contact`) et la couleur
	(l'accent de la cible) sont posés dessus ; sur tactile, l'onde est mise à l'échelle
	de la taille du doigt (event.width) quand c'est exploitable.
*/
function spawn(event, target, effect) {
	const x = event.clientX, y = event.clientY;
	const el = document.createElement("z-contact");
	el.setAttribute("fx", effect);
	el.setAttribute("aria-hidden", "true");
	/*
		Couleur, en respectant la cascade : le SPÉCIFIQUE gagne, le GLOBAL est le repli.
		  --z-contact-color posé sur la cible (ou un ancêtre)  →  il gagne
		  sinon --z-accent (global ou redéfini par le composant) →  repli

		getComputedStyle(target) résout déjà toute la cascade à l'endroit du contact :
		on lit donc la valeur telle qu'elle vaut LÀ. Ce pont JS est nécessaire parce que
		l'effet naît dans l'overlay — il n'est pas descendant de la cible, il n'hérite
		de rien. On recopie la valeur résolue, on n'invente pas.
	*/
	const targetStyle = getComputedStyle(target);
	const color =
		targetStyle.getPropertyValue("--z-contact-color").trim() ||
		targetStyle.getPropertyValue("--z-accent").trim();
	if (color) el.style.setProperty("--z-contact-color", color);
	el.style.left = `${x}px`;
	el.style.top = `${y}px`;

	/*
		LA GÉOMÉTRIE DE LA CIBLE — même pont que la couleur, même raison : l'effet naît
		dans l'overlay, il n'est descendant de rien, il n'hérite d'aucune forme. On lui
		recopie donc la BOÎTE du composant touché (taille, rayon, et l'écart entre le
		point de contact et le centre). Le CSS s'en sert pour l'effet `morph` — le petit
		rond né sous la souris meurt en épousant la forme du composant. Posé pour tous
		les effets : c'est une donnée du contact, pas une astuce d'un effet.
	*/
	const box = target.getBoundingClientRect();
	el.style.setProperty("--z-contact--target__w", `${box.width}px`);
	el.style.setProperty("--z-contact--target__h", `${box.height}px`);
	el.style.setProperty("--z-contact--target__radius", targetStyle.borderRadius || "0px");
	el.style.setProperty("--z-contact--target__dx", `${box.left + box.width / 2 - x}px`);
	el.style.setProperty("--z-contact--target__dy", `${box.top + box.height / 2 - y}px`);

	/*
		Anatomie du socle (ADR-0016), respectée à la lettre : PAS de couche `z-fx`
		(un effet transitoire vit DANS `z-foreground`, ce n'est pas une part). L'anneau/
		onde de l'impact = la part `z-foreground` ; le point central (implode) = `z-marker`.
		Vrais éléments ciblables/skinnables : `z-contact z-foreground { … }`.
	*/
	el.appendChild(document.createElement("z-foreground"));
	if (effect === "implode") el.appendChild(document.createElement("z-marker"));

	/*
		Taille de contact : sur tactile, event.width/height donne la géométrie du doigt.
		Fiable (variable, > quelques px) → on met l'onde à l'échelle. Sinon (souris, ou
		valeur constante ~1) → échelle 1. On n'est pas responsables du matériel : on lit
		l'API, repli propre.
	*/
	const pointerType = event.pointerType || "mouse";
	const contactSize = Math.max(event.width || 0, event.height || 0);
	let scale = 1;
	if (pointerType === "touch" && contactSize > 4) {
		scale = Math.min(3, Math.max(0.7, contactSize / 20));
		el.style.scale = String(scale);
	}
	/* Rendu dans l'overlay au-dessus de TOUT (ré-injecté topmost à chaque impact). */
	topLayer().appendChild(el);

	/* Effet RICHE branché ? on lui laisse la main ; sinon le CSS fait le rendu. */
	effects.get(effect)?.(el, x, y, target);

	/* Durée (pour le nettoyage ET l'événement). */
	const raw = getComputedStyle(el).getPropertyValue("--z-contact-duration").trim();
	const parsed = raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000;
	const duration = Number.isFinite(parsed) ? parsed : 500;

	/*
		Événement : le contact a eu lieu, avec ses paramètres. Émis sur la cible (bubbling)
		→ n'importe quel code peut écouter `document.addEventListener("zoe:contact", …)`.
	*/
	target.dispatchEvent(new CustomEvent("zoe:contact", {
		bubbles: true,
		detail: { fx: effect, x, y, size: scale, duration, pointerType, contactSize: contactSize || null },
	}));

	/* L'implose a deux couches décalées (jusqu'à ~1.3× la durée) → marge de nettoyage. */
	setTimeout(() => el.remove(), duration * 1.6 + 60);
}

/* Démarre le moteur : la gouvernance des sources déclarées (watcher) + un seul
   écouteur d'impact en capture. */
export function startContact() {
	startContactSources();
	document.addEventListener("pointerdown", onPointerDown, true);
}

/* Réglage + registre d'effets, exposés via Zoe.contact. */
export const contact = {
	on() { enabled = true; },
	off() { enabled = false; },
	get enabled() { return enabled; },
	/*
		Enregistre un effet riche (JS). Ex. :
			Zoe.contact.effect("fireball", (el, x, y) => { … particules … });
		Puis un auteur écrit `contact="fireball"` où il veut.
		@param {string} name
		@param {(el: HTMLElement, x: number, y: number, target: HTMLElement) => void} render
	*/
	effect(name, render) {
		if (name && typeof render === "function") effects.set(name, render);
	},
};

/*
	La balise <z-contact> — l'effet éphémère que le moteur fait naître au point de
	contact. Élément « bête » : aucun comportement propre, tout l'aspect vit dans le
	CSS (`z-contact z-foreground { … }`). Il est enregistré ICI, chez son moteur —
	et non dans un registre commun : une balise appartient au code qui la fait vivre.
*/
export class ZContact extends HTMLElement {}

/* Enregistre <z-contact>. Garde-fou contre la double définition. */
export function defineZContact() {
	if (!customElements.get("z-contact")) customElements.define("z-contact", ZContact);
}

/*
	Auto-installation à l'import — la convention de ce repo (un module se branche seul,
	comme chaque composant). Le moteur reste OPT-IN pour autant : sans un <z-contact fx="…">
	écrit dans la page, `effectOf()` renvoie "none" et il ne se passe rien.
*/
defineZContact();
startContact();
