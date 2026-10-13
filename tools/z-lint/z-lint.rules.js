/*
	============================================================
	z-lint.rules — LA CONSOLE QUI CORRIGE : les règles, pures
	------------------------------------------------------------
	Le navigateur jette une propriété inconnue SANS UN MOT : `--z-button-bg: red` ne
	peint rien, `z-button:state(hovered)` ne matche jamais, `<z-buton>` reste une boîte
	vide. Pour un humain c'est « Zoé est cassée » ; pour une IA agentique c'est une
	hallucination qui passe. Ces règles lisent du HTML et du CSS, les confrontent au
	vocabulaire RÉEL (dist/zoe.json, généré depuis le code) et proposent le nom le plus
	proche. Une IA qui lit la console se corrige seule — à condition que la suggestion
	soit juste, et elle l'est parce que la grammaire est régulière.

	Ce module ne touche ni au DOM ni au réseau : il prend du texte et un vocabulaire,
	rend des constats. Il tourne dans le navigateur (z-lint.js) et dans Node (le serveur
	MCP, les tests). Une seule implémentation pour les deux.

	Un constat : { level: "error" | "warn" | "info", kind, found, expected, message }.
	  error — ce qui ne marchera jamais (balise inconnue, ::part en light DOM)
	  warn  — ce qui ne fera rien de ce qu'on croit (état, attribut, token inconnus)
	  info  — ce qui est permis mais probablement une faute (token global inconnu)

	Styleguide tool.lint
	============================================================
*/

/* Les attributs HTML que tout élément accepte — jamais signalés. */
const GLOBAL_ATTRIBUTES = new Set(["id", "class", "style", "hidden", "title", "lang", "dir", "tabindex", "role", "slot", "part", "inert", "popover", "autofocus", "draggable", "translate", "accesskey", "contenteditable", "spellcheck", "nonce", "is", "itemprop", "itemscope", "itemtype", "exportparts", "channel", "state", "size", "tone", "width", "commandfor", "command", "popovertarget", "popovertargetaction", "name", "value", "disabled", "required", "form", "type", "for"]);

/* Les états que tout z-element porte : connus même quand un composant ne les redit pas. */
const BASE_STATES = ["default", "over", "press", "release", "releaseOut", "drag", "focus", "enter", "exit", "current", "select", "unselect", "loading", "disabled", "error", "success"];

