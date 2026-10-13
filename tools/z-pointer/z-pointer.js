/*
	============================================================
	z-pointer — LA POSITION DE LA SOURIS, DONNÉE AU CSS
	------------------------------------------------------------
	CE QU'IL RÉSOUT — « je voudrais qu'un div suive la souris » est la demande la plus
	banale du web, et celle qui coûte le plus cher : un écouteur, une mesure de boîte,
	une image d'animation, un nettoyage à la sortie. Écrite trente fois par page, elle
	rame ; écrite une fois pour toutes, elle est gratuite.

	    <z-pointer local global>
	      <div class="halo"></div>
	    </z-pointer>

	    .halo {
	      translate: calc(var(--z-pointer--local__x) * 1px)
	                 calc(var(--z-pointer--local__y) * 1px);
	      opacity: var(--z-pointer--local__in);      ← 1 dedans, 0 dehors
	    }

	LE PRINCIPE — comme tout Zoé : l'outil ne PEINT rien, il POSE des nombres sur
	lui-même. Une variable CSS hérite : tout ce qu'il enveloppe les lit gratuitement,
	aussi profond que ça descende. Le div ne « sait » pas d'où vient la valeur — il lit
	un token, comme il lirait `--z-accent`. Zéro classe, zéro écouteur, zéro JS chez
	l'auteur.

	LES DEUX REPÈRES — deux SORTIES d'une même source, comme les `low`/`high` d'un
	z-range, d'où le séparateur double du pacte (`--z-{comp}--{part}__{prop}`) :

	  attribut `local`  — le repère de la BOÎTE (0,0 = son coin haut-gauche)
	    --z-pointer--local__x   --z-pointer--local__y     en pixels
	    --z-pointer--local__rx  --z-pointer--local__ry    en ratio 0→1 (la part traversée)
	    --z-pointer--local__in                            1 dedans, 0 dehors

	  attribut `global` — le repère de la FENÊTRE (0,0 = son coin haut-gauche)
	    --z-pointer--global__x  --z-pointer--global__y    en pixels
	    --z-pointer--global__rx --z-pointer--global__ry   en ratio 0→1

	Sans attribut : `local` seul — le cas courant, et le moins cher (un écouteur sur la
	boîte, pas sur le document).

	POURQUOI DES NOMBRES NUS, jamais des longueurs : un nombre se multiplie. `* 1px`
	donne une distance, `* 360deg` un angle, `* 100%` une part, `* 1` un facteur. Une
	longueur ne donnerait jamais que des longueurs. C'est la règle du carnet couleur —
	poser un nombre, jamais peindre.

	POURQUOI @property : parce qu'un nombre TYPÉ s'anime. `transition: --z-pointer--local__x
	260ms` suffit à faire TRAÎNER un calque derrière la souris — sans une image de JS.
	C'est aussi ce qui donne une valeur de départ (0) au lieu d'un `var()` invalide qui
	effacerait le composant en silence.

	CE QU'IL NE FAIT PAS — il ne dessine pas de curseur (c'est z-cursor), il ne relie pas
	deux éléments distants (c'est z-channel : `channel=` traverse la page, z-pointer ne
	descend que dans ses enfants). Un outil, un rôle.

	Styleguide tool.pointer
	============================================================
*/

/*
	LES NEUF NOMBRES, déclarés au navigateur. `inherits: true` est TOUT le contrat :
	c'est lui qui fait descendre la valeur jusqu'au dernier enfant, sans que personne
	ne la passe. Déclarés ici plutôt qu'en CSS parce que la liste est la même que celle
	qu'écrit `#pose` — une seule vérité, pas deux fichiers à tenir d'accord.
*/
const TOKENS = [
	"--z-pointer--local__x", "--z-pointer--local__y",
	"--z-pointer--local__rx", "--z-pointer--local__ry",
	"--z-pointer--local__in",
	"--z-pointer--global__x", "--z-pointer--global__y",
	"--z-pointer--global__rx", "--z-pointer--global__ry"
];

/*
	L'enregistrement n'a lieu que dans un navigateur : en Node (z-manifest importe ce
	module pour lire `static api`, un rendu serveur ferait pareil), `CSS` n'existe pas.
*/
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
	L'élément. Il n'a ni calque, ni ombre, ni contenu propre : il enveloppe, il écoute,
	il pose. Sa seule exigence de forme — être une BOÎTE — est dans z-pointer.css.
*/
export class ZPointer extends HTMLElement {

