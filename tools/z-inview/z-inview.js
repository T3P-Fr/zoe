/*
	============================================================
	z-inview — CE QUI EST À L'ÉCRAN, DIT AU CSS
	------------------------------------------------------------
	CE QU'IL RÉSOUT — « ça apparaît quand ça entre à l'écran ». La demande la plus
	répandue du web moderne : des BIBLIOTHÈQUES ENTIÈRES ne font que ça, et chacune
	arrive avec ses classes, sa configuration et son fichier à charger.

	    <z-inview>
	      <h2>ce titre entre en scène</h2>
	    </z-inview>

	    z-inview h2 {
	      opacity: var(--z-inview__seen);
	      translate: 0 calc((1 - var(--z-inview__seen)) * 20px);
	      transition: opacity .6s, translate .6s;
	    }

	Aucune classe posée par du JS, aucun nom à inventer, aucun catalogue d'animations à
	apprendre : l'apparition est écrite dans la peau, en CSS, comme le reste.

	CE QU'IL POSE (grammaire du pacte) :

	    --z-inview__in       1 dès qu'un pixel est visible, 0 sinon
	    --z-inview__ratio    la PART visible de l'élément, 0→1
	    --z-inview__seen     1 une fois vu — et il ne redescend JAMAIS
	    --z-inview__cross    la TRAVERSÉE de l'écran : 0 quand il entre par le bas,
	                         1 quand il sort par le haut

	POURQUOI `seen` EXISTE — une entrée en scène ne se rejoue pas. Sans lui, remonter
	dans la page rejouerait toutes les animations, et la page donnerait le tournis. C'est
	le défaut que tout le monde finit par corriger à la main (`observer.unobserve`) ;
	ici c'est un nombre de plus, et l'auteur choisit : `seen` pour une fois, `in` pour
	à chaque passage.

	POURQUOI `cross` EXISTE — `ratio` sature dès que l'élément tient tout entier à
	l'écran : il vaut 1 et ne bouge plus. Pour un décor qui glisse pendant toute la
	traversée, il faut un nombre qui continue de monter — c'est `cross`.

	LE COÛT, ET LE SOIN QU'IL DEMANDE — l'observateur (IntersectionObserver) est le
	moyen le moins cher de savoir qu'on entre à l'écran : le navigateur le calcule
	lui-même, sans écouter le défilement. Mais `cross` a besoin d'une mesure continue,
	elle : on ne l'écoute donc QUE pendant que l'élément est visible, et on débranche
	dès qu'il sort. Un élément hors de l'écran ne coûte rien.

	Styleguide tool.inview
	============================================================
*/

const TOKENS = [
	"--z-inview__in", "--z-inview__ratio", "--z-inview__seen", "--z-inview__cross"
];

if (typeof CSS !== "undefined" && typeof CSS.registerProperty === "function") {
	for (const name of TOKENS) {
		try {
			CSS.registerProperty({ name, syntax: "<number>", inherits: true, initialValue: "0" });
		} catch {
			/* Déjà enregistré (module importé deux fois, rechargement à chaud) : sans conséquence. */
		}
	}
}

/*
	LES SEUILS — l'observateur ne prévient qu'aux paliers qu'on lui donne. Vingt-et-un
	paliers (tous les 5 %) suffisent à rendre `ratio` continu à l'œil, sans demander au
	navigateur un calcul à chaque pixel.
*/
const SEUILS = Array.from({ length: 21 }, (_, i) => i / 20);

export class ZInview extends HTMLElement {

	static api = {
		tag: "z-inview",
		example: "tools/z-inview/z-inview.lab.html",
		summary: {
			en: "\"Fade it in when it scrolls into view\" — the single most common request on the web, and the reason whole libraries get loaded. Wrap it in this tag: the answer arrives in CSS as a number, and the animation stays yours to write.",
			fr: "« Ça apparaît quand ça entre à l'écran » — la demande la plus répandue du web, et la raison pour laquelle on charge des bibliothèques entières. Enveloppez-le dans cette balise : la réponse arrive dans le CSS sous forme de nombre, et l'animation reste la vôtre.",
			es: "« Que aparezca al entrar en pantalla » — la petición más común de la web, y el motivo por el que se cargan bibliotecas enteras. Envuélvalo en esta etiqueta: la respuesta llega al CSS como un número, y la animación sigue siendo suya."
		},
		attributes: [
			{
				name: "margin",
				type: "string",
				values: [{ value: "<longueur>", note: { en: "e.g. -80px — trigger later, once it is really in view", fr: "ex. -80px — déclencher plus tard, une fois vraiment entré", es: "p. ej. -80px — disparar más tarde, una vez realmente entrado" } }],
				description: {
					en: "Grows or shrinks the screen for this element only. A negative value waits until it is well inside; a positive one prepares it before it arrives.",
					fr: "Agrandit ou rétrécit l'écran, pour cet élément seulement. Une valeur négative attend qu'il soit bien entré ; une valeur positive le prépare avant qu'il n'arrive.",
					es: "Agranda o encoge la pantalla, solo para este elemento. Un valor negativo espera a que esté bien dentro; uno positivo lo prepara antes de que llegue."
				}
			}
		],
		events: [],
		states: [],
		cssVars: [
			{ name: "--z-inview__in", description: { en: "1 as soon as a single pixel is on screen, 0 otherwise — for what should play again at every pass.", fr: "1 dès qu'un seul pixel est à l'écran, 0 sinon — pour ce qui doit rejouer à chaque passage.", es: "1 en cuanto un solo píxel está en pantalla, 0 si no — para lo que debe repetirse en cada pasada." } },
			{ name: "--z-inview__ratio", description: { en: "The visible share of the element, 0→1. It saturates at 1 once the element fits entirely on screen.", fr: "La part visible de l'élément, 0→1. Elle sature à 1 dès que l'élément tient tout entier à l'écran.", es: "La parte visible del elemento, 0→1. Se satura en 1 cuando el elemento cabe entero en pantalla." } },
			{ name: "--z-inview__seen", description: { en: "1 once seen — and it NEVER goes back down. An entrance does not replay: this is the number that stops a page from making you dizzy on the way back up.", fr: "1 une fois vu — et il ne redescend JAMAIS. Une entrée en scène ne se rejoue pas : c'est le nombre qui évite le tournis en remontant la page.", es: "1 una vez visto — y NUNCA vuelve a bajar. Una entrada no se repite: es el número que evita el mareo al volver a subir." } },
			{ name: "--z-inview__cross", description: { en: "The crossing of the screen: 0 entering from the bottom, 1 leaving through the top. The number that keeps moving when ratio has saturated — for a decor that drifts the whole way through.", fr: "La traversée de l'écran : 0 quand il entre par le bas, 1 quand il sort par le haut. Le nombre qui continue de bouger quand ratio a saturé — pour un décor qui glisse pendant toute la traversée.", es: "La travesía de la pantalla: 0 al entrar por abajo, 1 al salir por arriba. El número que sigue moviéndose cuando ratio se ha saturado — para un decorado que se desliza durante todo el recorrido." } }
		]
	};

