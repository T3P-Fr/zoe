/*
	============================================================
	check — LE ROUGE DÉCIDE : le contrôle de cohérence du dépôt
	------------------------------------------------------------
	    node scripts/check.mjs          (ou `npm run check`)

	Ce qui est vérifié, et pourquoi :
	  1. chaque élément porte une api complète (summary trilingue, exemple, descriptions,
	     dossier .js · .css · .doc.md · .demo.html pour un composant) — la doc, llms.txt
	     et le serveur MCP n'ont que ça pour parler juste ;
	  2. zoe.css et zoe.js listent exactement les composants présents sur le disque, ni
	     un de plus (fichier fantôme) ni un de moins (composant invisible) ;
	  3. aucun lien relatif mort dans les pages HTML (href/src) — une page qui pointe sur
	     un fichier disparu est une recherche inutile programmée ;
	  4. les sorties générées sont à jour (dist/zoe.json reflète le code).

	Zéro dépendance. Sortie lisible : une ligne par manque, et un code de sortie 1 s'il
	en reste un seul. Le composant passe, ou il ne rentre pas.
	Styleguide tool.check
	============================================================
*/

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { ROOT, scanRepository } from "./z-manifest/z-manifest.lib.js";

const problems = [];
const say = (line) => problems.push(line);

/* 1 · L'api de chaque élément, et le dossier d'un composant. */
const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
const { index, warnings } = await scanRepository({ version: pkg.version });
for (const warning of warnings) say(`api · ${warning}`);

/* Un outil aussi doit se documenter : son .doc.md et une page (démo ou lab). */
for (const entry of index.elements.filter((element) => element.kind === "tools")) {
	if (!entry.paths.doc) say(`api · <${entry.tag}> : z-x.doc.md manquant (un outil se documente comme un composant)`);
	if (!entry.paths.demo && !entry.paths.lab) say(`api · <${entry.tag}> : aucune page (.demo.html ou .lab.html)`);
}

/* 2 · zoe.css et zoe.js ⟺ le disque. */
const onDisk = (await readdir(join(ROOT, "components"))).filter((name) => name.startsWith("z-")).sort();
/* On ne lit que les LIGNES d'import — un chemin cité dans un commentaire n'est pas une inscription. */
for (const [file, pattern] of [["zoe.css", /^@import url\("\.\/components\/(z-[a-z0-9-]+)\/\1\.css"\);/gm], ["zoe.js", /^import "\.\/components\/(z-[a-z0-9-]+)\/\1\.js";/gm]]) {
	const listed = [...(await readFile(join(ROOT, file), "utf8")).matchAll(pattern)].map((match) => match[1]).sort();
	for (const name of onDisk) if (!listed.includes(name)) say(`${file} · ${name} existe sur le disque mais n'est pas listé`);
	for (const name of listed) if (!onDisk.includes(name)) say(`${file} · ${name} est listé mais n'existe pas sur le disque`);
	const duplicates = listed.filter((name, i) => listed.indexOf(name) !== i);
	for (const name of new Set(duplicates)) say(`${file} · ${name} est listé deux fois`);
}
/* Un composant sur le disque qui manque à sa propre feuille : la page le charge en JS,
   rien ne le peint. */
for (const name of onDisk) {
	if (!existsSync(join(ROOT, "components", name, `${name}.css`))) say(`components/${name} · ${name}.css manquant`);
}

/* 3 · Les liens relatifs des pages HTML. */
const htmlFiles = await collect(ROOT, (path) => path.endsWith(".html"));
const attributePattern = /\b(?:href|src)=["']([^"'#?]+)(?:[#?][^"']*)?["']/g;
for (const file of htmlFiles) {
	const html = await readFile(file, "utf8");
	for (const match of html.matchAll(attributePattern)) {
		const target = match[1];
		if (/^(https?:|mailto:|data:|javascript:|\/\/)/.test(target) || target === "") continue;
		const resolved = target.startsWith("/") ? join(ROOT, target) : resolve(dirname(file), target);
		const candidate = existsSync(resolved) && (await stat(resolved)).isDirectory() ? join(resolved, "index.html") : resolved;
		if (!existsSync(candidate)) say(`liens · ${rel(file)} → "${target}" introuvable`);
	}
}

/* 4 · dist/zoe.json à jour ? On compare la LISTE des balises et des chemins (pas la date). */
try {
	const built = JSON.parse(await readFile(join(ROOT, "dist", "zoe.json"), "utf8"));
	const fingerprint = (idx) => JSON.stringify(idx.elements.map((entry) => [entry.tag, entry.example, entry.paths, entry.attributes.map((attribute) => attribute.name), entry.members.map((member) => member.name)]));
	if (fingerprint(built) !== fingerprint(index)) say("dist · dist/zoe.json est en retard sur le code — lancer `npm run manifest`");
} catch {
	say("dist · dist/zoe.json absent — lancer `npm run manifest`");
}

/* ── Compte rendu ── */
const counts = ["core", "tools", "components"].map((kind) => `${index.elements.filter((entry) => entry.kind === kind).length} ${kind}`).join(" · ");
if (!problems.length) {
	console.log(`✓ check : ${index.elements.length} éléments (${counts}) · ${htmlFiles.length} pages · zoe.css/zoe.js alignés · aucun lien mort · dist à jour`);
	process.exit(0);
}
console.error(`✗ check : ${problems.length} manque(s)\n`);
for (const problem of problems) console.error(`  · ${problem}`);
process.exit(1);

/* Tous les fichiers sous `dir` (hors node_modules, .git, dist) qui passent le filtre. */
async function collect(dir, keep) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (["node_modules", ".git", "dist", ".concurrency"].includes(entry.name)) continue;
		const path = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...await collect(path, keep));
		else if (keep(path)) out.push(path);
	}
	return out;
}

/* @param {string} file @returns {string} */
function rel(file) {
	return relative(ROOT, file).replace(/\\/g, "/");
}
