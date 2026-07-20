/*
	z-cursor.js — effets de MOUVEMENT du pointeur (façon Neovide / smear-cursor).

	⚠ PORTÉ, PAS RÉÉCRIT. Ce moteur vient de l'ancien repo
	(`packages/core/src/fx/cursor.js`) et il est INTOUCHABLE : on le déplace, on ne le
	refait pas. Seuls les deux `import` ont changé de chemin, et `<z-cursor>` sait
	désormais s'allumer toute seule (voir tout en bas). Pas une ligne de mouvement n'a
	bougé — le mouvement se juge à l'œil, pas au diff.

	L'USAGE, en une ligne : poser <z-cursor></z-cursor> dans la page. Rien d'autre.

	Master switch composable `mouse-fx` (hérité du plus proche ancêtre) :
	  - "trail" : un trait plein qui, à CHAQUE clic, FUSE du clic précédent vers le
	              nouveau (gravé, ne pas rouvrir).
	  - "smear" : SMEAR 2.0 — un CARRÉ qui dort au dernier clic, puis au clic suivant
	              se tourne vers le nouveau, s'étire/se déplace et reprend brusquement
	              sa forme à l'arrivée. Piloté par tokens --z-smear-* (profil, ease,
	              vitesse, étirement max, opacité).
	  - "follow" : le trait DEVIENT le curseur (suit la souris en continu, ressort +
	              étirement ; curseur natif masqué). Aussi via Zoe.cursor.smear().
	  - "mousetrail" : un RUBAN qui suit le curseur — courbe lissée sur les N dernières
	              positions, grosse tête → pointe, qui s'efface quand on s'arrête (canvas ;
	              curseur natif gardé). Tokens --z-trail-*. Aussi via Zoe.cursor.mousetrail().
	  - (le "click" = le dot au point d'impact est géré par contact.js.)

	Couleur = --z-accent (suit la skin). Réglable par tokens --z-cursor-*. Coupé
	sous prefers-reduced-motion. <z-cursor> = élément léger, défini en bas de ce fichier.
*/

import { ZElement } from "../../core/z-element/z-element.js";
import { topLayer } from "../z-contact/z-overlay.js";
import { activeSource } from "../z-contact/z-contact-source.js";

let started = false;

