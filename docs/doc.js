/*
	============================================================
	doc.js — LE VIEWER de la doc officielle (multilingue)
	------------------------------------------------------------
	Il ne DÉCRIT rien à la main : il charge la liste des composants (le manifeste),
	importe chaque module, et lit l'API BRUTE de la classe vivante (`Class.api`) — dont
	les descriptions peuvent être `{ en, fr, es }`. Un sélecteur de langue bascule TOUT
	côté client (comme le sélecteur de peau). Les libellés de la doc sont dans I18N ;
	l'API, dans les `static api`. Anglais par défaut.
	(Commentaires en français = langue de travail ; l'API publiée, elle, est en anglais.)
	============================================================
*/

import "../examples/skin-switch.js";   /* le pacte : sélecteur de peau */

const ROOT = new URL("../", import.meta.url).href;   /* …/zoé/ */

/* Les deux familles d'états, testées différemment (les noms d'états ne se traduisent pas). */
const MOUSE = ["over", "press", "release", "releaseOut", "drag", "focus"];       /* au geste */
const UTILITY = ["current", "loading", "disabled", "error", "success"];        /* au clic */

/* Langue courante + dictionnaire de l'UI de la doc (l'API vit dans les static api). */
let LANG = new URLSearchParams(location.search).get("lang") || localStorage.getItem("zoe-lang") || "en";
const I18N = {
	en: { attributesHint: "Written on THIS element, in the HTML. A named shortcut: one word, and the component knows what to do.", eventsHint: "What the component signals. Listen with addEventListener.", statesHint: "They HAPPEN — on gesture, or set by code. You don't set them here, you paint them: z-button:state(over) { … }", cssVarsHint: "Written in CSS, and flows DOWN to everything inside. The fine-grained setting; an attribute is a shortcut that sets several at once.", core: "core", tools: "tools", components: "components", attributes: "Attributes", type: "Type", values: "Values", boolPresent: "present / absent", role: "Role", events: "Events", event: "Event", states: "States :state()", cssVars: "CSS variables", variable: "Variable", tryme: "Try me", hint: "Hover, press, DRAG it (drop inside / outside) — the « mouse » dots follow.", mouse: "Mouse — on gesture", utility: "Utility — on click", seealso: "Same states as z-element — try them above.", clickState: "click to set this state", promisePre: "States · interaction · animation: ", promiseBold: "zero JS to manage.", promisePost: " Write this HTML — and the CSS for :state().", default: "default" },
	fr: { attributesHint: "S'écrit sur CET élément, dans le HTML. Un raccourci nommé : un mot, et le composant sait quoi faire.", eventsHint: "Ce que le composant signale. À écouter avec addEventListener.", statesHint: "Ils ARRIVENT — au geste, ou posés par le code. On ne les règle pas ici, on les peint : z-button:state(over) { … }", cssVarsHint: "S'écrit en CSS, et descend sur tout le contenu. Le réglage fin ; un attribut n'est qu'un raccourci qui en pose plusieurs d'un coup.", core: "noyau", tools: "tools", components: "composants", attributes: "Attributs", type: "Type", values: "Valeurs", boolPresent: "présent / absent", role: "Rôle", events: "Événements", event: "Événement", states: "États :state()", cssVars: "Variables CSS", variable: "Variable", tryme: "Testez-moi", hint: "Survolez, pressez, GLISSEZ-le (lâchez dedans / dehors) — les points « souris » suivent.", mouse: "Souris — au geste", utility: "Utilitaires — au clic", seealso: "Mêmes états que z-element — voir plus haut.", clickState: "clic pour poser cet état", promisePre: "États · interaction · animation : ", promiseBold: "zéro JS à gérer.", promisePost: " Le HTML à écrire — et le CSS pour :state().", default: "défaut" },
	es: { attributesHint: "Se escribe en ESTE elemento, en el HTML. Un atajo con nombre: una palabra, y el componente sabe qué hacer.", eventsHint: "Lo que el componente señala. Escúchelo con addEventListener.", statesHint: "OCURREN — con el gesto, o puestos por el código. No se ajustan aquí, se pintan: z-button:state(over) { … }", cssVarsHint: "Se escribe en CSS, y BAJA a todo lo que hay dentro. El ajuste fino; un atributo solo es un atajo que pone varios de una vez.", core: "núcleo", tools: "herramientas", components: "componentes", attributes: "Atributos", type: "Tipo", values: "Valores", boolPresent: "presente / ausente", role: "Función", events: "Eventos", event: "Evento", states: "Estados :state()", cssVars: "Variables CSS", variable: "Variable", tryme: "Pruébame", hint: "Pase el ratón, presione, ARRÁSTRELO (suelte dentro / fuera) — los puntos « ratón » siguen.", mouse: "Ratón — al gesto", utility: "Utilitarios — al clic", seealso: "Mismos estados que z-element — ver más arriba.", clickState: "clic para poner este estado", promisePre: "Estados · interacción · animación: ", promiseBold: "cero JS que gestionar.", promisePost: " El HTML a escribir — y el CSS para :state().", default: "predeterminado" }
};
const t = (k) => I18N[LANG]?.[k] ?? I18N.en[k] ?? k;
/* résout une description : string (anglais) OU { en, fr, es } → la langue courante. */
const desc = (v) => (typeof v === "string" ? v : (v && (v[LANG] || v.en || Object.values(v)[0])) || "");

