/*
	contact.js — l'IMPACT au point de contact (l'axe `fx` de z-contact). Chaque appui
	sur un élément interactif fait naître un effet LÀ où le pointeur a touché, RÉPLIQUÉ
	dans l'overlay au-dessus de tout (overlay.js). « contact » vaut pour souris, doigt et
	stylet (pas « click », faux sur tactile).

	QUI CHOISIT L'EFFET : la PEAU, en CSS. Le moteur ne fait que poser les pièces
	(z-foreground, z-marker) et leur recopier la boîte de la cible ; ce qu'on VOIT vient
	de la recette que la peau importe (tools/z-contact/effects/*.css). Sans recette
	importée, un clic ne produit rien de visible — c'est le cas de la peau Claude.
	L'attribut `fx` ne sert plus qu'à COUPER (`fx="none"`) : un effet écrit dans le HTML
	s'appliquerait à toutes les peaux, ce qui était exactement le défaut d'avant.

	z-contact a DEUX axes : `fx` (l'impact, ici) et `trail` (le sillage, cursor.js) —
	même composant, deux attributs. UN seul écouteur global (capture) ; zéro câblage par
	composant. À chaque contact on émet `zoe:contact` (fx, pointerType, taille) pour que
	d'autres briques réagissent (son, analytics, enchaînement). Skins = effets riches.

	UN ou DEUX temps — un `fx` se joue d'un trait au CURSOR-DOWN (morph/implode/explode),
	OU se TIENT jusqu'au CURSOR-UP quand sa recette déclare `--z-contact__release--<nom>`
	(voir discoverHeldEffects). Le moteur crée alors l'effet en `phase="press"` et le garde
	vivant sous le doigt ; au relâchement il bascule `phase="release"` (le CSS y peint la
	conclusion) et émet `zoe:release`. Un effet à deux temps couvre donc appui ET relâchement.
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

/*
	LES APPUIS EN COURS — pour les effets À DEUX TEMPS (voir discoverHeldEffects). Un effet
	ordinaire naît au CURSOR-DOWN et meurt seul ; un effet à deux temps VIT tant que le doigt
	appuie, puis se conclut au CURSOR-UP. On range chaque effet vivant par `pointerId` (multitouch :
	plusieurs appuis simultanés, chacun le sien) → { el, safety }.
	@type {Map<number, { el: HTMLElement, safety: number }>}
*/
const pressed = new Map();

/*
	Garde-fou : si aucun pointerup n'arrive (pointeur perdu, onglet masqué, geste avalé), on
	relâche de force au bout de ce délai — un effet vivant ne doit jamais rester coincé à l'écran.
*/
const MAX_HOLD = 15000;

function reduced() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/*
	Pas de source <z-contact> dans la page = rien : le moteur est OPT-IN, on le DÉCLARE.
	Avec une source, il tourne — et c'est la PEAU qui décide de ce qu'on voit (la recette
	CSS qu'elle importe). L'attribut `fx="none"` coupe tout ; toute autre valeur ne fait
	que nommer les pièces posées, elle ne choisit plus l'apparence.
	@returns {string} le nom des pièces à poser, ou "none" si aucune source
*/
function effectOf() {
	const src = activeSource();
	if (!src) return "none";
	const explicit = src.getAttribute("fx");
	if (explicit) return explicit.toLowerCase();
	/* pas de `fx` écrit → la signature PAR DÉFAUT de la peau (token --z-contact-fx),
	   sinon rien. C'est la peau qui décide, jamais un défaut codé en dur. */
	return getComputedStyle(document.documentElement).getPropertyValue("--z-contact-fx").trim().toLowerCase() || "none";
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
	Au RELÂCHEMENT (CURSOR-UP) ou à l'annulation du geste : on bascule l'effet pressé de ce
	pointeur vers l'état `release` (l'auteur y écrit la conclusion — l'explosion), puis on le
	retire quand l'animation de sortie est finie. Idempotent (un pointeur relâché deux fois ne
	fait rien la seconde).
	@param {number} pointerId
*/
function releasePressed(pointerId) {
	const entry = pressed.get(pointerId);
	if (!entry) return;
	pressed.delete(pointerId);
	clearTimeout(entry.safety);
	const { el } = entry;
	el.setPhase("release");

	/* La recette peut donner au relâchement une durée propre (token `--z-contact-duration`
	   scopé `[phase="release"]`). On la relit APRÈS la bascule pour honorer cette valeur. */
	const raw = getComputedStyle(el).getPropertyValue("--z-contact-duration").trim();
	const parsed = raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000;
	const duration = Number.isFinite(parsed) ? parsed : 500;
	setTimeout(() => el.remove(), duration * 1.6 + 60);

	/* Écho : le relâchement a eu lieu (pour son, enchaînements, analytics). */
	document.dispatchEvent(new CustomEvent("zoe:release", { bubbles: true, detail: { pointerId } }));
}

/* Un seul écouteur de relâchement (comme pour l'appui) : il sert TOUS les effets à deux temps. */
function onPointerUp(event) {
	releasePressed(event.pointerId);
}

