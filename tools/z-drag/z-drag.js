/*
	============================================================
	z-drag — DÉPLACER À LA MAIN, SANS ÉCRIRE LE DÉPLACEMENT
	------------------------------------------------------------
	CE QU'IL RÉSOUT — le plus gros paquet de JavaScript de n'importe quelle interface.
	Attraper, suivre, relâcher : trois événements, une capture de pointeur, un décalage
	à mémoriser, des limites à surveiller, et le clavier qu'on oublie toujours. Réécrit
	dans chaque projet, jamais tout à fait juste.

	    <z-drag>tire-moi</z-drag>

	    z-drag {
	      translate: calc(var(--z-drag__x) * 1px) calc(var(--z-drag__y) * 1px);
	    }

	LE RENVERSEMENT — l'outil ne DÉPLACE rien. Il pose la position, et c'est le CSS qui
	décide ce qu'elle bouge. Ça a l'air d'un détail, c'est tout l'inverse :

	  · un seul axe ?     n'utilise que `__x`, et rien d'autre à configurer
	  · pas un déplacement mais une ROTATION ? `rotate: calc(var(--z-drag__x) * 1deg)`
	  · un volume, une opacité, une couleur ? c'est le même nombre
	  · l'objet reste en place et c'est son OMBRE qui bouge ? évidemment

	Aucune option ne pouvait couvrir ça. Un nombre, si.

	CE QU'IL POSE (grammaire du pacte) :

	    --z-drag__x  --z-drag__y      la position, en pixels depuis le point de départ
	    --z-drag__rx --z-drag__ry     la PART parcourue dans les limites, 0→1 (avec `bounds`)
	    --z-drag__held                1 pendant qu'on tient, 0 sinon

	CE QU'IL FAIT AUSSI, ET QU'ON OUBLIE TOUJOURS — le CLAVIER. Un objet qu'on ne peut
	déplacer qu'à la souris est un objet inaccessible. `<z-drag tabindex="0">` se déplace
	aux FLÈCHES (10 px avec Maj), et l'outil pose lui-même le rôle et l'étiquette qu'un
	lecteur d'écran attend. Ce n'est pas une option : c'est le minimum, donc c'est
	d'office.

	IL ÉMET `zoe:drop` au relâchement, avec la position — le seul moment où une page a
	quelque chose à faire (l'enregistrer, la ranger, décider où l'objet est tombé).

	Styleguide tool.drag
	============================================================
*/

const TOKENS = ["--z-drag__x", "--z-drag__y", "--z-drag__rx", "--z-drag__ry", "--z-drag__held"];

if (typeof CSS !== "undefined" && typeof CSS.registerProperty === "function") {
	for (const name of TOKENS) {
		try {
			CSS.registerProperty({ name, syntax: "<number>", inherits: true, initialValue: "0" });
		} catch {
			/* Déjà enregistré (module importé deux fois, rechargement à chaud) : sans conséquence. */
		}
	}
}

/* Le pas du clavier : un pixel pour ajuster, dix avec Maj pour traverser. */
const PAS = 1;
const PAS_RAPIDE = 10;

export class ZDrag extends HTMLElement {