/*
	L'ACCUEIL — L'ESSAI ROUTIER, pas le capot. Un visiteur ne doit pas tomber sur des
	tableaux ni sur une preuve de plomberie (« regarde, au survol ça ne fuit pas » = « elle
	roule » : toute voiture roule). Il doit VOIR le résultat : une application entière,
	vivante, qui se transforme sous sa main pour presque rien d'écrit. On MONTRE la voiture
	en train de rouler — la démo « cinq nombres », en vrai, incrustée à la porte. Le
	mécanisme (le geste, le « avant/après ») descend sous le capot, pour qui veut le voir.
	(Recadré avec Christophe le 2026-07-22 : « ne me dis pas qu'elle roule, fais-moi
	l'essai. » Comparaisons Flash retirées : trop datées pour un visiteur.)
*/
const DEMO = `${ROOT}examples/trois-variables.html`;   /* la voiture — on l'incruste, on ne la décrit pas */

const HOME = {
	en: {
		menu: "the drive", title: "Five numbers. A whole interface.",
		tagline: "This isn't a screenshot — grab it. Push a slider, and the entire page re-harmonizes. Not one palette was written.",
		caption: "Everything above — backgrounds, cards, hairlines — descends from five numbers. No greys, no palette, no dark-mode file. That's Zoé.",
		underHood: "Under the hood — the code you no longer write",
		before: "By hand — on every component", after: "With Zoé"
	},
	fr: {
		menu: "l'essai", title: "Cinq nombres. Une interface entière.",
		tagline: "Ce n'est pas une capture — attrape-la. Pousse un curseur, et toute la page se ré-harmonise. Pas une seule palette écrite.",
		caption: "Tout ce qui est au-dessus — fonds, cartes, filets — descend de cinq nombres. Aucun gris, aucune palette, aucun fichier « mode sombre ». C'est ça, Zoé.",
		underHood: "Sous le capot — le code que tu n'écris plus",
		before: "À la main — sur chaque composant", after: "Avec Zoé"
	},
	es: {
		menu: "la prueba", title: "Cinco números. Una interfaz entera.",
		tagline: "No es una captura — agárrala. Empuja un control, y toda la página se re-armoniza. Ni una sola paleta escrita.",
		caption: "Todo lo de arriba — fondos, tarjetas, filetes — desciende de cinco números. Sin grises, sin paleta, sin archivo « modo oscuro ». Eso es Zoé.",
		underHood: "Bajo el capó — el código que ya no escribes",
		before: "A mano — en cada componente", after: "Con Zoé"
	}
};

/* Le « avant/après » — du code, donc pas de traduction (il vit tel quel dans z-element.doc.md). */
const AVANT = `btn.addEventListener("pointerenter", () => btn.classList.add("is-over"));
btn.addEventListener("pointerleave", () => btn.classList.remove("is-over"));
btn.addEventListener("pointerdown",  () => btn.classList.add("is-press"));
btn.addEventListener("pointerup",    (e) => { /* dedans ? dehors ? annulé ? */ });
// + le glissé, + le focus clavier, + retirer les écouteurs au démontage…`;
const APRES = `<z-element><button>Envoyer</button></z-element>

z-element:state(over)  { background: orange; }
z-element:state(press) { transform: scale(.97); }`;