	static api = {
		tag: "z-pointer",
		example: `<z-pointer>
  <div class="halo"></div>
</z-pointer>
<style>
  .halo {
    position: absolute; width: 200px; height: 200px; margin: -100px 0 0 -100px; border-radius: 50%;
    background: radial-gradient(circle, var(--z-accent), transparent 70%);
    translate: calc(var(--z-pointer--local__x) * 1px) calc(var(--z-pointer--local__y) * 1px);
    opacity: var(--z-pointer--local__in);
  }
</style>`,
		summary: {
			en: "Want a div to follow the mouse? Wrap it in this tag — the position lands in CSS as plain numbers, and every child inherits them. No class, no listener, no JS of yours.",
			fr: "Vous voulez qu'un div suive la souris ? Enveloppez-le dans cette balise — la position arrive dans le CSS sous forme de nombres, et tous les enfants en héritent. Aucune classe, aucun écouteur, aucun JS de votre part.",
			es: "¿Quiere que un div siga al ratón? Envuélvalo en esta etiqueta — la posición llega al CSS como números, y todos los hijos los heredan. Sin clases, sin escuchadores, sin JS suyo."
		},
		attributes: [
			{
				name: "local",
				type: "boolean",
				description: {
					en: "Coordinates in the BOX's frame (0,0 = its top-left corner). Taken by default when no frame is asked for — it is the common case, and the cheapest.",
					fr: "Les coordonnées dans le repère de la BOÎTE (0,0 = son coin haut-gauche). Pris par défaut quand aucun repère n'est demandé — c'est le cas courant, et le moins cher.",
					es: "Las coordenadas en el marco de la CAJA (0,0 = su esquina superior izquierda). Tomado por defecto cuando no se pide ningún marco — es el caso común, y el más barato."
				}
			},
			{
				name: "global",
				type: "boolean",
				description: {
					en: "Coordinates in the WINDOW's frame (0,0 = its top-left corner). The pointer is then followed everywhere, even outside the box — useful for a crosshair or a page-wide light.",
					fr: "Les coordonnées dans le repère de la FENÊTRE (0,0 = son coin haut-gauche). La souris est alors suivie partout, même hors de la boîte — pour une mire ou une lumière à l'échelle de la page.",
					es: "Las coordenadas en el marco de la VENTANA (0,0 = su esquina superior izquierda). El puntero se sigue en todas partes, incluso fuera de la caja — para una mira o una luz de toda la página."
				}
			}
		],
		events: [],
		states: [],
		cssVars: [
			{ name: "--z-pointer--local__x", description: { en: "Distance from the box's left edge, in pixels — a bare number, so multiply it (* 1px).", fr: "La distance depuis le bord gauche de la boîte, en pixels — un nombre nu, donc à multiplier (* 1px).", es: "La distancia desde el borde izquierdo de la caja, en píxeles — un número desnudo, multiplíquelo (* 1px)." } },
			{ name: "--z-pointer--local__y", description: { en: "Distance from the box's top edge, in pixels.", fr: "La distance depuis le bord haut de la boîte, en pixels.", es: "La distancia desde el borde superior de la caja, en píxeles." } },
			{ name: "--z-pointer--local__rx", description: { en: "The share of the box crossed horizontally, 0→1 — becomes an angle (* 360deg), a share (* 100%), anything.", fr: "La part de la boîte traversée horizontalement, 0→1 — devient un angle (* 360deg), une part (* 100%), ce que vous voulez.", es: "La parte de la caja recorrida horizontalmente, 0→1 — se vuelve un ángulo (* 360deg), una parte (* 100%), lo que quiera." } },
			{ name: "--z-pointer--local__ry", description: { en: "The share of the box crossed vertically, 0→1.", fr: "La part de la boîte traversée verticalement, 0→1.", es: "La parte de la caja recorrida verticalmente, 0→1." } },
			{ name: "--z-pointer--local__in", description: { en: "1 while the pointer is inside the box, 0 outside — the switch a skin uses to fade a halo out cleanly.", fr: "1 tant que la souris est dans la boîte, 0 dehors — l'interrupteur qui fait disparaître un halo proprement.", es: "1 mientras el puntero está dentro de la caja, 0 fuera — el interruptor que apaga un halo limpiamente." } },
			{ name: "--z-pointer--global__x", description: { en: "Distance from the window's left edge, in pixels.", fr: "La distance depuis le bord gauche de la fenêtre, en pixels.", es: "La distancia desde el borde izquierdo de la ventana, en píxeles." } },
			{ name: "--z-pointer--global__y", description: { en: "Distance from the window's top edge, in pixels.", fr: "La distance depuis le bord haut de la fenêtre, en pixels.", es: "La distancia desde el borde superior de la ventana, en píxeles." } },
			{ name: "--z-pointer--global__rx", description: { en: "The share of the window crossed horizontally, 0→1.", fr: "La part de la fenêtre traversée horizontalement, 0→1.", es: "La parte de la ventana recorrida horizontalmente, 0→1." } },
			{ name: "--z-pointer--global__ry", description: { en: "The share of the window crossed vertically, 0→1.", fr: "La part de la fenêtre traversée verticalement, 0→1.", es: "La parte de la ventana recorrida verticalmente, 0→1." } }
		]
	};

