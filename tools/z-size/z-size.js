/*
	============================================================
	z-size — LA TAILLE RÉELLE, ET LE DÉBORDEMENT, DITS AU CSS
	------------------------------------------------------------
	CE QU'IL RÉSOUT — deux questions que le CSS ne sait pas poser seul :

	  « quelle taille fait vraiment cette boîte ? »   → les requêtes de conteneur
	     répondent par OUI/NON à des paliers qu'on a fixés d'avance. Elles ne donnent
	     pas de NOMBRE, donc rien à interpoler : pour un texte qui grandit
	     CONTINÛMENT avec sa boîte, il faut la mesure elle-même.

	  « est-ce que ça DÉBORDE ? »                     → aucune réponse en CSS. Aucune.
	     C'est LA question sans réponse du langage, et la raison pour laquelle tant
	     d'interfaces affichent une ombre de bord ou une flèche « voir la suite » qui
	     ne correspond à rien.

	    <z-size>
	      <p>ce texte grandit avec sa boîte</p>
	    </z-size>

	    z-size p { font-size: calc(14px + var(--z-size__w) * 0.012px); }

	CE QU'IL POSE (grammaire du pacte) :

	    --z-size__w       --z-size__h        la taille intérieure, en pixels
	    --z-size__ratio                      la proportion largeur / hauteur
	    --z-size__over                       1 si le contenu déborde, d'un côté ou de l'autre
	    --z-size__over-x  --z-size__over-y   le débordement, côté par côté

	CE QU'IL N'EST PAS — un remplaçant des requêtes de conteneur. Elles restent
	meilleures pour CHANGER DE MISE EN PAGE à un palier (une colonne devient deux) :
	c'est un basculement, pas une interpolation. z-size sert quand la réponse est un
	nombre qui glisse, ou quand la question est le débordement. Les deux vont ensemble.

	Styleguide tool.size
	============================================================
*/

