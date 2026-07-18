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

	/* démo live : une instance de l'élément (interactive). */
	const demo = el("div", { class: "demo" });
	const inst = document.createElement(d.tagName);
	inst.textContent = "Exemple";
	demo.append(inst);
	sec.append(demo);

	if (d.attributes?.length) sec.append(heading("Attributs"), table(["Attribut", "Type", "Rôle"],
		d.attributes.map((a) => [code(a.name), a.type?.text || "", a.description || ""])));
	if (d.events?.length) sec.append(heading("Événements"), table(["Événement", "Rôle"],
		d.events.map((ev) => [code(ev.name), ev.description || ""])));
	if (d.cssStates?.length) { sec.append(heading("États :state()")); sec.append(chips(d.cssStates.map((s) => s.name))); }
	if (d.cssProperties?.length) sec.append(heading("Variables CSS"), table(["Variable", "Rôle"],
		d.cssProperties.map((v) => [code(v.name), v.description || ""])));
	return sec;
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
