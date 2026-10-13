/*
	============================================================
	z-mcp.lib — LE CŒUR du serveur MCP de Zoé (pur, testable)
	------------------------------------------------------------
	Un serveur MCP (Model Context Protocol) donne à un agent IA des OUTILS et des
	RESSOURCES. Celui de Zoé expose UNE SEULE source — dist/zoe.json, la grammaire
	(docs/GRAMMAR.md), les narratifs (.doc.md) — sous une forme qu'un modèle peut
	interroger pièce par pièce, au lieu d'avaler 1 200 lignes de llms.txt.

	Ce module ne connaît ni stdin, ni stdout, ni JSON-RPC : il reçoit des données déjà
	lues et rend des réponses. z-mcp.js (la commande) fait le transport. C'est ce qui
	permet de tester chaque outil avec `node --test`, sans lancer de processus.

	Les outils :
	  zoe_grammar   la grammaire complète — à lire EN PREMIER
	  zoe_list      la liste des éléments (filtrable par famille, par mot)
	  zoe_get       la fiche complète d'un élément (API + narratif)
	  zoe_example   le HTML canonique d'un élément, et rien d'autre
	  zoe_search    une recherche dans tout le vocabulaire (balises, attributs, états, tokens)
	  zoe_skins     les peaux et leurs tokens
	  zoe_lint      vérifier un fragment HTML/CSS AVANT de l'écrire
	Les ressources : la grammaire, llms.txt, l'index, le manifeste, chaque .doc.md, chaque peau.

	Styleguide tool.mcp
	============================================================
*/

import { elementReference, pickText, SCAN_DIRS } from "../z-manifest/z-manifest.lib.js";
import { buildVocabulary, formatFinding, lint } from "../../tools/z-lint/z-lint.rules.js";

const LANGS = ["en", "fr", "es"];

