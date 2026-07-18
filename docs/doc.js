/*
	============================================================
	doc.js — LE VIEWER de la doc officielle (lit le manifeste généré)
	------------------------------------------------------------
	Il ne DÉCRIT rien à la main : il charge `dist/custom-elements.json` (produit par
	z-manifest depuis les `static api`), importe chaque module (pour que les éléments
	soient définis), et monte, pour chacun : le résumé, les tables d'API, et une DÉMO
	LIVE. Ajouter un composant → il apparaît ici tout seul, au bon format.
	============================================================
*/

import "../examples/skin-switch.js";   /* le pacte : sélecteur de peau */

const ROOT = new URL("../", import.meta.url).href;   /* …/zoé/ */

/* les états durables qu'on peut FORCER par un bouton (les autres sont interactifs). */
const DURABLE_STATES = ["current", "loading", "busy", "disabled", "error", "success"];

/* charge les presets de mouvement (les composants en ont besoin pour animer) */
addLink(`${ROOT}tools/z-motion/z-motion.css`);

const manifest = await (await fetch(`${ROOT}dist/custom-elements.json`)).json();
const entries = manifest.modules
	.map((m) => ({ path: m.path, decl: m.declarations[0] }))
	.filter((e) => e.decl && e.decl.tagName);

/* importe chaque module (définit l'élément) + injecte le CSS des composants. */
for (const { path } of entries) {
	await import(`${ROOT}${path}`);
	if (path.startsWith("components/")) addLink(`${ROOT}${path.replace(/\.js$/, ".css")}`);
}

render();

/* self-test (#selftest) : GLISSER le bouton doit poser drag puis release, et le
   bouton doit BOUGER. Les points de la liste doivent suivre. */
if (location.hash === "#selftest") {
	await new Promise((r) => requestAnimationFrame(r));
	const sec = document.getElementById("z-button");
	const inst = sec.querySelector("z-button");
	const r = inst.getBoundingClientRect();
	const send = (type, x, y) => inst.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
	const dotOn = (name) => [...sec.querySelectorAll(".viz-states li")].some((li) => li.textContent.trim() === name && li.querySelector(".dot").classList.contains("on"));
	send("pointerdown", r.left + 40, r.top + 30);
	send("pointermove", r.left + 90, r.top + 30);          /* dépasse le seuil → drag + bouge */
	const dragging = inst.matches(":state(drag)");
	const moved = inst.style.transform.includes("translate");
	const dragDot = dotOn("drag");
	send("pointerup", r.left + 90, r.top + 30);            /* dedans → release */
	await new Promise((r) => requestAnimationFrame(r));
	const released = inst.matches(":state(release)");
	const res = el("div", { text: `SELF-TEST glissé : drag=${dragging ? "✅" : "❌"} · bouge=${moved ? "✅" : "❌"} · point « drag » allumé=${dragDot ? "✅" : "❌"} · release au lâcher=${released ? "✅" : "❌"}` });
	res.style.cssText = "position:fixed;bottom:0;left:0;right:0;padding:.6rem 1rem;background:#1a1a1a;color:#fff;font:13px ui-monospace,monospace;z-index:99999";
	document.body.append(res);
}

/* ── rendu ─────────────────────────────────────────────────── */

function groupOf(path) {
	if (path.startsWith("core/")) return "noyau";
	if (path.startsWith("tools/")) return "tools";
	if (path.startsWith("components/")) return "composants";
	return "autre";
}

function render() {
	const menu = document.getElementById("menu");
	const main = document.getElementById("main");
	const groups = { noyau: [], tools: [], composants: [] };
	for (const e of entries) (groups[groupOf(e.path)] ||= []).push(e);

	for (const [name, list] of Object.entries(groups)) {
		if (!list.length) continue;
		const g = el("div", { class: "group", text: name });
		menu.append(g);
		for (const e of list) {
			menu.append(el("a", { href: `#${e.decl.tagName}`, text: `<${e.decl.tagName}>` }));
			main.append(entrySection(e.decl));
		}
	}
}

