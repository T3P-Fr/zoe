/*
	============================================================
	z-lint — LA CONSOLE QUI CORRIGE (le branchement navigateur)
	------------------------------------------------------------
	Un module à charger en développement, une ligne :

	    <script type="module" src="tools/z-lint/z-lint.js"></script>

	Au chargement de la page, il lit le vocabulaire RÉEL de Zoé (dist/zoe.json, généré
	depuis le code), parcourt le HTML et toutes les feuilles de style de la page, et
	écrit dans la console chaque chose qui ne fera jamais ce qu'on en attend — avec le
	nom le plus proche :

	    ⚠ <z-button> never poses the state `hovered` — did you mean `over`?
	    ⚠ `--z-button-bg` is not in the pact's grammar — did you mean `--z-button__background-color`?

	Pourquoi en anglais : la console est lue par des développeurs et par des agents IA,
	et tout le reste de l'API (attributs, états, llms.txt) est en anglais.

	Les règles vivent dans z-lint.rules.js (pur, testé, partagé avec le serveur MCP).
	Ici : lire la page, appeler les règles, afficher. Rien d'autre. Ce module ne change
	pas la page, ne charge rien d'autre que l'index, et n'a rien à faire en production.

	API : `window.ZoeLint.lint()` relance l'analyse (après une mutation, par exemple) et
	rend les constats ; l'événement `zoe:lint` est émis sur `document` avec `detail:
	{ findings }` pour qu'une page les affiche (la page de lab le fait).

	Styleguide tool.lint
	============================================================
*/

import { buildVocabulary, formatFinding, lint as lintText } from "./z-lint.rules.js";

/*
	L'API de l'outil, pour le manifeste et la doc. z-lint n'est pas une balise : c'est un
	module qu'on charge (comme z-channel est un attribut) — `attributeTool` le dit au viewer.
*/
export const api = {
	tag: "z-lint",
	attributeTool: true,
	example: `<script type="module" src="tools/z-lint/z-lint.js"></script>`,
	summary: {
		en: "The console that corrects: load it in development and every unknown tag, attribute, state, part or misspelled token is reported with the nearest valid name. The browser stays silent; z-lint speaks.",
		fr: "La console qui corrige : chargez-le en développement, et chaque balise, attribut, état, pièce ou token mal écrit est signalé avec le nom valide le plus proche. Le navigateur se tait ; z-lint parle.",
		es: "La consola que corrige: cárguelo en desarrollo y cada etiqueta, atributo, estado, pieza o token mal escrito se señala con el nombre válido más cercano. El navegador calla; z-lint habla."
	},
	attributes: [],
	events: [
		{ name: "zoe:lint", description: { en: "Fired on `document` after each pass. detail: { findings } — each finding has level, kind, found, expected, message.", fr: "Émis sur `document` après chaque passe. detail : { findings } — chaque constat porte level, kind, found, expected, message.", es: "Emitido en `document` tras cada pasada. detail: { findings } — cada hallazgo lleva level, kind, found, expected, message." } }
	],
	states: [],
	members: [
		{ kind: "method", name: "ZoeLint.lint()", type: "Promise<object[]>", description: { en: "Re-runs the analysis on the whole page and returns the findings (also printed to the console).", fr: "Relance l'analyse sur toute la page et rend les constats (aussi écrits dans la console).", es: "Vuelve a analizar toda la página y devuelve los hallazgos (también escritos en la consola)." } }
	]
};

const INDEX_URL = new URL("../../dist/zoe.json", import.meta.url);

/** @type {ReturnType<typeof buildVocabulary>|null} */
let vocabulary = null;

/*
	Le vocabulaire, chargé une fois. Sans index (page servie hors du dépôt), on le dit
	et on s'arrête — un lint sans vocabulaire inventerait des fautes.
	@returns {Promise<ReturnType<typeof buildVocabulary>|null>}
*/
async function loadVocabulary() {
	if (vocabulary) return vocabulary;
	try {
		const response = await fetch(INDEX_URL);
		if (!response.ok) throw new Error(`${response.status}`);
		vocabulary = buildVocabulary(await response.json());
	} catch (error) {
		console.warn(`z-lint : dist/zoe.json unreachable (${error.message}) — run \`npm run manifest\`. Nothing checked.`);
		return null;
	}
	return vocabulary;
}

/*
	Le CSS de la page : le texte de chaque règle de chaque feuille lisible. Les feuilles
	d'une autre origine (polices Google) lèvent une SecurityError à la lecture — on les
	saute, elles ne parlent pas de Zoé.
	@returns {string}
*/
function pageCss() {
	const chunks = [];
	for (const sheet of document.styleSheets) {
		try { for (const rule of sheet.cssRules) chunks.push(rule.cssText); }
		catch { /* cross-origin : illisible, et sans intérêt ici */ }
	}
	return chunks.join("\n");
}

/*
	Analyse la page entière et écrit les constats dans la console (un groupe replié,
	une ligne par constat, l'erreur d'abord).
	@returns {Promise<object[]>} les constats
*/
export async function lint() {
	const vocab = await loadVocabulary();
	if (!vocab) return [];
	const findings = lintText({ html: document.documentElement.outerHTML, css: pageCss() }, vocab);
	report(findings);
	document.dispatchEvent(new CustomEvent("zoe:lint", { detail: { findings } }));
	return findings;
}

/* La sortie console : groupée pour ne pas noyer le reste, dépliée s'il y a une erreur. */
function report(findings) {
	if (!findings.length) { console.info("z-lint : nothing to report — every tag, attribute, state and token is known."); return; }
	const errors = findings.filter((item) => item.level === "error").length;
	const open = errors ? console.group : console.groupCollapsed;
	open.call(console, `z-lint : ${findings.length} finding(s)${errors ? ` — ${errors} will never work` : ""}`);
	for (const item of findings) (item.level === "error" ? console.error : item.level === "warn" ? console.warn : console.info)(formatFinding(item));
	console.groupEnd();
}

/*
	Une fois la page ET ses feuilles chargées (les @import arrivent après DOMContentLoaded).
	Hors navigateur (le générateur de manifeste importe ce module en Node, sans document
	réel), on ne fait rien : l'api ci-dessus suffit.
*/
if (typeof document !== "undefined" && typeof document.createElement === "function") {
	if (document.readyState === "complete") lint();
	else window.addEventListener("load", () => lint(), { once: true });
	window.ZoeLint = { lint };
}