/*
	Fait naître un <z-contact> au point de contact. L'effet (`fx`) et la couleur (l'accent de
	la cible) sont posés dessus ; sur tactile, l'onde est mise à l'échelle de la taille du doigt
	(event.width) quand c'est exploitable. Naît toujours en `phase="press"` (premier temps) ;
	il naît en état `press`, y RESTE tant que l'on appuie, et bascule en `release` au relâchement.
	@param {PointerEvent} event
	@param {HTMLElement} target  le composant touché
	@param {string} effect       le nom de l'effet (fx) — sert d'étiquette / de scope optionnel
*/
function spawn(event, target, effect) {
	const x = event.clientX, y = event.clientY;
	const el = document.createElement("z-contact");
	el.setAttribute("fx", effect);
	/* LE TEMPS de l'effet, dans la grammaire de Zoé : l'auteur écrit `z-contact:state(press)`
	   pendant l'appui, `z-contact:state(release)` au relâchement. setPhase pose l'état (et, le
	   temps de la migration, l'attribut `phase=` que lisent encore les vieilles recettes). */
	el.setPhase("press");
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
	/* Les DEUX couches de l'anatomie, posées pour tout effet : `z-foreground` (l'onde/anneau)
	   et `z-marker` (le point central). L'auteur en peint zéro, une ou deux — celle qu'il ne
	   touche pas reste à 0×0, invisible, sans coût. C'est le vocabulaire des calques : on écrit
	   `z-contact:state(press) z-foreground { … }`. */
	el.appendChild(document.createElement("z-foreground"));
	el.appendChild(document.createElement("z-marker"));

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

	/* CHAQUE effet se tient : il vit tant que l'on appuie (état `press`) et se conclut au
	   relâchement (état `release`, via releasePressed). On le range par pointerId (multitouch :
	   plusieurs appuis, chacun le sien) et on arme le garde-fou. Le nettoyage a lieu au
	   relâchement — jamais par une durée ici, sinon l'effet s'effacerait sous le doigt. */
	const safety = setTimeout(() => releasePressed(event.pointerId), MAX_HOLD);
	pressed.set(event.pointerId, { el, safety });
}

/* Démarre le moteur : la gouvernance des sources déclarées (watcher) + un seul
   écouteur d'impact en capture. */
