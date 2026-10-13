/*
	z-cursor.js — LE SILLAGE DU POINTEUR (le ruban qui suit la souris, ou qui fuse
	d'un clic à l'autre).

	⚠ PORTÉ, PAS RÉÉCRIT. Ce moteur vient de l'ancien repo
	(`packages/core/src/fx/cursor.js`) et il est INTOUCHABLE : on le déplace, on ne le
	refait pas. Ce qui a bougé depuis, et rien d'autre : les deux `import` ont changé de
	chemin ; `<z-cursor>` sait s'allumer toute seule (voir tout en bas) ; et le moteur va
	lire ses réglages sur la BALISE au lieu de la racine (voir `trailHost`). Pas une ligne
	de mouvement n'a bougé — le mouvement se juge à l'œil, pas au diff.

	L'USAGE, en une ligne : poser <z-cursor></z-cursor> dans la page. Rien d'autre.

	DEUX EFFETS, UN SEUL MOTEUR — et c'est tout ce qui reste (le mode `smear`, un carré
	qui fusait d'un clic à l'autre, a été supprimé le 2026-07-21 : « je ne garde que le
	follow-mouse et le click2click »).

	  fx="move"   le RUBAN suit la souris. Courbe lissée sur les N dernières positions,
	              grosse tête au curseur → pointe à la queue, qui s'efface quand on
	              s'arrête. Canvas plein écran, curseur natif gardé.
	  fx="click"  le MÊME ruban, mais nourri d'un point FANTÔME qui voyage du clic
	              précédent vers le nouveau (fuseTrail), puis meurt tout seul.
	  fx="none"   rien.

	Un seul moteur pour les deux : c'est la décision de fond. Le clic→clic n'est pas un
	autre effet, c'est le même sillage avec une autre main sur la barre.

	Réglé par tokens --z-trail-* (grosseur, longueur, fluidité, courbe, couleur), que
	CHAQUE PEAU pose à sa façon : la queue de Claude est une plume qui traîne, celle de
	HighTech un tracé d'instrument. Couleur par défaut = --z-accent, donc elle suit la
	peau. Coupé sous prefers-reduced-motion.
*/

import { ZElement } from "../../core/z-element/z-element.js";
import { topLayer } from "../z-contact/z-overlay.js";
import { activeSource } from "../z-contact/z-contact-source.js";

let started = false;

function reduced() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/*
	Attribut PUBLIC `trail` (hérité du plus proche ancêtre, défaut "none") — le SILLAGE,
	un seul moteur exprimé de deux façons :
	  - "none"  : aucun sillage (curseur natif seul) ;
	  - "click" : le ruban nourri d'un point fantôme qui va du clic précédent au nouveau.
	  - "move"  : un ruban qui SUIT le curseur en continu (canvas, tokens --z-trail-*).
	L'impact au clic, lui, est l'autre axe : `fx` (implode/explode), jamais ici.
	Lu sur la SOURCE déclarée (le dernier <z-contact> actif, via le watcher) — pas de
	source = pas de sillage (opt-in, comme fx).
*/
function trailOf() {
	/* Une balise <z-cursor fx="click"> écrite dans la page VAUT déclaration de sillage au
	   clic, au même titre que <z-contact trail="click"> (la forme historique). C'est du
	   routage, pas du mouvement : le moteur, lui, n'est pas touché. */
	if (document.querySelector('body > z-cursor[fx="click"]')) return "click";
	const src = activeSource();
	return src ? (src.getAttribute("trail") || "none").toLowerCase() : "none";
}

/* ---------- trail="click" : le SILLAGE fuse du clic précédent au nouveau clic ----------
   MÊME moteur que le move : le ruban est nourri d'un point fantôme A→B qui meurt seul
   (fuseTrail) : un seul moteur pour le suivi ET le clic→clic. */
let lastClick = null;

function onClickTrail(event) {
	if (reduced()) return;
	if (trailOf() !== "click") return;
	const to = { x: event.clientX, y: event.clientY };
	if (lastClick) fuseTrail(lastClick, to);
	lastClick = to;
}