/*
	Les textes de la démo z-contact. Déclarés ICI (près de HOME) et non près de contactDemo :
	render() tourne en haut du fichier, donc ces const doivent être initialisées avant, sinon
	TDZ (« Cannot access 'CDEMO' before initialization »).
*/
const CDEMO = {
	en: { target: "Click here — or anywhere in the zone", hint: "The effect is born where the pointer touches. Move a slider: it replays live.", effect: "Effect", none: "off", write: "Write as", modeAttr: "attribute", modeCss: "CSS", size: "Size", thickness: "Thickness", duration: "Duration", color: "Colour", css: "Same result, two ways to write it — flip « attribute / CSS » above. That's the point: attribute OR CSS, your choice." },
	fr: { target: "Cliquez ici — ou n'importe où dans la zone", hint: "L'effet naît là où le pointeur touche. Bougez un curseur : il se rejoue en direct.", effect: "Effet", none: "aucun", write: "Écrire en", modeAttr: "attribut", modeCss: "CSS", size: "Taille", thickness: "Épaisseur", duration: "Durée", color: "Couleur", css: "Même résultat, deux façons de l'écrire — basculez « attribut / CSS » au-dessus. C'est ça, la force : attribut OU CSS, au choix." },
	es: { target: "Pulse aquí — o en cualquier parte de la zona", hint: "El efecto nace donde el puntero toca. Mueva un control: se repite en directo.", effect: "Efecto", none: "ninguno", write: "Escribir como", modeAttr: "atributo", modeCss: "CSS", size: "Tamaño", thickness: "Grosor", duration: "Duración", color: "Color", css: "Mismo resultado, dos formas de escribirlo — cambie « atributo / CSS » arriba. Esa es la fuerza: atributo O CSS, a su elección." }
};
const CDEMO_EFFECTS = ["implode", "explode", "morph", "ink"];
/* Les réglages vivants : `key` nomme le libellé (CDEMO[lang][key]), `token` la variable
   CSS réelle (et le nom de l'attribut-raccourci). Bouger un curseur rejoue l'effet. */
const CDEMO_CTLS = [
	{ key: "size", token: "size", prop: "--z-contact-size", min: 8, max: 64, value: 26, unit: "px" },
	{ key: "thickness", token: "width", prop: "--z-contact-width", min: 1, max: 16, value: 6, unit: "px" },
	{ key: "duration", token: "duration", prop: "--z-contact-duration", min: 200, max: 2000, value: 550, unit: "ms" }
];
const CDEMO_SWATCHES = ["var(--z-accent)", "#e0662c", "#22a06b", "#c4562f", "#7b61ff"];

addLink(`${ROOT}tools/z-motion/z-motion.css`);

const manifest = await (await fetch(`${ROOT}dist/custom-elements.json`)).json();
const entries = manifest.modules.map((m) => ({ path: m.path, tag: m.declarations[0]?.tagName })).filter((e) => e.tag);

/* importe chaque module (définit l'élément + expose son static api), injecte le CSS
   des composants, et lit l'API BRUTE (multilingue) sur la classe vivante. */
for (const e of entries) {
	await import(`${ROOT}${e.path}`);
	if (e.path.startsWith("components/")) addLink(`${ROOT}${e.path.replace(/\.js$/, ".css")}`);
	e.api = rawApi(e.tag);
}

mountLangSwitch();
render();

/* self-test (#selftest) : GLISSER le bouton pose drag puis releaseOut (dehors), il
   revient au centre, et un état utilitaire se pose au clic. */
if (location.hash === "#selftest") try {
	await new Promise((r) => requestAnimationFrame(r));
	const sec = document.getElementById("z-element");
	const inst = sec.querySelector(".viz-instance");
	const r = inst.getBoundingClientRect();
	const send = (type, x, y) => inst.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
	const rowOn = (name) => [...sec.querySelectorAll(".viz-row")].some((li) => li.textContent.trim() === name && li.querySelector(".dot").classList.contains("on"));
	const stage = inst.parentElement;
	const sr = stage.getBoundingClientRect();
	send("pointerdown", r.left + 40, r.top + 30);
	send("pointermove", r.left + 90, r.top + 30);
	const dragging = inst.matches(":state(drag)");
	const moved = inst.style.transform.includes("translate");
	const dragDot = rowOn("drag");
	send("pointerup", sr.right + 300, sr.bottom + 300);
	/* releaseOut est TRANSITOIRE (timer ~320 ms) : on le lit SYNCHRONE, avant tout
	   await — sinon le temps virtuel du navigateur headless l'a déjà éteint. */
	const releasedOut = inst.matches(":state(releaseOut)");
	const back = (inst.style.transform || "") === "";
	await new Promise((r) => requestAnimationFrame(r));
	[...sec.querySelectorAll(".viz-row.clickable")].find((b) => b.textContent.trim() === "loading")?.click();
	await new Promise((r) => requestAnimationFrame(r));
	const util = inst.matches(":state(loading)") && rowOn("loading");
	const res = el("div", { text: `SELF-TEST : drag=${dragging ? "✅" : "❌"} · bouge=${moved ? "✅" : "❌"} · releaseOut(dehors)=${releasedOut ? "✅" : "❌"} · retour centre=${back ? "✅" : "❌"} · utilitaire(clic loading)=${util ? "✅" : "❌"}` });
	res.style.cssText = "position:fixed;bottom:0;left:0;right:0;padding:.6rem 1rem;background:#1a1a1a;color:#fff;font:13px ui-monospace,monospace;z-index:99999";
	document.body.append(res);
} catch (err) {
	const res = el("div", { text: `SELF-TEST ERROR : ${err && err.message}` });
	res.style.cssText = "position:fixed;bottom:0;left:0;right:0;padding:.6rem 1rem;background:#7a0000;color:#fff;font:13px ui-monospace,monospace;z-index:99999";
	document.body.append(res);
}

