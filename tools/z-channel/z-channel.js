/*
	z-channel — LE CANAL (les composants se parlent sans se connaître)
	------------------------------------------------------------
	OUTIL INDÉPENDANT. Il ne connaît ni z-element, ni un composant Zoé, ni une peau.
	Importe-le seul dans une page de HTML nu, il marche :

	    <input type="range" channel="tempo">
	    <div class="barre" channel="tempo"></div>
	    <script type="module" src="tools/z-channel/z-channel.js"></script>

	    .barre { width: calc(var(--z-channel-tempo) * 1%); }

	Il s'arme tout seul à l'import, comme le ferait un attribut natif.

	───────────────────────────────────────────────────────────
	LA PHRASE QUI LE DÉFINIT :

	  « Le canal ne fait qu'UNE chose : poser --z-channel-{nom} sur ses membres.
	    Ce que cette valeur pilote est décidé en CSS. »

	Donc il ne peint RIEN lui-même — il ne vole rien aux peaux. C'est la loi qui a
	écrit ce fichier : chaque verbe du JS est un pouvoir volé aux peaux.

	───────────────────────────────────────────────────────────
	1. QUI ÉMET, QUI LIT — jamais écrit, toujours déduit

	  émettre = avoir une valeur qui change et lever un événement. Un <input>
	           natif, un z-slider, un z-range : leur nature suffit.
	  lire    = gratuit et universel. Le token est posé sur TOUS les membres ;
	           ton CSS s'en sert ou pas. Un <div> vide ne fait que lire.

	Aucun `channel-in` / `channel-out` : deux formes = mort (loi « une seule forme »).

	2. MULTI-CANAL — gratuit, sans plafond

	    <z-dot channel="x y"></z-dot>     ← membre de DEUX canaux
	    z-dot { left: calc(var(--z-channel-x) * 1%);
	            top:  calc(var(--z-channel-y) * 1%); }

	Deux noms, deux tokens posés sur l'hôte. Douze noms, douze tokens. Et dans
	l'autre sens un seul canal pilote autant de propriétés CSS que la peau veut :
	largeur ET teinte ET rotation — c'est le CSS qui décide, donc la peau.

	3. MULTI-PROPRIÉTÉ — la grammaire de Christophe, pas une nouvelle syntaxe

	Un z-range a DEUX sorties (low/high), un color-picker en a trois. On refuse
	`channel="prix:low autre:high"` : ce serait une deuxième langue à apprendre,
	et un mapping que je peux halluciner. À la place le composant ÉCLATE ses
	sorties avec le séparateur double, celui des frontières sujet → part :

	    <z-range channel="prix">   pose   --z-channel-prix--low
	                                      --z-channel-prix--high

	L'auteur ne donne qu'UN nom. Les parts sont nommées par le composant (donc
	dans le manifeste, donc une IA les connaît et la console peut les corriger).
	Rien à faire correspondre → rien à halluciner.

	UNE SEULE FORME, avec un segment qui peut manquer :

	    --z-channel-{nom}              une sortie   (90 % des cas : .value)
	    --z-channel-{nom}--{part}      N sorties    (déclaré par le composant)

	C'est exactement le choix déjà tranché pour `--z-{composant}[--{part}]__{prop}` :
	la part est optionnelle, elle n'apparaît que quand elle existe.

	4. COMMENT UN COMPOSANT DÉCLARE PLUSIEURS SORTIES

	Par duck-typing, jamais par un import : l'outil regarde
	`element.constructor.channelParts`. Un composant Zoé le déclare (z-element le
	documente) ; un <input> natif ne l'a pas → une sortie, `.value`. L'outil reste
	utilisable sans Zoé, et Zoé reste utilisable sans l'outil.

	5. L'ENCAPSULATION (shadow DOM) — la frontière, exacte

	  ✔ la PEINTURE traverse : le token est posé sur l'HÔTE, il descend dans la
	    shadow par héritage. Une peau encapsulée lit var(--z-channel-x), fin.
	  ✘ le JS ne traverse pas : querySelectorAll s'arrête à la frontière.
	  ✘ `change` natif est composed:false, il meurt à la frontière (`input`, lui,
	    est composed:true et arrive retargé sur l'hôte). Les composants Zoé
	    ré-émettent en composed:true — d'où l'écoute de z-input/z-change ici.

	  ⚠ LA RÈGLE QUI EN SORT : `channel=` se porte sur la BALISE du composant,
	    jamais sur ses entrailles. Le canal relie des HÔTES ; il atteint le dedans
	    par le CSS, jamais par le JS. C'est cohérent avec la loi : le dedans
	    appartient à la peau, il ne se référence pas depuis l'extérieur.

	6. CE QU'ON REFUSE
	  · un objet JSON sur une ardoise → il faudrait le déballer en JS, on perd le
	    CSS qui lisait tout seul. Une ardoise = une chose simple ;
	  · un attribut `pilot=` → le pilote, c'est la ligne CSS ;
	  · un désabonnement → l'abonnement EST l'attribut. Retire l'élément, il quitte
	    le canal. Aucune fuite possible, et le graphe réactif est le DOM lui-même :
	    querySelectorAll('[channel~=x]') montre qui écoute.

	Styleguide 0
	============================================================
*/

