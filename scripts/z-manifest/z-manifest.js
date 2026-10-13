/*
	============================================================
	z-manifest — LA COMMANDE : lit le dépôt, écrit toutes les sorties
	------------------------------------------------------------
	    node scripts/z-manifest/z-manifest.js            génère tout, avertit
	    node scripts/z-manifest/z-manifest.js --strict   idem, et ÉCHOUE au premier manque

	Tout le calcul vit dans z-manifest.lib.js (pur, testé). Ici : les lectures de
	configuration, l'écriture des fichiers, le compte rendu. Zéro dépendance.

	Ce qui est écrit :
	  dist/zoe.json · dist/custom-elements.json · dist/vscode.html-custom-data.json
	  llms.txt · llms-full.txt (racine)
	  core/z-element/z-element.css (ses listes de balises) · README.md (sa table)
	  .vscode/settings.json (UNE ligne : html.customData, le reste fusionné intact)

	Styleguide tool.manifest
	============================================================
*/

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
	ROOT, scanRepository, toManifest, toVscode, toLlms, readNarratives,
	regenerateVariantLists, regenerateReadmeTable
} from "./z-manifest.lib.js";

const strict = process.argv.includes("--strict");

async function main() {
	const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
	const { index, warnings } = await scanRepository({ version: pkg.version });
	const grammar = await readFile(join(ROOT, "docs", "GRAMMAR.md"), "utf8");
	const narratives = await readNarratives(index);

	await mkdir(join(ROOT, "dist"), { recursive: true });
	await writeFile(join(ROOT, "dist", "zoe.json"), JSON.stringify(index, null, 2) + "\n");
	await writeFile(join(ROOT, "dist", "custom-elements.json"), JSON.stringify(toManifest(index), null, 2) + "\n");
	await writeFile(join(ROOT, "dist", "vscode.html-custom-data.json"), JSON.stringify(toVscode(index), null, 2) + "\n");
	await writeFile(join(ROOT, "llms.txt"), toLlms(index, grammar));
	await writeFile(join(ROOT, "llms-full.txt"), toLlms(index, grammar, { full: true, narratives }));

	await rewrite(join(ROOT, "core", "z-element", "z-element.css"), (css) => regenerateVariantLists(css, index));
	await rewrite(join(ROOT, "README.md"), (readme) => regenerateReadmeTable(readme, index));
	await writeVscodeSettings();

	const counts = ["core", "tools", "components"].map((kind) => `${index.elements.filter((entry) => entry.kind === kind).length} ${kind}`).join(" · ");
	console.log(`✓ z-manifest : ${index.elements.length} éléments (${counts}) · ${index.skins.length} peaux → dist/{zoe,custom-elements,vscode.html-custom-data}.json · llms.txt · llms-full.txt`);
	for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
	if (strict && warnings.length) {
		console.error(`✗ z-manifest --strict : ${warnings.length} manque(s). Le composant passe ou il ne rentre pas.`);
		process.exit(1);
	}
}

/* Réécrit un fichier à travers une transformation, seulement s'il existe et s'il change. */
async function rewrite(path, transform) {
	if (!existsSync(path)) return;
	const before = await readFile(path, "utf8");
	const after = transform(before);
	if (after !== before) await writeFile(path, after);
}

/*
	LES RÉGLAGES VSCODE — on n'en possède QU'UNE ligne : `html.customData`. Tout le reste
	appartient au dépôt, on le FUSIONNE (lu, notre ligne remplacée, le reste réécrit tel
	quel). Illisible → on n'y touche pas : perdre l'autocomplétion vaut mieux que perdre
	les réglages de quelqu'un.
*/
async function writeVscodeSettings() {
	const path = join(ROOT, ".vscode", "settings.json");
	const ours = { "html.customData": ["./dist/vscode.html-custom-data.json"] };
	let existing = {};
	if (existsSync(path)) {
		try { existing = JSON.parse((await readFile(path, "utf8")).replace(/^\s*\/\/.*$/gm, "")); }
		catch { console.warn("  ⚠ .vscode/settings.json illisible — laissé intact."); return; }
	}
	await mkdir(join(ROOT, ".vscode"), { recursive: true });
	await writeFile(path, JSON.stringify({ ...existing, ...ours }, null, 2) + "\n");
}

main().catch((error) => { console.error("z-manifest a échoué :", error); process.exit(1); });