/* ── rendu ─────────────────────────────────────────────────── */

/* Lit l'API BRUTE (multilingue) d'une classe vivante et la normalise pour le rendu. */
function rawApi(tag) {
	const api = customElements.get(tag)?.api;
	if (!api) return null;
	return {
		tagName: api.tag,
		summary: api.summary,
		attributes: (api.attributes || []).map((a) => ({ name: a.name, type: { text: a.type || "string" }, values: a.values || null, description: a.description })),
		events: (api.events || []).map((ev) => ({ name: ev.name, description: ev.description })),
		cssStates: (api.states || []).map((s) => ({ name: s })),
		cssProperties: (api.cssVars || []).map((v) => ({ name: v.name, description: v.description }))
	};
}

function groupOf(path) {
	if (path.startsWith("core/")) return "core";
	if (path.startsWith("tools/")) return "tools";
	if (path.startsWith("components/")) return "components";
	return "other";
}

function render() {
	const menu = document.getElementById("menu");
	const main = document.getElementById("main");
	while (menu.children.length > 1) menu.lastChild.remove();   /* on garde le <h1>, on rebâtit */
	main.innerHTML = "";

	/* L'accueil d'abord : un lien tout en haut du menu, et la section en tête du corps. */
	const home = HOME[LANG] || HOME.en;
	const homeLink = el("a", { href: "#home", text: home.menu });
	homeLink.style.fontWeight = "600";
	menu.append(homeLink);
	main.append(homeSection());

	const groups = { core: [], tools: [], components: [] };
	for (const e of entries) (groups[groupOf(e.path)] ||= []).push(e);

	for (const [key, list] of Object.entries(groups)) {
		if (!list.length) continue;
		menu.append(el("div", { class: "group", text: t(key) }));
		for (const e of list) {
			menu.append(el("a", { href: `#${e.api.tagName}`, text: `<${e.api.tagName}>` }));
			main.append(entrySection(e.api, key));
		}
	}
}

/*
	L'ACCUEIL : l'essai routier, dans l'ordre où l'œil doit le prendre.
	① LA VOITURE QUI ROULE — la vraie démo « cinq nombres » incrustée en live (iframe).
	   On ne la décrit pas, on la fait rouler sous la main du visiteur. C'est la porte.
	② LA LÉGENDE — ce qu'il vient de voir, en une phrase.
	③ SOUS LE CAPOT — le « avant/après » : le moteur, pour qui veut le voir APRÈS l'essai.
*/
function homeSection() {
	const h = HOME[LANG] || HOME.en;
	const sec = el("section", { class: "entry home", id: "home" });
	sec.append(el("h2", { text: h.title }));
	sec.append(el("p", { class: "summary", text: h.tagline }));

	/* ① la voiture qui roule — la démo, en vrai, cadrée comme un écran vivant */
	const screen = el("div", { class: "hero-screen" });
	const bar = el("div", { class: "hero-bar" });
	bar.append(el("span", { class: "hero-live" }), el("span", { class: "hero-url", text: "examples/trois-variables.html" }));
	const frame = document.createElement("iframe");
	frame.className = "hero-frame";
	frame.src = DEMO;
	frame.loading = "lazy";
	frame.title = h.title;
	screen.append(bar, frame);
	sec.append(screen);
	sec.append(el("p", { class: "hero-caption", text: h.caption }));

	/* ③ sous le capot — le avant/après */
	sec.append(el("h3", { text: h.underHood }));
	const cmp = el("div", { class: "avapres" });
	cmp.append(codeCol(h.before, AVANT, "avant"), codeCol(h.after, APRES, "apres"));
	sec.append(cmp);

	return sec;
}

/* Une colonne de code du « avant/après » : un titre + le bloc, tel quel. */
function codeCol(title, source, cls) {
	const box = el("div", { class: `col ${cls}` });
	box.append(el("p", { class: "col-title", text: title }));
	const pre = document.createElement("pre");
	const c = document.createElement("code");
	c.textContent = source;
	pre.append(c);
	box.append(pre);
	return box;
}