const TOKENS = [
	"--z-size__w", "--z-size__h", "--z-size__ratio",
	"--z-size__over", "--z-size__over-x", "--z-size__over-y"
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

export class ZSize extends HTMLElement {

	static api = {
		tag: "z-size",
		example: "tools/z-size/z-size.lab.html",
		summary: {
			en: "Two questions CSS cannot answer on its own: how big is this box, really — and does its content overflow? Wrap it in this tag and both answers land in CSS as numbers.",
			fr: "Deux questions auxquelles le CSS ne sait pas répondre seul : quelle taille fait vraiment cette boîte — et son contenu déborde-t-il ? Enveloppez-la dans cette balise, les deux réponses arrivent dans le CSS sous forme de nombres.",
			es: "Dos preguntas que el CSS no sabe responder solo: ¿qué tamaño tiene realmente esta caja — y su contenido se desborda? Envuélvala en esta etiqueta y ambas respuestas llegan al CSS como números."
		},
		attributes: [],
		events: [],
		states: [],
		cssVars: [
			{ name: "--z-size__w", description: { en: "The inner width, in pixels — a bare number, so multiply it. This is what container queries never give you: a value to interpolate.", fr: "La largeur intérieure, en pixels — un nombre nu, donc à multiplier. C'est ce que les requêtes de conteneur ne donnent jamais : une valeur à interpoler.", es: "El ancho interior, en píxeles — un número desnudo, multiplíquelo. Es lo que las consultas de contenedor nunca dan: un valor para interpolar." } },
			{ name: "--z-size__h", description: { en: "The inner height, in pixels.", fr: "La hauteur intérieure, en pixels.", es: "La altura interior, en píxeles." } },
			{ name: "--z-size__ratio", description: { en: "Width divided by height. Above 1 it is lying down, below 1 it is standing up — one number to swap a layout on shape rather than on size.", fr: "La largeur divisée par la hauteur. Au-dessus de 1 elle est couchée, en dessous elle est debout — un seul nombre pour basculer une mise en page sur la FORME plutôt que sur la taille.", es: "El ancho dividido por la altura. Por encima de 1 está tumbada, por debajo de pie — un número para cambiar una maquetación según la FORMA en vez del tamaño." } },
			{ name: "--z-size__over", description: { en: "1 if the content overflows on either side. THE question CSS has no answer for — and the reason so many edge shadows and \"see more\" arrows mean nothing.", fr: "1 si le contenu déborde d'un côté ou de l'autre. LA question sans réponse en CSS — et la raison pour laquelle tant d'ombres de bord et de flèches « voir la suite » ne correspondent à rien.", es: "1 si el contenido se desborda por algún lado. LA pregunta sin respuesta en CSS — y el motivo de que tantas sombras de borde y flechas « ver más » no signifiquen nada." } },
			{ name: "--z-size__over-x", description: { en: "1 if the content overflows horizontally.", fr: "1 si le contenu déborde horizontalement.", es: "1 si el contenido se desborda horizontalmente." } },
			{ name: "--z-size__over-y", description: { en: "1 if the content overflows vertically.", fr: "1 si le contenu déborde verticalement.", es: "1 si el contenido se desborda verticalmente." } }
		]
	};

	#observer = null;
	#mutations = null;

	connectedCallback() {
		this.#warnUnknownAttributes();
		/*
			TROIS CHOSES À SURVEILLER, et une seule ne suffit pas :
			  · la BOÎTE change de taille        → ResizeObserver sur soi
			  · un ENFANT change de taille sans que la boîte bouge (une image qui finit
			    de charger, un texte qui se replie) → le débordement change, la boîte non
			  · un enfant est AJOUTÉ ou RETIRÉ    → il n'était pas encore observé

			Le deuxième est le piège classique : on observe l'élément, on croit avoir tout
			couvert, et l'ombre de bord ment dès la première image qui arrive en retard.
		*/
		this.#observer = new ResizeObserver(() => this.#write());
		this.#observer.observe(this);
		this.#observeChildren();

		/* Le contenu change de composition : on rattrape les nouveaux venus. Observer
		   deux fois le même enfant est sans effet, on peut donc repasser sans trier. */
		this.#mutations = new MutationObserver(() => { this.#observeChildren(); this.#write(); });
		this.#mutations.observe(this, { childList: true });

		this.#write();
	}

	disconnectedCallback() {
		this.#observer?.disconnect();
		this.#mutations?.disconnect();
		this.#observer = null;
		this.#mutations = null;
	}

	#observeChildren() {
		for (const enfant of this.children) this.#observer?.observe(enfant);
	}

	/*
		La mesure. `clientWidth` est la taille INTÉRIEURE (bordures et barre de défilement
		exclues) : c'est celle qui sert à écrire une règle, pas la taille extérieure.
		`scrollWidth` est celle dont le contenu aurait besoin — leur écart EST le
		débordement.
	*/
	#write() {
		const style = this.style;
		const w = this.clientWidth;
		const h = this.clientHeight;
		style.setProperty("--z-size__w", String(w));
		style.setProperty("--z-size__h", String(h));
		/* Une boîte de hauteur nulle n'a pas de proportion : 0 plutôt qu'une division
		   par zéro, qui rendrait toutes les règles qui en dépendent invalides. */
		style.setProperty("--z-size__ratio", h > 0 ? (w / h).toFixed(4) : "0");

		/* Un pixel de tolérance : les arrondis de rendu font déborder d'un demi-pixel des
		   boîtes qui ne débordent pas — et une ombre qui clignote est pire que pas d'ombre. */
		const overX = this.scrollWidth > w + 1 ? 1 : 0;
		const overY = this.scrollHeight > h + 1 ? 1 : 0;
		style.setProperty("--z-size__over-x", String(overX));
		style.setProperty("--z-size__over-y", String(overY));
		style.setProperty("--z-size__over", overX || overY ? "1" : "0");
	}

	/*
		LE DANGER SILENCIEUX, MORT — un attribut hors du vocabulaire n'est jamais bloqué,
		mais il est DIT tout haut. z-size n'en prend aucun : tout se lit en CSS.
	*/
	#warnUnknownAttributes() {
		const native = new Set(["id", "class", "style", "hidden", "role", "slot", "title"]);
		for (const { name } of this.attributes) {
			if (native.has(name) || name.startsWith("data-") || name.startsWith("aria-")) continue;
			console.warn(`[z-size] attribut inconnu « ${name} » — ignoré (jamais bloqué). z-size n'en prend aucun : tout se lit dans ses tokens.`);
		}
	}
}

customElements.define("z-size", ZSize);