/*
	LES COURBES — huit familles, qui décident comment l'épaisseur du ruban décroît de la
	tête vers la queue (`--z-trail-ease`). Une peau choisit la sienne : `sine` fait FONDRE
	l'épaisseur (la plume de Claude), `linear` la fait tomber droit (le tracé de HighTech).
	Elles s'appelaient SMEAR_* du temps où un second effet les partageait ; ce mode a été
	retiré le 2026-07-21, le nom aussi.
*/
const BACK_C = 1.70158;

const EASES = {
	linear: (t) => t,
	quad:   (t) => t * t,
	cubic:  (t) => t * t * t,
	quart:  (t) => t * t * t * t,
	quint:  (t) => t * t * t * t * t,
	expo:   (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
	sine:   (t) => 1 - Math.cos((t * Math.PI) / 2),
	back:   (t) => (BACK_C + 1) * t * t * t - BACK_C * t * t,
};

/*
	OÙ LE MOTEUR VA LIRE SES RÉGLAGES — sur la BALISE, pas sur la racine.

	Le ruban est peint dans un canevas plein écran : il n'a pas d'élément à lui, il doit
	donc aller chercher ses réglages quelque part. Longtemps c'était `<html>`, et ça
	dressait un mur : `z-cursor { --z-trail-thickness: 30 }` était ignoré, et un pont JS
	recopiait les variants sur la racine — donc pour toute la page, et sans jamais
	nettoyer (une valeur posée survivait au changement de peau).

	Rien n'est perdu au passage : une peau pose ses réglages sur `:root` et ils DESCENDENT
	jusqu'à la balise. Ce qui est écrit sur la balise gagne, ce qui vient de la peau
	s'applique sinon. L'ordre naturel, sans une ligne de JS pour l'arbitrer.
*/
let sourceEl = null;

/* La balise qui règle le sillage : celle que l'auteur a écrite, sinon le `<z-contact>`
   de la forme historique, sinon la racine (il faut bien lire quelque part). */
function trailHost() {
	if (sourceEl?.isConnected) return sourceEl;
	return document.querySelector("body > z-cursor") || activeSource() || document.documentElement;
}

/* Lit un token CSS en CHAÎNE (le nom d'une courbe, une couleur) avec repli. */
function tokenStr(el, name, fallback) {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	return raw || fallback;
}

/* Valeur numérique d'un token, lue sur un élément (le moteur les relit au vol). */
function token(el, name, fallback) {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	const n = parseFloat(raw);
	return Number.isFinite(n) ? n : fallback;
}

/* ---------- Mode MOUSETRAIL : un ruban qui suit le curseur ----------
	On mémorise les N dernières positions du curseur ; à chaque frame on relie ces
	points par une courbe LISSÉE (quadratique via les milieux), avec une LARGEUR qui
	s'effile : grosse tête au curseur → pointe à la queue. Les points vieillissent et
	disparaissent (effacement quand la souris s'arrête). Curseur natif GARDÉ. Dessiné
	sur un <canvas> plein écran (la largeur variable le long d'une courbe est trop
	pénible en SVG). Piloté par tokens --z-trail-* ; mouse-fx="mousetrail" (page). */
let mtOn = false;
let mtRaf = 0;
let mtCanvas = null;
let mtCtx = null;

function mtSizeCanvas() {
	const dpr = window.devicePixelRatio || 1;
	mtCanvas.width = Math.round(window.innerWidth * dpr);
	mtCanvas.height = Math.round(window.innerHeight * dpr);
	mtCanvas.style.width = window.innerWidth + "px";
	mtCanvas.style.height = window.innerHeight + "px";
	mtCtx.setTransform(dpr, 0, 0, dpr, 0, 0);   /* on dessine en pixels CSS */
}

/* La VRAIE trace : on enregistre les positions du curseur (tête = la plus récente,
   pile sur la souris → colle à sa vitesse). Elles vieillissent puis disparaissent. */
let mtPoints = [];   /* [{x, y, t}] du plus ANCIEN (queue) au plus RÉCENT (tête) */
let mtHeadThick = 0; /* grosseur de tête LISSÉE (suit la vitesse de la souris) */
let mtRetract = 0;   /* vitesse de rétraction de la queue (accélère quand on ralentit) */
let mtTarget = null; /* dernière position VISÉE (le curseur en move, ou le point fantôme A→B en click) */
const mtSmooth = { x: 0, y: 0 };   /* tête lissée, échantillonnée dans la boucle rAF */
let mtDriven = false; /* true = ruban PILOTÉ (click2click, sans le vrai curseur) ; false = suit la souris (move) */
let fuseActive = false; /* true tant que le point fantôme voyage de A vers B (avant de mourir) */
let fuseRaf = 0;

function onMoveMT(event) {
	/* On ne fait QUE mémoriser la cible ; l'échantillonnage régulier se fait en rAF
	   (fluide, indépendant du débit des événements pointeur). */
	if (!mtTarget) { mtTarget = { x: event.clientX, y: event.clientY }; mtSmooth.x = mtTarget.x; mtSmooth.y = mtTarget.y; }
	else { mtTarget.x = event.clientX; mtTarget.y = event.clientY; }
}

/* Couleur concrète du ruban : --z-trail-color si posé en dur, sinon l'accent. */
function mtColor() {
	const host = trailHost();
	const c = tokenStr(host, "--z-trail-color", "");
	if (c && !c.includes("var")) return c;
	return tokenStr(host, "--z-accent", "#006eff");
}

function mtLoop() {
	const host = trailHost();
	/* La grosseur se lit en DEUX temps : le réglage (que pose la peau, ou l'auteur) et le
	   facteur d'échelle (que pose l'attribut `size`). Les multiplier ici, c'est ce qui
	   permet aux deux écritures de coexister sans que l'une écrase l'autre. */
	const thickness = token(host, "--z-trail-thickness", 14) * token(host, "--z-trail-scale", 1);
	const fade = token(host, "--z-trail-fade", 500);            /* durée de vie d'un point (ms) = longueur du trail */
	const speedRef = token(host, "--z-trail-speed-ref", 1.2);  /* vitesse (px/ms) qui donne la tête pleine */
	const easeW = EASES[tokenStr(host, "--z-trail-ease", "linear")] || EASES.linear;
	const smooth = Math.min(1, Math.max(0.05, token(host, "--z-trail-smooth", 0.5)));  /* fluidité (bas = plus lisse/traîne) */
	const now = performance.now();

	/* ÉCHANTILLONNAGE en rAF : une tête lissée suit la cible à CHAQUE frame (comble les
	   trous entre les événements pointeur) → un point régulier par frame, ruban fluide. */
	if (mtTarget) {
		mtSmooth.x += (mtTarget.x - mtSmooth.x) * smooth;
		mtSmooth.y += (mtTarget.y - mtSmooth.y) * smooth;
		mtPoints.push({ x: mtSmooth.x, y: mtSmooth.y, t: now });
		if (mtPoints.length > 240) mtPoints.shift();
	}

	/* Effacement par ÂGE : on jette les points trop vieux → la queue fond quand on
	   s'arrête, et le ruban est plus LONG quand on bouge vite (points plus espacés). */
	while (mtPoints.length && now - mtPoints[0].t > fade) mtPoints.shift();

	/* GROSSEUR DE TÊTE ∝ VITESSE : vite = grosse tête, lent = fine, arrêt = se résorbe
	   (fini le « point » figé). Vitesse mesurée sur les 2 derniers points, lissée pour
	   respirer sans clignoter. */
	let v = 0;
	const np = mtPoints.length;
	if (np >= 2) {
		const a = mtPoints[np - 2], b = mtPoints[np - 1];
		v = Math.hypot(b.x - a.x, b.y - a.y) / Math.max(1, b.t - a.t);
		if (now - b.t > 60) v = 0;   /* souris arrêtée → vitesse nulle */
	}
	const targetThick = thickness * Math.min(1, Math.max(0.08, v / speedRef));
	mtHeadThick += (targetThick - mtHeadThick) * 0.3;

	/* RÉTRACTION ACCÉLÉRÉE de la queue : quand la souris ralentit, on mange les points
	   les plus vieux (queue) de plus en plus vite → la fine queue « fonce » vers la tête
	   au lieu de s'attarder. Reprend à zéro dès qu'on rebouge (la tête réalimente). */
	if (v < speedRef * 0.25) mtRetract += 0.5;   /* accélère tant que c'est lent */
	else mtRetract = 0;
	const eat = Math.floor(mtRetract);
	if (eat > 0) {
		mtPoints.splice(0, Math.min(eat, Math.max(0, mtPoints.length - 2)));
		mtRetract -= eat;
	}

	mtCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

	/* pts déjà rangés queue→tête (ordre d'enregistrement). tt = 0 en queue, 1 en tête. */
	const pts = mtPoints;
	if (pts.length >= 3) {
		const n = pts.length;
		/* UNE SEULE forme pleine (pas de segments qui se chevauchent → plus de coutures).
		   On borde la courbe des deux côtés : largeur qui s'effile (tête épaisse → pointe
		   en queue). Bord gauche à l'aller, bord droit au retour, puis on remplit. */
		const left = [], right = [];
		for (let i = 0; i < n; i++) {
			const tt = i / (n - 1);                      /* 0 = queue, 1 = tête */
			const prev = pts[Math.max(0, i - 1)];
			const next = pts[Math.min(n - 1, i + 1)];
			let dxi = next.x - prev.x, dyi = next.y - prev.y;
			const d = Math.hypot(dxi, dyi) || 1;
			dxi /= d; dyi /= d;                          /* tangente unitaire */
			/* Demi-largeur effilée : l'ease pilote COMMENT l'épaisseur décroît vers la queue
			   (linéaire par défaut ; ex. expo = tête grosse longtemps puis pointe brusque). */
			const hw = Math.max(0.15, (mtHeadThick * easeW(tt)) / 2);
			left.push({ x: pts[i].x - dyi * hw, y: pts[i].y + dxi * hw });
			right.push({ x: pts[i].x + dyi * hw, y: pts[i].y - dxi * hw });
		}
		/* Bords en VRAIES COURBES : quadratique passant par le milieu de chaque paire
		   de points (le sommet sert de point de contrôle) → la ligne passe en douceur
		   par tous les dots, pas de polygone. Aller sur le bord gauche, retour sur le droit. */
		mtCtx.beginPath();
		mtCtx.moveTo(left[0].x, left[0].y);
		for (let i = 1; i < n - 1; i++) {
			const mx = (left[i].x + left[i + 1].x) / 2, my = (left[i].y + left[i + 1].y) / 2;
			mtCtx.quadraticCurveTo(left[i].x, left[i].y, mx, my);
		}
		mtCtx.lineTo(left[n - 1].x, left[n - 1].y);
		mtCtx.lineTo(right[n - 1].x, right[n - 1].y);
		for (let i = n - 2; i > 0; i--) {
			const mx = (right[i].x + right[i - 1].x) / 2, my = (right[i].y + right[i - 1].y) / 2;
			mtCtx.quadraticCurveTo(right[i].x, right[i].y, mx, my);
		}
		mtCtx.lineTo(right[0].x, right[0].y);
		mtCtx.closePath();

		/* Remplissage plein à la couleur, EN UNE PASSE (aucun recouvrement). */
		mtCtx.fillStyle = mtColor();
		mtCtx.fill();

		/* TÊTE ARRONDIE : un disque au bout tête (rayon = demi-grosseur) → museau rond. */
		mtCtx.beginPath();
		mtCtx.arc(pts[n - 1].x, pts[n - 1].y, Math.max(0.5, mtHeadThick / 2), 0, Math.PI * 2);
		mtCtx.fill();

		/* Puis l'opacité dans un DÉGRADÉ tête→queue, appliqué en masque (destination-in) :
		   la queue devient transparente avec la distance, la tête reste pleine. Lisse. */
		const head = pts[n - 1], tail = pts[0];
		const grad = mtCtx.createLinearGradient(tail.x, tail.y, head.x, head.y);
		grad.addColorStop(0, "rgba(0,0,0,0)");        /* queue : transparente */
		grad.addColorStop(1, "rgba(0,0,0,1)");        /* tête : pleine */
		mtCtx.globalCompositeOperation = "destination-in";
		mtCtx.fillStyle = grad;
		mtCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
		mtCtx.globalCompositeOperation = "source-over";
	}
	/* Mode PILOTÉ (click2click) : le fantôme est arrivé (fuseActive=false) ET la queue est
	   vidée → plus rien à dessiner. On tue le ruban (libère canvas + rAF) ; il renaîtra
	   topmost au prochain clic. En move, on ne s'arrête jamais ici (suit la souris). */
	if (mtDriven && !fuseActive && mtPoints.length === 0) { stopMouseTrail(); return; }
	mtRaf = requestAnimationFrame(mtLoop);
}

/*
	trail="click" — LE SILLAGE en clic→clic, avec LE MÊME MOTEUR que le move (« un effet
	pour 2 », décision produit). On ne recompose RIEN : on nourrit le ruban d'un point FANTÔME
	qui voyage du clic précédent (A) au nouveau (B), puis on le RELÂCHE. Dès qu'on cesse de
	bouger `mtTarget`, la queue vieillit et meurt exactement comme quand la souris s'arrête
	en move → la mort organique NOIRE que tu aimes, gratuite. La vitesse (px/ms) fixe la
	durée du voyage (clics proches = net, éloignés = ample).
	@param {{x:number,y:number}} from  clic précédent (A)
	@param {{x:number,y:number}} to    nouveau clic (B)
*/
function fuseTrail(from, to) {
	const dist = Math.hypot(to.x - from.x, to.y - from.y);
	if (dist < 1) return;
	/* Démarre le ruban en mode PILOTÉ (pas d'écouteur pointermove : c'est le fantôme, pas la souris). */
	if (!mtOn) startMouseTrail(true);
	const speed = token(trailHost(), "--z-trail-speed-fuse", 3); /* px/ms */
	const duration = Math.max(1, dist / speed);
	const start = performance.now();
	/* Pose la tête sur A, puis fais voyager le point visé vers B. */
	mtTarget = { x: from.x, y: from.y };
	mtSmooth.x = from.x; mtSmooth.y = from.y;
	fuseActive = true;
	cancelAnimationFrame(fuseRaf);
	function step(now) {
		let t = (now - start) / duration;
		if (t > 1) t = 1;
		mtTarget.x = from.x + (to.x - from.x) * t;
		mtTarget.y = from.y + (to.y - from.y) * t;
		if (t < 1) {
			fuseRaf = requestAnimationFrame(step);
		} else {
			/* Arrivé à B : on RELÂCHE. On ne bouge plus mtTarget → la queue meurt seule (organique). */
			fuseActive = false;
		}
	}
	fuseRaf = requestAnimationFrame(step);
}

function startMouseTrail(driven = false) {
	if (mtOn || reduced()) return;
	mtOn = true;
	mtDriven = driven;
	mtCanvas = document.createElement("canvas");
	mtCanvas.setAttribute("aria-hidden", "true");
	mtCanvas.style.cssText =
		"position:fixed;left:0;top:0;pointer-events:none;z-index:9999;";
	/* Le ruban vit dans l'overlay au-dessus de TOUT (topmost par ré-injection). */
	topLayer().appendChild(mtCanvas);
	mtCtx = mtCanvas.getContext("2d");
	mtSizeCanvas();
	mtPoints = [];
	mtHeadThick = 0;
	mtRetract = 0;
	mtTarget = null;
	window.addEventListener("resize", mtSizeCanvas);
	/* move : le ruban suit le VRAI curseur. click (driven) : c'est le fantôme A→B qui le nourrit. */
	if (!driven) window.addEventListener("pointermove", onMoveMT, { passive: true });
	mtRaf = requestAnimationFrame(mtLoop);
}

function stopMouseTrail() {
	mtOn = false;
	cancelAnimationFrame(mtRaf);
	window.removeEventListener("pointermove", onMoveMT);
	window.removeEventListener("resize", mtSizeCanvas);
	mtCanvas?.remove();
	mtCanvas = null;
	mtCtx = null;
	mtPoints = [];
}

/* ---------- Démarrage ---------- */
export function startCursor() {
	if (started) return;
	started = true;
	/* UN seul écouteur, en capture, pour toute la page : c'est lui qui nourrit le point
	   fantôme du clic→clic. Zéro câblage par composant. */
	document.addEventListener("pointerup", onClickTrail, true);
	/* La forme historique `<z-contact trail="move">` reste honorée : elle allume le même
	   ruban que `<z-cursor>`. */
	if (trailOf() === "move") startMouseTrail();
}

/* API publique (Zoe.cursor) — pour piloter le sillage depuis du JS, quand la balise
   ne suffit pas (un mode « présentation » qu'on allume et qu'on éteint, par exemple). */
export const cursor = {
	mousetrail(on = true) { on ? startMouseTrail() : stopMouseTrail(); },
	off() { stopMouseTrail(); },
	get trailing() { return mtOn; },
};

/*
	La balise <z-cursor> — DEUX rôles pour un seul nom, comme <z-contact> :

	  · SOURCE — celle que l'auteur écrit dans sa page, à plat. Elle ne se voit pas :
	    elle dit « le sillage tourne ici », et son attribut `fx` dit lequel. C'est LE
	    cadeau de Zoé : un tag à ajouter, rien d'autre à câbler.

	        <z-cursor></z-cursor>              le ruban qui suit la souris (défaut)
	        <z-cursor fx="none"></z-cursor>    rien

	  · PEINTURE — celle que le moteur crée à la volée dans l'overlay (la comète, le
	    carré qui fuse). Elle n'a aucun comportement : son aspect vit dans le CSS.

	Comment on les distingue sans rien changer au moteur : la peinture naît DANS
	`z-overlay`, la source vit dans la page. Un `closest("z-overlay")` suffit — le moteur
	de mouvement n'est pas touché, et c'est la règle (on le PORTE, on ne le refait pas).
*/
export class ZCursor extends ZElement {
	/*
		L'API MACHINE, lue par scripts/z-manifest (autocomplétion VSCode + doc + llms.txt).
	*/
	static api = {
		tag: "z-cursor",
		example: `<z-cursor fx="move" tone="main"></z-cursor>`,
		summary: {
			en: "The pointer's wake: one flat tag, and the mouse leaves a ribbon behind it.",
			fr: "Le sillage du pointeur : une balise à plat, et la souris laisse un ruban derrière elle.",
			es: "La estela del puntero: una etiqueta plana, y el ratón deja una cinta detrás."
		},
		attributes: [
			{ name: "fx", type: "string", description: { en: "move (the ribbon follows the mouse, default) · click (it fuses from one click to the next) · none.", fr: "move (le ruban suit la souris, défaut) · click (il fuse d'un clic au suivant) · none.", es: "move (la cinta sigue al ratón, por defecto) · click (fusiona de un clic al siguiente) · none." } },
			{ name: "tone", type: "string", description: { en: "Colours the wake with the tone (main · complement · soft).", fr: "Colore le sillage avec le ton (main · complement · soft).", es: "Colorea la estela con el tono (main · complement · soft)." } },
			{ name: "size", type: "string", description: { en: "Thickness of the wake, on the shared scale (xs → xl).", fr: "Grosseur du sillage, sur l'échelle commune (xs → xl).", es: "Grosor de la estela, en la escala común (xs → xl)." } }
		],
		states: ZElement.api.states,
		/*
			LES VARIABLES, AVEC LEURS BORNES. Les `min`/`max` ne sont pas de la décoration :
			c'est ce qui permet au pupitre de monter un CURSEUR plutôt qu'un champ à taper —
			et un réglage de mouvement ne se juge qu'en le traînant. Les bornes disent aussi
			le domaine utile : au-delà, ça n'a plus de sens, et l'auteur le voit sans lire.
		*/
		cssVars: [
			{ name: "--z-trail-thickness", min: 1, max: 60, step: 1, description: { en: "Head thickness (px).", fr: "Grosseur de la tête (px).", es: "Grosor de la cabeza (px)." } },
			{ name: "--z-trail-scale", min: 0.2, max: 4, step: 0.1, description: { en: "Multiplies the thickness — what the `size` attribute sets.", fr: "Multiplie la grosseur — ce que pose l'attribut `size`.", es: "Multiplica el grosor — lo que pone el atributo `size`." } },
			{ name: "--z-trail-fade", min: 60, max: 2500, step: 20, description: { en: "Life of a point (ms) — the wake's length.", fr: "Durée de vie d'un point (ms) — la longueur du sillage.", es: "Vida de un punto (ms) — el largo de la estela." } },
			{ name: "--z-trail-smooth", min: 0.05, max: 1, step: 0.01, description: { en: "Follow smoothness: low = it trails, 1 = glued to the pointer.", fr: "Fluidité du suivi : bas = il traîne, 1 = collé au pointeur.", es: "Fluidez del seguimiento: bajo = se arrastra, 1 = pegado al puntero." } },
			{ name: "--z-trail-speed-ref", min: 0.2, max: 4, step: 0.1, description: { en: "Mouse speed (px/ms) that fills the head.", fr: "Vitesse de souris (px/ms) qui remplit la tête.", es: "Velocidad del ratón (px/ms) que llena la cabeza." } },
			{ name: "--z-trail-speed-fuse", min: 0.5, max: 12, step: 0.5, description: { en: "Speed (px/ms) of the trip from one click to the next.", fr: "Vitesse (px/ms) du voyage d'un clic au suivant.", es: "Velocidad (px/ms) del viaje de un clic al siguiente." } },
			{ name: "--z-trail-ease", description: { en: "Head→tail falloff: linear quad cubic quart quint expo sine back.", fr: "Décroissance tête→queue : linear quad cubic quart quint expo sine back.", es: "Decrecimiento cabeza→cola: linear quad cubic quart quint expo sine back." } },
			{ name: "--z-trail-color", description: { en: "Colour (defaults to the skin's accent).", fr: "La couleur (par défaut l'accent de la peau).", es: "El color (por defecto el acento de la piel)." } }
		]
	};

	connectedCallback() {
		super.connectedCallback();

		/* Peinture éphémère de l'overlay : rien à déclencher, elle EST déjà l'effet. */
		if (this.closest("z-overlay")) return;

		/* Source déclarée : on allume le sillage demandé. `move` par défaut — le suivi
		   de la souris est ce qu'on vient chercher en écrivant la balise. */
		const fx = (this.getAttribute("fx") || "move").toLowerCase();
		if (fx === "none" || reduced()) return;

		/* C'est CETTE balise que le moteur lira. Plus rien à recopier ailleurs : ses
		   réglages sont là où l'auteur les a écrits. */
		sourceEl = this;

		if (fx !== "click") startMouseTrail();

		/* Les effets AU CLIC (le trait qui fuse d'un clic à l'autre) sont pilotés par les
		   écouteurs globaux du moteur : on les branche une fois. En `click`, on ne
		   démarre PAS le ruban ici — c'est le premier fuse qui l'allumera, sinon un ruban
		   suivrait la souris avant même qu'on ait cliqué. */
		startCursor();
	}

	/* Le PONT entre les variants et le moteur a été supprimé le 2026-07-21. Il recopiait
	   `tone` et `size` sur la racine — donc sur toute la page, et sans jamais nettoyer :
	   une valeur posée survivait au changement de peau, et deux <z-cursor> se marchaient
	   dessus. `tone` et `size` posent maintenant leurs réglages en CSS (z-cursor.css), et
	   le moteur les lit sur la balise. Aucun JS n'arbitre plus rien. */
}

/* Enregistre <z-cursor>. Garde-fou contre la double définition. */
export function defineZCursor() {
	if (!customElements.get("z-cursor")) customElements.define("z-cursor", ZCursor);
}

/* Auto-installation à l'import — la convention du repo : un module se branche seul.
   Le moteur reste OPT-IN pour autant : sans <z-cursor> écrit dans la page, rien ne
   tourne et rien ne se voit. */
defineZCursor();