/*
	L'API du canal, pour la doc générée et le manifeste. z-channel n'est pas une
	balise mais un ATTRIBUT (`channel=`) : `attributeTool` le dit au viewer (il montre
	le nom du tool, pas une fausse balise <z-channel>), et `example` pointe l'essai
	vivant qu'il incruste. Même contrat que le `static api` des composants.
*/
export const api = {
	tag: "z-channel",
	attributeTool: true,
	example: "tools/z-channel/z-channel.lab.html",
	summary: {
		fr: "Le canal : deux éléments qui portent le même channel=\"nom\" sont reliés. Ce qui change ici bouge là-bas — et c'est le CSS qui décide quoi. Zéro classe, zéro écouteur.",
		en: "The channel: two elements sharing the same channel=\"name\" are linked. What changes here moves there — and the CSS decides what. No class, no listener.",
		es: "El canal: dos elementos con el mismo channel=\"nombre\" quedan enlazados. Lo que cambia aquí se mueve allá — y el CSS decide qué. Sin clases, sin escuchadores."
	},
	attributes: [
		{
			name: "channel",
			type: "string",
			values: null,
			description: {
				fr: "Le(s) nom(s) de canal de cet élément, séparés par une espace (channel=\"x y\"). L'abonnement EST l'attribut : le poser fait entrer dans le canal, le retirer en sort.",
				en: "This element's channel name(s), space-separated (channel=\"x y\"). The subscription IS the attribute: adding it joins, removing it leaves.",
				es: "El/los nombre(s) de canal de este elemento, separados por espacio (channel=\"x y\"). La suscripción ES el atributo: ponerlo entra, quitarlo sale."
			}
		}
	],
	events: [],
	states: [],
	cssVars: [
		{
			name: "--z-channel-{nom}",
			description: {
				fr: "Posé par l'outil sur chaque membre : la valeur courante du canal. À lire en CSS — calc(var(--z-channel-tempo) * 1%).",
				en: "Set by the tool on every member: the channel's current value. Read it in CSS — calc(var(--z-channel-tempo) * 1%).",
				es: "Puesto por la herramienta en cada miembro: el valor actual del canal. Léalo en CSS — calc(var(--z-channel-tempo) * 1%)."
			}
		},
		{
			name: "--z-channel-{nom}--{part}",
			description: {
				fr: "Quand la source a plusieurs sorties (un z-range : low/high), une variable par part, avec le séparateur double du pacte.",
				en: "When the source has several outputs (a z-range: low/high), one variable per part, using the pact's double separator.",
				es: "Cuando la fuente tiene varias salidas (un z-range: low/high), una variable por parte, con el separador doble del pacto."
			}
		}
	]
};

