/*
	z-manifest.test — les fonctions pures du générateur, et un scan réel du dépôt.
	`node --test` les trouve seul (suffixe .test.js). Le scan réel est le test qui
	compte : il prouve que chaque module s'importe en Node avec le shim et porte une api.
*/
import { test } from "node:test";
import assert from "node:assert/strict";
import {
	pickText, parseUnionType, attributeValues, extractTokens, parseRootTokens, braceBlock,
	extractKeyframes, regenerateVariantLists, regenerateReadmeTable, scanRepository, toManifest, toVscode, toLlms
} from "./z-manifest.lib.js";

test("pickText : chaîne = anglais, objet = langue demandée, repli sur en", () => {
	assert.equal(pickText("plain"), "plain");
	assert.equal(pickText({ en: "hello", fr: "bonjour" }, "fr"), "bonjour");
	assert.equal(pickText({ en: "hello" }, "es"), "hello");
	assert.equal(pickText(undefined), "");
});

test("parseUnionType : une union de littéraux devient des valeurs", () => {
	assert.deepEqual(parseUnionType("\"submit\" | \"reset\" | \"button\""), ["submit", "reset", "button"]);
	assert.deepEqual(parseUnionType("'horizontal' | 'vertical'"), ["horizontal", "vertical"]);
	assert.deepEqual(parseUnionType("boolean | number"), ["boolean", "number"]);
	assert.deepEqual(parseUnionType("string"), []);
	assert.deepEqual(parseUnionType(undefined), []);
});

test("attributeValues : déclarées d'abord, sinon déduites du type", () => {
	const declared = attributeValues({ values: [{ value: "none", note: { en: "off" }, default: true }, "auto"] });
	assert.equal(declared.length, 2);
	assert.equal(declared[0].default, true);
	assert.equal(declared[1].value, "auto");
	assert.deepEqual(attributeValues({ type: "\"a\" | \"b\"" }).map((value) => value.value), ["a", "b"]);
});

test("extractTokens : les tokens du pacte d'un composant, part et propriété séparés", () => {
	const css = `
		z-checkbox { gap: var(--z-checkbox__gap, .5em); }
		z-checkbox > z-layer[part="marker"] { background: var(--z-checkbox--marker__background, var(--z-surface)); }
		z-checkbox:state(current) > [part=dot] { scale: var(--z-checkbox--dot__bar-scale, .28); }
		z-checkbox-group { gap: var(--z-checkbox-group__gap); } /* un autre composant : ignoré */
	`;
	const tokens = extractTokens(css, "z-checkbox");
	assert.deepEqual(tokens.map((token) => token.name), ["--z-checkbox--dot__bar-scale", "--z-checkbox--marker__background", "--z-checkbox__gap"]);
	assert.deepEqual(tokens[1], { name: "--z-checkbox--marker__background", part: "marker", property: "background" });
	assert.equal(tokens[2].part, null);
});

test("parseRootTokens : lit chaque :root, ignore les commentaires et les règles de composant", () => {
	const css = `
		/* --z-fake: in a comment; */
		:root { --z-accent: #006eff; --z-font: "IBM Plex Mono", monospace; }
		z-button { --z-button__color: red; }
		:root { --z-radius: 2px; }
	`;
	assert.deepEqual(parseRootTokens(css), { "--z-accent": "#006eff", "--z-font": "\"IBM Plex Mono\", monospace", "--z-radius": "2px" });
});

test("braceBlock : accolades imbriquées", () => {
	const text = "a { b { c } d } e";
	assert.equal(braceBlock(text, text.indexOf("{")), " b { c } d ");
});

test("extractKeyframes : les presets", () => {
	assert.deepEqual(extractKeyframes("@keyframes pop {} @keyframes slideUp {}"), ["pop", "slideUp"]);
});

test("regenerateVariantLists : chaque :is/:where(z-element, …) reçoit la liste complète", () => {
	const index = { elements: [{ kind: "components", tag: "z-button" }, { kind: "tools", tag: "z-pointer" }, { kind: "components", tag: "z-card" }] };
	const css = ":where(z-element, z-old) { a: b } :is(z-element, z-old)[size=\"l\"] { c: d }";
	const out = regenerateVariantLists(css, index);
	assert.equal(out, ":where(z-element, z-button, z-card, z-cursor) { a: b } :is(z-element, z-button, z-card, z-cursor)[size=\"l\"] { c: d }");
});

test("regenerateReadmeTable : remplit entre les marqueurs, laisse le reste", () => {
	const index = { elements: [{ kind: "components", tag: "z-button", attributeTool: false, summary: { en: "A button" }, paths: { doc: "components/z-button/z-button.doc.md", demo: null, lab: null } }] };
	const readme = "# Zoé\n<!-- zoe:elements -->\nold\n<!-- /zoe:elements -->\nend";
	const out = regenerateReadmeTable(readme, index);
	assert.match(out, /\| `<z-button>` \| A button \| \[doc\]\(components\/z-button\/z-button\.doc\.md\) \|/);
	assert.ok(out.startsWith("# Zoé\n<!-- zoe:elements -->"));
	assert.ok(out.endsWith("<!-- /zoe:elements -->\nend"));
	assert.equal(regenerateReadmeTable("no markers", index), "no markers");
});

test("scanRepository : chaque module du dépôt s'importe et porte une api", async () => {
	const { index } = await scanRepository({ version: "test" });
	const tags = index.elements.map((entry) => entry.tag);
	for (const expected of ["z-element", "z-layer", "z-button", "z-checkbox", "z-channel", "z-contact"]) assert.ok(tags.includes(expected), `${expected} manque`);
	assert.equal(new Set(tags).size, tags.length, "deux éléments portent la même balise");
	const button = index.elements.find((entry) => entry.tag === "z-button");
	assert.equal(button.kind, "components");
	assert.ok(button.paths.css && button.paths.doc && button.paths.demo, "z-button doit avoir css + doc + demo");
	assert.ok(button.tokens.some((token) => token.name.startsWith("--z-button")), "les tokens du CSS sont extraits");
	assert.ok(index.skins.length >= 2, "au moins deux peaux");
	assert.ok(index.skins.every((skin) => skin.tokens["--z-accent"]), "chaque peau pose --z-accent");
	assert.ok(index.motion.presets.includes("pop"));

	const manifest = toManifest(index);
	assert.equal(manifest.schemaVersion, "1.0.0");
	assert.ok(manifest.modules.every((module) => module.declarations[0].tagName));

	const vscode = toVscode(index);
	assert.ok(vscode.tags.find((tag) => tag.name === "z-button").attributes.some((attribute) => attribute.name === "size"), "les variants du socle sont proposés");

	const llms = toLlms(index, "# grammar");
	assert.match(llms, /^# Zoé/);
	assert.match(llms, /### <z-button>/);
});