function entrySection(d) {
	const sec = el("section", { class: "entry", id: d.tagName });
	sec.append(el("h2", { text: `<${d.tagName}>` }));
	sec.append(el("p", { class: "summary", text: d.summary || "" }));

	/* VISUALISEUR D'ÉTATS : l'instance vivante + toutes ses chips (qui s'allument en
	   direct) + des boutons pour FORCER les états durables. La démo que Christophe adore,
	   rendue générique par le manifeste. */
	sec.append(visualizer(d));

	if (d.attributes?.length) sec.append(heading("Attributs"), table(["Attribut", "Type", "Rôle"],
		d.attributes.map((a) => [code(a.name), a.type?.text || "", a.description || ""])));
	if (d.events?.length) sec.append(heading("Événements"), table(["Événement", "Rôle"],
		d.events.map((ev) => [code(ev.name), ev.description || ""])));
	if (d.cssStates?.length) { sec.append(heading("États :state()")); sec.append(chips(d.cssStates.map((s) => s.name))); }
	if (d.cssProperties?.length) sec.append(heading("Variables CSS"), table(["Variable", "Rôle"],
		d.cssProperties.map((v) => [code(v.name), v.description || ""])));
	return sec;
}

/*
	Le VISUALISEUR d'états, générique : une instance vivante + la rangée de TOUTES ses
	chips (allumées en direct via l'événement z-state) + des boutons pour forcer les
	états durables. Survole/presse l'instance → les chips d'interaction s'allument.
*/
/*
	Le VISUALISEUR : un gros « Testez-moi », DRAGUABLE pour de vrai (il bouge à la
	souris → déclenche naturellement press/drag/release/releaseOut), et une liste
	d'états à côté, chacun avec un POINT qui s'allume quand l'état est actif. On teste
	au doigt, les points suivent — pas de forçage au clavier.
*/
function visualizer(d) {
	const box = el("div", { class: "viz" });
	const stage = el("div", { class: "viz-stage" });
	const inst = document.createElement(d.tagName);
	inst.className = "viz-instance";
	inst.textContent = "Testez-moi";
	stage.append(inst);

	/* DRAGUABLE POUR DE VRAI : on suit le pointeur (API pointer). z-element pose ses
	   états tout seul (press → drag → release/releaseOut) ; ici on ne fait que bouger. */
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
		base.x += e.clientX - start.x; base.y += e.clientY - start.y; start = null;
	};
	inst.addEventListener("pointerup", drop);
	inst.addEventListener("pointercancel", drop);

	/* La liste d'états : un point + le nom. Le point s'allume quand l'état est actif. */
	const list = el("ul", { class: "viz-states" });
	const dots = new Map();
	for (const s of d.cssStates || []) {
		const li = document.createElement("li");
		const dot = el("span", { class: "dot" });
		li.append(dot, document.createTextNode(s.name));
		list.append(li);
		dots.set(s.name, dot);
	}
	const light = (active) => { const set = new Set(active); for (const [name, dot] of dots) dot.classList.toggle("on", set.has(name)); };
	inst.addEventListener("z-state", (e) => light(e.detail.states));
	requestAnimationFrame(() => light(inst.states || []));

	stage.append(el("p", { class: "viz-hint", text: "Survole, presse, GLISSE-le (lâche dedans / dehors) — les points suivent." }));
	box.append(stage, list);
	return box;
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
function heading(t) { return el("h3", { text: t }); }
function code(t) { const c = el("code", { text: t }); return c; }
function table(head, rows) {
	const t = document.createElement("table");
	const thead = document.createElement("tr");
	for (const h of head) thead.append(el("th", { text: h }));
	t.append(thead);
	for (const row of rows) {
		const tr = document.createElement("tr");
		for (const cell of row) { const td = document.createElement("td"); td.append(cell instanceof Node ? cell : document.createTextNode(cell)); tr.append(td); }
		t.append(tr);
	}
	return t;
}
function chips(names) {
	const box = el("div", { class: "chips" });
	for (const n of names) box.append(code(n));
	return box;
}
function addLink(href) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.append(l); }