/*
	La dernière valeur vue sur chaque canal. Sert à CALER un nouveau venu : un
	membre créé après coup adopte la valeur courante sans que personne ne la lui
	passe. C'est le pendant, côté valeur, de la délégation d'événements.
	@type {Map<string, unknown>}
*/
const lastValue = new Map();

/*
	Les événements qui portent un changement de valeur. `input`/`change` couvrent
	le HTML nu ; `z-input`/`z-change` couvrent les composants Zoé (émis en
	composed:true, donc ils sortent des shadow roots — voir §5).
*/
const VALUE_EVENTS = ["input", "change", "z-input", "z-change"];

/*
	Les parts de sortie d'un élément, ou null s'il n'en a qu'une (`.value`).
	Duck-typing volontaire : aucun import de z-element, l'outil reste autonome.
	@param {Element} element
	@returns {string[]|null}
*/
function partsOf(element) {
	const declared = /** @type {any} */ (element.constructor)?.channelParts;
	return Array.isArray(declared) && declared.length ? declared : null;
}

/*
	Les canaux dont un élément est membre. `channel="x y"` → ["x", "y"].
	@param {Element} element
	@returns {string[]}
*/
function channelsOf(element) {
	return (element.getAttribute("channel") || "").split(/\s+/).filter(Boolean);
}

/*
	Lit la valeur courante d'un émetteur. Une sortie → un scalaire ; plusieurs →
	un objet {part: valeur}. La valeur VIT dans le composant : on ne la stocke
	jamais à côté (deux chemins vers la même donnée divergent toujours).
	@param {Element} element
	@returns {unknown}
*/
function readValue(element) {
	const parts = partsOf(element);
	if (!parts) return /** @type {any} */ (element).value;

	const out = {};
	for (const part of parts) out[part] = /** @type {any} */ (element)[part];
	return out;
}

/*
	Écrit une valeur reçue dans un membre qui sait la porter — c'est ce qui rend
	le canal BIDIRECTIONNEL (deux sliders sur le même nom se suivent). On ne
	touche que ce qui existe déjà et ce qui a réellement changé : écrire une
	valeur identique relancerait un événement, donc une boucle.
	@param {Element} element
	@param {unknown} value
*/
function writeValue(element, value) {
	const target = /** @type {any} */ (element);
	const parts = partsOf(element);

	if (parts && value && typeof value === "object") {
		for (const part of parts) {
			if (!(part in value) || !(part in target)) continue;
			if (String(target[part]) !== String(value[part])) target[part] = value[part];
		}
		return;
	}

	if (value !== null && typeof value === "object") return;
	if (!("value" in target)) return;
	if (String(target.value) !== String(value)) target.value = value;
}

/*
	Pose le(s) token(s) du canal sur un membre. C'est LE geste de l'outil, et le
	seul qui traverse une shadow root (héritage de custom property).

	  scalaire → --z-channel-{nom}
	  objet    → --z-channel-{nom}--{part}, un par part

	@param {Element} element
	@param {string} name
	@param {unknown} value
*/
function paint(element, name, value) {
	const style = /** @type {HTMLElement} */ (element).style;

	if (value !== null && typeof value === "object") {
		for (const [part, one] of Object.entries(value)) {
			style.setProperty(`--z-channel-${name}--${part}`, String(one));
		}
		return;
	}
	style.setProperty(`--z-channel-${name}`, String(value));
}

