/*
	z-mcp.test — le cœur (sans processus) puis le serveur réel (un vrai aller-retour
	JSON-RPC sur stdio, comme le ferait Claude Code).
*/
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createCore } from "./z-mcp.lib.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

async function realCore() {
	const index = JSON.parse(await readFile(join(ROOT, "dist/zoe.json"), "utf8"));
	return createCore({
		index, version: "test",
		grammar: await readFile(join(ROOT, "docs/GRAMMAR.md"), "utf8"),
		narratives: { "z-button": "# z-button\n\nDoc de test." },
		llms: "llms", llmsFull: "full", manifest: "{}", skinsCss: { hightech: ":root{}" }
	});
}

test("les outils sont déclarés avec un schéma JSON valide", async () => {
	const core = await realCore();
	assert.deepEqual(core.tools.map((tool) => tool.name), ["zoe_grammar", "zoe_list", "zoe_get", "zoe_example", "zoe_search", "zoe_skins", "zoe_lint"]);
	for (const tool of core.tools) {
		assert.match(tool.name, /^[a-zA-Z0-9_-]{1,64}$/);
		assert.equal(tool.inputSchema.type, "object");
		assert.ok(tool.description.length > 20);
	}
});

test("zoe_get rend la fiche, en français aussi, avec le narratif", async () => {
	const core = await realCore();
	const en = core.callTool("zoe_get", { tag: "<z-button>" }).content[0].text;
	assert.match(en, /### <z-button>/);
	assert.match(en, /```html/);
	assert.match(en, /Attributes:/);
	assert.match(en, /Doc de test/);
	const fr = core.callTool("zoe_get", { tag: "button", lang: "fr", narrative: false }).content[0].text;
	assert.match(fr, /Un bouton/);
	assert.doesNotMatch(fr, /Doc de test/);
});

test("zoe_get sur une balise inconnue : résultat en erreur avec suggestion", async () => {
	const core = await realCore();
	const result = core.callTool("zoe_get", { tag: "z-buton" });
	assert.equal(result.isError, true);
	assert.match(result.content[0].text, /Did you mean <z-button>/);
});

test("zoe_list filtre par famille et par mot ; zoe_search trouve par token et par pièce", async () => {
	const core = await realCore();
	const tools = core.callTool("zoe_list", { kind: "tools" }).content[0].text;
	assert.match(tools, /z-channel/);
	assert.doesNotMatch(tools, /<z-button>/);
	const search = core.callTool("zoe_search", { query: "dot" }).content[0].text;
	assert.match(search, /<z-checkbox>.*part dot/);
	const token = core.callTool("zoe_search", { query: "--z-slider__progress" }).content[0].text;
	assert.match(token, /<z-slider>/);
});

test("zoe_lint signale et suggère ; zoe_skins liste les tokens ; zoe_example rend le HTML", async () => {
	const core = await realCore();
	const lint = core.callTool("zoe_lint", { css: "z-button:state(hovered) { --z-button-bg: red; }" });
	assert.match(lint.content[0].text, /did you mean `over`/);
	assert.match(lint.content[0].text, /--z-button--background__color/);
	const skins = core.callTool("zoe_skins", { id: "hightech" }).content[0].text;
	assert.match(skins, /--z-accent: /);
	const example = core.callTool("zoe_example", { tag: "z-checkbox" }).content[0].text;
	assert.match(example, /^<z-checkbox/);
});

test("ressources : la grammaire et un .doc.md se lisent ; une URI inconnue échoue", async () => {
	const core = await realCore();
	assert.ok(core.resources.some((resource) => resource.uri === "zoe://doc/z-button"));
	assert.match(core.readResource("zoe://grammar").contents[0].text, /# Zoé — the grammar/);
	assert.throws(() => core.readResource("zoe://nope"), /Unknown resource/);
	assert.throws(() => core.callTool("zoe_nope"), /Unknown tool/);
});

test("le serveur réel : initialize → tools/list → tools/call → resources/read, sur stdio", async () => {
	const child = spawn(process.execPath, [join(HERE, "z-mcp.js")], { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
	const replies = new Map();
	let buffer = "";
	const done = new Promise((resolve) => {
		child.stdout.on("data", (chunk) => {
			buffer += chunk;
			let index;
			while ((index = buffer.indexOf("\n")) !== -1) {
				const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
				if (!line.trim()) continue;
				const message = JSON.parse(line);
				replies.set(message.id, message);
				if (replies.size === 5) resolve();
			}
		});
	});
	const send = (message) => child.stdin.write(JSON.stringify(message) + "\n");
	send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
	send({ jsonrpc: "2.0", method: "notifications/initialized" });
	send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
	send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "zoe_example", arguments: { tag: "z-button" } } });
	send({ jsonrpc: "2.0", id: 4, method: "resources/read", params: { uri: "zoe://grammar" } });
	send({ jsonrpc: "2.0", id: 5, method: "nope/method" });

	const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("le serveur n'a pas répondu en 15 s")), 15000));
	try {
		await Promise.race([done, timeout]);
	} finally {
		child.stdin.end();
		child.kill();
	}
	assert.equal(replies.get(1).result.protocolVersion, "2025-06-18");
	assert.equal(replies.get(1).result.serverInfo.name, "zoe");
	assert.ok(replies.get(1).result.instructions.includes("zoe_grammar"));
	assert.equal(replies.get(2).result.tools.length, 7);
	assert.match(replies.get(3).result.content[0].text, /<z-button>/);
	assert.match(replies.get(4).result.contents[0].text, /grammar/);
	assert.equal(replies.get(5).error.code, -32601);
});
