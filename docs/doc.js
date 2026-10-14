/*
	============================================================
	doc.js — LE VIEWER de la doc officielle (multilingue)
	------------------------------------------------------------
	Il ne DÉCRIT rien à la main : il charge l'index généré (dist/zoe.json — attributs,
	événements, états, calques, variables, tokens lus dans le CSS, membres JS, exemple,
	chemins des fichiers, en trois langues), importe chaque module pour que les éléments
	soient DÉFINIS (les exemples se rendent en vrai), et met en page. Un sélecteur de
	langue bascule TOUT côté client (comme le sélecteur de peau). Les libellés de la doc
	sont dans I18N ; l'API, dans les `static api` du code — une source.

	L'ordre d'une fiche : le BESOIN (le summary, écrit comme une promesse), puis l'ESSAI
	(l'exemple rendu en vrai, son code juste à côté — jamais une démo sans son code), puis
	le narratif (.doc.md), puis SEULEMENT le technique (attributs, événements, états,
	calques, variables, API JS).
	(Commentaires en français = langue de travail ; l'API publiée, elle, est en anglais.)
	============================================================
*/

import "../examples/skin-switch.js";   /* le pacte : sélecteur de peau */
import { discoverContactEffects } from "../tools/z-contact/z-contact-effect.js";   /* les effets que la peau déclare */

const ROOT = new URL("../", import.meta.url).href;   /* …/zoé/ */

/* Les deux familles d'états, testées différemment (les noms d'états ne se traduisent pas). */
const MOUSE = ["over", "press", "release", "releaseOut", "drag", "focus"];       /* au geste */
const UTILITY = ["current", "loading", "disabled", "error", "success"];        /* au clic */