/*
	Diffuse une valeur à tous les membres d'un canal : on peint TOUT LE MONDE
	(y compris la source — elle doit pouvoir se lire elle-même en CSS) mais on
	n'ÉCRIT pas dans la source, ce qui coupe la boucle d'événements.
	@param {string} name le nom du canal
	@param {unknown} value un scalaire, un mot, ou {part: valeur}
	@param {Element|null} source l'émetteur, ou null si c'est le monde (tune)
*/
export function broadcast(name, value, source = null) {
	if (!name) return;
	lastValue.set(name, value);

	for (const member of document.querySelectorAll(`[channel~="${name}"]`)) {
		paint(member, name, value);
		if (member !== source) writeValue(member, value);
	}
}

/*
	Le monde parle à un canal : un serveur, une horloge, une autre page. C'est la
	même porte que le doigt, pour ce qui n'a pas de doigt. Une valeur SANS rail
	(un thème) n'a que celle-ci : `channel="theme"` branche, il ne remplit pas.

	    tune("tempo", 70);
	    tune("prix", { low: 10, high: 90 });
	    tune("theme", "dark");

	@param {string} name
	@param {unknown} value
*/
export function tune(name, value) {
	broadcast(name, value, null);
}

/*
	Cale un membre sur l'état courant de ses canaux, à son arrivée. Deux cas :
	  · le canal a déjà une valeur → le nouveau venu l'adopte (il n'a rien raté) ;
	  · il n'en a pas encore ET ce membre sait émettre → c'est LUI qui l'amorce,
	    la valeur initiale vient donc du DOM, jamais d'un défaut inventé ici.
	@param {Element} element
*/
export function join(element) {
	for (const name of channelsOf(element)) {
		if (lastValue.has(name)) {
			paint(element, name, lastValue.get(name));
			writeValue(element, lastValue.get(name));
			continue;
		}
		const value = readValue(element);
		if (value !== undefined) broadcast(name, value, element);
	}
}

/*
	Câblage de la page, une fois pour toutes. Idempotent : rappelé, il ne recâble
	rien (l'outil peut être importé par dix modules).
*/
let wired = false;

export function wireChannels() {
	/* Hors vrai navigateur (outil de manifeste, SSR : `document` factice sans écouteurs),
	   l'outil ne s'arme pas — il n'a rien à câbler et ne doit pas planter l'import. */
	if (wired || typeof document === "undefined" || typeof document.addEventListener !== "function") return;
	wired = true;

	/*
		En CAPTURE : on veut l'événement même si quelqu'un l'arrête plus bas, et
		on veut voir les composants qui ré-émettent depuis leur hôte. Le closest()
		remonte à l'hôte membre — pour un événement sorti d'une shadow root, le
		navigateur a déjà retargé la cible sur cet hôte (voir §5).
	*/
	const relay = (/** @type {Event} */ event) => {
		const source = /** @type {Element} */ (event.target)?.closest?.("[channel]");
		if (!source) return;
		const value = readValue(source);
		if (value === undefined) return;
		for (const name of channelsOf(source)) broadcast(name, value, source);
	};
	for (const type of VALUE_EVENTS) document.addEventListener(type, relay, true);

	/*
		Les membres de demain. On surveille l'ajout de nœuds ET l'attribut lui-même :
		poser `channel="x"` à chaud fait entrer dans le canal, le retirer en sort.
		L'abonnement EST l'attribut — il n'y a rien d'autre à désabonner.
	*/
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "attributes") {
				const target = /** @type {Element} */ (mutation.target);
				if (target.hasAttribute("channel")) join(target);
				continue;
			}
			for (const node of mutation.addedNodes) {
				if (!(node instanceof Element)) continue;
				if (node.matches("[channel]")) join(node);
				for (const nested of node.querySelectorAll("[channel]")) join(nested);
			}
		}
	});
	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["channel"]
	});

	/* Les membres déjà là au chargement : l'observer ne les a pas vus naître. */
	const scan = () => {
		for (const member of document.querySelectorAll("[channel]")) join(member);
	};
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, { once: true });
	else scan();
}

/* Le canal est déclaratif : il s'arme seul, comme le ferait un attribut natif. */
wireChannels();