	static observedAttributes = ["local", "global"];

	/* La dernière position reçue, en attente d'être écrite à la prochaine image. */
	#last = null;

	/* Le numéro d'image demandée — 0 quand aucune n'est en vol (une seule écriture par image). */
	#frame = 0;

	/* Qui porte l'écouteur : la boîte, ou le document dès que le repère global est demandé. */
	#source = null;

	#onMove = (event) => {
		this.#last = event;
		if (!this.#frame) this.#frame = requestAnimationFrame(() => this.#write());
	};

	/*
		La souris quitte la boîte : on éteint `in`. C'est le seul signal qui permette à une
		peau de faire disparaître un halo proprement (`opacity: var(--…__in)`) au lieu de le
		laisser collé au dernier pixel survolé.
	*/
	#onLeave = () => this.style.setProperty("--z-pointer--local__in", "0");

	connectedCallback() {
		this.#warnUnknownAttributes();
		this.#listen();
	}

	disconnectedCallback() {
		this.#deafen();
	}

	attributeChangedCallback() {
		/* Le repère demandé change → l'écouteur change de porteur. Sans effet avant connexion. */
		if (this.isConnected) { this.#deafen(); this.#listen(); }
	}

	/* Le repère de la boîte : demandé, ou pris par défaut quand rien n'est demandé. */
	get #wantsLocal() {
		return this.hasAttribute("local") || !this.hasAttribute("global");
	}

	get #wantsGlobal() {
		return this.hasAttribute("global");
	}

	/*
		UN SEUL écouteur, jamais deux — sinon chaque mouvement serait compté deux fois.
		Dès que le repère global est demandé il faut suivre la souris PARTOUT : c'est le
		document qui écoute, et le repère local continue d'être calculé (il devient négatif
		ou dépasse la boîte, ce qui est juste — `in` dit alors 0).
	*/
	#listen() {
		this.#source = this.#wantsGlobal ? document : this;
		this.#source.addEventListener("pointermove", this.#onMove, { passive: true });
		this.addEventListener("pointerleave", this.#onLeave);
	}

	#deafen() {
		this.#source?.removeEventListener("pointermove", this.#onMove);
		this.removeEventListener("pointerleave", this.#onLeave);
		this.#source = null;
		if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
	}

	/*
		L'écriture, une fois par image. Tout part de `clientX/clientY` — le repère de la
		fenêtre : le global s'y lit tel quel, le local s'en déduit en retirant le coin de
		la boîte. Une seule mesure de boîte par image, et seulement si le local est demandé.
	*/
	#write() {
		this.#frame = 0;
		const event = this.#last;
		if (!event) return;

		if (this.#wantsLocal) {
			const box = this.getBoundingClientRect();
			const x = event.clientX - box.left;
			const y = event.clientY - box.top;
			const inside = x >= 0 && y >= 0 && x <= box.width && y <= box.height;
			this.#pose("local", x, y, box.width, box.height);
			this.style.setProperty("--z-pointer--local__in", inside ? "1" : "0");
		}

		if (this.#wantsGlobal) {
			this.#pose("global", event.clientX, event.clientY, innerWidth, innerHeight);
		}
	}

	/*
		Pose les quatre nombres d'un repère : les deux distances, et les deux parts.
		@param {string} scope   "local" ou "global" — le repère
		@param {number} x       la distance depuis son bord gauche, en pixels
		@param {number} y       la distance depuis son bord haut, en pixels
		@param {number} width   la largeur du repère, pour en tirer la part
		@param {number} height  la hauteur du repère
	*/
	#pose(scope, x, y, width, height) {
		const style = this.style;
		style.setProperty(`--z-pointer--${scope}__x`, x.toFixed(1));
		style.setProperty(`--z-pointer--${scope}__y`, y.toFixed(1));
		/* Une boîte de largeur nulle n'a pas de part : 0 plutôt qu'une division par zéro. */
		style.setProperty(`--z-pointer--${scope}__rx`, width ? (x / width).toFixed(4) : "0");
		style.setProperty(`--z-pointer--${scope}__ry`, height ? (y / height).toFixed(4) : "0");
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est JAMAIS bloqué
		(pas de plafond), mais il est DIT tout haut : une faute de frappe ne se perd plus.
		`<z-pointer globale>` poserait sinon le repère local sans un mot, et l'auteur
		chercherait longtemps. Les attributs natifs sont laissés tranquilles.
	*/
	#warnUnknownAttributes() {
		const known = new Set(["local", "global"]);
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (known.has(name) || native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-pointer] attribut inconnu « ${name} » — ignoré (jamais bloqué). Connus : local · global.`);
		}
	}
}

customElements.define("z-pointer", ZPointer);