function entrySection(d, group) {
	const sec = el("section", { class: "entry", id: d.tagName });
	sec.append(el("h2", { text: `<${d.tagName}>` }));
	sec.append(el("p", { class: "summary", text: desc(d.summary) }));

	/*
		L'ordre d'une fiche : le BESOIN (le summary, écrit comme une promesse), puis l'ESSAI
		(on manipule), puis SEULEMENT le technique (les tables) plus bas. z-contact a sa
		vraie zone de démo avec sélecteur d'effet — pas un renvoi. Les autres gardent leur
		aperçu ; le bloc « ce que tu écris » ne s'affiche que là où il aide encore.
	*/
	const isContact = d.tagName === "z-contact";
	if (!isContact) sec.append(usageBlock(d));

	if (group === "core") sec.append(visualizer(d));
	else if (isContact) sec.append(contactDemo(d));
	else if (group === "components") sec.append(preview(d));
	else sec.append(el("p", { class: "seealso", text: t("seealso") }));

	if (d.attributes?.length) sec.append(heading(t("attributes"), t("attributesHint")), attributesTable(d.attributes));
	if (d.events?.length) sec.append(heading(t("events"), t("eventsHint")), table([t("event"), t("role")],
		d.events.map((ev) => [code(ev.name), desc(ev.description)])));
	if (d.cssStates?.length) { sec.append(heading(t("states"), t("statesHint"))); sec.append(chips(d.cssStates.map((s) => s.name))); }
	if (d.cssProperties?.length) sec.append(heading(t("cssVars"), t("cssVarsHint")), table([t("variable"), t("role")],
		d.cssProperties.map((v) => [code(v.name), desc(v.description)])));
	return sec;
}

/*
	LA DÉMO DE z-contact — la vraie, pas un renvoi. Une zone où l'on clique, un sélecteur
	d'effet, et l'effet naît sous le pointeur (répliqué dans l'overlay, comme en vrai). On
	branche les vrais fichiers : la base z-contact.css positionne la scène, et une « recette »
	(effects/<fx>.css) donne l'apparence — exactement le mécanisme réel : changer d'effet =
	changer de recette. Une source <z-contact> invisible dit au moteur « tourne ici ».
*/
/* Charge (ou remplace) la recette d'effet, appendue APRÈS la peau pour gagner la cascade. */
function ensureContactRecipe(fx) {
	let link = document.getElementById("doc-contact-recipe");
	if (fx === "none") { link?.remove(); return; }
	if (!link) { link = document.createElement("link"); link.id = "doc-contact-recipe"; link.rel = "stylesheet"; }
	document.head.append(link);                    /* ré-append → reste le dernier, donc gagne */
	link.href = `${ROOT}tools/z-contact/effects/${fx}.css`;
}