/* Langue courante + dictionnaire de l'UI de la doc (l'API vit dans les static api). */
let LANG = new URLSearchParams(location.search).get("lang") || localStorage.getItem("zoe-lang") || "en";
const I18N = {
	en: {
		attributesHint: "Written on THIS element, in the HTML. A named shortcut: one word, and the component knows what to do.",
		eventsHint: "What the component signals. Listen with addEventListener.",
		statesHint: "They HAPPEN — on gesture, or set by code. You don't set them here, you paint them: z-button:state(over) { … }",
		cssVarsHint: "Written in CSS, and flows DOWN to everything inside. The fine-grained setting; an attribute is a shortcut that sets several at once. Tokens follow the pact: --z-{component}[--{part}]__{css-property}.",
		layersHint: "A piece marked ::before / ::after is painted by the CSS — nothing to write. A piece without one is content you write (<z-layer part=\"…\">, or a native tag carrying part=\"…\"). Zoé never generates a node. Same word, same meaning in every component.",
		membersHint: "The JavaScript surface, when you want to drive the element from code. HTML and CSS never require it.",
		exampleHint: "Rendered live, with the exact HTML that produced it. Change the skin (top right): the rendering follows, the HTML does not move.",
		core: "core", tools: "tools", components: "components", attributes: "Attributes", type: "Type", values: "Values", boolPresent: "present / absent", role: "Role", events: "Events", event: "Event", states: "States :state()", cssVars: "CSS variables", variable: "Variable", layers: "Layers", layer: "Part", optional: "optional", members: "JS API", member: "Member", example: "Example", demo: "Full demo", lab: "Lab", source: "Source",
		paints: (property, part) => (part ? `Paints \`${property}\` of the \`${part}\` part.` : `Paints \`${property}\` of the element.`),
		tryme: "Try me", hint: "Hover, press, DRAG it (drop inside / outside) — the « mouse » dots follow.", mouse: "Mouse — on gesture", utility: "Utility — on click", seealso: "Same states as z-element — try them above.", clickState: "click to set this state", default: "default"
	},
	fr: {
		attributesHint: "S'écrit sur CET élément, dans le HTML. Un raccourci nommé : un mot, et le composant sait quoi faire.",
		eventsHint: "Ce que le composant signale. À écouter avec addEventListener.",
		statesHint: "Ils ARRIVENT — au geste, ou posés par le code. On ne les règle pas ici, on les peint : z-button:state(over) { … }",
		cssVarsHint: "S'écrit en CSS, et descend sur tout le contenu. Le réglage fin ; un attribut n'est qu'un raccourci qui en pose plusieurs d'un coup. Les tokens suivent le pacte : --z-{composant}[--{pièce}]__{propriété-css}.",
		layersHint: "Une pièce marquée ::before / ::after est peinte par le CSS — rien à écrire. Une pièce sans marque est du contenu que vous écrivez (<z-layer part=\"…\">, ou une balise native portant part=\"…\"). Zoé ne génère jamais un nœud. Un même mot, un même sens dans tous les composants.",
		membersHint: "La surface JavaScript, pour piloter l'élément depuis du code. Le HTML et le CSS ne l'exigent jamais.",
		exampleHint: "Rendu en direct, avec le HTML exact qui le produit. Changez la peau (en haut à droite) : le rendu suit, le HTML ne bouge pas.",
		core: "noyau", tools: "outils", components: "composants", attributes: "Attributs", type: "Type", values: "Valeurs", boolPresent: "présent / absent", role: "Rôle", events: "Événements", event: "Événement", states: "États :state()", cssVars: "Variables CSS", variable: "Variable", layers: "Calques", layer: "Pièce", optional: "optionnel", members: "API JS", member: "Membre", example: "Exemple", demo: "Démo complète", lab: "Lab", source: "Source",
		paints: (property, part) => (part ? `Peint \`${property}\` de la pièce \`${part}\`.` : `Peint \`${property}\` de l'élément.`),
		tryme: "Testez-moi", hint: "Survolez, pressez, GLISSEZ-le (lâchez dedans / dehors) — les points « souris » suivent.", mouse: "Souris — au geste", utility: "Utilitaires — au clic", seealso: "Mêmes états que z-element — voir plus haut.", clickState: "clic pour poser cet état", default: "défaut"
	},
	es: {
		attributesHint: "Se escribe en ESTE elemento, en el HTML. Un atajo con nombre: una palabra, y el componente sabe qué hacer.",
		eventsHint: "Lo que el componente señala. Escúchelo con addEventListener.",
		statesHint: "OCURREN — con el gesto, o puestos por el código. No se ajustan aquí, se pintan: z-button:state(over) { … }",
		cssVarsHint: "Se escribe en CSS, y BAJA a todo lo que hay dentro. El ajuste fino; un atributo solo es un atajo que pone varios de una vez. Los tokens siguen el pacto: --z-{componente}[--{pieza}]__{propiedad-css}.",
		layersHint: "Una pieza marcada ::before / ::after la pinta el CSS — nada que escribir. Una pieza sin marca es contenido que usted escribe (<z-layer part=\"…\">, o una etiqueta nativa con part=\"…\"). Zoé nunca genera un nodo. Misma palabra, mismo significado en todos los componentes.",
		membersHint: "La superficie JavaScript, para dirigir el elemento desde código. El HTML y el CSS nunca la exigen.",
		exampleHint: "Renderizado en vivo, con el HTML exacto que lo produce. Cambie la piel (arriba a la derecha): el renderizado sigue, el HTML no se mueve.",
		core: "núcleo", tools: "herramientas", components: "componentes", attributes: "Atributos", type: "Tipo", values: "Valores", boolPresent: "presente / ausente", role: "Función", events: "Eventos", event: "Evento", states: "Estados :state()", cssVars: "Variables CSS", variable: "Variable", layers: "Capas", layer: "Pieza", optional: "opcional", members: "API JS", member: "Miembro", example: "Ejemplo", demo: "Demo completa", lab: "Laboratorio", source: "Fuente",
		paints: (property, part) => (part ? `Pinta \`${property}\` de la pieza \`${part}\`.` : `Pinta \`${property}\` del elemento.`),
		tryme: "Pruébame", hint: "Pase el ratón, presione, ARRÁSTRELO (suelte dentro / fuera) — los puntos « ratón » siguen.", mouse: "Ratón — al gesto", utility: "Utilitarios — al clic", seealso: "Mismos estados que z-element — ver más arriba.", clickState: "clic para poner este estado", default: "predeterminado"
	}
};
const t = (k) => I18N[LANG]?.[k] ?? I18N.en[k] ?? k;
/* résout une description : string (anglais) OU { en, fr, es } → la langue courante. */
const desc = (v) => (typeof v === "string" ? v : (v && (v[LANG] || v.en || Object.values(v)[0])) || "");