function reduced() {
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* mouse-fx du plus proche ancêtre (défaut "click") — commutateur AVANCÉ, réservé
   aux expériences (smear/follow). Le commutateur PUBLIC, lui, est `trail` (ci-dessous). */
function fxOf(node) {
	return (node?.closest?.("[mouse-fx]")?.getAttribute("mouse-fx") ?? "click").toLowerCase();
}

/*
	Attribut PUBLIC `trail` (hérité du plus proche ancêtre, défaut "none") — le SILLAGE,
	un seul moteur exprimé de deux façons :
	  - "none"  : aucun sillage (curseur natif seul) ;
	  - "click" : le SMEAR — un carré qui, à CHAQUE clic, s'étire du clic précédent vers
	              le nouveau puis reprend sa forme (squash&stretch, profils de matière,
	              tokens --z-smear-*). C'est LA version validée du clic→clic.
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
   (fuseTrail). Fini `flySmear` (blob séparé) et `fly` (trait droit) : un seul moteur. */
let lastClick = null;

function onClickTrail(event) {
	if (reduced()) return;
	if (trailOf() !== "click") return;
	const to = { x: event.clientX, y: event.clientY };
	if (lastClick) fuseTrail(lastClick, to);
	lastClick = to;
}

/* Fait courir un trait de `from` à `to`, étiré dans la direction, qui s'amincit et
   s'efface à l'arrivée. Tween en rAF (easeOut). */
/* px d'un token de longueur (« 300ms », « 0.3s », « 14px », « 100% »). */
function px(raw, fallback) {
	const s = String(raw).trim();
	if (s.endsWith("ms")) return parseFloat(s);
	if (s.endsWith("s")) return parseFloat(s) * 1000;
	const n = parseFloat(s);
	return Number.isFinite(n) ? n : fallback;
}
/* ---------- Mode SMEAR 2.0 : le carré qui fuse d'un clic à l'autre ----------
	Un carré dort (invisible) au dernier clic ; au clic suivant il se tourne vers le
	nouveau, s'étire/se déplace, puis reprend BRUSQUEMENT sa forme au point d'arrivée
	(et se rendort). Tout est piloté par tokens --z-smear-* (profil et ease lus comme
	des chaînes CSS). Couleur = --z-accent (suit la skin). Coupé sous reduced-motion. */

/* Familles d'ease : chacune donne une courbe `in` (0→1 accélérée). La tête prend la
	variante OUT (miroir), la queue la variante IN → c'est ce couple qui fait « fuse+snap ». */
const SMEAR_BACK_C = 1.70158;
const SMEAR_EASES = {
	linear: (t) => t,
	quad:   (t) => t * t,
	cubic:  (t) => t * t * t,
	quart:  (t) => t * t * t * t,
	quint:  (t) => t * t * t * t * t,
	expo:   (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
	sine:   (t) => 1 - Math.cos((t * Math.PI) / 2),
	back:   (t) => (SMEAR_BACK_C + 1) * t * t * t - SMEAR_BACK_C * t * t,
};

/* Elastic-out : dépasse 1 puis oscille en s'amortissant (le « tremble Pixar »). */
function smearElastic(t) {
	if (t === 0 || t === 1) return t;
	return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
}

/* Lit un token CSS en CHAÎNE (profil, ease) avec repli. */
function tokenStr(el, name, fallback) {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	return raw || fallback;
}

/* Le carré dort au dernier clic ; on garde sa position pour le prochain vol. */
let lastSmear = null;

function onClickSmear(event) {
	if (reduced()) return;
	if (!/\bsmear\b/.test(fxOf(event.target))) return;
	const to = { x: event.clientX, y: event.clientY };
	if (lastSmear) flySmear(lastSmear, to, event.target);
	lastSmear = to;
}

/*
	Fait fuser un carré de `from` vers `to`. Durée = distance ÷ vitesse (px/ms) : deux
	clics proches → quasi instantané (net) ; éloignés → ample (beau). Tween en rAF.
*/
function flySmear(from, to, target) {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const dist = Math.hypot(dx, dy);
	if (dist < 1) return;

	const el = document.createElement("z-cursor");
	el.setAttribute("fx", "smear2");
	el.setAttribute("aria-hidden", "true");
	const accent = getComputedStyle(target).getPropertyValue("--z-accent").trim();
	if (accent) el.style.setProperty("--z-smear-color", accent);
	/* Rendu dans l'overlay au-dessus de TOUT (topmost par ré-injection). */
	topLayer().appendChild(el);

	/* Réglages, lus sur l'élément (défauts gravés dans zoe.css §13). */
	const S = token(el, "--z-smear-size", 12);            /* côté du carré au repos */
	const speed = token(el, "--z-smear-speed", 3);        /* vitesse px/ms */
	const smax = token(el, "--z-smear-stretch-max", 150) / 100;  /* aire max (facteur) */
	const omin = token(el, "--z-smear-opacity-min", 50) / 100;   /* opacité plancher */
	const adapt = token(el, "--z-smear-opacity-adapt", 1) !== 0; /* fondu à l'étirement */
	const profile = tokenStr(el, "--z-smear-profile", "volume"); /* matière */
	const easeFn = SMEAR_EASES[tokenStr(el, "--z-smear-ease", "cubic")] || SMEAR_EASES.cubic;
	const easeIn = (t) => easeFn(t);
	const easeOut = (t) => 1 - easeFn(1 - t);

	const areaOrig = S * S;
	const areaMax = smax * areaOrig;
	const Lmax = areaMax;                                 /* épaisseur mini 1px → L max = aire max */
	const angle = Math.atan2(dy, dx);
	const cos = Math.cos(angle), sin = Math.sin(angle);
	const duration = Math.max(1, dist / speed);
	const start = performance.now();

	function frame(now) {
		let t = (now - start) / duration;
		if (t > 1) t = 1;

		let L, h, midD;
		if (profile === "elastic") {
			/* Vol (étirement) puis atterrissage élastique au nouveau clic. */
			const fly = 0.55;
			if (t < fly) {
				const tt = t / fly;
				const headD = dist * easeOut(tt), tailD = dist * easeIn(tt);
				L = Math.min(Lmax, S + (headD - tailD));
				h = Math.max(1, areaOrig / L);
				midD = (headD + tailD) / 2;
			} else {
				const tt = (t - fly) / (1 - fly);
				const e = smearElastic(tt);
				L = S * (1 + (1 - e) * 0.6);
				h = Math.max(1, areaOrig / L);
				midD = dist;
			}
		} else {
			const headD = dist * easeOut(t), tailD = dist * easeIn(t);
			L = Math.min(Lmax, S + (headD - tailD));
			midD = (headD + tailD) / 2;
			if (profile === "volume" || profile === "goutte") {
				h = Math.max(1, areaOrig / L);            /* aire constante (vrai squash&stretch) */
			} else if (profile === "pointe") {
				const prog = Lmax > S ? (L - S) / (Lmax - S) : 0;
				h = Math.max(3, S * (1 - 0.55 * prog));   /* garde de la hauteur → pointe visible */
			} else {
				const prog = Lmax > S ? (L - S) / (Lmax - S) : 0;
				h = Math.max(1, S - (S - 1) * prog);      /* rect : s'amincit linéairement */
			}
		}

		/* Allongement (pour la pointe) et amincissement (pour l'opacité). */
		const stretch01 = Lmax > S ? Math.min(1, Math.max(0, (L - S) / (Lmax - S))) : 0;
		const spread01 = Math.min(1, Math.max(0, 1 - h / S));
		const op = adapt ? 1 - (1 - omin) * spread01 : 1;

		const cx = from.x + cos * midD;
		const cy = from.y + sin * midD;

		el.style.width = `${L}px`;
		el.style.height = `${h}px`;
		el.style.marginLeft = `${-L / 2}px`;
		el.style.marginTop = `${-h / 2}px`;
		/* Tête (bord droit = sens du vol) arrondie en cap ; queue arrondie en « goutte ». */
		const rHead = h / 2;
		const rTail = profile === "goutte" ? h / 2 : Math.min(4, h / 2);
		el.style.borderRadius = `${rTail}px ${rHead}px ${rHead}px ${rTail}px`;
		/* Profil « pointe » : vraie queue effilée via clip-path, de 0 (repos) à pointe max. */
		if (profile === "pointe") {
			const leftHalf = 50 * (1 - Math.pow(stretch01, 0.6));
			el.style.borderRadius = "0";
			el.style.clipPath = `polygon(0 ${(50 - leftHalf).toFixed(1)}%, 100% 0, 100% 100%, 0 ${(50 + leftHalf).toFixed(1)}%)`;
		} else {
			el.style.clipPath = "none";
		}
		el.style.opacity = t >= 1 ? 0 : op;
		el.style.transform = `translate(${cx}px, ${cy}px) rotate(${angle}rad)`;

		if (t < 1) requestAnimationFrame(frame);
		else el.remove();
	}
	requestAnimationFrame(frame);
}

/* ---------- Mode SMEAR (continu) : le trait suit la souris ---------- */
let smearOn = false;
let raf = 0;
let smearEl = null;
const target = { x: 0, y: 0 };
const pos = { x: 0, y: 0 };

function token(el, name, fallback) {
	const raw = getComputedStyle(el).getPropertyValue(name).trim();
	const n = parseFloat(raw);
	return Number.isFinite(n) ? n : fallback;
}

function onMove(event) {
	target.x = event.clientX;
	target.y = event.clientY;
}

function smearLoop() {
	const stiffness = token(smearEl, "--z-cursor-stiffness", 0.16);
	/* Le point retardé (queue) rattrape le curseur (tête) : plus stiffness est bas,
	   plus il traîne → plus l'ÉCART (donc la comète) est grand. « Ralentir » = baisser. */
	pos.x += (target.x - pos.x) * stiffness;
	pos.y += (target.y - pos.y) * stiffness;
	const dx = target.x - pos.x;
	const dy = target.y - pos.y;
	const len = Math.hypot(dx, dy);              /* l'écart = la longueur de la comète */
	const angle = Math.atan2(dy, dx) * 180 / Math.PI;
	const size = parseFloat(getComputedStyle(smearEl).width) || 18;
	const thin = token(smearEl, "--z-cursor-thin", 1);
	/* stretch = combien l'écart allonge la comète (1 = brut) ; stretch-max = plafond
	   du scaleX pour qu'un flick rapide ne fasse pas une comète infinie. */
	const stretch = token(smearEl, "--z-cursor-stretch", 1);
	const stretchMax = token(smearEl, "--z-cursor-stretch-max", 6);
	/* Centrée au milieu queue↔tête → la TÊTE (+X = sens du mouvement) tombe sur le
	   curseur réel, la QUEUE traîne au point retardé. Le dégradé fade la queue. */
	const sx = Math.min(stretchMax, (len * stretch + size) / size);
	const mx = (pos.x + target.x) / 2;
	const my = (pos.y + target.y) / 2;
	smearEl.style.transform =
		`translate(${mx}px, ${my}px) translate(-50%, -50%) rotate(${angle}deg) scale(${sx}, ${thin})`;
	raf = requestAnimationFrame(smearLoop);
}

function startSmear() {
	if (smearOn || reduced()) return;
	smearOn = true;
	smearEl = document.createElement("z-cursor");
	smearEl.setAttribute("fx", "smear");
	smearEl.setAttribute("data-on", "");
	smearEl.setAttribute("aria-hidden", "true");
	document.body.appendChild(smearEl);
	document.documentElement.classList.add("z-smear-on");
	target.x = pos.x = window.innerWidth / 2;
	target.y = pos.y = window.innerHeight / 2;
	window.addEventListener("pointermove", onMove, { passive: true });
	raf = requestAnimationFrame(smearLoop);
}

function stopSmear() {
	smearOn = false;
	cancelAnimationFrame(raf);
	window.removeEventListener("pointermove", onMove);
	document.documentElement.classList.remove("z-smear-on");
	smearEl?.remove();
	smearEl = null;
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
	const root = document.documentElement;
	const c = tokenStr(root, "--z-trail-color", "");
	if (c && !c.includes("var")) return c;
	return tokenStr(root, "--z-accent", "#006eff");
}

function mtLoop() {
	const root = document.documentElement;
	const thickness = token(root, "--z-trail-thickness", 14);   /* grosseur MAX de la tête */
	const fade = token(root, "--z-trail-fade", 500);            /* durée de vie d'un point (ms) = longueur du trail */
	const speedRef = token(root, "--z-trail-speed-ref", 1.2);  /* vitesse (px/ms) qui donne la tête pleine */
	const easeW = SMEAR_EASES[tokenStr(root, "--z-trail-ease", "linear")] || SMEAR_EASES.linear;
	const smooth = Math.min(1, Math.max(0.05, token(root, "--z-trail-smooth", 0.5)));  /* fluidité (bas = plus lisse/traîne) */
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
	pour 2 », Christophe). On ne recompose RIEN : on nourrit le ruban d'un point FANTÔME
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
	const speed = token(document.documentElement, "--z-trail-speed-fuse", 3); /* px/ms */
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
	/* Trail ET smear 2.0 sont pilotés par clic (par zone via mouse-fx) → écouteurs globaux. */
	document.addEventListener("pointerup", onClickTrail, true);
	/* (l'ancien moteur smear/blob au clic est retiré : trail="click" = le moteur du ruban.) */
	/* Le smear CONTINU (curseur qui suit) est global (page) : mot-clé `follow` sur
	   <html>/<body>. (Le mot `smear` est désormais le Smear 2.0, piloté au clic.) */
	/* Sillage PUBLIC : trail="move" → le ruban qui suit le curseur (page). */
	if (trailOf() === "move") startMouseTrail();
	/* Smear CONTINU (expérimental) : mot-clé `follow` sur <html>/<body>. */
	const page = fxOf(document.body) + " " + (document.documentElement.getAttribute("mouse-fx") || "");
	if (/\bfollow\b/.test(page)) startSmear();
}

/* API publique (Zoe.cursor). */
export const cursor = {
	smear() { startSmear(); },
	mousetrail(on = true) { on ? startMouseTrail() : stopMouseTrail(); },
	off() { stopSmear(); stopMouseTrail(); },
	get smearing() { return smearOn; },
	get trailing() { return mtOn; },
};

/*
	La balise <z-cursor> — DEUX rôles pour un seul nom, comme <z-contact> :

	  · SOURCE — celle que l'auteur écrit dans sa page, à plat. Elle ne se voit pas :
	    elle dit « le sillage tourne ici », et son attribut `fx` dit lequel. C'est LE
	    cadeau de Zoé : un tag à ajouter, rien d'autre à câbler.

	        <z-cursor></z-cursor>              le ruban qui suit la souris (défaut)
	        <z-cursor fx="smear"></z-cursor>   la comète QUI EST le curseur (natif masqué)
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
		summary: {
			en: "The pointer's wake: one flat tag, and the mouse leaves a ribbon behind it.",
			fr: "Le sillage du pointeur : une balise à plat, et la souris laisse un ruban derrière elle.",
			es: "La estela del puntero: una etiqueta plana, y el ratón deja una cinta detrás."
		},
		attributes: [
			{ name: "fx", type: "string", description: { en: "move (ribbon following the mouse, default) · click (it fuses from one click to the next) · smear (the comet IS the cursor) · none.", fr: "move (le ruban suit la souris, défaut) · click (il fuse d'un clic au suivant) · smear (la comète EST le curseur) · none.", es: "move (la cinta sigue al ratón, por defecto) · click (fusiona de un clic al siguiente) · smear (la cometa ES el cursor) · none." } },
			{ name: "tone", type: "string", description: { en: "Colours the wake with the tone (main · complement · soft).", fr: "Colore le sillage avec le ton (main · complement · soft).", es: "Colorea la estela con el tono (main · complement · soft)." } },
			{ name: "size", type: "string", description: { en: "Thickness of the wake, on the shared scale (xs → xl).", fr: "Grosseur du sillage, sur l'échelle commune (xs → xl).", es: "Grosor de la estela, en la escala común (xs → xl)." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-trail-thickness", description: { en: "Head thickness (px).", fr: "Grosseur de la tête (px).", es: "Grosor de la cabeza (px)." } },
			{ name: "--z-trail-fade", description: { en: "Life of a point (ms) — the wake's length.", fr: "Durée de vie d'un point (ms) — la longueur du sillage.", es: "Vida de un punto (ms) — el largo de la estela." } },
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

		this.#porterLesVariants();

		if (fx === "smear" || fx === "follow") startSmear();
		else if (fx !== "click") startMouseTrail();

		/* Les effets AU CLIC (le trait qui fuse d'un clic à l'autre) sont pilotés par les
		   écouteurs globaux du moteur : on les branche une fois. En `click`, on ne
		   démarre PAS le ruban ici — c'est le premier fuse qui l'allumera, sinon un ruban
		   suivrait la souris avant même qu'on ait cliqué. */
		startCursor();
	}

	/*
		LE PONT ENTRE LES VARIANTS ET LE MOTEUR.

		`tone` et `size` posent des tokens SUR CETTE BALISE (voir core/z-element.css), mais
		le ruban est peint dans un canevas plein écran : il ne peut pas hériter d'un
		élément de la page, il lit ses réglages sur la racine. On recopie donc, une fois,
		ce que les variants ont résolu ici vers les tokens que le moteur lit là-bas.

		Une valeur écrite à la main sur la racine gagne : on ne l'écrase que si l'auteur
		a demandé un variant.
	*/
	#porterLesVariants() {
		const lu = getComputedStyle(this);
		const racine = document.documentElement.style;

		if (this.hasAttribute("tone")) {
			const couleur = lu.getPropertyValue("--z-tone__fill").trim();
			/* `soft` vaut `transparent` : un sillage invisible n'a pas de sens, on prend
			   alors son encre, qui est la couleur estompée de la peau. */
			const retenue = (!couleur || couleur === "transparent")
				? lu.getPropertyValue("--z-tone__ink").trim()
				: couleur;
			if (retenue) racine.setProperty("--z-trail-color", retenue);
		}

		if (this.hasAttribute("size")) {
			/* La taille du texte de cette balise EST le facteur résolu (base × cran) :
			   le ruban en tire sa grosseur, dans la même échelle que tout le reste. */
			const facteur = parseFloat(lu.fontSize) / 16;
			const grosseur = parseFloat(getComputedStyle(document.documentElement)
				.getPropertyValue("--z-trail-thickness") || 14);
			racine.setProperty("--z-trail-thickness", (grosseur * facteur).toFixed(1));
		}
	}
}

/* Enregistre <z-cursor>. Garde-fou contre la double définition. */
export function defineZCursor() {
	if (!customElements.get("z-cursor")) customElements.define("z-cursor", ZCursor);
}

/* Auto-installation à l'import — la convention du repo : un module se branche seul.
   Le moteur reste OPT-IN pour autant : sans <z-cursor> écrit dans la page, rien ne
   tourne et rien ne se voit. */
defineZCursor();