	static api = {
		tag: "z-drag",
		example: "tools/z-drag/z-drag.lab.html",
		summary: {
			en: "Dragging is the single biggest pile of JavaScript in any interface. Wrap it in this tag: the position lands in CSS as a number, and YOU decide what it moves — a position, a rotation, an opacity. Keyboard included.",
			fr: "Le glisser-déposer est le plus gros paquet de JavaScript d'une interface. Enveloppez-le dans cette balise : la position arrive dans le CSS sous forme de nombre, et c'est VOUS qui décidez ce qu'elle déplace — une position, une rotation, une opacité. Clavier compris.",
			es: "Arrastrar es el mayor montón de JavaScript de cualquier interfaz. Envuélvalo en esta etiqueta: la posición llega al CSS como número, y USTED decide qué mueve — una posición, una rotación, una opacidad. Teclado incluido."
		},
		attributes: [
			{
				name: "axis",
				values: [
					{ value: "x", note: { en: "horizontal only", fr: "horizontal seulement", es: "solo horizontal" } },
					{ value: "y", note: { en: "vertical only", fr: "vertical seulement", es: "solo vertical" } }
				],
				description: {
					en: "Locks the gesture to one axis. Optional: reading only __x in your CSS already gives a horizontal slider — this attribute exists so the GESTURE itself refuses the other direction, which is what a finger feels.",
					fr: "Enferme le geste sur un axe. Facultatif : ne lire que __x dans votre CSS donne déjà un curseur horizontal — l'attribut existe pour que le GESTE lui-même refuse l'autre direction, ce qu'un doigt sent.",
					es: "Encierra el gesto en un eje. Opcional: leer solo __x en su CSS ya da un deslizador horizontal — el atributo existe para que el GESTO mismo rechace la otra dirección, que es lo que siente un dedo."
				}
			},
			{
				name: "bounds",
				type: "boolean",
				description: {
					en: "Keeps the object inside its parent, and turns on __rx / __ry — the share travelled, 0→1. Without it the object goes wherever the hand goes.",
					fr: "Garde l'objet dans son parent, et allume __rx / __ry — la part parcourue, 0→1. Sans lui, l'objet va où va la main.",
					es: "Mantiene el objeto dentro de su padre, y enciende __rx / __ry — la parte recorrida, 0→1. Sin él, el objeto va donde va la mano."
				}
			}
		],
		events: [
			{ name: "zoe:drop", description: { en: "Emitted on release — the only moment a page has something to do. detail: { x, y, rx, ry }.", fr: "Émis au relâchement — le seul moment où une page a quelque chose à faire. detail : { x, y, rx, ry }.", es: "Emitido al soltar — el único momento en que una página tiene algo que hacer. detail: { x, y, rx, ry }." } }
		],
		states: [],
		cssVars: [
			{ name: "--z-drag__x", description: { en: "The position along X, in pixels from the starting point — a bare number, so multiply it into whatever you want moved.", fr: "La position en X, en pixels depuis le point de départ — un nombre nu, à multiplier vers ce que vous voulez déplacer.", es: "La posición en X, en píxeles desde el punto de partida — un número desnudo, multiplíquelo hacia lo que quiera mover." } },
			{ name: "--z-drag__y", description: { en: "The position along Y, in pixels from the starting point.", fr: "La position en Y, en pixels depuis le point de départ.", es: "La posición en Y, en píxeles desde el punto de partida." } },
			{ name: "--z-drag__rx", description: { en: "With bounds: the share travelled horizontally, 0→1 — a slider's value, for free.", fr: "Avec bounds : la part parcourue horizontalement, 0→1 — la valeur d'un curseur, gratuitement.", es: "Con bounds: la parte recorrida horizontalmente, 0→1 — el valor de un deslizador, gratis." } },
			{ name: "--z-drag__ry", description: { en: "With bounds: the share travelled vertically, 0→1.", fr: "Avec bounds : la part parcourue verticalement, 0→1.", es: "Con bounds: la parte recorrida verticalmente, 0→1." } },
			{ name: "--z-drag__held", description: { en: "1 while the object is held, 0 once let go — for the shadow that lifts under the finger.", fr: "1 pendant qu'on tient l'objet, 0 une fois lâché — pour l'ombre qui se soulève sous le doigt.", es: "1 mientras se sostiene el objeto, 0 al soltarlo — para la sombra que se levanta bajo el dedo." } }
		]
	};

	static observedAttributes = ["axis", "bounds"];

	/* La position courante, la seule mémoire de l'outil — elle survit d'un geste à l'autre. */
	#x = 0;
	#y = 0;

	/* Le point saisi, dans le repère de l'objet : c'est lui qui évite le saut au premier
	   pixel (sans ça, l'objet se recentrerait d'un coup sous le curseur). */
	#prise = { x: 0, y: 0 };

	#frame = 0;
	#last = null;

	/* Tenu ou non — la mémoire qui évite de conclure un geste qui n'a jamais commencé. */
	#held = false;