/*
	L'ACCUEIL — L'ESSAI ROUTIER, pas le capot. Un visiteur ne doit pas tomber sur des
	tableaux ni sur une preuve de plomberie. Il doit VOIR le résultat : une application
	entière, vivante, qui se transforme sous sa main pour presque rien d'écrit. La démo
	« cinq nombres », en vrai, incrustée à la porte. Le mécanisme (le « avant/après »)
	descend sous le capot, pour qui veut le voir.
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
		tagline: "Ce n'est pas une capture — attrapez-la. Poussez un curseur, et toute la page se ré-harmonise. Pas une seule palette écrite.",
		caption: "Tout ce qui est au-dessus — fonds, cartes, filets — descend de cinq nombres. Aucun gris, aucune palette, aucun fichier « mode sombre ». C'est ça, Zoé.",
		underHood: "Sous le capot — le code que vous n'écrivez plus",
		before: "À la main — sur chaque composant", after: "Avec Zoé"
	},
	es: {
		menu: "la prueba", title: "Cinco números. Una interfaz entera.",
		tagline: "No es una captura — agárrela. Empuje un control, y toda la página se re-armoniza. Ni una sola paleta escrita.",
		caption: "Todo lo de arriba — fondos, tarjetas, filetes — desciende de cinco números. Sin grises, sin paleta, sin archivo « modo oscuro ». Eso es Zoé.",
		underHood: "Bajo el capó — el código que ya no escribe",
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
	en: { target: "Click here — or anywhere in the zone", hint: "The effect is born where the pointer touches. Move a slider: it replays live.", effect: "Effect — from the skin", belongsToSkin: "These are the effects THIS skin declares (@property --z-contact__fx--…). Switch skin (top-right) and the list changes. The page never hard-codes them.", write: "Write as", modeAttr: "attribute", modeCss: "CSS", size: "Size", thickness: "Thickness", duration: "Duration", color: "Colour", css: "Same result, two ways to write it — flip « attribute / CSS » above. That's the point: attribute OR CSS, your choice." },
	fr: { target: "Cliquez ici — ou n'importe où dans la zone", hint: "L'effet naît là où le pointeur touche. Bougez un curseur : il se rejoue en direct.", effect: "Effet — fourni par la peau", belongsToSkin: "Ce sont les effets que CETTE peau déclare (@property --z-contact__fx--…). Basculez la peau (en haut à droite) et la liste change. La page ne les fige jamais.", write: "Écrire en", modeAttr: "attribut", modeCss: "CSS", size: "Taille", thickness: "Épaisseur", duration: "Durée", color: "Couleur", css: "Même résultat, deux façons de l'écrire — basculez « attribut / CSS » au-dessus. C'est ça, la force : attribut OU CSS, au choix." },
	es: { target: "Pulse aquí — o en cualquier parte de la zona", hint: "El efecto nace donde el puntero toca. Mueva un control: se repite en directo.", effect: "Efecto — de la piel", belongsToSkin: "Son los efectos que ESTA piel declara (@property --z-contact__fx--…). Cambie la piel (arriba a la derecha) y la lista cambia. La página nunca los fija.", write: "Escribir como", modeAttr: "atributo", modeCss: "CSS", size: "Tamaño", thickness: "Grosor", duration: "Duración", color: "Color", css: "Mismo resultado, dos formas de escribirlo — cambie « atributo / CSS » arriba. Esa es la fuerza: atributo O CSS, a su elección." }
};
/* Les réglages vivants : `key` nomme le libellé (CDEMO[lang][key]), `token` la variable
   CSS réelle (et le nom de l'attribut-raccourci). Bouger un curseur rejoue l'effet. */