/* Les formes mortes du pacte, reconnues au premier regard. */
const DEAD_FORMS = [
	{ pattern: /::part\(/g, kind: "dead-form", message: "`::part()` only applies to shadow DOM; Zoé is light DOM — target the piece with `> [part=…]`." },
	{ pattern: /\[state=["']?[\w-]+["']?\]/g, kind: "dead-form", message: "`[state=…]` cannot work: an element is `over` AND `press` at once — use `:state(name)`." },
	{ pattern: /\.(?:z-|is-|on)(?:over|hover|press|pressed|active|release|current|focus|drag|disabled|loading|error|success)\b/g, kind: "dead-form", message: "states are not classes — use `z-x:state(name)`." }
];

/*
	Distance de Levenshtein — le coût minimal pour transformer `a` en `b`. Classique,
	itérative, sans allocation inutile : le vocabulaire fait quelques centaines de mots.
	@param {string} a @param {string} b @returns {number}
*/
export function levenshtein(a, b) {
	if (a === b) return 0;
	if (!a.length) return b.length;
	if (!b.length) return a.length;
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
		}
		previous = current;
	}
	return previous[b.length];
}

/*
	Le candidat le plus proche d'un mot, ou null si rien n'est assez proche. Le seuil
	grandit avec la longueur : deux fautes sur `over`, c'est un autre mot ; sur
	`background-color`, c'est une coquille. Insensible à la casse (`releaseout`).
	@param {string} word
	@param {Iterable<string>} candidates
	@returns {string|null}
*/
export function nearest(word, candidates) {
	const lower = word.toLowerCase();
	let best = null;
	let bestDistance = Infinity;
	for (const candidate of candidates) {
		const distance = levenshtein(lower, candidate.toLowerCase());
		if (distance < bestDistance) { best = candidate; bestDistance = distance; }
	}
	/* La tolérance suit le plus LONG des deux mots : « hovered » → « over » coûte trois
	   lettres et doit passer ; « banana » → « over » aussi, et ne doit pas. */
	const tolerance = Math.max(2, Math.ceil(Math.max(lower.length, (best || "").length) / 3));
	return bestDistance <= tolerance ? best : null;
}

/* Les abréviations qu'un auteur écrit par réflexe, et le mot du pacte qu'elles cachent. */
const ABBREVIATIONS = { bg: "background", fg: "color", col: "color", colour: "color", txt: "label", text: "label", br: "border", bdr: "border", rad: "radius", radius: "radius", pad: "padding", sz: "size", w: "width", h: "height", dur: "duration", anim: "animation", shadow: "shadow", fill: "background", stroke: "border" };

/*
	Le token du pacte le plus proche d'un nom mal écrit, POUR une balise donnée. La
	distance d'édition seule ne suffit pas : `--z-button-bg` est à dix-sept lettres de
	`--z-button--background__color`. On lit donc les MOTS de ce que l'auteur a écrit
	(`bg` → background), on cherche les tokens qui les contiennent, et la distance ne
	départage que les ex æquo.
	@param {string} name        le token écrit, ex. --z-button-bg
	@param {string} tag         la balise reconnue en préfixe
	@param {Iterable<string>} tokens  les tokens connus de cette balise
	@returns {string|null}
*/
export function nearestToken(name, tag, tokens) {
	const rest = name.slice(`--${tag}`.length);
	const words = rest.split(/[-_]+/).filter(Boolean).map((word) => ABBREVIATIONS[word.toLowerCase()] || word.toLowerCase());
	let best = null;
	let bestScore = -Infinity;
	let bestHits = 0;
	for (const token of tokens) {
		const body = token.slice(`--${tag}`.length).toLowerCase();
		const hits = words.filter((word) => body.includes(word)).length;
		const score = hits * 100 - levenshtein(rest.toLowerCase(), body);
		if (score > bestScore) { best = token; bestScore = score; bestHits = hits; }
	}
	if (best === null) return null;
	return bestHits > 0 || levenshtein(name.toLowerCase(), best.toLowerCase()) <= 3 ? best : null;
}

/*
	Le vocabulaire, bâti depuis l'index zoe.json : par balise, ses attributs, ses états,
	ses pièces, ses tokens ; plus les tokens globaux des peaux et les presets de mouvement.
	@param {{ elements: object[], globalTokens?: string[], motion?: { presets: string[] } }} index
	@returns {{ tags: Map<string, { attributes: Set<string>, states: Set<string>, parts: Set<string>, tokens: Set<string> }>, globalTokens: Set<string>, presets: Set<string> }}
*/
export function buildVocabulary(index) {
	const tags = new Map();
	for (const entry of index.elements) {
		if (entry.attributeTool) continue;   /* z-channel, z-motion, z-lint : pas des balises */
		const parts = new Set();
		const walk = (layers) => { for (const layer of layers || []) { parts.add(layer.part); walk(layer.children); } };
		walk(entry.layers);
		tags.set(entry.tag, {
			attributes: new Set((entry.attributes || []).map((attribute) => attribute.name)),
			states: new Set([...BASE_STATES, ...(entry.states || []).map((state) => (typeof state === "string" ? state : state.name))]),
			parts,
			tokens: new Set([...(entry.tokens || []).map((token) => token.name), ...(entry.cssVars || []).map((variable) => variable.name)])
		});
	}
	return {
		tags,
		globalTokens: new Set(index.globalTokens || []),
		presets: new Set(index.motion?.presets || [])
	};
}

/*
	Les constats sur un fragment HTML : balises `z-*` inconnues, attributs inconnus sur
	une balise connue. Lecture par expressions régulières — on cherche des fautes
	d'auteur, pas une conformité HTML5.
	@param {string} html
	@param {ReturnType<typeof buildVocabulary>} vocabulary
	@returns {object[]}
*/
export function lintHtml(html, vocabulary) {
	const findings = [];
	const tagPattern = /<(z-[a-z0-9-]+)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g;
	for (const match of html.matchAll(tagPattern)) {
		const [, tag, rawAttributes] = match;
		const known = vocabulary.tags.get(tag);
		if (!known) {
			const suggestion = nearest(tag, vocabulary.tags.keys());
			findings.push(finding("error", "unknown-tag", `<${tag}>`, suggestion && `<${suggestion}>`, `unknown element <${tag}>${suggestion ? ` — did you mean <${suggestion}>?` : ""}`));
			continue;
		}
		for (const attribute of attributeNames(rawAttributes)) {
			if (isAllowedAttribute(attribute, known)) continue;
			const suggestion = nearest(attribute, known.attributes);
			findings.push(finding("warn", "unknown-attribute", `<${tag} ${attribute}>`, suggestion, `<${tag}> has no attribute \`${attribute}\`${suggestion ? ` — did you mean \`${suggestion}\`?` : ` — it is ignored`}`));
		}
	}
	return findings;
}

/*
	Les constats sur du CSS : états inconnus, pièces inconnues, tokens hors grammaire ou
	non lus, formes mortes, presets inconnus.
	@param {string} css
	@param {ReturnType<typeof buildVocabulary>} vocabulary
	@returns {object[]}
*/
export function lintCss(css, vocabulary) {
	const findings = [];
	const text = css.replace(/\/\*[\s\S]*?\*\//g, "");

	/* Ce que l'auteur déclare lui-même est légitime : états en @property, @keyframes. */
	const declaredStates = new Set([...text.matchAll(/@property\s+--z-state__([\w-]+)/g)].map((match) => match[1]));
	const declaredKeyframes = new Set([...text.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));

	for (const dead of DEAD_FORMS) {
		for (const match of text.matchAll(dead.pattern)) findings.push(finding("error", dead.kind, match[0], null, dead.message));
	}

	/*
		Les SÉLECTEURS — états et pièces, en tenant compte de l'imbrication : dans
		`z-button { &:state(over) { > [part=label] {…} } }`, la balise qui donne le sens est
		celle du bloc parent. On marche donc dans les accolades, et chaque sélecteur
		composé hérite de la balise la plus proche au-dessus de lui.
	*/
	walkSelectors(text, (selector, parents) => {
		const inherited = [...parents].reverse().map(leadingTag).find(Boolean) || null;
		for (const piece of selector.split(",")) {
			let current = inherited;
			for (const compound of piece.trim().split(/\s*[\s>+~]\s*/).filter(Boolean)) {
				const own = leadingTag(compound);
				if (own) current = own;
				else if (compound.includes("&")) current = inherited;
				if (own && !vocabulary.tags.has(own)) {
					if (!seen(findings, `<${own}>`)) {
						const suggestion = nearest(own, vocabulary.tags.keys());
						findings.push(finding("error", "unknown-tag", `<${own}>`, suggestion && `<${suggestion}>`, `unknown element <${own}> in a selector${suggestion ? ` — did you mean <${suggestion}>?` : ""}`));
					}
					continue;
				}
				const known = current ? vocabulary.tags.get(current) : null;
				if (!known) continue;
				for (const [, raw] of compound.matchAll(/:state\(([^)]+)\)/g)) {
					const name = raw.trim();
					if (known.states.has(name) || declaredStates.has(name) || /^from-[\w-]+$/.test(name)) continue;
					const suggestion = nearest(name, known.states);
					findings.push(finding("warn", "unknown-state", `${current}:state(${name})`, suggestion && `${current}:state(${suggestion})`, `<${current}> never poses the state \`${name}\`${suggestion ? ` — did you mean \`${suggestion}\`?` : ""}`));
				}
				if (!known.parts.size) continue;
				for (const [, part] of compound.matchAll(/\[part=["']?([a-z0-9-]+)["']?\]/g)) {
					if (known.parts.has(part)) continue;
					const suggestion = nearest(part, known.parts);
					findings.push(finding("warn", "unknown-part", `${current} [part=${part}]`, suggestion && `[part=${suggestion}]`, `<${current}> has no \`${part}\` layer${suggestion ? ` — did you mean \`${suggestion}\`?` : ` (its parts: ${[...known.parts].join(", ")})`}`));
				}
			}
		}
	});

	/* Les variables --z-… : grammaire du pacte, puis existence. */
	const sortedTags = [...vocabulary.tags.keys()].sort((a, b) => b.length - a.length);   /* z-radio-group avant z-radio */
	for (const name of new Set([...text.matchAll(/--z-[\w-]+/g)].map((match) => match[0]))) {
		if (name.startsWith("--z-state__") || name.startsWith("--z-channel-") || name.startsWith("--z-tone__") || name.startsWith("--z-layer--")) continue;
		/* Un token qu'une peau déclare sur :root est légitime, même s'il porte le nom d'un
		   composant en préfixe (`--z-contact-fx` : la signature de la peau, pas une pièce). */
		if (vocabulary.globalTokens.has(name)) continue;
		const tag = sortedTags.find((candidate) => name === `--${candidate}` || name.startsWith(`--${candidate}--`) || name.startsWith(`--${candidate}__`) || name.startsWith(`--${candidate}-`));
		if (tag) {
			const known = vocabulary.tags.get(tag);
			if (known.tokens.has(name)) continue;
			const grammatical = new RegExp(`^--${tag}(--[a-z0-9]+(?:-[a-z0-9]+)*)?__[a-z0-9]+(?:-[a-z0-9]+)*$`).test(name);
			const suggestion = nearestToken(name, tag, known.tokens);
			if (!grammatical) {
				findings.push(finding("warn", "token-grammar", name, suggestion, `\`${name}\` is not in the pact's grammar \`--z-{component}[--{part}]__{css-property}\`${suggestion ? ` — did you mean \`${suggestion}\`?` : ""}`));
			} else {
				findings.push(finding("info", "unread-token", name, suggestion, `no CSS of <${tag}> reads \`${name}\`${suggestion ? ` — did you mean \`${suggestion}\`?` : " — setting it paints nothing"}`));
			}
			continue;
		}
		if (vocabulary.globalTokens.has(name)) continue;
		const suggestion = nearest(name, vocabulary.globalTokens);
		if (suggestion) findings.push(finding("info", "unknown-global-token", name, suggestion, `\`${name}\` is not a skin token — did you mean \`${suggestion}\`?`));
	}

	/* animation: name — un preset qui n'existe pas ne bouge pas. */
	for (const match of text.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)) {
		for (const name of animationNames(match[1])) {
			if (vocabulary.presets.has(name) || declaredKeyframes.has(name)) continue;
			const suggestion = nearest(name, vocabulary.presets);
			if (suggestion) findings.push(finding("info", "unknown-preset", name, suggestion, `no @keyframes named \`${name}\` — did you mean the z-motion preset \`${suggestion}\`?`));
		}
	}

	return findings;
}