function contactDemo(d) {
	const c = CDEMO[LANG] || CDEMO.en;
	addLink(`${ROOT}tools/z-contact/z-contact.css`);   /* la base : positionne l'overlay/les parts */

	/* la SOURCE déclarée (invisible) : elle dit au moteur « le contact tourne sur cette page ». */
	let src = document.getElementById("doc-contact-src");
	if (!src) { src = document.createElement("z-contact"); src.id = "doc-contact-src"; document.body.append(src); }

	const box = el("div", { class: "cdemo" });
	const rootStyle = document.documentElement.style;
	const TOKENS = { size: "--z-contact-size", width: "--z-contact-width", duration: "--z-contact-duration", color: "--z-contact-color" };
	/* La démo ouvre sur la SIGNATURE de la peau active (--z-contact-fx) : sous Claude on
	   voit « ink » d'office, sous HighTech « morph ». Repli sur implode si la peau n'en pose pas. */
	const skinFx = getComputedStyle(document.documentElement).getPropertyValue("--z-contact-fx").trim();
	const initialFx = CDEMO_EFFECTS.includes(skinFx) ? skinFx : "implode";
	/* L'état, un seul, quel que soit le mode d'écriture. */
	const state = { fx: initialFx, size: "26px", width: "6px", duration: "550ms", color: null };
	let mode = "css";   /* « css » (variables) ou « attr » (attributs) — même résultat */

	/* la zone : cliquable partout (tabindex → le moteur la voit comme interactive). */
	const zone = el("div", { class: "cdemo-zone" });
	zone.tabIndex = 0;
	const target = el("button", { class: "cdemo-target", text: c.target });
	zone.append(target, el("p", { class: "cdemo-hint", text: c.hint }));

	/* Rejoue l'effet au centre de la cible — throttlé, pour que glisser un curseur le
	   fasse refleurir en direct sans saturer. */
	let last = 0;
	const fire = () => {
		if (state.fx === "none") return;
		const now = performance.now();
		if (now - last < 90) return;
		last = now;
		const r = target.getBoundingClientRect();
		target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1 }));
	};

	/* Le CODE vivant : ce que l'auteur écrirait, dans le mode choisi. C'est là que la
	   parité se voit — le MÊME réglage, en attribut ou en CSS. */
	const codePre = document.createElement("pre");
	codePre.className = "cdemo-code";
	const codeEl = document.createElement("code");
	codePre.append(codeEl);
	const renderCode = () => {
		const set = Object.keys(TOKENS).filter((k) => state[k]);
		if (mode === "attr") {
			codeEl.textContent = `<z-contact${["fx", ...set].map((k) => ` ${k}="${state[k]}"`).join("")}>`;
		} else {
			const decl = set.map((k) => `${TOKENS[k]}: ${state[k]};`).join(" ");
			codeEl.textContent = `<z-contact fx="${state.fx}">\nz-contact { ${decl} }`;
		}
	};

	/* Applique l'état par le CHEMIN choisi (attribut OU CSS) ; l'autre est nettoyé pour que
	   le code affiché soit honnête. Les deux finissent sur le même token, d'où le même effet. */
	const apply = () => {
		if (mode === "attr") {
			for (const prop of Object.values(TOKENS)) rootStyle.removeProperty(prop);
			for (const k of Object.keys(TOKENS)) state[k] ? src.setAttribute(k, state[k]) : src.removeAttribute(k);
		} else {
			for (const k of Object.keys(TOKENS)) src.removeAttribute(k);
			for (const [k, prop] of Object.entries(TOKENS)) state[k] ? rootStyle.setProperty(prop, state[k]) : rootStyle.removeProperty(prop);
		}
		renderCode();
		fire();
	};

	/* le sélecteur d'effet (changer d'effet = changer de recette). */
	const params = el("div", { class: "cdemo-params" });
	params.append(el("span", { class: "cdemo-plabel", text: c.effect }));
	const fxButtons = new Map();
	const selectFx = (fx) => {
		state.fx = fx;
		src.setAttribute("fx", fx);
		ensureContactRecipe(fx);
		for (const [name, b] of fxButtons) b.classList.toggle("on", name === fx);
		renderCode();
		fire();
	};
	for (const fx of [...CDEMO_EFFECTS, "none"]) {
		const b = el("button", { class: "cdemo-choice", text: fx === "none" ? c.none : fx });
		b.addEventListener("click", () => selectFx(fx));
		params.append(b); fxButtons.set(fx, b);
	}

	/* la bascule d'écriture : attribut OU CSS — le cœur de la démonstration. */
	const modeRow = el("div", { class: "cdemo-params" });
	modeRow.append(el("span", { class: "cdemo-plabel", text: c.write }));
	const modeButtons = new Map();
	const selectMode = (m) => {
		mode = m;
		for (const [name, b] of modeButtons) b.classList.toggle("on", name === m);
		apply();
	};
	for (const [m, label] of [["attr", c.modeAttr], ["css", c.modeCss]]) {
		const b = el("button", { class: "cdemo-choice", text: label });
		b.addEventListener("click", () => selectMode(m));
		modeRow.append(b); modeButtons.set(m, b);
	}

	/* les réglages VIVANTS : un z-slider par token (la démo faite AVEC Zoé). */
	const controls = el("div", { class: "cdemo-controls" });
	for (const ctl of CDEMO_CTLS) {
		const row = el("label", { class: "cdemo-ctl" });
		row.append(el("span", { class: "cdemo-ctl-label", text: c[ctl.key] }));
		const s = document.createElement("z-slider");
		s.setAttribute("min", ctl.min); s.setAttribute("max", ctl.max); s.setAttribute("value", ctl.value);
		s.addEventListener("input", () => { state[ctl.token] = `${s.value}${ctl.unit}`; apply(); });
		row.append(s);
		controls.append(row);
	}
	/* la couleur : des pastilles — un clic met à jour l'état et réapplique. */
	const colorRow = el("label", { class: "cdemo-ctl" });
	colorRow.append(el("span", { class: "cdemo-ctl-label", text: c.color }));
	const swatches = el("div", { class: "cdemo-swatches" });
	for (const col of CDEMO_SWATCHES) {
		const sw = el("button", { class: "cdemo-swatch" });
		sw.style.background = col;
		sw.addEventListener("click", () => {
			state.color = col.startsWith("var(") ? null : col;
			[...swatches.children].forEach((n) => n.classList.toggle("on", n === sw));
			apply();
		});
		swatches.append(sw);
	}
	colorRow.append(swatches);
	controls.append(colorRow);

	box.append(params, zone, modeRow, controls, codePre, el("p", { class: "cdemo-css", text: c.css }));

	/* état initial : la signature de la peau, mode CSS. */
	fxButtons.get(initialFx).classList.add("on");
	modeButtons.get("css").classList.add("on");
	src.setAttribute("fx", initialFx);
	ensureContactRecipe(initialFx);
	apply();
	return box;
}