const CDEMO_CTLS = [
	{ key: "size", token: "size", prop: "--z-contact-size", min: 8, max: 64, value: 26, unit: "px" },
	{ key: "thickness", token: "width", prop: "--z-contact-width", min: 1, max: 16, value: 6, unit: "px" },
	{ key: "duration", token: "duration", prop: "--z-contact-duration", min: 200, max: 2000, value: 550, unit: "ms" }
];
const CDEMO_SWATCHES = ["var(--z-accent)", "#e0662c", "#22a06b", "#c4562f", "#7b61ff"];

/* Les éléments dont l'exemple ne se rend PAS dans la doc : ils agissent sur toute la page
   (un ruban qui suit la souris, le défilement de la page) ou sont déjà présents (z-contact).
   Leur essai, c'est leur page de lab, incrustée. */
const PAGE_WIDE = new Set(["z-cursor", "z-contact", "z-scroll", "z-pointer", "z-inview", "z-size", "z-drag", "z-channel", "z-lint", "z-motion"]);

addLink(`${ROOT}zoe.css`);   /* la bibliothèque entière : les exemples se peignent */

/* Style du narratif rendu (.doc-md) — minimal, il s'appuie sur les tokens de la peau. */
const mdStyle = document.createElement("style");
mdStyle.textContent = ".doc-md{margin:1.6rem 0;line-height:1.6}.doc-md h3{margin:1.6rem 0 .5rem}.doc-md h4{margin:1.2rem 0 .4rem}.doc-md pre{overflow-x:auto;padding:.8rem 1rem;border-radius:8px;background:var(--z-surface,#f4f0ea)}.doc-md code{font-size:.92em}.doc-md table.md-table{border-collapse:collapse;margin:1rem 0;width:100%}.doc-md .md-table th,.doc-md .md-table td{border:1px solid var(--z-line);padding:.45rem .7rem;text-align:left;vertical-align:top}.doc-md blockquote{margin:1rem 0;padding:.3rem 1rem;border-left:3px solid var(--z-line);color:var(--z-ink-soft)}.doc-md ul{margin:.6rem 0;padding-left:1.3rem}";
document.head.append(mdStyle);

/* L'INDEX GÉNÉRÉ — une source. Puis on importe chaque module : les balises se DÉFINISSENT,
   et les exemples se rendent pour de vrai. */
const index = await (await fetch(`${ROOT}dist/zoe.json`)).json();
const entries = index.elements;
for (const e of entries) {
	if (!e.paths.js) continue;
	try { await import(`${ROOT}${e.paths.js}`); }
	catch (error) { console.warn(`doc : ${e.tag} ne s'importe pas —`, error); }
}

/* LE NARRATIF vit dans le .doc.md de l'élément — UNE source (le structuré vient du static
   api). Absent = la fiche se contente de l'api. */
for (const e of entries) {
	if (!e.paths.doc) continue;
	try {
		const res = await fetch(`${ROOT}${e.paths.doc}`);
		if (res.ok) e.narrative = await res.text();
	} catch { /* pas de .doc.md lisible : la fiche se contente du static api */ }
}

mountLangSwitch();
render();
/* La peau a changé → ses effets déclarés (--z-contact__fx--*) aussi : on reconstruit la
   doc pour re-découvrir (sélecteur d'effet + tableaux se remettent à jour tout seuls). */
window.addEventListener("zoe:skin", render);

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
	const res = el("div", { text: `SELF-TEST : drag=${dragging ? "✅" : "❌"} · bouge=${moved ? "✅" : "❌"} · dragDot=${dragDot ? "✅" : "❌"} · releaseOut(dehors)=${releasedOut ? "✅" : "❌"} · retour centre=${back ? "✅" : "❌"} · utilitaire(clic loading)=${util ? "✅" : "❌"}` });
	res.style.cssText = "position:fixed;bottom:0;left:0;right:0;padding:.6rem 1rem;background:#1a1a1a;color:#fff;font:13px ui-monospace,monospace;z-index:99999";
	document.body.append(res);
} catch (err) {
	const res = el("div", { text: `SELF-TEST ERROR : ${err && err.message}` });
	res.style.cssText = "position:fixed;bottom:0;left:0;right:0;padding:.6rem 1rem;background:#7a0000;color:#fff;font:13px ui-monospace,monospace;z-index:99999";
	document.body.append(res);
}

