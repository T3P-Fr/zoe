/*
	============================================================
	z-scroll — OÙ EN EST LE DÉFILEMENT, DONNÉ AU CSS
	------------------------------------------------------------
	CE QU'IL RÉSOUT — la barre de progression en tête d'article, le bandeau qui rétrécit
	quand on descend, le décor qui glisse moins vite que le texte, la flèche « remonter »
	qui n'apparaît qu'après le premier écran. Quatre demandes banales, quatre écouteurs
	de scroll écrits à la main, et une page qui rame parce qu'aucun n'est groupé.

	    <z-scroll page></z-scroll>

	    .progression { width: calc(var(--z-scroll__ry) * 100%); }

	Une balise posée n'importe où, et toute la page sait où elle en est.

	DEUX MODES, un seul vocabulaire :

	  `page`        — le défilement de la PAGE. Les nombres sont posés sur `:root`, donc
	                  lisibles PARTOUT (c'est le seul cas où l'outil ne pose pas sur
	                  lui-même : le défilement de la page n'appartient à personne).
	  sans attribut — l'élément EST la boîte qui défile. Les nombres sont posés sur lui,
	                  et descendent dans ses enfants. Le même vocabulaire, en local.

	CE QU'IL POSE (grammaire du pacte) :

	    --z-scroll__y    --z-scroll__x     la distance parcourue, en pixels
	    --z-scroll__ry   --z-scroll__rx    la PART parcourue, 0→1 (0 au départ, 1 au bout)
	    --z-scroll__dir                    1 vers le bas, -1 vers le haut
	    --z-scroll__top                    1 tant qu'on n'a pas bougé du départ
	    --z-scroll__end                    1 quand on touche le bout

	`__ry` est le nombre qui sert 90 % du temps : une part, donc une largeur
	(`* 100%`), une rotation (`* 360deg`), une opacité, un décalage. `__dir` est celui
	qu'on n'obtient jamais autrement : il faut avoir gardé la position d'avant.

	ET LE CSS NATIF ? `animation-timeline: scroll()` fait une partie du travail, et le
	fera mieux le jour où tous les navigateurs suivront. Mais une timeline n'anime que
	des keyframes : elle ne donne pas de NOMBRE. Ici le nombre est à vous — vous le
	multipliez, vous le comparez, vous le passez à `color-mix()`. Les deux cohabitent très
	bien ; ce n'est pas un remplacement, c'est l'autre bout du problème.

	Styleguide tool.scroll
	============================================================
*/

const TOKENS = [
	"--z-scroll__x", "--z-scroll__y",
	"--z-scroll__rx", "--z-scroll__ry",
	"--z-scroll__dir", "--z-scroll__top", "--z-scroll__end"
];

