/*
	============================================================
	skin-switch — le PACTE : un <select> de peau, en haut à droite
	------------------------------------------------------------
	Sur toute page de démo/test : un sélecteur qui bascule la peau (claude ↔ hightech
	↔ …). Il éprouve la SOLIDITÉ du concept — un composant qui casse au changement de
	skin se voit à l'instant. Il append son propre <link> de thème EN DERNIER (gagne la
	cascade) et mémorise le choix (localStorage).

	Usage : `import "…/examples/skin-switch.js";` en tête du script d'une page.
	Ajouter une peau = une entrée dans SKINS.
	============================================================
*/

/* HighTech EN TÊTE, donc par défaut (2026-07-21) : c'est la peau de référence, celle qui
   doit finir identique à la planche d'origine. Une démo s'ouvre sur elle ; Claude est la
   contre-épreuve qu'on va chercher. */
import { syncContactEffectFromSkin } from "../tools/z-contact/z-contact-effect.js";

const SKINS = [
	{ id: "hightech", label: "HighTech — la planche" },
	{ id: "claude", label: "Claude — encre chaude" }
];
const KEY = "zoe-skin";
/* profondeur : depuis examples/ ou un dossier de composant, on remonte à la racine puis skins/. */
const ROOT = new URL("../", import.meta.url).href;   /* …/zoé/ */

/* priorité : ?skin= (deep-link, comme ?lang=) > choix mémorisé > 1re peau. */
const forced = new URLSearchParams(location.search).get("skin");
const saved = localStorage.getItem(KEY);
const current = SKINS.some((s) => s.id === forced) ? forced
	: SKINS.some((s) => s.id === saved) ? saved
	: SKINS[0].id;

const link = document.createElement("link");
link.rel = "stylesheet";
link.id = "zoe-skin";
const href = (id) => `${ROOT}skins/${id}/${id}.css`;
link.href = href(current);
/* Quand la peau (re)charge, on resynchronise l'effet de clic : la nouvelle peau tue et
   remplace l'effet de l'ancienne (un seul lien d'effet, jamais deux). */
link.addEventListener("load", syncContactEffectFromSkin);
document.head.append(link);

function mount() {
	const box = document.createElement("div");
	box.style.cssText = [
		"position:fixed", "top:.6rem", "right:.6rem", "z-index:99999",
		"display:flex", "align-items:center", "gap:.5rem",
		"padding:.35rem .5rem .35rem .7rem", "border-radius:9px",
		"background:rgba(24,20,17,.92)", "color:#f3ece0",
		"font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace",
		"box-shadow:0 4px 14px rgba(0,0,0,.25)"
	].join(";");
	const label = document.createElement("span");
	label.textContent = "peau"; label.style.cssText = "opacity:.7;text-transform:uppercase;letter-spacing:.1em";
	const select = document.createElement("select");
	select.setAttribute("aria-label", "Changer la peau");
	select.style.cssText = "font:inherit;color:#fff;background:#2a2320;border:1px solid #4a4038;border-radius:6px;padding:.35rem .5rem;cursor:pointer";
	for (const s of SKINS) {
		const o = document.createElement("option");
		o.value = s.id; o.textContent = s.label; select.append(o);
	}
	select.value = current;
	select.addEventListener("change", () => { link.href = href(select.value); localStorage.setItem(KEY, select.value); });
	box.append(label, select);
	document.body.append(box);
}
if (document.body) mount(); else window.addEventListener("DOMContentLoaded", mount);
