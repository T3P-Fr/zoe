/*
	============================================================
	z-manifest.lib — la BIBLIOTHÈQUE du générateur (fonctions pures + lecture du dépôt)
	------------------------------------------------------------
	UNE source — le bloc `static api` de chaque élément, le CSS qu'il embarque, les
	fichiers qui l'accompagnent — et PLUSIEURS sorties, toutes dérivées d'ici :

	  dist/zoe.json                       l'index complet (multilingue) : ce que lisent
	                                      la doc, l'accueil et le serveur MCP
	  dist/custom-elements.json           Custom Elements Manifest (standard, anglais)
	  dist/vscode.html-custom-data.json   autocomplétion + survol dans VSCode
	  llms.txt · llms-full.txt            la référence pour les IA (racine, convention
	                                      llmstxt.org)
	  core/z-element/z-element.css        les listes de balises des variants (régénérées)
	  README.md                           la table des éléments (entre marqueurs)

	Ce fichier ne touche PAS au disque en sortie : il lit, il calcule, il rend des
	chaînes. L'écriture est dans z-manifest.js (la commande) — c'est ce qui rend tout
	ceci testable avec `node --test`, sans effet de bord.

	Styleguide tool.manifest
	============================================================
*/

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
export const SCAN_DIRS = ["core", "tools", "components"];
export const LANGS = ["en", "fr", "es"];

/* ── Multilingue ───────────────────────────────────────────── */

/*
	Une description est une chaîne (anglais) OU un objet { en, fr, es }. On choisit la
	langue demandée et on retombe sur l'anglais, puis sur la première traduction trouvée.
	@param {string|Record<string,string>|undefined} value
	@param {string} [lang]
	@returns {string}
*/
export function pickText(value, lang = "en") {
	if (typeof value === "string") return value;
	if (!value) return "";
	return value[lang] || value.en || Object.values(value)[0] || "";
}

/*
	Normalise une description vers l'objet multilingue complet, pour que zoe.json ait
	toujours la même forme (une chaîne seule est de l'anglais).
	@param {string|Record<string,string>|undefined} value
	@returns {Record<string,string>}
*/
export function toLangs(value) {
	if (typeof value === "string") return { en: value };
	if (!value) return {};
	return value;
}

/* ── Types d'attributs ─────────────────────────────────────── */