/* ── rendu ─────────────────────────────────────────────────── */

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
	/* L'INTRO — la page « le socle » (docs/intro.html) : la synthèse du modèle, écrite en
	   HTML natif habillé par la peau. Placée juste sous l'essai : c'est la porte conceptuelle. */
	menu.append(el("a", { href: "./intro.html", text: LANG === "en" ? "the base" : LANG === "es" ? "el zócalo" : "le socle" }));
	menu.append(el("a", { href: "./GRAMMAR.md", text: LANG === "en" ? "the grammar" : LANG === "es" ? "la gramática" : "la grammaire" }));
	menu.append(el("a", { href: "../examples/theme-builder.html", text: LANG === "en" ? "the theme lab" : LANG === "es" ? "el taller de tema" : "l'atelier de thème" }));
	main.append(homeSection());

	const groups = { core: [], tools: [], components: [] };
	for (const e of entries) (groups[e.kind] ||= []).push(e);

	for (const [key, list] of Object.entries(groups)) {
		if (!list.length) continue;
		menu.append(el("div", { class: "group", text: t(key) }));
		for (const e of list) {
			menu.append(el("a", { href: `#${e.tag}`, text: e.attributeTool ? e.tag : `<${e.tag}>` }));
			main.append(entrySection(e));
		}
	}
}

/*
	L'ACCUEIL : l'essai routier, dans l'ordre où l'œil doit le prendre.
	① LA VOITURE QUI ROULE — la vraie démo « cinq nombres » incrustée en live (iframe).
	② LA LÉGENDE — ce qu'il vient de voir, en une phrase.
	③ SOUS LE CAPOT — le « avant/après » : le moteur, pour qui veut le voir APRÈS l'essai.
*/
function homeSection() {
	const h = HOME[LANG] || HOME.en;
	const sec = el("section", { class: "entry home", id: "home" });
	sec.append(el("h2", { text: h.title }));
	sec.append(el("p", { class: "summary", text: h.tagline }));
	sec.append(screen(DEMO, "examples/trois-variables.html", h.title));
	sec.append(el("p", { class: "hero-caption", text: h.caption }));
	sec.append(el("h3", { text: h.underHood }));
	const cmp = el("div", { class: "avapres" });
	cmp.append(codeCol(h.before, AVANT, "avant"), codeCol(h.after, APRES, "apres"));
	sec.append(cmp);
	return sec;
}

