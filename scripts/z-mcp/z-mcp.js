/*
	============================================================
	z-mcp — LE SERVEUR MCP de Zoé (transport stdio, JSON-RPC 2.0)
	------------------------------------------------------------
	    node scripts/z-mcp/z-mcp.js        (ou `npm run mcp`)

	Branché dans Claude Code par `.mcp.json` (racine) ; dans Claude Desktop, Cursor ou
	tout client MCP par la même commande. Zéro dépendance : le protocole MCP n'est que du
	JSON-RPC 2.0, un message par ligne, sur stdin/stdout. On NE LOGUE JAMAIS sur stdout
	(ce serait un message corrompu) : les traces vont sur stderr.

	Tout le sens vit dans z-mcp.lib.js ; ici : lire le dépôt au démarrage, parser les
	lignes, répondre. Les données sont lues UNE fois : relancer le serveur après
	`npm run manifest` pour qu'il voie un nouveau composant.

	Styleguide tool.mcp
	============================================================
*/

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { ROOT, readNarratives } from "../z-manifest/z-manifest.lib.js";
import { createCore } from "./z-mcp.lib.js";

/* Les versions du protocole que ce serveur sait parler ; la plus récente d'abord. */
const PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];

async function loadData() {
	const read = (path) => readFile(join(ROOT, path), "utf8");
	const pkg = JSON.parse(await read("package.json"));
	const index = JSON.parse(await read("dist/zoe.json"));
	const skinsCss = {};
	for (const skin of index.skins) skinsCss[skin.id] = await read(skin.paths.css);
	return {
		version: pkg.version,
		index,
		grammar: await read("docs/GRAMMAR.md"),
		narratives: await readNarratives(index),
		llms: existsSync(join(ROOT, "llms.txt")) ? await read("llms.txt") : "",
		llmsFull: existsSync(join(ROOT, "llms-full.txt")) ? await read("llms-full.txt") : "",
		manifest: await read("dist/custom-elements.json"),
		skinsCss
	};
}

async function main() {
	const data = await loadData();
	const core = createCore(data);

	const send = (message) => process.stdout.write(JSON.stringify(message) + "\n");
	const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
	const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

	/* Un message JSON-RPC → une réponse (ou rien pour une notification). */
	function handle(message) {
		const { id, method, params = {} } = message;
		const isNotification = id === undefined || id === null;
		try {
			switch (method) {
				case "initialize": {
					const requested = params.protocolVersion;
					return reply(id, {
						protocolVersion: PROTOCOLS.includes(requested) ? requested : PROTOCOLS[0],
						capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
						serverInfo: { name: "zoe", version: data.version },
						instructions: core.instructions
					});
				}
				case "ping": return reply(id, {});
				case "tools/list": return reply(id, { tools: core.tools });
				case "tools/call": {
					try { return reply(id, core.callTool(params.name, params.arguments)); }
					catch (error) { return fail(id, error.code || -32602, error.message); }
				}
				case "resources/list": return reply(id, { resources: core.resources });
				case "resources/templates/list": return reply(id, { resourceTemplates: [] });
				case "resources/read": {
					try { return reply(id, core.readResource(params.uri)); }
					catch (error) { return fail(id, error.code || -32002, error.message); }
				}
				case "prompts/list": return reply(id, { prompts: [] });
				case "logging/setLevel": return reply(id, {});
				default:
					if (isNotification) return;                       /* notifications/initialized, notifications/cancelled… */
					return fail(id, -32601, `Method not found: ${method}`);
			}
		} catch (error) {
			if (!isNotification) fail(id, -32603, error.message);
			process.stderr.write(`z-mcp : ${error.stack || error}\n`);
		}
	}

	const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
	lines.on("line", (line) => {
		const trimmed = line.trim();
		if (!trimmed) return;
		let message;
		try { message = JSON.parse(trimmed); }
		catch { return fail(null, -32700, "Parse error"); }
		if (Array.isArray(message)) message.forEach(handle);
		else handle(message);
	});
	lines.on("close", () => process.exit(0));

	process.stderr.write(`z-mcp : Zoé ${data.version} — ${data.index.elements.length} éléments, ${core.tools.length} outils, ${core.resources.length} ressources. En écoute sur stdio.\n`);
}

main().catch((error) => { process.stderr.write(`z-mcp n'a pas pu démarrer : ${error.message}\n`); process.exit(1); });