/*
	Le VISUALISEUR : un gros « Testez-moi », DRAGUABLE pour de vrai (il bouge à la
	souris → press/drag/release/releaseOut), et deux familles d'états à côté (souris au
	geste, utilitaires au clic), chacune avec un POINT qui s'allume quand l'état est actif.
*/
function visualizer(d) {
	const box = el("div", { class: "viz" });
	const stage = el("div", { class: "viz-stage" });
	const inst = document.createElement(d.tagName);
	inst.className = "viz-instance";
	inst.textContent = t("tryme");
	stage.append(inst);

	let start = null;
	const base = { x: 0, y: 0 };
	inst.addEventListener("pointerdown", (e) => {
		start = { x: e.clientX, y: e.clientY };
		try { inst.setPointerCapture(e.pointerId); } catch { /* ok */ }
	});
	inst.addEventListener("pointermove", (e) => {
		if (!start) return;
		inst.style.transform = `translate(${base.x + e.clientX - start.x}px, ${base.y + e.clientY - start.y}px)`;
	});
	const drop = (e) => {
		if (!start) return;
		const dx = e.clientX - start.x, dy = e.clientY - start.y;
		start = null;
		/* dedans/dehors = par rapport à la ZONE (pas au bouton, qui suit le pointeur). */
		const sr = stage.getBoundingClientRect();
		const inStage = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
		if (inStage) {
			base.x += dx; base.y += dy;
		} else {
			inst.style.transform = ""; base.x = 0; base.y = 0;
			inst.setState?.("release", false); inst.setState?.("over", false);
			inst.setState?.("releaseOut", true);
			setTimeout(() => inst.setState?.("releaseOut", false), 450);
		}
	};
	inst.addEventListener("pointerup", drop);
	inst.addEventListener("pointercancel", drop);

	const has = new Set((d.cssStates || []).map((s) => s.name));
	const dots = new Map();
	const panel = el("div", { class: "viz-panel" });
	panel.append(group(t("mouse"), MOUSE.filter((n) => has.has(n)), false, inst, dots));
	panel.append(group(t("utility"), UTILITY.filter((n) => has.has(n)), true, inst, dots));

	const light = (active) => { const set = new Set(active); for (const [name, dot] of dots) dot.classList.toggle("on", set.has(name)); };
	inst.addEventListener("z-state", (e) => light(e.detail.states));
	requestAnimationFrame(() => light(inst.states || []));

	stage.append(el("p", { class: "viz-hint", text: t("hint") }));
	box.append(stage, panel);
	return box;
}

/* Un groupe d'états : titre + lignes (point + nom). Cliquable = force l'état. */
function group(title, names, clickable, inst, dots) {
	const g = el("div", { class: "viz-group" });
	g.append(el("p", { class: "viz-group-title", text: title }));
	for (const name of names) {
		const row = el(clickable ? "button" : "div", { class: `viz-row${clickable ? " clickable" : ""}` });
		const dot = el("span", { class: "dot" });
		row.append(dot, document.createTextNode(name));
		if (clickable) { row.title = t("clickState"); row.addEventListener("click", () => inst.toggleState?.(name)); }
		g.append(row);
		dots.set(name, dot);
	}
	return g;
}

/* Le bloc « ce que tu écris » : le HTML minimal + la promesse zéro JS. */
function usageBlock(d) {
	const wrap = el("div", { class: "usage" });
	const pre = document.createElement("pre");
	const code = document.createElement("code");
	const lines = [`<${d.tagName}>Exemple</${d.tagName}>`];
	const attr = (d.attributes || [])[0];
	if (attr) lines.push(`<${d.tagName} ${attr.name}>…</${d.tagName}>`);
	code.textContent = lines.join("\n");
	pre.append(code);
	const promise = el("p", { class: "promise" });
	promise.append(document.createTextNode(t("promisePre")));
	promise.append(el("b", { text: t("promiseBold") }));
	promise.append(document.createTextNode(t("promisePost")));
	wrap.append(pre, promise);
	return wrap;
}

/* Aperçu d'un COMPOSANT : l'instance stylée dans quelques états (pas le tester). */
function preview(d) {
	const box = el("div", { class: "preview" });
	const has = new Set((d.cssStates || []).map((s) => s.name));
	const show = ["", ...["loading", "error", "disabled"].filter((s) => has.has(s))];
	for (const s of show) {
		const inst = document.createElement(d.tagName);
		if (s) inst.setAttribute(s, "");
		inst.textContent = s || t("default");
		box.append(inst);
	}
	return box;
}