	#onDown = (event) => {
		/* Le clic droit et le milieu ne saisissent rien — ils ont leur propre rôle. */
		if (event.button !== 0) return;
		/*
			LA CAPTURE — tout le reste du geste vient à nous, même si le doigt sort de
			l'objet ou de la fenêtre. C'est ce qui manque à la plupart des glisser-déposer
			écrits à la main : l'objet « décroche » dès qu'on va trop vite.
		*/
		this.setPointerCapture(event.pointerId);
		this.#held = true;
		this.#prise = { x: event.clientX - this.#x, y: event.clientY - this.#y };
		this.style.setProperty("--z-drag__held", "1");
		this.addEventListener("pointermove", this.#onMove);
	};

	#onMove = (event) => {
		this.#last = event;
		if (!this.#frame) this.#frame = requestAnimationFrame(() => this.#write());
	};

	#onUp = () => {
		if (!this.#held) return;   /* idempotent : un pointeur relâché deux fois ne fait rien */
		this.#held = false;
		this.removeEventListener("pointermove", this.#onMove);
		this.style.setProperty("--z-drag__held", "0");
		if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
		this.#last = null;
		this.#emitDrop();
	};

	/*
		LE CLAVIER — pas une option. Un objet qu'on ne peut déplacer qu'à la souris est un
		objet que certains ne peuvent pas déplacer du tout.
	*/
	#onKey = (event) => {
		const pas = event.shiftKey ? PAS_RAPIDE : PAS;
		const deltas = {
			ArrowLeft: [-pas, 0], ArrowRight: [pas, 0],
			ArrowUp: [0, -pas], ArrowDown: [0, pas]
		};
		const delta = deltas[event.key];
		if (!delta) return;
		event.preventDefault();   /* sinon la page défile sous l'objet qu'on déplace */
		this.#place(this.#x + delta[0], this.#y + delta[1]);
		this.#emitDrop();
	};