	static observedAttributes = ["margin"];

	#observer = null;

	/* La mesure continue de `cross` n'est branchée QUE pendant que l'élément est visible. */
	#suit = false;
	#frame = 0;

	#onScroll = () => {
		if (!this.#frame) this.#frame = requestAnimationFrame(() => this.#writeCross());
	};

	connectedCallback() {
		this.#warnUnknownAttributes();
		this.#observe();
	}

	disconnectedCallback() {
		this.#observer?.disconnect();
		this.#observer = null;
		this.#unfollow();
	}

	attributeChangedCallback() {
		/* La marge fait partie de la définition de l'observateur : il faut le refaire. */
		if (this.isConnected) { this.#observer?.disconnect(); this.#observe(); }
	}

	#observe() {
		const margin = this.getAttribute("margin");
		this.#observer = new IntersectionObserver((entries) => {
			for (const entry of entries) this.#onEntry(entry);
		}, {
			threshold: SEUILS,
			/* La marge s'applique aux quatre bords ; une seule valeur suffit à dire
			   « attends qu'il soit bien entré » (négative) ou « prépare-le » (positive). */
			rootMargin: margin || "0px"
		});
		this.#observer.observe(this);
	}

	/*
		Le rapport de l'observateur : trois nombres d'un coup. `seen` est le seul qui ne
		sait pas revenir en arrière — c'est tout son intérêt.
	*/
	#onEntry(entry) {
		const style = this.style;
		style.setProperty("--z-inview__in", entry.isIntersecting ? "1" : "0");
		style.setProperty("--z-inview__ratio", entry.intersectionRatio.toFixed(4));
		if (entry.isIntersecting) {
			style.setProperty("--z-inview__seen", "1");
			this.#follow();
		} else {
			this.#unfollow();
			/* Sorti de l'écran : on FIGE la traversée au bord qu'il vient de franchir,
			   0 en bas, 1 en haut. Sans ça, le décor resterait coincé à mi-course. */
			const parLeHaut = entry.boundingClientRect.bottom < 0;
			style.setProperty("--z-inview__cross", parLeHaut ? "1" : "0");
		}
	}

	/* Tant qu'il est à l'écran, on suit le défilement — et seulement tant qu'il y est. */
	#follow() {
		if (this.#suit) return;
		this.#suit = true;
		addEventListener("scroll", this.#onScroll, { passive: true });
		addEventListener("resize", this.#onScroll, { passive: true });
		this.#writeCross();
	}

	#unfollow() {
		if (!this.#suit) return;
		this.#suit = false;
		removeEventListener("scroll", this.#onScroll);
		removeEventListener("resize", this.#onScroll);
		if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
	}

	/*
		LA TRAVERSÉE — 0 quand le haut de l'élément touche le bas de l'écran, 1 quand son
		bas touche le haut de l'écran. La course totale est donc « la hauteur de l'écran
		plus celle de l'élément » : c'est le chemin qu'il parcourt de bord à bord.
	*/
	#writeCross() {
		this.#frame = 0;
		const box = this.getBoundingClientRect();
		const course = innerHeight + box.height;
		const parcouru = innerHeight - box.top;
		const cross = course > 0 ? parcouru / course : 0;
		this.style.setProperty("--z-inview__cross", Math.min(1, Math.max(0, cross)).toFixed(4));
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est jamais bloqué,
		mais il est DIT tout haut. `<z-inview once>` ne se perdrait pas en silence : c'est
		`--z-inview__seen` qu'il faut lire, pas un attribut.
	*/
	#warnUnknownAttributes() {
		const known = new Set(["margin"]);
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (known.has(name) || native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-inview] attribut inconnu « ${name} » — ignoré (jamais bloqué). Connus : margin. Pour « une seule fois », lis le token --z-inview__seen.`);
		}
	}
}

customElements.define("z-inview", ZInview);