/*
	Les nombres sont déclarés au navigateur : `inherits: true` les fait descendre, le
	type `<number>` les rend ANIMABLES (une transition sur `--z-scroll__ry` adoucit une
	barre de progression), et la valeur de départ évite qu'un `var()` non défini rende
	la déclaration invalide — le danger silencieux du pacte.
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

export class ZScroll extends HTMLElement {

	static api = {
		tag: "z-scroll",
		example: `<z-scroll page></z-scroll>
<div class="progress"></div>
<style>
  .progress { position: fixed; inset: 0 auto auto 0; height: 3px; background: var(--z-accent);
              width: calc(var(--z-scroll__ry) * 100%); }
</style>`,
		summary: {
			en: "A progress bar, a shrinking header, a parallax, a \"back to top\" that waits its turn — all of them need one thing: how far down are we? Drop this tag and the answer lands in CSS as a number between 0 and 1.",
			fr: "Une barre de progression, un bandeau qui rétrécit, un parallaxe, une flèche « remonter » qui attend son tour — tous réclament la même chose : où en est-on ? Posez cette balise et la réponse arrive dans le CSS, un nombre entre 0 et 1.",
			es: "Una barra de progreso, un encabezado que se encoge, un paralaje, una flecha « volver arriba » que espera su turno — todos piden lo mismo: ¿por dónde vamos? Coloque esta etiqueta y la respuesta llega al CSS, un número entre 0 y 1."
		},
		attributes: [
			{
				name: "page",
				type: "boolean",
				description: {
					en: "Measure the PAGE's scroll instead of this box. The numbers are then set on :root, readable everywhere — the page's scroll belongs to no one in particular.",
					fr: "Mesurer le défilement de la PAGE au lieu de cette boîte. Les nombres sont alors posés sur :root, lisibles partout — le défilement de la page n'appartient à personne en particulier.",
					es: "Medir el desplazamiento de la PÁGINA en vez de esta caja. Los números se ponen en :root, legibles en todas partes — el desplazamiento de la página no pertenece a nadie en particular."
				}
			}
		],
		events: [],
		states: [],
		cssVars: [
			{ name: "--z-scroll__ry", description: { en: "The share scrolled vertically, 0 at the start, 1 at the end — the number that serves 90% of the time.", fr: "La part parcourue verticalement, 0 au départ, 1 au bout — le nombre qui sert 90 % du temps.", es: "La parte recorrida verticalmente, 0 al principio, 1 al final — el número que sirve el 90 % del tiempo." } },
			{ name: "--z-scroll__rx", description: { en: "The share scrolled horizontally, 0→1.", fr: "La part parcourue horizontalement, 0→1.", es: "La parte recorrida horizontalmente, 0→1." } },
			{ name: "--z-scroll__y", description: { en: "The distance scrolled vertically, in pixels — a bare number, so multiply it (* 1px).", fr: "La distance parcourue verticalement, en pixels — un nombre nu, donc à multiplier (* 1px).", es: "La distancia recorrida verticalmente, en píxeles — un número desnudo, multiplíquelo (* 1px)." } },
			{ name: "--z-scroll__x", description: { en: "The distance scrolled horizontally, in pixels.", fr: "La distance parcourue horizontalement, en pixels.", es: "La distancia recorrida horizontalmente, en píxeles." } },
			{ name: "--z-scroll__dir", description: { en: "1 going down, -1 going up. It keeps its last value at rest — the one number you can never get otherwise, since it needs the previous position.", fr: "1 vers le bas, -1 vers le haut. Garde sa dernière valeur à l'arrêt — le seul nombre qu'on n'obtient jamais autrement, puisqu'il faut la position d'avant.", es: "1 hacia abajo, -1 hacia arriba. Guarda su último valor en reposo — el único número que no se obtiene de otro modo, pues necesita la posición anterior." } },
			{ name: "--z-scroll__top", description: { en: "1 while nothing has moved from the start — for a header that only shrinks once you leave the top.", fr: "1 tant qu'on n'a pas bougé du départ — pour un bandeau qui ne rétrécit qu'une fois quitté le haut.", es: "1 mientras no se ha movido del inicio — para un encabezado que solo se encoge al dejar la parte superior." } },
			{ name: "--z-scroll__end", description: { en: "1 when the end is reached — for the shadow that fades out once there is nothing left to see.", fr: "1 quand on touche le bout — pour l'ombre qui s'efface une fois qu'il n'y a plus rien à voir.", es: "1 cuando se llega al final — para la sombra que se borra cuando ya no queda nada por ver." } }
		]
	};

	static observedAttributes = ["page"];

	/* Le numéro d'image demandée — 0 quand aucune n'est en vol (une seule écriture par image). */
	#frame = 0;

	/* La position d'avant, la seule mémoire de l'outil : c'est elle qui donne `__dir`. */
	#lastY = 0;
	#dir = 1;

	/* Qui a été branché — gardé tel quel pour débrancher EXACTEMENT la même chose. */
	#source = null;
	#host = null;

	#onScroll = () => {
		if (!this.#frame) this.#frame = requestAnimationFrame(() => this.#write());
	};

	connectedCallback() {
		this.#warnUnknownAttributes();
		this.#listen();
	}

	disconnectedCallback() {
		this.#deafen();
	}

	attributeChangedCallback() {
		/* On change de mode : ce n'est plus la même boîte qu'on écoute, ni le même porteur. */
		if (this.isConnected) { this.#deafen(); this.#listen(); }
	}

	/*
		LA BOÎTE MESURÉE et LE PORTEUR DES NOMBRES ne sont pas toujours le même élément.
		En mode `page`, on mesure `document.scrollingElement` et on pose sur `:root` : le
		défilement de la page n'appartient à aucun coin du document, il doit être lisible
		partout. Hors de ce mode, l'élément est les deux à la fois — comme z-pointer.
	*/
	#listen() {
		const isPage = this.hasAttribute("page");
		this.#source = isPage ? document : this;
		this.#host = isPage ? document.documentElement : this;
		this.#source.addEventListener("scroll", this.#onScroll, { passive: true });
		/* Redimensionner change la course totale, donc la PART parcourue, sans un seul scroll. */
		addEventListener("resize", this.#onScroll, { passive: true });
		/* Une première écriture : avant tout geste, `__top` doit déjà valoir 1. */
		this.#write();
	}

	#deafen() {
		this.#source?.removeEventListener("scroll", this.#onScroll);
		removeEventListener("resize", this.#onScroll);
		this.#source = null;
		this.#host = null;
		if (this.#frame) { cancelAnimationFrame(this.#frame); this.#frame = 0; }
	}

	/*
		L'écriture, une fois par image. La « course » est ce qui dépasse de la fenêtre :
		hauteur totale moins hauteur visible. Une page qui ne défile pas a une course
		nulle — sa part vaut alors 0, jamais l'infini d'une division par zéro.
	*/
	#write() {
		this.#frame = 0;
		const host = this.#host;
		if (!host) return;

		const box = this.hasAttribute("page") ? document.scrollingElement : this;
		if (!box) return;

		const y = box.scrollTop;
		const x = box.scrollLeft;
		const courseY = box.scrollHeight - box.clientHeight;
		const courseX = box.scrollWidth - box.clientWidth;

		/* Le sens GARDE sa valeur tant qu'on ne bouge pas : à l'arrêt, un bandeau caché
		   doit le rester, pas clignoter parce que le nombre est retombé à zéro. */
		if (y !== this.#lastY) this.#dir = y > this.#lastY ? 1 : -1;
		this.#lastY = y;

		const style = host.style;
		style.setProperty("--z-scroll__y", y.toFixed(1));
		style.setProperty("--z-scroll__x", x.toFixed(1));
		style.setProperty("--z-scroll__ry", courseY > 0 ? (y / courseY).toFixed(4) : "0");
		style.setProperty("--z-scroll__rx", courseX > 0 ? (x / courseX).toFixed(4) : "0");
		style.setProperty("--z-scroll__dir", String(this.#dir));
		/* Un demi-pixel de tolérance : les zooms et les écrans à densité donnent des
		   positions fractionnaires, et « 0.4 px du haut » est le haut. */
		style.setProperty("--z-scroll__top", y <= 0.5 ? "1" : "0");
		style.setProperty("--z-scroll__end", courseY > 0 && y >= courseY - 0.5 ? "1" : "0");
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est jamais bloqué,
		mais il est DIT tout haut. `<z-scroll pages>` mesurerait sinon une boîte qui ne
		défile pas, et tous les nombres resteraient à zéro sans un mot.
	*/
	#warnUnknownAttributes() {
		const known = new Set(["page"]);
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (known.has(name) || native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-scroll] attribut inconnu « ${name} » — ignoré (jamais bloqué). Connus : page.`);
		}
	}
}

customElements.define("z-scroll", ZScroll);