/*
	Un `type` écrit en union de littéraux (`"a" | "b"`, `'x' | 'y'`) devient une liste de
	valeurs pour l'autocomplétion. Tout autre type (string, number, boolean) rend [].
	@param {string|undefined} type
	@returns {string[]}
*/
export function parseUnionType(type) {
	if (!type || !type.includes("|")) return [];
	const values = type.split("|").map((part) => part.trim().replace(/^["']|["']$/g, ""));
	return values.every((value) => /^[\w-]+$/.test(value)) ? values : [];
}

/*
	Les valeurs d'un attribut, sous UNE forme : [{ value, note, default }]. Elles viennent
	soit de `values` (déclaré), soit du type-union.
	@param {{ type?: string, values?: Array<string|{value:string,note?:any,default?:boolean}>|null }} attribute
	@returns {{ value: string, note: Record<string,string>, default: boolean }[]}
*/
export function attributeValues(attribute) {
	const declared = attribute.values || [];
	if (declared.length) {
		return declared.map((item) => (typeof item === "string"
			? { value: item, note: {}, default: false }
			: { value: item.value, note: toLangs(item.note), default: Boolean(item.default) }));
	}
	return parseUnionType(attribute.type).map((value) => ({ value, note: {}, default: false }));
}

/* ── Tokens CSS ────────────────────────────────────────────── */

/*
	Les tokens du PACTE que consomme un composant, lus dans SON CSS :
	`--z-{tag}[--{part}]__{prop}`. On ne devine rien : si le CSS les lit, ils existent.
	@param {string} css   le contenu de z-x.css
	@param {string} tag   la balise (z-checkbox)
	@returns {{ name: string, part: string|null, property: string }[]} triés, uniques
*/
export function extractTokens(css, tag) {
	const pattern = new RegExp(`--${escapeRegExp(tag)}(--[a-z0-9]+(?:-[a-z0-9]+)*)?__([a-z0-9]+(?:-[a-z0-9]+)*)`, "g");
	const found = new Map();
	for (const match of css.matchAll(pattern)) {
		const name = match[0];
		if (!found.has(name)) found.set(name, { name, part: match[1] ? match[1].slice(2) : null, property: match[2] });
	}
	/* Tri par points de code (pas localeCompare, qui néglige la ponctuation) : les tokens
	   à part (`--z-x--part__…`) viennent avant ceux de l'hôte (`--z-x__…`), stable partout. */
	return [...found.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/*
	Les tokens posés sur `:root` par une peau : { "--z-accent": "#006eff", … }. On lit
	chaque bloc `:root { … }` du fichier (une peau peut en avoir plusieurs) ; les
	déclarations hors :root (règles de composant) ne sont pas des tokens de fondation.
	@param {string} css
	@returns {Record<string,string>}
*/
export function parseRootTokens(css) {
	const tokens = {};
	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
	let index = 0;
	while ((index = stripped.indexOf(":root", index)) !== -1) {
		const open = stripped.indexOf("{", index);
		if (open === -1) break;
		const block = braceBlock(stripped, open);
		for (const match of block.matchAll(/(--z-[\w-]+)\s*:\s*([^;]+);/g)) {
			tokens[match[1]] = match[2].trim().replace(/\s+/g, " ");
		}
		index = open + block.length;
	}
	return tokens;
}

/*
	Le contenu d'un bloc `{ … }` à partir de son accolade ouvrante, accolades imbriquées
	comprises (le CSS moderne imbrique).
	@param {string} text
	@param {number} openIndex  position du `{`
	@returns {string} le texte ENTRE les accolades
*/
export function braceBlock(text, openIndex) {
	let depth = 0;
	for (let i = openIndex; i < text.length; i++) {
		if (text[i] === "{") depth++;
		else if (text[i] === "}" && --depth === 0) return text.slice(openIndex + 1, i);
	}
	return text.slice(openIndex + 1);
}

/* Les noms des @keyframes d'une feuille (les presets de z-motion). @param {string} css @returns {string[]} */
export function extractKeyframes(css) {
	return [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
}

/* @param {string} value @returns {string} */
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ── Lecture du dépôt ──────────────────────────────────────── */

/*
	MINI-SHIM : de quoi importer un custom element en Node. `static api` ne touche rien de
	tout ça — ces stubs servent à ce que `class X extends HTMLElement` et
	`customElements.define(...)` ne plantent pas à l'import. Tout ce qui est instance
	(attachInternals, observers) n'est évalué qu'à la construction, jamais ici.
*/
export function installShim() {
	if (globalThis.__zoeShim) return;
	globalThis.__zoeShim = true;
	globalThis.HTMLElement = class HTMLElement {};
	const registry = new Map();
	globalThis.customElements = {
		get: (name) => registry.get(name),
		define: (name, ctor) => registry.set(name, ctor),
		whenDefined: () => Promise.resolve()
	};
	const noop = () => {};
	globalThis.window = globalThis;
	globalThis.document = {
		styleSheets: [],
		readyState: "complete",
		addEventListener: noop,
		removeEventListener: noop,
		querySelectorAll: () => [],
		querySelector: () => null,
		documentElement: { style: { setProperty: noop, removeProperty: noop } },
		body: null
	};
	globalThis.getComputedStyle = () => ({ getPropertyValue: () => "" });
	globalThis.CSSPropertyRule = class CSSPropertyRule {};
	globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
	globalThis.cancelAnimationFrame = clearTimeout;
	globalThis.MutationObserver ??= class { observe() {} disconnect() {} };
	globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
	globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} };
	globalThis.matchMedia ??= () => ({ matches: false, addEventListener: noop, removeEventListener: noop });
}

/*
	Les modules candidats : <dir>/<name>/<name>.js. Un dossier sans module principal
	(z-motion, qui n'est que du CSS) est rendu quand même, sans `file` — il a une
	fiche, pas de classe.
	@returns {Promise<{ dir: string, name: string, file: string|null }[]>}
*/
export async function findModules() {
	const modules = [];
	for (const dir of SCAN_DIRS) {
		const base = join(ROOT, dir);
		if (!existsSync(base)) continue;
		for (const name of (await readdir(base)).sort()) {
			if (!name.startsWith("z-")) continue;
			const file = join(base, name, `${name}.js`);
			modules.push({ dir, name, file: existsSync(file) ? file : null });
		}
	}
	return modules;
}

/*
	L'API d'un module : le premier export porteur d'un `static api` (une classe), sinon
	un export nommé `api` (un outil-attribut comme z-channel, qui n'a pas de balise).
	@param {string} file
	@returns {Promise<{ api: object, className: string }|null>}
*/
export async function readApi(file) {
	const mod = await import(pathToFileURL(file).href);
	for (const [name, value] of Object.entries(mod)) {
		if (typeof value === "function" && value.api?.tag) return { api: value.api, className: name };
	}
	if (mod.api?.tag) return { api: mod.api, className: mod.api.tag };
	return null;
}

/*
	Les fichiers qui accompagnent un élément, par existence sur le disque : on n'inscrit
	rien à la main, on constate. Chemins relatifs à la racine, séparateur `/`.
	@param {string} dir @param {string} name
	@returns {Record<string, string|null>}
*/
export function companionPaths(dir, name) {
	const base = `${dir}/${name}/${name}`;
	const maybe = (suffix) => (existsSync(join(ROOT, `${base}${suffix}`)) ? `${base}${suffix}` : null);
	return { js: maybe(".js"), css: maybe(".css"), doc: maybe(".doc.md"), demo: maybe(".demo.html"), lab: maybe(".lab.html") };
}

/*
	Normalise une api brute vers la fiche de zoe.json : tout multilingue est un objet,
	toute liste existe (vide au besoin), les états sont des objets { name, description }.
	@param {object} api
	@param {{ dir: string, name: string, className: string, paths: object, css: string }} context
	@returns {object}
*/
export function toEntry(api, { dir, name, className, paths, css }) {
	const states = (api.states || []).map((state) => (typeof state === "string"
		? { name: state, description: {} }
		: { name: state.name, description: toLangs(state.description) }));
	return {
		tag: api.tag,
		kind: dir,
		className,
		attributeTool: Boolean(api.attributeTool),
		summary: toLangs(api.summary),
		example: typeof api.example === "string" && !api.example.endsWith(".html") ? api.example : "",
		paths,
		attributes: (api.attributes || []).map((attribute) => ({
			name: attribute.name,
			type: attribute.type || (attribute.values?.length ? "enum" : "string"),
			values: attributeValues(attribute),
			description: toLangs(attribute.description)
		})),
		events: (api.events || []).map((event) => ({ name: event.name, description: toLangs(event.description) })),
		states,
		layers: normalizeLayers(api.layers),
		cssVars: (api.cssVars || []).map((variable) => ({
			name: variable.name,
			description: toLangs(variable.description),
			...(variable.min !== undefined ? { min: variable.min, max: variable.max, step: variable.step } : {})
		})),
		tokens: css ? extractTokens(css, api.tag) : [],
		members: (api.members || []).map((member) => ({
			kind: member.kind || "method",
			name: member.name,
			type: member.type || "",
			description: toLangs(member.description)
		})),
		name
	};
}

/* @param {any[]|undefined} layers @returns {object[]} */
function normalizeLayers(layers) {
	return (layers || []).map((layer) => ({
		part: layer.part,
		optional: Boolean(layer.optional),
		description: toLangs(layer.description),
		children: normalizeLayers(layer.children)
	}));
}

/*
	Lit TOUT le dépôt et rend l'index : éléments, peaux, presets de mouvement, tokens
	globaux. C'est l'objet que zoe.json sérialise, et que toutes les autres sorties
	dérivent.
	@param {{ version?: string }} [options]
	@returns {Promise<{ index: object, warnings: string[] }>}
*/
export async function scanRepository({ version = "0.0.0" } = {}) {
	installShim();
	const warnings = [];
	const elements = [];

	for (const { dir, name, file } of await findModules()) {
		const paths = companionPaths(dir, name);
		const css = paths.css ? await readFile(join(ROOT, paths.css), "utf8") : "";
		if (!file) {
			/* un outil sans module (z-motion) : une fiche réduite, lue dans son CSS. Un dossier
			   vide (ni .js ni .css) n'est rien du tout : on le dit, on ne l'invente pas. */
			if (css) elements.push(cssOnlyEntry(dir, name, paths, css));
			else warnings.push(`${dir}/${name} : dossier sans module ni CSS — ignoré`);
			continue;
		}
		/* Un module qui ne s'importe pas (syntaxe, import cassé, travail en cours) n'arrête
		   pas la génération des autres : il est dit, et il manque — c'est le rouge qui décide. */
		let read = null;
		try { read = await readApi(file); }
		catch (error) { warnings.push(`${dir}/${name} : le module ne s'importe pas — ${error.message.split("\n")[0]}`); continue; }
		if (!read) { warnings.push(`${dir}/${name} : aucun \`static api\` (ni export \`api\`) — absent du manifeste`); continue; }
		const entry = toEntry(read.api, { dir, name, className: read.className, paths, css });
		warnings.push(...validateEntry(entry));
		elements.push(entry);
	}

	const skins = await readSkins();
	const motionCss = existsSync(join(ROOT, "tools/z-motion/z-motion.css")) ? await readFile(join(ROOT, "tools/z-motion/z-motion.css"), "utf8") : "";
	const globalTokens = [...new Set(skins.flatMap((skin) => Object.keys(skin.tokens)))].sort();

	const index = {
		name: "Zoé",
		version,
		generated: new Date().toISOString().slice(0, 10),
		grammar: "docs/GRAMMAR.md",
		elements,
		skins,
		motion: { presets: extractKeyframes(motionCss) },
		globalTokens
	};
	return { index, warnings };
}

/* Une fiche pour un outil 100 % CSS (z-motion) : pas de balise, ses presets comme vocabulaire. */
function cssOnlyEntry(dir, name, paths, css) {
	return {
		tag: name,
		kind: dir,
		className: null,
		attributeTool: true,
		summary: {
			en: "Shared @keyframes presets — attach them to any state: `animation: pop var(--z-dur) var(--z-ease)`.",
			fr: "Les @keyframes partagés — à brancher sur n'importe quel état : `animation: pop var(--z-dur) var(--z-ease)`.",
			es: "Los @keyframes compartidos — para cualquier estado: `animation: pop var(--z-dur) var(--z-ease)`."
		},
		example: "z-button:state(error) { animation: shake var(--z-dur) var(--z-ease); }",
		paths,
		attributes: [], events: [], states: [], layers: [], cssVars: [], members: [],
		tokens: [],
		presets: extractKeyframes(css),
		name
	};
}

/*
	Les peaux : un dossier skins/<id>/<id>.css, ses tokens de :root, sa doc, sa planche.
	@returns {Promise<object[]>}
*/
export async function readSkins() {
	const base = join(ROOT, "skins");
	if (!existsSync(base)) return [];
	const skins = [];
	for (const id of (await readdir(base, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
		const cssPath = `skins/${id}/${id}.css`;
		if (!existsSync(join(ROOT, cssPath))) continue;
		const css = await readFile(join(ROOT, cssPath), "utf8");
		const tokens = parseRootTokens(css);
		const maybe = (suffix) => (existsSync(join(ROOT, `skins/${id}/${id}${suffix}`)) ? `skins/${id}/${id}${suffix}` : null);
		skins.push({
			id,
			name: (tokens["--z-skin-name"] || id).replace(/^"|"$/g, ""),
			source: (tokens["--z-skin-source"] || "").replace(/^"|"$/g, "") || null,
			paths: { css: cssPath, doc: maybe(".doc.md"), demo: maybe(".demo.html") },
			tokens
		});
	}
	return skins;
}

/*
	LE ROUGE DÉCIDE : ce qu'une fiche doit porter pour être publiable. Chaque manque est
	une phrase, pas un code — on la lit, on sait quoi faire.
	@param {object} entry
	@returns {string[]}
*/
export function validateEntry(entry) {
	const where = `<${entry.tag}>`;
	const problems = [];
	for (const lang of LANGS) if (!entry.summary[lang]) problems.push(`${where} : summary.${lang} manquant`);
	if (!entry.example) problems.push(`${where} : \`example\` manquant (le HTML canonique, une chaîne)`);
	for (const attribute of entry.attributes) {
		if (!attribute.name) problems.push(`${where} : un attribut sans nom`);
		else if (!pickText(attribute.description) && !attribute.values.some((value) => pickText(value.note))) problems.push(`${where} : attribut \`${attribute.name}\` sans description`);
	}
	for (const event of entry.events) if (!pickText(event.description)) problems.push(`${where} : événement \`${event.name}\` sans description`);
	const walk = (layers, trail) => {
		for (const layer of layers) {
			if (!layer.part) problems.push(`${where} : un calque sans \`part\``);
			else if (!pickText(layer.description)) problems.push(`${where} : calque \`${trail}${layer.part}\` sans description`);
			walk(layer.children, `${trail}${layer.part} › `);
		}
	};
	walk(entry.layers, "");
	for (const variable of entry.cssVars) if (!pickText(variable.description)) problems.push(`${where} : variable \`${variable.name}\` sans description`);
	if (entry.kind === "components") {
		for (const [key, label] of [["css", "z-x.css"], ["doc", "z-x.doc.md"], ["demo", "z-x.demo.html"]]) {
			if (!entry.paths[key]) problems.push(`${where} : ${label} manquant (le contrat d'un composant : .js · .css · .doc.md · .demo.html)`);
		}
	}
	return problems;
}

/* ── Les sorties ───────────────────────────────────────────── */

/*
	Custom Elements Manifest (schéma 1.0, étendu des `cssStates` de la 2.x) — anglais,
	la langue publiée. Les calques deviennent des `cssParts` (le mot du standard), les
	tokens du pacte rejoignent `cssProperties`.
	@param {object} index
	@returns {object}
*/
export function toManifest(index) {
	const elements = index.elements.filter((entry) => entry.className);
	return {
		schemaVersion: "1.0.0",
		readme: "README.md",
		modules: elements.map((entry) => ({
			kind: "javascript-module",
			path: entry.paths.js,
			description: `Generated by scripts/z-manifest from the \`static api\` of ${entry.className}. Do not edit by hand.`,
			declarations: [{
				kind: "class",
				name: entry.className,
				tagName: entry.tag,
				customElement: true,
				summary: pickText(entry.summary),
				description: entry.example ? `Example:\n\n${entry.example}` : undefined,
				attributes: entry.attributes.map((attribute) => ({
					name: attribute.name,
					type: { text: attribute.type },
					description: describeAttribute(attribute, "en"),
					...(attribute.values.find((value) => value.default) ? { default: attribute.values.find((value) => value.default).value } : {})
				})),
				events: entry.events.map((event) => ({ name: event.name, description: pickText(event.description) })),
				cssProperties: [
					...entry.cssVars.map((variable) => ({ name: variable.name, description: pickText(variable.description) })),
					...entry.tokens.filter((token) => !entry.cssVars.some((variable) => variable.name === token.name)).map((token) => ({
						name: token.name,
						description: token.part ? `Paints \`${token.property}\` of the \`${token.part}\` part.` : `Paints \`${token.property}\` of the element.`
					}))
				],
				cssParts: flattenLayers(entry.layers).map((layer) => ({ name: layer.part, description: `${layer.trail}${pickText(layer.description)}${layer.optional ? " (optional)" : ""}` })),
				cssStates: entry.states.map((state) => ({ name: state.name, ...(pickText(state.description) ? { description: pickText(state.description) } : {}) })),
				members: entry.members.map((member) => ({ kind: member.kind, name: member.name, type: { text: member.type }, description: pickText(member.description) }))
			}],
			exports: [{ kind: "custom-element-definition", name: entry.tag, declaration: { name: entry.className, module: entry.paths.js } }]
		}))
	};
}

/* Les calques à plat, chaque enfant préfixé du chemin de ses parents. */
function flattenLayers(layers, trail = "") {
	return layers.flatMap((layer) => [{ ...layer, trail }, ...flattenLayers(layer.children, `${trail}${layer.part} › `)]);
}

/* La description d'un attribut, valeurs comprises, en une ligne. */
function describeAttribute(attribute, lang) {
	const base = pickText(attribute.description, lang);
	const noted = attribute.values.filter((value) => pickText(value.note, lang));
	if (!noted.length) return base;
	const list = noted.map((value) => `\`${value.value}\`${value.default ? " (default)" : ""}: ${pickText(value.note, lang)}`).join(" · ");
	return base ? `${base} — ${list}` : list;
}

/*
	Format VSCode HTML Custom Data → autocomplétion + survol des <z-*>. Les valeurs
	d'un attribut deviennent des propositions ; un booléen n'en a pas (présent/absent).
	@param {object} index
	@returns {object}
*/
export function toVscode(index) {
	const elements = index.elements.filter((entry) => entry.className && !entry.attributeTool);
	return {
		version: 1.1,
		tags: elements.map((entry) => ({
			name: entry.tag,
			description: { kind: "markdown", value: `${pickText(entry.summary)}${entry.example ? `\n\n\`\`\`html\n${entry.example}\n\`\`\`` : ""}` },
			attributes: [
				...entry.attributes.map((attribute) => ({
					name: attribute.name,
					description: describeAttribute(attribute, "en"),
					...(attribute.type === "boolean" ? { valueSet: "v" } : attribute.values.length ? { values: attribute.values.map((value) => ({ name: value.value, description: pickText(value.note) || undefined })) } : {})
				})),
				...variantAttributes(entry)
			],
			references: [
				...(entry.paths.doc ? [{ name: "Documentation", url: `./docs/index.html#${entry.tag}` }] : []),
				...(entry.paths.demo ? [{ name: "Demo", url: `./${entry.paths.demo}` }] : [])
			]
		}))
	};
}

/* Les variants du socle (size · tone · width), offerts à tout composant visuel. */
function variantAttributes(entry) {
	if (entry.kind !== "components" && entry.tag !== "z-element") return [];
	const names = new Set(entry.attributes.map((attribute) => attribute.name));
	const variants = [
		{ name: "size", description: "Size factor from the skin's scale — everything inside follows in em.", values: ["xs", "s", "m", "l", "xl"] },
		{ name: "tone", description: "Importance / meaning — sets --z-tone__fill, --z-tone__ink, --z-tone__line.", values: ["main", "complement", "soft", "success", "danger"] },
		{ name: "width", description: "auto (default) or full — takes the whole line.", values: ["auto", "full"] }
	];
	return variants.filter((variant) => !names.has(variant.name)).map((variant) => ({
		name: variant.name,
		description: variant.description,
		values: variant.values.map((value) => ({ name: value }))
	}));
}

/*
	llms.txt — la référence pour une IA, en anglais, autonome : la grammaire d'abord
	(c'est elle qui permet de DÉDUIRE), puis chaque élément avec tout ce qu'il faut pour
	l'écrire sans ouvrir un autre fichier.
	@param {object} index
	@param {string} grammar  le contenu de docs/GRAMMAR.md
	@param {{ full?: boolean, narratives?: Record<string,string> }} [options]
	@returns {string}
*/
export function toLlms(index, grammar, { full = false, narratives = {} } = {}) {
	const lines = [];
	lines.push("# Zoé", "", `> HTML-first web components with living states (\`:state()\`), portable skins (one CSS file of tokens) and CSS-driven motion. Light DOM, zero dependencies, ${index.elements.filter((entry) => entry.kind === "components").length} components, ${index.elements.filter((entry) => entry.kind === "tools").length} tools, ${index.skins.length} skins. Version ${index.version}, generated ${index.generated}.`, "");
	lines.push("This file is generated by `scripts/z-manifest` from the source code. Machine-readable twins: `dist/zoe.json` (full index), `dist/custom-elements.json` (Custom Elements Manifest), `dist/vscode.html-custom-data.json`. An MCP server exposes the same data: `node scripts/z-mcp/z-mcp.js` (see `.mcp.json`).", "");
	lines.push("---", "", grammar.trim(), "", "---", "");
	lines.push("# Reference", "");
	for (const kind of SCAN_DIRS) {
		const list = index.elements.filter((entry) => entry.kind === kind);
		if (!list.length) continue;
		lines.push(`## ${kind}`, "");
		for (const entry of list) lines.push(...elementReference(entry, "en"), "");
	}
	lines.push("## skins", "");
	for (const skin of index.skins) {
		lines.push(`### ${skin.name} — \`${skin.paths.css}\``);
		if (skin.source) lines.push(`Source of truth: \`${skin.source}\`.`);
		lines.push("Tokens:", ...Object.entries(skin.tokens).filter(([name]) => !name.startsWith("--z-skin-")).map(([name, value]) => `- \`${name}\`: ${value}`), "");
	}
	if (index.motion.presets.length) lines.push("## motion presets (z-motion)", "", index.motion.presets.map((name) => `\`${name}\``).join(" · "), "");
	if (full) {
		lines.push("---", "", "# Narrative documentation (French)", "");
		for (const entry of index.elements) {
			const text = narratives[entry.tag];
			if (!text) continue;
			lines.push(`## ${entry.tag} — ${entry.paths.doc}`, "", text.trim(), "");
		}
		for (const skin of index.skins) {
			const text = narratives[`skin:${skin.id}`];
			if (!text) continue;
			lines.push(`## skin ${skin.id} — ${skin.paths.doc}`, "", text.trim(), "");
		}
	}
	return lines.join("\n") + "\n";
}

/*
	La fiche d'UN élément en Markdown — partagée par llms.txt et le serveur MCP (même
	forme, même source : ce qu'une IA lit dans l'un, elle le retrouve dans l'autre).
	@param {object} entry
	@param {string} [lang]
	@returns {string[]} les lignes
*/
export function elementReference(entry, lang = "en") {
	const lines = [];
	const title = entry.attributeTool ? entry.tag : `<${entry.tag}>`;
	lines.push(`### ${title}`, "", pickText(entry.summary, lang));
	if (entry.example) lines.push("", "```html", entry.example, "```");
	if (entry.attributes.length) {
		lines.push("", "Attributes:");
		for (const attribute of entry.attributes) {
			const values = attribute.values.length ? ` [${attribute.values.map((value) => value.value + (value.default ? "*" : "")).join(" | ")}]` : "";
			lines.push(`- \`${attribute.name}\` (${attribute.type})${values} — ${describeAttribute(attribute, lang)}`);
		}
	}
	if (entry.events.length) lines.push("", "Events: " + entry.events.map((event) => `\`${event.name}\` — ${pickText(event.description, lang)}`).join(" · "));
	if (entry.states.length) {
		const own = entry.states.filter((state) => pickText(state.description, lang));
		lines.push("", `States (\`${entry.tag}:state(…)\`): ${entry.states.map((state) => `\`${state.name}\``).join(", ")}`);
		for (const state of own) lines.push(`- \`${state.name}\` — ${pickText(state.description, lang)}`);
	}
	if (entry.layers.length) {
		lines.push("", "Layers (`<z-layer part=\"…\">`, author-written):");
		for (const layer of flattenLayers(entry.layers)) lines.push(`- ${layer.trail}\`${layer.part}\`${layer.optional ? " (optional)" : ""} — ${pickText(layer.description, lang)}`);
	}
	if (entry.cssVars.length) {
		lines.push("", "CSS variables:");
		for (const variable of entry.cssVars) lines.push(`- \`${variable.name}\` — ${pickText(variable.description, lang)}`);
	}
	const extraTokens = entry.tokens.filter((token) => !entry.cssVars.some((variable) => variable.name === token.name));
	if (extraTokens.length) lines.push("", "Skin tokens it reads (`--z-{component}[--{part}]__{property}`): " + extraTokens.map((token) => `\`${token.name}\``).join(", "));
	if (entry.members.length) {
		lines.push("", "JS API:");
		for (const member of entry.members) lines.push(`- \`${member.name}\`${member.type ? ` : ${member.type}` : ""} — ${pickText(member.description, lang)}`);
	}
	if (entry.presets?.length) lines.push("", "Presets: " + entry.presets.map((name) => `\`${name}\``).join(", "));
	const pages = [entry.paths.doc && `doc: ${entry.paths.doc}`, entry.paths.demo && `demo: ${entry.paths.demo}`, entry.paths.lab && `lab: ${entry.paths.lab}`].filter(Boolean);
	if (pages.length) lines.push("", `Files: ${pages.join(" · ")}`);
	return lines;
}

/*
	Les listes de balises de core/z-element/z-element.css — les variants `size · tone ·
	width` s'écrivent `:is(z-element, z-button, …)` pour ne pas attraper un `<input
	size>` natif. Tenues à la main elles oublient toujours le dernier composant : on les
	RÉGÉNÈRE. Le fichier porte le marqueur de cette liste dans son en-tête.
	@param {string} css        le contenu actuel
	@param {object} index
	@returns {string} le CSS réécrit
*/
export function regenerateVariantLists(css, index) {
	const tags = ["z-element", ...index.elements.filter((entry) => entry.kind === "components").map((entry) => entry.tag), "z-cursor"];
	const list = tags.join(", ");
	return css.replace(/:(is|where)\(z-element,[^)]*\)/g, (_, fn) => `:${fn}(${list})`);
}

/*
	La table des éléments du README, entre `<!-- zoe:elements -->` et `<!-- /zoe:elements -->`.
	Sans marqueurs, le README est rendu intact.
	@param {string} readme
	@param {object} index
	@returns {string}
*/
export function regenerateReadmeTable(readme, index) {
	const open = "<!-- zoe:elements -->";
	const close = "<!-- /zoe:elements -->";
	if (!readme.includes(open) || !readme.includes(close)) return readme;
	const rows = [];
	for (const kind of SCAN_DIRS) {
		const list = index.elements.filter((entry) => entry.kind === kind);
		if (!list.length) continue;
		rows.push(`**${kind}**`, "", "| element | what it does | files |", "|---|---|---|");
		for (const entry of list) {
			const files = [entry.paths.doc && `[doc](${entry.paths.doc})`, entry.paths.demo && `[demo](${entry.paths.demo})`, entry.paths.lab && `[lab](${entry.paths.lab})`].filter(Boolean).join(" · ");
			rows.push(`| \`${entry.attributeTool ? entry.tag : `<${entry.tag}>`}\` | ${pickText(entry.summary)} | ${files} |`);
		}
		rows.push("");
	}
	const before = readme.slice(0, readme.indexOf(open) + open.length);
	const after = readme.slice(readme.indexOf(close));
	return `${before}\n${rows.join("\n")}${after}`;
}

/*
	Les narratifs (.doc.md) de chaque élément et de chaque peau, pour llms-full.txt.
	@param {object} index
	@returns {Promise<Record<string,string>>}
*/
export async function readNarratives(index) {
	const narratives = {};
	for (const entry of index.elements) {
		if (entry.paths.doc) narratives[entry.tag] = await readFile(join(ROOT, entry.paths.doc), "utf8");
	}
	for (const skin of index.skins) {
		if (skin.paths.doc) narratives[`skin:${skin.id}`] = await readFile(join(ROOT, skin.paths.doc), "utf8");
	}
	return narratives;
}

/* Le chemin relatif à la racine, séparateur `/`. @param {string} file @returns {string} */
export function relativeToRoot(file) {
	return relative(ROOT, file).replace(/\\/g, "/");
}
