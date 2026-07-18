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

/* Les deux familles d'états, testées différemment. */
const MOUSE = ["over", "press", "release", "releaseOut", "drag", "focus"];       /* au geste */
const UTILITY = ["current", "loading", "busy", "disabled", "error", "success"]; /* au clic (une app les pose) */

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
	const sec = document.getElementById("z-element");   /* le tester est sur la base, une seule fois */
	const inst = sec.querySelector(".viz-instance");
	const r = inst.getBoundingClientRect();
	const send = (type, x, y) => inst.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1 }));
	const rowOn = (name) => [...sec.querySelectorAll(".viz-row")].some((li) => li.textContent.trim() === name && li.querySelector(".dot").classList.contains("on"));
	const stage = inst.parentElement;
	const sr = stage.getBoundingClientRect();
	send("pointerdown", r.left + 40, r.top + 30);
	send("pointermove", r.left + 90, r.top + 30);          /* dépasse le seuil → drag + bouge */
	const dragging = inst.matches(":state(drag)");
	const moved = inst.style.transform.includes("translate");
	const dragDot = rowOn("drag");
	send("pointerup", sr.right + 300, sr.bottom + 300);    /* DEHORS la zone → releaseOut + retour */
	await new Promise((r) => requestAnimationFrame(r));
	const releasedOut = inst.matches(":state(releaseOut)");
	const back = (inst.style.transform || "") === "";
	/* utilitaire : clic sur la ligne « loading » → :state(loading) + point allumé */
	[...sec.querySelectorAll(".viz-row.clickable")].find((b) => b.textContent.trim() === "loading")?.click();
	await new Promise((r) => requestAnimationFrame(r));
	const util = inst.matches(":state(loading)") && rowOn("loading");
	const res = el("div", { text: `SELF-TEST : drag=${dragging ? "✅" : "❌"} · bouge=${moved ? "✅" : "❌"} · releaseOut(dehors)=${releasedOut ? "✅" : "❌"} · retour centre=${back ? "✅" : "❌"} · utilitaire(clic loading)=${util ? "✅" : "❌"}` });
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
			main.append(entrySection(e.decl, name));
		}
	}
}

function entrySection(d, group) {
	const sec = el("section", { class: "entry", id: d.tagName });
	sec.append(el("h2", { text: `<${d.tagName}>` }));
	sec.append(el("p", { class: "summary", text: d.summary || "" }));
	sec.append(usageBlock(d));

	/* Le TESTER interactif (Testez-moi + les 2 familles) UNE SEULE fois, sur la base
	   (le noyau, là où vivent les états). Un composant montre juste un aperçu stylé ;
	   un tool renvoie à la base (mêmes états). Fini les 3 démos identiques. */
	if (group === "noyau") sec.append(visualizer(d));
	else if (group === "composants") sec.append(preview(d));
	else sec.append(el("p", { class: "seealso", text: "Mêmes états que z-element — teste-les là-haut." }));

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
		const dx = e.clientX - start.x, dy = e.clientY - start.y;
		start = null;
		/* dedans/dehors = par rapport à la ZONE (pas au bouton, qui suit le pointeur). */
		const sr = stage.getBoundingClientRect();
		const inStage = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
		if (inStage) {
			base.x += dx; base.y += dy;   /* reste où on l'a lâché (release, posé par z-element) */
		} else {
			/* dehors → on RAMÈNE au milieu, et on force releaseOut (z-element croyait « dedans »). */
			inst.style.transform = ""; base.x = 0; base.y = 0;
			inst.setState?.("release", false); inst.setState?.("over", false);
			inst.setState?.("releaseOut", true);
			setTimeout(() => inst.setState?.("releaseOut", false), 450);
		}
	};
	inst.addEventListener("pointerup", drop);
	inst.addEventListener("pointercancel", drop);

	/*
		DEUX FAMILLES, deux façons de tester :
		 · SOURIS (au geste) : points qui s'allument quand tu manipules le bouton ;
		 · UTILITAIRES (au clic) : aucune souris ne les pose → la LIGNE est cliquable.
	*/
	const has = new Set((d.cssStates || []).map((s) => s.name));
	const dots = new Map();
	const panel = el("div", { class: "viz-panel" });
	panel.append(group("Souris — au geste", MOUSE.filter((n) => has.has(n)), false, inst, dots));
	panel.append(group("Utilitaires — au clic", UTILITY.filter((n) => has.has(n)), true, inst, dots));

	const light = (active) => { const set = new Set(active); for (const [name, dot] of dots) dot.classList.toggle("on", set.has(name)); };
	inst.addEventListener("z-state", (e) => light(e.detail.states));
	requestAnimationFrame(() => light(inst.states || []));

	stage.append(el("p", { class: "viz-hint", text: "Survole, presse, GLISSE-le (lâche dedans / dehors) — les points « souris » suivent." }));
	box.append(stage, panel);
	return box;
}

/* Un groupe d'états : un titre + des lignes (point + nom). Cliquable = on force l'état
   (les utilitaires, qu'aucune souris ne déclenche). Read-only = simple indicateur. */
function group(title, names, clickable, inst, dots) {
	const g = el("div", { class: "viz-group" });
	g.append(el("p", { class: "viz-group-title", text: title }));
	for (const name of names) {
		const row = el(clickable ? "button" : "div", { class: `viz-row${clickable ? " clickable" : ""}` });
		const dot = el("span", { class: "dot" });
		row.append(dot, document.createTextNode(name));
		if (clickable) { row.title = "clique pour poser cet état"; row.addEventListener("click", () => inst.toggleState?.(name)); }
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
	promise.append(document.createTextNode("États · interaction · animation : "));
	promise.append(el("b", { text: "zéro JS à gérer." }));
	promise.append(document.createTextNode(" Tu écris ce HTML — et ton CSS pour :state()."));
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
		inst.textContent = s || "défaut";
		box.append(inst);
	}
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