export function startContact() {
	startContactSources();
	document.addEventListener("pointerdown", onPointerDown, true);
	/* Le SECOND temps des effets à deux temps : relâchement normal (up) ou geste annulé
	   (cancel — le doigt part de l'écran, un scroll prend la main…). Les deux concluent l'effet.
	   En capture, comme l'appui : le moteur voit le geste avant que la page ne l'intercepte. */
	document.addEventListener("pointerup", onPointerUp, true);
	document.addEventListener("pointercancel", onPointerUp, true);
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
export class ZContact extends HTMLElement {
	constructor() {
		super();
		/* ElementInternals ouvre les ÉTATS PERSONNALISÉS : `:state(press)` / `:state(release)`.
		   C'est CE qui laisse l'auteur écrire l'effet dans la grammaire de Zoé — décrire
		   `z-contact` dans ses états — sans jamais connaître l'overlay ni les couches. */
		try { this._internals = this.attachInternals(); } catch { this._internals = null; }
	}

	/*
		Pose le TEMPS courant de l'effet : `press` (appui) puis `release` (relâchement). Un seul
		état à la fois. On écrit l'état personnalisé (pour `:state(...)`) ET, le temps que les
		recettes livrées migrent, l'attribut `phase=` qu'elles lisent encore.
		@param {"press" | "release"} name
	*/
	setPhase(name) {
		this.setAttribute("phase", name);
		const states = this._internals?.states;
		if (states) { states.clear(); states.add(name); }
	}

	/*
		L'API MACHINE (lue par scripts/z-manifest → autocomplétion + doc + llms.txt).
		Elle décrit la SOURCE, la seule chose qu'un auteur écrit : `<z-contact fx="…">`.
		L'effet éphémère, lui, est créé par le moteur — personne ne le tape à la main.
	*/
	static api = {
		tag: "z-contact",
		example: `<z-contact></z-contact>
<!-- one tag anywhere in the page: every interactive element gets the skin's click effect -->`,
		summary: {
			en: "Need a click effect across your whole page? Drop this tag anywhere — problem solved. Two effects by default; not to your taste? Make your own in a few lines of CSS.",
			fr: "Besoin d'un effet de clic visuel sur toute votre page ? Posez cette balise n'importe où — problème résolu. Deux effets par défaut ; ils ne vous conviennent pas ? Faites le vôtre en quelques lignes de CSS.",
			es: "¿Un efecto de clic visual en toda su página? Coloque esta etiqueta donde sea — resuelto. Dos efectos por defecto; ¿no le convienen? Haga el suyo en unas líneas de CSS."
		},
		attributes: [
			{
				name: "fx",
				values: [{ value: "none", note: { en: "cut the effect on this page — fx's ONLY role. WHICH effect shows belongs to the skin, never the page", fr: "coupe l'effet sur cette page — le SEUL rôle de fx. QUEL effet s'affiche appartient à la peau, jamais à la page", es: "corta el efecto en esta página — el ÚNICO papel de fx. QUÉ efecto se muestra pertenece a la piel, nunca a la página" } }],
				description: { en: "Kill switch only; the effect itself belongs to the skin.", fr: "Coupe-circuit, rien d'autre ; l'effet lui-même appartient à la peau.", es: "Solo interruptor; el efecto pertenece a la piel." }
			},
			{ name: "disabled", type: "boolean", description: { en: "Set by the engine on every source but the last one — the last declared wins.", fr: "Posé par le moteur sur toutes les sources sauf la dernière — la dernière déclarée gagne.", es: "Puesto por el motor en todas las fuentes menos la última — la última declarada gana." } },
			/* Les 4 raccourcis : un attribut qui POSE son token (parité attribut/token) — au
			   CHOIX avec la variable CSS du même nom, plus bas. Les deux font la même chose. */
			{ name: "size", values: [{ value: "<longueur>", note: { en: "e.g. 24px — sets --z-contact-size", fr: "ex. 24px — pose --z-contact-size", es: "p. ej. 24px — pone --z-contact-size" } }] },
			{ name: "width", values: [{ value: "<longueur>", note: { en: "e.g. 2px — sets --z-contact-width", fr: "ex. 2px — pose --z-contact-width", es: "p. ej. 2px — pone --z-contact-width" } }] },
			{ name: "duration", values: [{ value: "<durée>", note: { en: "e.g. 2s — sets --z-contact-duration", fr: "ex. 2s — pose --z-contact-duration", es: "p. ej. 2s — pone --z-contact-duration" } }] },
			{ name: "color", values: [{ value: "<couleur>", note: { en: "e.g. tomato — sets --z-contact-color", fr: "ex. tomato — pose --z-contact-color", es: "p. ej. tomato — pone --z-contact-color" } }] }
		],
		events: [
			{ name: "zoe:contact", description: { en: "Emitted on the touched target. detail: { fx, x, y, size, duration, pointerType }.", fr: "Émis sur la cible touchée. detail : { fx, x, y, size, duration, pointerType }.", es: "Emitido en el objetivo tocado. detail: { fx, x, y, size, duration, pointerType }." } }
		],
		states: [],
		cssVars: [
			{ name: "--z-contact-size", description: { en: "The size of the effect.", fr: "La taille de l'effet.", es: "El tamaño del efecto." } },
			{ name: "--z-contact-width", description: { en: "Thickness of the outline.", fr: "L'épaisseur du contour.", es: "El grosor del contorno." } },
			{ name: "--z-contact-duration", description: { en: "Duration of the effect.", fr: "La durée de l'effet.", es: "La duración del efecto." } },
			{ name: "--z-contact-color", description: { en: "Colour — defaults to the accent of the touched element.", fr: "La couleur — par défaut l'accent de l'élément touché.", es: "El color — por defecto el acento del elemento tocado." } }
		]
	};

	/*
		LA PARITÉ ATTRIBUT / TOKEN — la force : chaque réglage se pose AU CHOIX en CSS
		(`--z-contact-duration: 2s`) OU en attribut (`<z-contact duration="2s">`). L'attribut
		ne peint pas : il POSE le token sur :root, d'où l'effet — né dans l'overlay — en
		hérite. On ne touche PAS au moteur : juste cette réflexion sur la source déclarée.
	*/
	static shortcuts = { size: "--z-contact-size", width: "--z-contact-width", duration: "--z-contact-duration", color: "--z-contact-color" };
	static observedAttributes = ["size", "width", "duration", "color"];

	attributeChangedCallback(name, _old, value) {
		const prop = ZContact.shortcuts[name];
		if (!prop) return;
		if (value == null) document.documentElement.style.removeProperty(prop);
		else document.documentElement.style.setProperty(prop, value);
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est JAMAIS bloqué
		(pas de plafond), mais il est DIT tout haut : une faute de frappe ne se perd plus.
		Les attributs natifs (id, class, data-*, aria-*…) sont laissés tranquilles.
	*/
	connectedCallback() {
		const known = new Set(["fx", "disabled", "size", "width", "duration", "color"]);
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (known.has(name) || native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-contact] attribut inconnu « ${name} » — ignoré (jamais bloqué). Connus : fx · size · width · duration · color. Pour un réglage libre : le token CSS --z-contact-${name}.`);
		}
	}
}

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
/*
	…mais on ne DÉMARRE le moteur que s'il y a un vrai DOM à écouter. Hors navigateur
	(Node : z-manifest lit `static api` en important le module, un rendu serveur ferait
	pareil), il n'y a personne à écouter et `document` n'est qu'un décor.
*/
if (typeof document !== "undefined" && typeof document.querySelectorAll === "function") {
	startContact();
}