/*
	Tout d'un coup : HTML et CSS, dédoublonnés (une même faute écrite dix fois ne vaut
	qu'un constat), les erreurs d'abord.
	@param {{ html?: string, css?: string }} source
	@param {ReturnType<typeof buildVocabulary>} vocabulary
	@returns {object[]}
*/
export function lint({ html = "", css = "" }, vocabulary) {
	const all = [...lintHtml(html, vocabulary), ...lintCss(css, vocabulary)];
	const unique = new Map();
	for (const item of all) unique.set(`${item.kind}|${item.found}`, item);
	const rank = { error: 0, warn: 1, info: 2 };
	return [...unique.values()].sort((a, b) => rank[a.level] - rank[b.level]);
}

/* Une ligne lisible par constat — ce que la console et le serveur MCP affichent. */
export function formatFinding(item) {
	const mark = { error: "✗", warn: "⚠", info: "·" }[item.level];
	return `${mark} ${item.message}`;
}

/* ── privé ── */

function finding(level, kind, found, expected, message) {
	return { level, kind, found, expected: expected || null, message };
}

function seen(findings, found) {
	return findings.some((item) => item.found === found);
}

/*
	Marche dans les blocs d'une feuille : à chaque `{`, le texte qui précède est un
	sélecteur (ou une at-rule, qu'on ne visite pas mais qu'on empile, pour que ses enfants
	gardent leurs parents). Un `;` clôt une déclaration : il vide le tampon pour que le
	sélecteur suivant ne traîne pas `color: red` devant lui.
	@param {string} text  du CSS sans commentaires
	@param {(selector: string, parents: string[]) => void} visit
*/
function walkSelectors(text, visit) {
	const stack = [];
	let buffer = "";
	for (const char of text) {
		if (char === "{") {
			const selector = buffer.trim();
			if (!selector.startsWith("@")) visit(selector, stack.filter((parent) => !parent.startsWith("@")));
			stack.push(selector);
			buffer = "";
		} else if (char === "}") {
			stack.pop();
			buffer = "";
		} else if (char === ";") {
			buffer = "";
		} else {
			buffer += char;
		}
	}
}