/* Un « écran vivant » : une barre allumée + une page qui tourne pour de vrai dedans. */
function screen(src, label, title) {
	const box = el("div", { class: "hero-screen" });
	const bar = el("div", { class: "hero-bar" });
	bar.append(el("span", { class: "hero-live" }), el("span", { class: "hero-url", text: label }));
	const frame = document.createElement("iframe");
	frame.className = "hero-frame";
	frame.src = src;
	frame.loading = "lazy";
	frame.title = title;
	box.append(bar, frame);
	return box;
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

/* La fiche d'un élément : besoin → essai → narratif → technique. */
function entrySection(e) {
	const sec = el("section", { class: "entry", id: e.tag });
	/* Un outil-attribut (z-channel, z-lint) ou 100 % CSS (z-motion) n'est PAS une balise. */
	sec.append(el("h2", { text: e.attributeTool ? e.tag : `<${e.tag}>` }));
	sec.append(el("p", { class: "summary", text: desc(e.summary) }));
	sec.append(linksRow(e));

	if (e.tag === "z-element") sec.append(visualizer(e));
	else if (e.tag === "z-contact") sec.append(contactDemo(e));
	else if (PAGE_WIDE.has(e.tag) && (e.paths.lab || e.paths.demo)) sec.append(screen(`${ROOT}${e.paths.lab || e.paths.demo}`, e.paths.lab || e.paths.demo, e.tag));
	if (e.example) sec.append(exampleBlock(e));

	if (e.narrative) sec.append(narrativeBlock(e.narrative));

	if (e.attributes?.length) sec.append(heading(t("attributes"), t("attributesHint")), attributesTable(e.attributes));
	if (e.events?.length) sec.append(heading(t("events"), t("eventsHint")), table([t("event"), t("role")], e.events.map((ev) => [code(ev.name), desc(ev.description)])));
	if (e.states?.length) { sec.append(heading(t("states"), t("statesHint"))); sec.append(chips(e.states.map((s) => s.name))); }
	if (e.layers?.length) sec.append(heading(t("layers"), t("layersHint")), layersTable(e.layers));
	const variables = variablesRows(e);
	if (variables.length) sec.append(heading(t("cssVars"), t("cssVarsHint")), table([t("variable"), t("role")], variables));
	if (e.members?.length) sec.append(heading(t("members"), t("membersHint")), table([t("member"), t("type"), t("role")], e.members.map((m) => [code(m.name), m.type ? code(m.type) : "", desc(m.description)])));
	return sec;
}

/* La ligne des portes : la démo complète, le lab, la source — là où l'œil arrive, pas en bas. */
function linksRow(e) {
	const row = el("p", { class: "links" });
	const add = (label, href) => { if (href) row.append(el("a", { href: `${ROOT}${href}`, text: `${label} →` })); };
	add(t("demo"), e.paths.demo);
	add(t("lab"), e.paths.lab);
	add(t("source"), e.paths.js || e.paths.css);
	return row.childElementCount ? row : document.createDocumentFragment();
}

/*
	L'EXEMPLE — rendu en vrai à gauche, son HTML exact à droite (loi : jamais une démo sans
	son code, juste à côté). Les éléments qui agissent sur toute la page (sillage,
	défilement…) ne se rendent pas ici : leur essai est leur page de lab, au-dessus ; on
	garde seulement le code.
*/
function exampleBlock(e) {
	const wrap = el("div", { class: "example" });
	const renderable = e.kind === "components" || e.tag === "z-layer";
	if (renderable) {
		const stage = el("div", { class: "example-render" });
		stage.innerHTML = e.example;
		wrap.append(stage);
	} else {
		wrap.classList.add("code-only");
	}
	const pre = document.createElement("pre");
	pre.className = "example-code";
	const c = document.createElement("code");
	c.textContent = e.example;
	pre.append(c);
	wrap.append(pre);
	const box = document.createDocumentFragment();
	box.append(heading(t("example"), renderable ? t("exampleHint") : null), wrap);
	return box;
}

/* Les calques, à plat, chaque enfant décalé sous son parent. */
function layersTable(layers) {
	const rows = [];
	const walk = (list, depth) => {
		for (const layer of list) {
			const cell = el("span", { class: `depth-${depth}` });
			if (depth) cell.append(el("span", { class: "tree", text: "↳ " }));
			cell.append(code(layer.part));
			/* Une pièce PEINTE porte son pseudo-élément : rien à écrire, c'est le CSS qui
			   la fait. Sans pseudo, c'est du contenu que l'auteur écrit. */
			if (layer.pseudo) cell.append(el("span", { class: "val-def", text: layer.pseudo }));
			if (layer.optional) cell.append(el("span", { class: "val-def", text: t("optional") }));
			rows.push([cell, desc(layer.description)]);
			walk(layer.children || [], depth + 1);
		}
	};
	walk(layers, 0);
	return table([t("layer"), t("role")], rows);
}

/* Les variables : celles que l'élément POSE (cssVars, décrites), puis les tokens du pacte
   qu'il LIT dans son CSS (déduits ; la description dit ce qu'ils peignent). */
function variablesRows(e) {
	const declared = (e.cssVars || []).map((v) => [code(v.name), desc(v.description)]);
	const declaredNames = new Set((e.cssVars || []).map((v) => v.name));
	const read = (e.tokens || []).filter((token) => !declaredNames.has(token.name)).map((token) => [code(token.name), t("paints")(token.property, token.part)]);
	return [...declared, ...read];
}

/*
	Mini-rendu Markdown — juste le sous-ensemble qu'on écrit dans les .doc.md (titres,
	paragraphes, gras, code, blocs de code, tables, citations, listes, liens, filets). Aucune
	dépendance (ODE2JS : on n'embarque pas une lib pour ça). Le contenu est le NÔTRE (un
	fichier du repo), donc innerHTML est sûr ici.
	@param {string} md
	@returns {string} du HTML
*/
function renderMarkdown(md) {
	const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	const inline = (s) => esc(s)
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
		/* Les touches : la doc écrit <kbd>…</kbd> (échappé par esc), on le RÉTABLIT en
		   <z-kbd> — le composant maison. La doc se peint donc avec Zoé (dogfooding), et
		   les raccourcis clavier ne s'affichent plus en toutes lettres. Contenu de
		   confiance (nos .doc.md) → réinjection sûre. */
		.replace(/&lt;kbd&gt;([^]*?)&lt;\/kbd&gt;/g, "<z-kbd>$1</z-kbd>");

	const lines = md.replace(/\r/g, "").split("\n");
	const out = [];
	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		if (line.startsWith("```")) {                       /* bloc de code */
			const buf = [];
			i++;
			while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
			i++;
			out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
			continue;
		}
		if (line.trim().startsWith("|") && lines[i + 1] && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
			const row = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
			const head = row(line);
			i += 2;
			const body = [];
			while (i < lines.length && lines[i].trim().startsWith("|")) body.push(row(lines[i++]));
			const th = head.map((c) => `<th>${inline(c)}</th>`).join("");
			const tr = body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
			out.push(`<table class="md-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`);
			continue;
		}
		const h = line.match(/^(#{1,4})\s+(.*)$/);          /* titre → décalé d'un cran (le h2 est pris) */
		if (h) { const n = Math.min(h[1].length + 1, 6); out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }

		if (line.startsWith(">")) {                          /* citation */
			const buf = [];
			while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
			out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
			continue;
		}
		if (/^\s*[-*]\s+/.test(line)) {                      /* liste */
			const buf = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
			out.push(`<ul>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</ul>`);
			continue;
		}
		if (/^\s*---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }   /* filet */
		if (!line.trim()) { i++; continue; }                 /* ligne vide */

		const buf = [];                                      /* paragraphe */
		while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*[-*]\s|\s*\||\s*---+\s*$)/.test(lines[i])) buf.push(lines[i++]);
		out.push(`<p>${inline(buf.join(" "))}</p>`);
	}
	return out.join("\n");
}