	connectedCallback() {
		this.#warnUnknownAttributes();
		this.addEventListener("pointerdown", this.#onDown);
		this.addEventListener("pointerup", this.#onUp);
		this.addEventListener("pointercancel", this.#onUp);
		this.addEventListener("keydown", this.#onKey);

		/*
			CE QU'UN LECTEUR D'ÉCRAN ATTEND — et rien de plus. On ne pose que ce qui manque :
			un auteur qui a écrit son propre rôle ou sa propre étiquette a toujours raison
			contre nous.

			UN OBJET BORNÉ SUR UN AXE **EST** UN CURSEUR : `slider` est le rôle que les
			lecteurs d'écran connaissent, il annonce la valeur, et les flèches y sont
			attendues. Un objet libre en deux dimensions, lui, n'a AUCUN équivalent ARIA —
			on ne lui invente donc pas de rôle (surtout pas `application`, qui coupe la
			navigation du lecteur d'écran pour toute la zone) : il garde son étiquette,
			c'est plus honnête qu'un mot qui promet ce qu'il ne tient pas.

			`tabindex` n'est PAS posé d'office — rendre focusable ce qui ne devait pas
			l'être casserait l'ordre de tabulation d'une page entière. On prévient, une fois.
		*/
		if (this.#isSlider && !this.hasAttribute("role")) {
			this.setAttribute("role", "slider");
			this.setAttribute("aria-orientation", this.getAttribute("axis") === "y" ? "vertical" : "horizontal");
			this.setAttribute("aria-valuemin", "0");
			this.setAttribute("aria-valuemax", "100");
		}
		if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) {
			this.setAttribute("aria-label", "objet déplaçable — flèches pour le bouger");
		}
		if (!this.hasAttribute("tabindex")) {
			console.info("[z-drag] pense à `tabindex=\"0\"` : sans lui, l'objet ne se déplace qu'à la souris.");
		}

		this.#place(this.#x, this.#y);
	}

	disconnectedCallback() {
		this.removeEventListener("pointerdown", this.#onDown);
		this.removeEventListener("pointerup", this.#onUp);
		this.removeEventListener("pointercancel", this.#onUp);
		this.removeEventListener("keydown", this.#onKey);
		this.removeEventListener("pointermove", this.#onMove);
		this.#held = false;
		if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
	}

	attributeChangedCallback() {
		/* Les limites ont pu changer : on replace la position dans le cadre du moment. */
		if (this.isConnected) this.#place(this.#x, this.#y);
	}

	#write() {
		this.#frame = 0;
		const event = this.#last;
		if (!event) return;
		this.#place(event.clientX - this.#prise.x, event.clientY - this.#prise.y);
	}

	/* Borné ET sur un seul axe : ce n'est plus un objet qu'on déplace, c'est un curseur. */
	get #isSlider() {
		return this.hasAttribute("bounds") && ["x", "y"].includes(this.getAttribute("axis"));
	}

	/*
		LE CŒUR — une seule porte pour la souris ET le clavier, donc un seul endroit où
		les limites s'appliquent et où les nombres s'écrivent. Deux chemins auraient
		fini par diverger.
		@param {number} x  la position demandée en X, avant limites
		@param {number} y  la position demandée en Y, avant limites
	*/
	#place(x, y) {
		const axis = this.getAttribute("axis");
		if (axis === "x") y = this.#y;
		if (axis === "y") x = this.#x;

		const cadre = this.#cadre();
		if (cadre) {
			x = Math.min(cadre.maxX, Math.max(cadre.minX, x));
			y = Math.min(cadre.maxY, Math.max(cadre.minY, y));
		}

		this.#x = x;
		this.#y = y;

		/* Le curseur annonce sa valeur : sans ça, `role="slider"` promettrait une valeur
		   que personne ne lit jamais — pire qu'un rôle absent. */
		if (this.#isSlider && cadre) {
			const course = this.getAttribute("axis") === "y" ? cadre.maxY - cadre.minY : cadre.maxX - cadre.minX;
			const parcouru = this.getAttribute("axis") === "y" ? y - cadre.minY : x - cadre.minX;
			this.setAttribute("aria-valuenow", String(course > 0 ? Math.round((parcouru / course) * 100) : 0));
		}

		const style = this.style;
		style.setProperty("--z-drag__x", x.toFixed(1));
		style.setProperty("--z-drag__y", y.toFixed(1));
		if (cadre) {
			const courseX = cadre.maxX - cadre.minX;
			const courseY = cadre.maxY - cadre.minY;
			style.setProperty("--z-drag__rx", courseX > 0 ? ((x - cadre.minX) / courseX).toFixed(4) : "0");
			style.setProperty("--z-drag__ry", courseY > 0 ? ((y - cadre.minY) / courseY).toFixed(4) : "0");
		}
	}

	/*
		LE CADRE, avec `bounds` : de combien l'objet peut s'écarter de sa place naturelle
		sans sortir de son parent. On mesure les deux boîtes À CHAQUE FOIS plutôt que de
		garder une valeur : la page bouge, les images arrivent, la fenêtre change — un
		cadre mémorisé est un cadre faux.

		La position ACTUELLE est déjà décalée de (x, y) : on la retire pour retrouver la
		place naturelle, sinon le cadre glisserait avec l'objet à chaque mesure.
		@returns {{minX: number, maxX: number, minY: number, maxY: number} | null}
	*/
	#cadre() {
		if (!this.hasAttribute("bounds")) return null;
		const parent = this.parentElement;
		if (!parent) return null;
		const moi = this.getBoundingClientRect();
		const lui = parent.getBoundingClientRect();
		const naturelX = moi.left - this.#x;
		const naturelY = moi.top - this.#y;
		return {
			minX: lui.left - naturelX,
			maxX: lui.right - moi.width - naturelX,
			minY: lui.top - naturelY,
			maxY: lui.bottom - moi.height - naturelY
		};
	}

	/* L'écho : l'objet est posé. Le seul moment où une page a quelque chose à faire. */
	#emitDrop() {
		const style = getComputedStyle(this);
		this.dispatchEvent(new CustomEvent("zoe:drop", {
			bubbles: true,
			detail: {
				x: this.#x,
				y: this.#y,
				rx: parseFloat(style.getPropertyValue("--z-drag__rx")) || 0,
				ry: parseFloat(style.getPropertyValue("--z-drag__ry")) || 0
			}
		}));
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est jamais bloqué,
		mais il est DIT tout haut. `<z-drag bound>` (sans s) laisserait sinon l'objet
		s'échapper de son cadre sans un mot.
	*/
	#warnUnknownAttributes() {
		const known = new Set(["axis", "bounds", "tabindex"]);
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (known.has(name) || native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-drag] attribut inconnu « ${name} » — ignoré (jamais bloqué). Connus : axis · bounds.`);
		}
	}
}

customElements.define("z-drag", ZDrag);
