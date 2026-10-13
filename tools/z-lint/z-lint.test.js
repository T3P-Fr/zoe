/*
	z-lint.test — les règles, sur un vocabulaire miniature puis sur le vrai zoe.json.
*/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { animationNames, buildVocabulary, levenshtein, lint, lintCss, lintHtml, nearest } from "./z-lint.rules.js";

const INDEX = {
	elements: [
		{ tag: "z-button", attributes: [{ name: "type" }, { name: "loading" }], states: ["default", "over", "press", "loading"], layers: [{ part: "background" }, { part: "infos", children: [{ part: "label" }] }], tokens: [{ name: "--z-button__background-color" }, { name: "--z-button--background__border" }], cssVars: [] },
		{ tag: "z-checkbox", attributes: [{ name: "current" }, { name: "indeterminate" }], states: ["indeterminate"], layers: [{ part: "marker", children: [{ part: "ring" }, { part: "dot" }] }], tokens: [{ name: "--z-checkbox--marker__size" }], cssVars: [] },
		{ tag: "z-channel", attributeTool: true, attributes: [{ name: "channel" }] }
	],
	globalTokens: ["--z-accent", "--z-surface", "--z-ink"],
	motion: { presets: ["pop", "shake", "ripple"] }
};
const vocabulary = buildVocabulary(INDEX);

test("levenshtein et nearest", () => {
	assert.equal(levenshtein("over", "over"), 0);
	assert.equal(levenshtein("hover", "over"), 1);
	assert.equal(nearest("hovered", ["over", "press", "loading"]), "over");
	assert.equal(nearest("releaseout", ["release", "releaseOut"]), "releaseOut");
	assert.equal(nearest("banana", ["over", "press"]), null);
});

test("html : balise inconnue, attribut inconnu, attributs globaux tolérés", () => {
	const findings = lintHtml(`<z-buton>Go</z-buton> <z-button lodaing id="a" aria-label="x" data-k="v" size="l">Ok</z-button>`, vocabulary);
	assert.deepEqual(findings.map((item) => [item.kind, item.expected]), [["unknown-tag", "<z-button>"], ["unknown-attribute", "loading"]]);
});

test("css : état inconnu, état from-*, @property déclaré", () => {
	const findings = lintCss(`
		@property --z-state__glow { syntax: "*"; inherits: false; initial-value: 0; }
		z-button:state(hovered) { color: red; }
		z-button:state(success):state(from-loading) { color: green; }
		z-button:state(glow) { color: blue; }
	`, vocabulary);
	assert.equal(findings.length, 1);
	assert.equal(findings[0].kind, "unknown-state");
	assert.equal(findings[0].expected, "z-button:state(over)");
});

test("css : les sélecteurs imbriqués héritent de la balise du bloc parent", () => {
	const findings = lintCss(`
		z-button {
			color: red;
			&:state(hovered) { color: blue; }
			> [part=labell] { font-weight: 700; }
			@media (width < 40em) { &:state(pressed) { scale: .9; } }
		}
		z-parent:state(drag) z-button:state(over) { color: green; }
	`, vocabulary);
	assert.deepEqual(findings.map((item) => [item.kind, item.expected]).sort(), [
		["unknown-part", "[part=label]"],
		["unknown-state", "z-button:state(over)"],
		["unknown-state", "z-button:state(press)"],
		["unknown-tag", null]
	]);
});

test("css : pièce inconnue, token hors grammaire, token non lu, token global proche", () => {
	const findings = lintCss(`
		z-checkbox > [part=marker] > [part=dott] { scale: 1; }
		z-button { --z-button-bg: red; --z-button__color: blue; background: var(--z-acent); }
	`, vocabulary);
	const kinds = Object.fromEntries(findings.map((item) => [item.kind, item]));
	assert.equal(kinds["unknown-part"].expected, "[part=dot]");
	assert.equal(kinds["token-grammar"].found, "--z-button-bg");
	assert.equal(kinds["token-grammar"].expected, "--z-button__background-color");
	assert.equal(kinds["unread-token"].found, "--z-button__color");
	assert.equal(kinds["unknown-global-token"].expected, "--z-accent");
});

test("animationNames : écrit à la main ou rendu par le CSSOM", () => {
	assert.deepEqual(animationNames("shake .3s"), ["shake"]);
	assert.deepEqual(animationNames("0.3s ease 0s 1 normal none running shake"), ["shake"]);
	assert.deepEqual(animationNames("pop var(--z-dur) cubic-bezier(.2, 1, .3, 1), spin 1s linear infinite"), ["pop", "spin"]);
	assert.deepEqual(animationNames("none"), []);
});

test("css : un token global de peau au préfixe d'un composant n'est pas une faute", () => {
	const vocab = buildVocabulary({ ...INDEX, globalTokens: [...INDEX.globalTokens, "--z-button-signature"] });
	assert.deepEqual(lintCss("z-button { color: var(--z-button-signature); }", vocab), []);
});

test("css : formes mortes et preset inconnu", () => {
	const findings = lintCss(`z-button::part(label) { } z-button[state="press"] { } .z-press { } z-button:state(error) { animation: shak .3s; }`, vocabulary);
	assert.equal(findings.filter((item) => item.kind === "dead-form").length, 3);
	assert.equal(findings.find((item) => item.kind === "unknown-preset").expected, "shake");
});

test("lint : dédoublonne et classe erreurs d'abord", () => {
	const findings = lint({ html: "<z-buton></z-buton><z-buton></z-buton>", css: "z-button { --z-button-bg: red; }" }, vocabulary);
	assert.equal(findings.length, 2);
	assert.equal(findings[0].level, "error");
});

test("le vrai dépôt : le CSS d'un composant ne produit aucun constat sur lui-même", async () => {
	const index = JSON.parse(await readFile(new URL("../../dist/zoe.json", import.meta.url), "utf8"));
	const real = buildVocabulary(index);
	const css = await readFile(new URL("../../components/z-checkbox/z-checkbox.css", import.meta.url), "utf8");
	const findings = lintCss(css, real).filter((item) => item.level !== "info");
	assert.deepEqual(findings, []);
});