/* Le sélecteur de langue (EN/FR/ES), en haut à gauche — il rebâtit la doc à la volée. */
function mountLangSwitch() {
	const box = el("div");
	box.style.cssText = "position:fixed;top:.6rem;left:.6rem;z-index:99999;display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem .35rem .7rem;border-radius:9px;background:rgba(24,20,17,.92);color:#f3ece0;font:600 12px/1 ui-monospace,monospace;box-shadow:0 4px 14px rgba(0,0,0,.25)";
	const label = el("span", { text: "lang" });
	label.style.cssText = "opacity:.7;text-transform:uppercase;letter-spacing:.1em";
	const select = document.createElement("select");
	select.style.cssText = "font:inherit;color:#fff;background:#2a2320;border:1px solid #4a4038;border-radius:6px;padding:.35rem .5rem;cursor:pointer";
	for (const [id, name] of [["en", "English"], ["fr", "Français"], ["es", "Español"]]) {
		const o = el("option", { text: name }); o.value = id; select.append(o);
	}
	select.value = LANG;
	select.addEventListener("change", () => { LANG = select.value; localStorage.setItem("zoe-lang", LANG); render(); });
	box.append(label, select);
	document.body.append(box);
}

/* ── petits helpers DOM ────────────────────────────────────── */
function el(tag, { class: cls, id, href, text } = {}) {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (id) n.id = id;
	if (href) n.href = href;
	if (text != null) n.textContent = text;
	return n;
}
/*
	Un titre de section, avec sa LÉGENDE. Sans elle, « Attributs » et « Variables CSS »
	se lisent comme deux façons de faire la même chose — c'est la question qui revient.
	La légende dit en une ligne ce qui les sépare : l'attribut se pose sur CET élément et
	c'est un raccourci nommé ; le token se pose en CSS, il descend sur tout ce qui suit,
	et c'est le réglage fin.
	@param {string} text   le titre
	@param {string} [hint] la légende (une phrase, ou rien)
*/
function heading(text, hint) {
	const titre = el("h3", { text });
	if (!hint) return titre;
	const bloc = document.createDocumentFragment();
	bloc.append(titre, el("p", { class: "hint", text: hint }));
	return bloc;
}
function code(text) { return el("code", { text }); }
function table(head, rows) {
	const tbl = document.createElement("table");
	const thead = document.createElement("tr");
	for (const h of head) thead.append(el("th", { text: h }));
	tbl.append(thead);
	for (const row of rows) {
		const tr = document.createElement("tr");
		for (const cell of row) { const td = document.createElement("td"); td.append(cell instanceof Node ? cell : document.createTextNode(cell)); tr.append(td); }
		tbl.append(tr);
	}
	return tbl;
}
/*
	LA TABLE DES ATTRIBUTS — chaque VALEUR est sa propre ligne, alignée avec son RÔLE.
	« string » ne dit rien ; « implode | l'anneau se ramasse en un point » dit tout. Le
	sens d'une valeur vit dans la colonne Rôle, sur la MÊME ligne que la valeur — jamais
	entassé sous elle dans la colonne étroite. Le nom de l'attribut chapeaute ses lignes
	(rowspan). Un seul gabarit du plus simple au plus complexe (uniformité) :
	  - valeurs décrites → une ligne par valeur : valeur [défaut] | son sens ;
	  - liste simple     → une ligne par valeur, le rôle général sur la première ;
	  - booléen          → une ligne « présent / absent » | le rôle ;
	  - texte libre      → une ligne « — » | le rôle.
*/
function attributesTable(attrs) {
	const tbl = document.createElement("table");
	tbl.className = "attrs";
	const head = document.createElement("tr");
	for (const h of [t("attributes"), t("values"), t("role")]) head.append(el("th", { text: h }));
	tbl.append(head);

	for (const a of attrs) {
		const rows = valueRows(a);
		rows.forEach((r, i) => {
			const tr = document.createElement("tr");
			tr.className = i === 0 ? "row-attr" : "row-sub";
			if (i === 0) {
				const td = document.createElement("td");
				td.rowSpan = rows.length;
				td.append(code(a.name));
				tr.append(td);
			}
			const tdV = document.createElement("td");
			tdV.className = "td-val";
			tdV.append(r.valueNode);
			if (r.def) tdV.append(el("span", { class: "val-def", text: t("default") }));
			tr.append(tdV);
			const tdR = document.createElement("td");
			tdR.append(document.createTextNode(r.role || ""));
			tr.append(tdR);
			tbl.append(tr);
		});
	}
	return tbl;
}

/* Décompose un attribut en lignes { valueNode, def, role } — une par valeur. */
function valueRows(a) {
	if (a.values?.length) {
		const norm = a.values.map((v) => (typeof v === "string" ? { value: v } : v));
		const described = norm.some((v) => v.note);
		return norm.map((v, i) => ({
			valueNode: code(v.value),
			def: v.default,
			role: described ? (v.note ? desc(v.note) : "") : (i === 0 ? desc(a.description) : "")
		}));
	}
	const plain = a.type?.text === "boolean" ? t("boolPresent") : "—";
	return [{ valueNode: el("span", { class: "val-plain", text: plain }), role: desc(a.description) }];
}
function chips(names) {
	const box = el("div", { class: "chips" });
	for (const n of names) box.append(code(n));
	return box;
}
function addLink(href) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.append(l); }
