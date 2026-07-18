/*
	serve.mjs — serveur de dev minimal (no-store, l'octet frais du disque).
	Usage : node scripts/serve.mjs [port]   (sert la racine du projet)
*/
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.argv[2] || 5174);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".md": "text/plain", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${port}`);
	const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
	const target = normalize(join(root, pathname));
	if (!target.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
	try {
		const body = await readFile(target);
		res.writeHead(200, { "content-type": types[extname(target)] || "text/plain", "cache-control": "no-store, max-age=0" });
		res.end(body);
	} catch { res.writeHead(404); res.end("Not found"); }
}).listen(port, () => console.log(`✓ Zoé dev: http://localhost:${port}`));