/*
	Bâtit le cœur du serveur depuis les données du dépôt.
	@param {{ index: object, grammar: string, narratives: Record<string,string>, llms: string, llmsFull: string, manifest: string, skinsCss: Record<string,string>, version: string }} data
*/
export function createCore(data) {
	const { index, grammar, narratives, llms, llmsFull, manifest, skinsCss, version } = data;
	const vocabulary = buildVocabulary(index);
	const byTag = new Map(index.elements.map((entry) => [entry.tag, entry]));

	const tools = [
		{
			name: "zoe_grammar",
			description: "The complete grammar of Zoé (states, layers, the token pact, skins, tools, dead forms, checklist). Read this first — everything else is deducible from it.",
			inputSchema: { type: "object", properties: {}, additionalProperties: false }
		},
		{
			name: "zoe_list",
			description: "List Zoé elements: tag, family (core · tools · components) and one-line summary. Optionally filter by family or by a word.",
			inputSchema: {
				type: "object",
				properties: {
					kind: { type: "string", enum: SCAN_DIRS, description: "Only this family." },
					query: { type: "string", description: "Only elements whose tag or summary contains this word." },
					lang: { type: "string", enum: LANGS, description: "Language of the summaries (default en)." }
				},
				additionalProperties: false
			}
		},
		{
			name: "zoe_get",
			description: "The full card of one element: summary, canonical HTML example, attributes (with values), events, states, layers (parts), CSS variables and skin tokens it reads, JS API, files — plus its narrative documentation when it exists.",
			inputSchema: {
				type: "object",
				properties: {
					tag: { type: "string", description: "The element tag, e.g. z-button (the leading < > is optional)." },
					lang: { type: "string", enum: LANGS, description: "Language of the descriptions (default en). The narrative documentation is in French." },
					narrative: { type: "boolean", description: "Include the narrative .doc.md (default true)." }
				},
				required: ["tag"],
				additionalProperties: false
			}
		},
		{
			name: "zoe_example",
			description: "Only the canonical HTML example of one element — ready to paste.",
			inputSchema: { type: "object", properties: { tag: { type: "string" } }, required: ["tag"], additionalProperties: false }
		},
		{
			name: "zoe_search",
			description: "Search the whole vocabulary: tags, attributes, events, states, layer parts, CSS tokens, summaries. Returns the matching elements with where the word was found.",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: "A word or token fragment, e.g. 'current', 'dot', '--z-button', 'form'." },
					limit: { type: "integer", minimum: 1, maximum: 50, description: "Max results (default 10)." }
				},
				required: ["query"],
				additionalProperties: false
			}
		},
		{
			name: "zoe_skins",
			description: "The skins (one CSS file of tokens each) with their :root tokens and values. Pass an id for one skin, or nothing for all.",
			inputSchema: { type: "object", properties: { id: { type: "string", description: "A skin id (hightech, claude…)." } }, additionalProperties: false }
		},
		{
			name: "zoe_lint",
			description: "Check an HTML and/or CSS fragment against Zoé's real vocabulary BEFORE writing it: unknown tags, attributes, states, parts, misspelled or unread tokens, dead forms — each with the nearest valid name.",
			inputSchema: {
				type: "object",
				properties: { html: { type: "string" }, css: { type: "string" } },
				additionalProperties: false
			}
		}
	];

	const resources = [
		{ uri: "zoe://grammar", name: "Zoé grammar", description: "docs/GRAMMAR.md — the complete rule set.", mimeType: "text/markdown" },
		{ uri: "zoe://llms.txt", name: "llms.txt", description: "Grammar + compact reference of every element.", mimeType: "text/plain" },
		{ uri: "zoe://llms-full.txt", name: "llms-full.txt", description: "llms.txt + every narrative documentation (French).", mimeType: "text/plain" },
		{ uri: "zoe://index.json", name: "zoe.json", description: "The full generated index (multilingual).", mimeType: "application/json" },
		{ uri: "zoe://manifest.json", name: "custom-elements.json", description: "Custom Elements Manifest (standard).", mimeType: "application/json" },
		...index.elements.filter((entry) => narratives[entry.tag]).map((entry) => ({ uri: `zoe://doc/${entry.tag}`, name: `${entry.tag} — documentation`, description: entry.paths.doc, mimeType: "text/markdown" })),
		...index.skins.map((skin) => ({ uri: `zoe://skin/${skin.id}`, name: `skin ${skin.name}`, description: skin.paths.css, mimeType: "text/css" }))
	];

	/* ── Les outils, un par un ── */

	function grammarTool() {
		return text(grammar.trim());
	}

	function listTool({ kind, query, lang = "en" } = {}) {
		const needle = (query || "").toLowerCase();
		const list = index.elements.filter((entry) => (!kind || entry.kind === kind)
			&& (!needle || entry.tag.includes(needle) || pickText(entry.summary, lang).toLowerCase().includes(needle)));
		if (!list.length) return text(`No element matches${kind ? ` kind=${kind}` : ""}${query ? ` query="${query}"` : ""}.`);
		const lines = [];
		for (const family of SCAN_DIRS) {
			const group = list.filter((entry) => entry.kind === family);
			if (!group.length) continue;
			lines.push(`## ${family}`);
			for (const entry of group) lines.push(`- ${entry.attributeTool ? entry.tag : `<${entry.tag}>`} — ${pickText(entry.summary, lang)}`);
			lines.push("");
		}
		lines.push(`${list.length} element(s). Use zoe_get for the full card.`);
		return text(lines.join("\n"));
	}

	function getTool({ tag, lang = "en", narrative = true } = {}) {
		const entry = resolve(tag);
		if (!entry) return notFound(tag);
		const lines = elementReference(entry, lang);
		if (narrative && narratives[entry.tag]) lines.push("", "---", "", `## Documentation (${entry.paths.doc})`, "", narratives[entry.tag].trim());
		return text(lines.join("\n"));
	}

	function exampleTool({ tag } = {}) {
		const entry = resolve(tag);
		if (!entry) return notFound(tag);
		return text(entry.example || `<${entry.tag}> has no example yet.`);
	}

	function searchTool({ query, limit = 10 } = {}) {
		const needle = String(query || "").trim().toLowerCase();
		if (!needle) return text("Give a word to search.");
		const hits = [];
		for (const entry of index.elements) {
			const where = [];
			const has = (value) => String(value || "").toLowerCase().includes(needle);
			if (has(entry.tag)) where.push("tag");
			for (const attribute of entry.attributes) if (has(attribute.name)) where.push(`attribute ${attribute.name}`);
			for (const event of entry.events) if (has(event.name)) where.push(`event ${event.name}`);
			for (const state of entry.states) if (has(state.name)) where.push(`state ${state.name}`);
			for (const part of flattenParts(entry.layers)) if (has(part)) where.push(`part ${part}`);
			for (const token of [...entry.tokens.map((token) => token.name), ...entry.cssVars.map((variable) => variable.name)]) if (has(token)) where.push(`token ${token}`);
			for (const member of entry.members) if (has(member.name)) where.push(`member ${member.name}`);
			if (LANGS.some((lang) => has(pickText(entry.summary, lang)))) where.push("summary");
			if (has(narratives[entry.tag])) where.push("documentation");
			if (where.length) hits.push({ entry, where, score: where.length + (where[0] === "tag" ? 5 : 0) });
		}
		hits.sort((a, b) => b.score - a.score);
		if (!hits.length) return text(`Nothing matches "${query}".`);
		const lines = hits.slice(0, limit).map(({ entry, where }) => `- <${entry.tag}> (${entry.kind}) — found in: ${[...new Set(where)].slice(0, 8).join(", ")}`);
		return text([`${hits.length} element(s) match "${query}":`, ...lines, "", "Use zoe_get <tag> for details."].join("\n"));
	}

	function skinsTool({ id } = {}) {
		const skins = id ? index.skins.filter((skin) => skin.id === id) : index.skins;
		if (!skins.length) return text(`No skin "${id}". Available: ${index.skins.map((skin) => skin.id).join(", ")}.`);
		const lines = [];
		for (const skin of skins) {
			lines.push(`## ${skin.name} (${skin.id}) — ${skin.paths.css}`);
			if (skin.source) lines.push(`Source of truth: ${skin.source}`);
			if (skin.paths.doc) lines.push(`Documentation: ${skin.paths.doc}`);
			lines.push("", "Tokens:");
			for (const [name, value] of Object.entries(skin.tokens)) if (!name.startsWith("--z-skin-")) lines.push(`- ${name}: ${value}`);
			lines.push("");
		}
		lines.push(`Switch skin = switch one <link rel="stylesheet">. Load the skin AFTER zoe.css.`);
		return text(lines.join("\n"));
	}

	function lintTool({ html = "", css = "" } = {}) {
		if (!html && !css) return text("Give html and/or css to check.");
		const findings = lint({ html, css }, vocabulary);
		if (!findings.length) return text("Nothing to report — every tag, attribute, state, part and token is known.");
		const lines = [`${findings.length} finding(s):`, ...findings.map(formatFinding), "", "```json", JSON.stringify(findings, null, 2), "```"];
		return text(lines.join("\n"), findings.some((item) => item.level === "error"));
	}

	const handlers = {
		zoe_grammar: grammarTool, zoe_list: listTool, zoe_get: getTool, zoe_example: exampleTool,
		zoe_search: searchTool, zoe_skins: skinsTool, zoe_lint: lintTool
	};

	/*
		Appelle un outil par son nom. Un nom inconnu est une ERREUR de protocole (le client
		a mal lu la liste) ; un argument hors vocabulaire est un RÉSULTAT en erreur (le
		modèle s'est trompé, on le lui dit pour qu'il se corrige).
		@param {string} name @param {object} [args]
		@returns {{ content: {type:string,text:string}[], isError?: boolean }}
	*/
	function callTool(name, args = {}) {
		const handler = handlers[name];
		if (!handler) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
		return handler(args || {});
	}

	/*
		Lit une ressource par son URI.
		@param {string} uri
		@returns {{ contents: { uri: string, mimeType: string, text: string }[] }}
	*/
	function readResource(uri) {
		const one = (mimeType, body) => ({ contents: [{ uri, mimeType, text: body }] });
		if (uri === "zoe://grammar") return one("text/markdown", grammar);
		if (uri === "zoe://llms.txt") return one("text/plain", llms);
		if (uri === "zoe://llms-full.txt") return one("text/plain", llmsFull);
		if (uri === "zoe://index.json") return one("application/json", JSON.stringify(index, null, 2));
		if (uri === "zoe://manifest.json") return one("application/json", manifest);
		const doc = uri.match(/^zoe:\/\/doc\/(z-[a-z0-9-]+)$/);
		if (doc && narratives[doc[1]]) return one("text/markdown", narratives[doc[1]]);
		const skin = uri.match(/^zoe:\/\/skin\/([a-z0-9-]+)$/);
		if (skin && skinsCss[skin[1]]) return one("text/css", skinsCss[skin[1]]);
		throw Object.assign(new Error(`Unknown resource: ${uri}`), { code: -32002 });
	}

	const instructions = [
		`Zoé ${version}: HTML-first web components with :state() interaction states, author-written <z-layer part> anatomy, skins as CSS token files, and the token pact --z-{component}[--{part}]__{css-property}.`,
		"Start with zoe_grammar. Then zoe_get <tag> for any element you write, zoe_lint on your HTML/CSS before delivering it.",
		"Zoé never generates DOM: the author writes the HTML, including layers. Semantic content stays native HTML; only widgets become z-* elements."
	].join(" ");

	return { tools, resources, callTool, readResource, instructions };

	/* ── privé ── */

	function resolve(tag) {
		const clean = String(tag || "").trim().replace(/^<|>$/g, "").toLowerCase();
		return byTag.get(clean) || byTag.get(`z-${clean}`) || null;
	}

	function notFound(tag) {
		const clean = String(tag || "").trim().replace(/^<|>$/g, "");
		const near = nearestTag(clean);
		return text(`No element "${clean}".${near ? ` Did you mean <${near}>?` : ""} Use zoe_list to see them all.`, true);
	}

	function nearestTag(word) {
		let best = null, bestScore = Infinity;
		for (const tag of byTag.keys()) {
			const score = distance(word.toLowerCase().replace(/^z-/, ""), tag.replace(/^z-/, ""));
			if (score < bestScore) { best = tag; bestScore = score; }
		}
		return bestScore <= 3 ? best : null;
	}
}

/* Un résultat d'outil : du texte, et le drapeau d'erreur quand le modèle doit se corriger. */
function text(body, isError = false) {
	return { content: [{ type: "text", text: body }], ...(isError ? { isError: true } : {}) };
}

function flattenParts(layers) {
	return (layers || []).flatMap((layer) => [layer.part, ...flattenParts(layer.children)]);
}

/* Distance d'édition minimale (même algorithme que z-lint ; recopié ici pour ne pas
   exposer un détail de z-lint comme API publique). */
function distance(a, b) {
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		previous = current;
	}
	return previous[b.length];
}