/* Les mots-clés du raccourci `animation` qui ne sont jamais un nom de @keyframes. */
const ANIMATION_KEYWORDS = new Set(["ease", "linear", "ease-in", "ease-out", "ease-in-out", "step-start", "step-end", "infinite", "normal", "reverse", "alternate", "alternate-reverse", "none", "forwards", "backwards", "both", "running", "paused", "initial", "inherit", "unset", "revert", "auto", "scroll", "view"]);

/*
	Les noms de @keyframes d'une valeur `animation` — telle qu'écrite (`shake .3s`) OU telle
	que le CSSOM la rend (`0.3s ease 0s 1 normal none running shake` : le navigateur range
	le nom en DERNIER). On retire les fonctions (cubic-bezier(…), var(…)), on coupe sur les
	virgules (plusieurs animations), et dans chaque morceau le nom est le seul mot qui n'est
	ni un temps, ni un nombre, ni un mot-clé.
	@param {string} value @returns {string[]}
*/
export function animationNames(value) {
	const names = [];
	const clean = value.replace(/[a-z-]+\([^)]*\)/gi, " ");
	for (const piece of clean.split(",")) {
		for (const token of piece.trim().split(/\s+/)) {
			if (!token || /^[\d.+-]/.test(token) || ANIMATION_KEYWORDS.has(token.toLowerCase())) continue;
			if (/^[a-zA-Z_][\w-]*$/.test(token)) names.push(token);
		}
	}
	return names;
}

/* La balise `z-*` qui ouvre un sélecteur composé (`z-button:state(over)` → z-button). */
function leadingTag(compound) {
	const match = compound.match(/^(z-[a-z0-9-]+)/);
	return match ? match[1] : null;
}

/* Les noms d'attributs d'une balise ouvrante (sans leurs valeurs). */
function attributeNames(raw) {
	return [...(raw || "").matchAll(/(?:^|\s)([^\s=>/"']+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g)].map((match) => match[1]).filter(Boolean);
}

function isAllowedAttribute(attribute, known) {
	const lower = attribute.toLowerCase();
	return known.attributes.has(lower) || GLOBAL_ATTRIBUTES.has(lower) || lower.startsWith("aria-") || lower.startsWith("data-") || lower.startsWith("on") || known.states.has(lower) || /^x-|^v-|^@|^:/.test(lower);
}