/* Le narratif d'un composant, rendu depuis son .doc.md. On retire le titre de niveau 1 :
   la section porte déjà son <h2>, on ne le redit pas. */
function narrativeBlock(md) {
	const box = el("div", { class: "doc-md" });
	box.innerHTML = renderMarkdown(md.replace(/^\s*#\s+.*(\n|$)/, ""));
	return box;
}

/*
	LA DÉMO DE z-contact — la vraie, pas un renvoi. Une zone où l'on clique, un sélecteur
	d'effet, et l'effet naît sous le pointeur (répliqué dans l'overlay, comme en vrai). On
	branche les vrais fichiers : la base z-contact.css positionne la scène, et une « recette »
	(effects/<fx>.css) donne l'apparence — exactement le mécanisme réel : changer d'effet =
	changer de recette. Une source <z-contact> invisible dit au moteur « tourne ici ».
*/
function contactDemo(d) {
	const c = CDEMO[LANG] || CDEMO.en;

	/* la SOURCE déclarée (invisible) : elle dit au moteur « le contact tourne sur cette page ». */
	let src = document.getElementById("doc-contact-src");
	if (!src) { src = document.createElement("z-contact"); src.id = "doc-contact-src"; document.body.append(src); }

	const box = el("div", { class: "cdemo" });
	const rootStyle = document.documentElement.style;
	const TOKENS = { size: "--z-contact-size", width: "--z-contact-width", duration: "--z-contact-duration", color: "--z-contact-color" };
	/* L'état des RÉGLAGES (l'EFFET, lui, appartient à la peau — jamais un choix de la démo). */
	const state = { size: "26px", width: "6px", duration: "550ms", color: null };
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
			codeEl.textContent = `<z-contact${set.map((k) => ` ${k}="${state[k]}"`).join("")}>`;
		} else {
			const decl = set.map((k) => `${TOKENS[k]}: ${state[k]};`).join(" ");
			codeEl.textContent = `<z-contact>\nz-contact { ${decl} }`;
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

	/* Le sélecteur d'effet — DYNAMIQUE : rempli par ce que la PEAU DÉCLARE (découverte des
	   @property --z-contact__fx--*). HighTech → implode/explode/morph ; Claude → ink. La page
	   ne fige rien : changez de peau, la liste change (la doc se reconstruit sur « zoe:skin »). */
	const effects = discoverContactEffects();
	const skinDefault = getComputedStyle(document.documentElement).getPropertyValue("--z-contact-fx").trim();
	const fxRow = el("div", { class: "cdemo-params" });
	fxRow.append(el("span", { class: "cdemo-plabel", text: c.effect }));
	const fxButtons = new Map();
	const pickFx = (fx) => {
		src.setAttribute("fx", fx);
		for (const [name, b] of fxButtons) b.classList.toggle("on", name === fx);
		fire();
	};
	for (const fx of effects) {
		const b = el("button", { class: "cdemo-choice", text: fx });
		b.addEventListener("click", () => pickFx(fx));
		fxRow.append(b); fxButtons.set(fx, b);
	}
	const skinNote = el("p", { class: "cdemo-skin", text: c.belongsToSkin });

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

	box.append(fxRow, skinNote, zone, modeRow, controls, codePre, el("p", { class: "cdemo-css", text: c.css }));

	/* état initial : la signature par défaut de la peau (ou le 1er effet découvert), mode CSS. */
	const startFx = effects.includes(skinDefault) ? skinDefault : effects[0];
	if (startFx) { src.setAttribute("fx", startFx); fxButtons.get(startFx)?.classList.add("on"); }
	else src.removeAttribute("fx");
	modeButtons.get("css").classList.add("on");
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
	const inst = document.createElement(d.tag);
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

	const has = new Set((d.states || []).map((s) => s.name));
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

/* Le sélecteur de langue (EN/FR/ES), en haut à gauche — il rebâtit la doc à la volée. */
function mountLangSwitch() {
	const box = el("div");
	box.style.cssText = "position:fixed;top:.6rem;left:.6rem;z-index:99999;display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem .35rem .7rem;border-radius:9px;background:rgba(24,20,17,.92);color:#f3ece0;font:600 12px/1 ui-monospace,monospace;box-shadow:0 4px 14px rgba(0,0,0,.25)";
	const label = el("span", { text: "lang" });
	label.style.cssText = "opacity:.7;text-transform:uppercase;letter-spacing:.1em";
	const select = document.createElement("select");
	select.setAttribute("aria-label", "Language");
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
	La légende dit en une ligne ce qui les sépare.
	@param {string} text   le titre
	@param {string|null} [hint] la légende (une phrase, ou rien)
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

/* Décompose un attribut (forme zoe.json : values = [{ value, note, default }]) en lignes
   { valueNode, def, role } — une par valeur. */
function valueRows(a) {
	if (a.values?.length) {
		const described = a.values.some((v) => desc(v.note));
		return a.values.map((v, i) => ({
			valueNode: code(v.value),
			def: v.default,
			role: described ? (desc(v.note) || "") : (i === 0 ? desc(a.description) : "")
		}));
	}
	const plain = a.type === "boolean" ? t("boolPresent") : "—";
	return [{ valueNode: el("span", { class: "val-plain", text: plain }), role: desc(a.description) }];
}
function chips(names) {
	const box = el("div", { class: "chips" });
	for (const n of names) box.append(code(n));
	return box;
}
function addLink(href) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.append(l); }
