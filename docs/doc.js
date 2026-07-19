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
const UTILITY = ["current", "loading", "busy", "disabled", "error", "success"]; /* au clic */

/* Langue courante + dictionnaire de l'UI de la doc (l'API vit dans les static api). */
let LANG = new URLSearchParams(location.search).get("lang") || localStorage.getItem("zoe-lang") || "en";
const I18N = {
	en: { core: "core", tools: "tools", components: "components", attributes: "Attributes", type: "Type", role: "Role", events: "Events", event: "Event", states: "States :state()", cssVars: "CSS variables", variable: "Variable", tryme: "Try me", hint: "Hover, press, DRAG it (drop inside / outside) — the « mouse » dots follow.", mouse: "Mouse — on gesture", utility: "Utility — on click", seealso: "Same states as z-element — try them above.", clickState: "click to set this state", promisePre: "States · interaction · animation: ", promiseBold: "zero JS to manage.", promisePost: " You write this HTML — and your CSS for :state().", default: "default" },
	fr: { core: "noyau", tools: "tools", components: "composants", attributes: "Attributs", type: "Type", role: "Rôle", events: "Événements", event: "Événement", states: "États :state()", cssVars: "Variables CSS", variable: "Variable", tryme: "Testez-moi", hint: "Survole, presse, GLISSE-le (lâche dedans / dehors) — les points « souris » suivent.", mouse: "Souris — au geste", utility: "Utilitaires — au clic", seealso: "Mêmes états que z-element — teste-les là-haut.", clickState: "clique pour poser cet état", promisePre: "États · interaction · animation : ", promiseBold: "zéro JS à gérer.", promisePost: " Tu écris ce HTML — et ton CSS pour :state().", default: "défaut" },
	es: { core: "núcleo", tools: "herramientas", components: "componentes", attributes: "Atributos", type: "Tipo", role: "Función", events: "Eventos", event: "Evento", states: "Estados :state()", cssVars: "Variables CSS", variable: "Variable", tryme: "Pruébame", hint: "Pasa el ratón, presiona, ARRÁSTRALO (suelta dentro / fuera) — los puntos « ratón » siguen.", mouse: "Ratón — al gesto", utility: "Utilitarios — al clic", seealso: "Mismos estados que z-element — pruébalos arriba.", clickState: "clic para poner este estado", promisePre: "Estados · interacción · animación: ", promiseBold: "cero JS que gestionar.", promisePost: " Escribes este HTML — y tu CSS para :state().", default: "predeterminado" }
};
const t = (k) => I18N[LANG]?.[k] ?? I18N.en[k] ?? k;
/* résout une description : string (anglais) OU { en, fr, es } → la langue courante. */
const desc = (v) => (typeof v === "string" ? v : (v && (v[LANG] || v.en || Object.values(v)[0])) || "");

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
		attributes: (api.attributes || []).map((a) => ({ name: a.name, type: { text: a.type || "string" }, description: a.description })),
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

function entrySection(d, group) {
	const sec = el("section", { class: "entry", id: d.tagName });
	sec.append(el("h2", { text: `<${d.tagName}>` }));
	sec.append(el("p", { class: "summary", text: desc(d.summary) }));
	sec.append(usageBlock(d));

	/* Le tester interactif UNE fois (le noyau) ; un composant = aperçu ; un tool = renvoi. */
	if (group === "core") sec.append(visualizer(d));
	else if (group === "components") sec.append(preview(d));
	else sec.append(el("p", { class: "seealso", text: t("seealso") }));

	if (d.attributes?.length) sec.append(heading(t("attributes")), table([t("attributes"), t("type"), t("role")],
		d.attributes.map((a) => [code(a.name), a.type?.text || "", desc(a.description)])));
	if (d.events?.length) sec.append(heading(t("events")), table([t("event"), t("role")],
		d.events.map((ev) => [code(ev.name), desc(ev.description)])));
	if (d.cssStates?.length) { sec.append(heading(t("states"))); sec.append(chips(d.cssStates.map((s) => s.name))); }
	if (d.cssProperties?.length) sec.append(heading(t("cssVars")), table([t("variable"), t("role")],
		d.cssProperties.map((v) => [code(v.name), desc(v.description)])));
	return sec;
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
function heading(text) { return el("h3", { text }); }
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
function chips(names) {
	const box = el("div", { class: "chips" });
	for (const n of names) box.append(code(n));
	return box;
}
function addLink(href) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.append(l); }
