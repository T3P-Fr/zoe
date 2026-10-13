/*
	============================================================
	z-slider — un curseur de valeur, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Deux écritures, comme partout dans Zoé (ADR-0018 : rien n'est injecté) :

	    FORME COURTE — le CSS peint l'hôte
	    <z-slider min="0" max="100" value="40"></z-slider>
	    <z-slider orientation="vertical" markers step="10"></z-slider>

	    FORME EN CALQUES — chaque pièce est un élément, donc animable SEULE
	    <z-slider value="40" label="over">
	      <z-layer part="background"><z-layer part="ticks"></z-layer></z-layer>
	      <z-layer part="marker"><z-layer part="dot"></z-layer></z-layer>
	      <z-layer part="infos"><z-layer part="label"></z-layer></z-layer>
	      <z-layer part="contact"></z-layer>
	    </z-slider>

	CE QUE CE FICHIER FAIT, ET RIEN D'AUTRE : il traduit un geste (pointeur, clavier)
	en une VALEUR, puis pose deux nombres dans la cascade —

	    --z-slider__progress   0 → 1, la position, d'où découle TOUT le dessin
	    --z-slider__value      la valeur, pour que le CSS puisse l'écrire lui-même

	Il ne peint rien, ne mesure aucune pièce, n'écrit aucun texte. Le remplissage, la
	poignée, les graduations et l'étiquette sont du CSS qui lit `progress`. C'est ce
	qui rend le curseur animable de bout en bout : `progress` est déclaré en
	`@property <number>`, donc il s'INTERPOLE — une valeur posée par API glisse au lieu
	de sauter, et une peau décide de la courbe.

	Les GRADUATIONS ne sont pas des éléments générés : `markers` pose un compte, et le
	CSS les dessine en repeating-gradient. Zéro balise ajoutée, et elles s'animent d'un
	bloc. Pour des graduations IRRÉGULIÈRES (0, 25, 90…), l'auteur écrit ses propres
	`<z-layer part="tick" style="--z-tick__at: 25%">` : c'est son DOM, on ne le lui prend
	pas. Voir la doc — c'est exactement la promesse « pas de plafond ».

	Doc narrative : z-slider.doc.md · API machine : `static api` ci-dessous.
	Styleguide 4.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Un appui sur PageUp/PageDown vaut dix crans : la convention native des range. */
const PAGE_FACTOR = 10;

export class ZSlider extends ZElement {
	static api = {
		tag: "z-slider",
		example: `<z-slider min="0" max="100" value="40" name="volume"></z-slider>
<z-slider value="25" step="5" markers label="over"></z-slider>
<z-slider orientation="vertical" value="60"></z-slider>`,
		members: [
			{ kind: "field", name: "value", type: "number", description: { en: "The current value, clamped to [min, max] and snapped to step. Setting it animates (progress is a typed @property).", fr: "La valeur courante, bornée à [min, max] et calée sur le pas. La poser anime (progress est une @property typée).", es: "El valor actual, limitado a [min, max] y ajustado al paso. Ponerlo anima (progress es una @property tipada)." } },
			{ kind: "field", name: "min · max · step", type: "number", description: { en: "The bounds and increment (read-only mirrors of the attributes).", fr: "Les bornes et l'incrément (reflets en lecture des attributs).", es: "Los límites y el incremento (reflejos de solo lectura de los atributos)." } },
			{ kind: "field", name: "progress", type: "number", description: { en: "0→1, the position along the track.", fr: "0→1, la position sur la piste.", es: "0→1, la posición en la pista." } }
		],
		summary: {
			en: "A value slider — poses progress (0→1) in the cascade, the skin paints everything.",
			fr: "Un curseur de valeur — pose une progression (0→1) dans la cascade, la peau peint tout.",
			es: "Un deslizador de valor — pone un progreso (0→1) en la cascada, el tema pinta todo."
		},
		attributes: [
			{ name: "value", type: "number", description: { en: "Current value. Clamped to [min, max] and snapped to step.", fr: "Valeur courante. Bornée à [min, max] et calée sur le pas.", es: "Valor actual. Limitado a [min, max] y ajustado al paso." } },
			{ name: "min", type: "number", description: { en: "Lower bound (default 0).", fr: "Borne basse (0 par défaut).", es: "Límite inferior (0 por defecto)." } },
			{ name: "max", type: "number", description: { en: "Upper bound (default 100).", fr: "Borne haute (100 par défaut).", es: "Límite superior (100 por defecto)." } },
			{ name: "step", type: "number", description: { en: "Increment. `any` for a continuous slider (default 1).", fr: "Incrément. `any` pour un curseur continu (1 par défaut).", es: "Incremento. `any` para un deslizador continuo (1 por defecto)." } },
			{ name: "orientation", type: "'horizontal' | 'vertical'", description: { en: "Track direction. Vertical runs bottom→top: up means more.", fr: "Sens de la piste. En vertical on va de bas en haut : vers le haut = plus.", es: "Sentido de la pista. En vertical va de abajo a arriba: arriba es más." } },
			{ name: "markers", type: "boolean | number", description: { en: "Graduations. Bare = one per step; a number = that many intervals.", fr: "Graduations. Seul = une par pas ; un nombre = ce nombre d'intervalles.", es: "Graduaciones. Solo = una por paso; un número = ese número de intervalos." } },
			{ name: "label", type: "'over' | 'under' | 'none'", description: { en: "Where the value is written, relative to the track. `none` (default) writes nothing.", fr: "Où s'écrit la valeur, par rapport à la piste. `none` (défaut) n'écrit rien.", es: "Dónde se escribe el valor, respecto a la pista. `none` (por defecto) no escribe nada." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivé : coupe l'interaction.", es: "Deshabilitado: bloquea la interacción." } }
		],
		events: [
			{ name: "input", description: { en: "Emitted on every value change, including during the drag. Read `.value`.", fr: "Émis à chaque changement de valeur, y compris pendant le glissé. Lire `.value`.", es: "Emitido en cada cambio de valor, incluso durante el arrastre. Leer `.value`." } },
			{ name: "change", description: { en: "Emitted once the gesture is over (pointer released, key up).", fr: "Émis une fois le geste terminé (pointeur relâché, touche relevée).", es: "Emitido al terminar el gesto (puntero soltado, tecla arriba)." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-slider__progress", description: { en: "0→1, posed by the component. Everything else is derived from it in CSS.", fr: "0→1, posée par le composant. Tout le reste en découle, en CSS.", es: "0→1, puesta por el componente. Todo lo demás se deriva en CSS." } },
			{ name: "--z-slider__value", description: { en: "The value, so the CSS can write it via counter() without any injected node.", fr: "La valeur, pour que le CSS l'écrive via counter() sans nœud injecté.", es: "El valor, para que el CSS lo escriba con counter() sin nodo inyectado." } },
			{ name: "--z-slider__markers", description: { en: "Number of intervals between graduations (0 = none).", fr: "Nombre d'intervalles entre graduations (0 = aucune).", es: "Número de intervalos entre graduaciones (0 = ninguna)." } }
		],
		/*
			LES CALQUES — les rôles se PARTAGENT entre composants : `dot` est la poignée ici
			et la marque d'une case ailleurs, mais c'est le même mot, donc une peau les
			atteint d'un coup. Seul `ticks` est propre au curseur.
		*/
		layers: [
			{
				part: "background",
				description: { en: "The track: the empty rail, from min to max.", fr: "La piste : le rail vide, de min à max.", es: "La pista: el riel vacío, de min a max." },
				children: [
					{ part: "ticks", optional: true, description: { en: "The graduations, drawn as a gradient — animatable as one block.", fr: "Les graduations, dessinées en dégradé — animables d'un bloc.", es: "Las graduaciones, dibujadas como degradado — animables en bloque." } }
				]
			},
			{
				part: "marker",
				description: { en: "The filled part, from min to the value. It IS the state, made visible.", fr: "La part remplie, de min à la valeur. C'est l'état, rendu visible.", es: "La parte llena, de min al valor. Es el estado, hecho visible." },
				children: [
					{ part: "dot", description: { en: "The handle, sitting at the end of the fill.", fr: "La poignée, posée au bout du remplissage.", es: "El tirador, al final del relleno." } }
				]
			},
			{
				part: "infos",
				description: { en: "What informs — follows the handle, placed by the `label` attribute.", fr: "Ce qui informe — suit la poignée, placé par l'attribut `label`.", es: "Lo que informa — sigue al tirador, colocado por el atributo `label`." },
				children: [
					{ part: "label", description: { en: "The value written out. Left empty, the CSS fills it from --z-slider__value.", fr: "La valeur écrite. Laissé vide, le CSS l'y écrit depuis --z-slider__value.", es: "El valor escrito. Si se deja vacío, el CSS lo rellena desde --z-slider__value." } }
				]
			},
			{ part: "contact", description: { en: "What receives the gesture — overflows the thin track so it stays easy to grab.", fr: "Ce qui reçoit le geste — déborde la piste fine pour rester attrapable.", es: "Lo que recibe el gesto — desborda la pista fina para seguir siendo agarrable." } }
		]
	};

	static get observedAttributes() {
		return [...super.observedAttributes, "value", "min", "max", "step", "orientation", "markers"];
	}

	/* Vrai entre le pointerdown et le pointerup : sépare `input` (pendant) de `change`
	   (à la fin), comme un <input type=range> natif. */
	#sliding = false;

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "slider");
		if (!this.hasAttribute("tabindex")) this.tabIndex = this.disabled ? -1 : 0;
		this.addEventListener("pointerdown", this.#onDown);
		this.addEventListener("pointermove", this.#onMove);
		this.addEventListener("pointerup", this.#onUp);
		this.addEventListener("keydown", this.#onKey);
		this.addEventListener("keyup", this.#onKeyUp);
		super.connectedCallback();     /* z-element câble toute la grammaire d'états */
		/* On repose la valeur au montage : elle borne, cale sur le pas, et publie
		   progress + l'ARIA d'un coup. Rien ne peut être incohérent au premier rendu. */
		this.#apply(this.value, { silent: true });
		this.#publishMarkers();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.tabIndex = value !== null ? -1 : 0;
		if (name === "orientation") this.setAttribute("aria-orientation", this.orientation);
		if (name === "markers") this.#publishMarkers();
		/* min/max/step déplacent les bornes : la valeur courante doit être re-bornée,
		   sinon un max abaissé laisse une poignée hors de sa piste. */
		if (["value", "min", "max", "step"].includes(name)) this.#apply(this.value, { silent: true });
	}

	/* ── API PUBLIQUE ── */

	/* La valeur courante, déjà bornée et calée sur le pas. @returns {number} */
	get value() {
		return this.#clamp(this.#num("value", this.min));
	}

	/* Pose la valeur (bornée, calée, publiée). @param {number} next */
	set value(next) {
		this.#apply(Number(next));
	}

	/* Borne basse. @returns {number} */
	get min() {
		return this.#num("min", 0);
	}

	/* Borne haute. @returns {number} */
	get max() {
		return this.#num("max", 100);
	}

	/* Le pas. `step="any"` rend le curseur continu → 0. @returns {number} */
	get step() {
		if (this.getAttribute("step") === "any") return 0;
		const raw = this.#num("step", 1);
		return raw > 0 ? raw : 1;
	}

	/* Sens de la piste. @returns {'horizontal'|'vertical'} */
	get orientation() {
		return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
	}

	/* La position dans la course, de 0 à 1. @returns {number} */
	get progress() {
		const span = this.max - this.min;
		return span > 0 ? (this.value - this.min) / span : 0;
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Lit un attribut numérique, avec sa valeur de repli. */
	#num(name, fallback) {
		const raw = parseFloat(this.getAttribute(name));
		return Number.isFinite(raw) ? raw : fallback;
	}

	/* Borne dans [min, max] ET cale sur le pas, en partant de min (et non de zéro :
	   un curseur min=5 step=10 doit donner 5, 15, 25 — pas 0, 10, 20). */
	#clamp(raw) {
		const { min, max, step } = this;
		let value = Math.min(max, Math.max(min, Number.isFinite(raw) ? raw : min));
		if (step > 0) {
			value = min + Math.round((value - min) / step) * step;
			value = Math.min(max, Math.max(min, value));
			/* Le flottant traîne (0.1 + 0.2…) : on arrondit à la précision du pas, sinon
			   un curseur de 0.1 affiche 0.30000000000000004. */
			const decimals = (String(step).split(".")[1] || "").length;
			value = Number(value.toFixed(decimals));
		}
		return value;
	}

	/*
		LE SEUL point qui change la valeur. Il borne, écrit l'attribut (source de vérité),
		publie dans la cascade, met l'ARIA à jour, et prévient — dans cet ordre, pour
		qu'un écouteur de `input` lise toujours un composant déjà cohérent.
		@param {number} raw
		@param {{silent?: boolean}} [options] silent : republie sans émettre (montage, reflow)
	*/
	#apply(raw, { silent = false } = {}) {
		const next = this.#clamp(raw);
		const changed = String(next) !== this.getAttribute("value");
		if (changed) this.setAttribute("value", String(next));

		this.style.setProperty("--z-slider__progress", String(this.progress));
		this.style.setProperty("--z-slider__value", String(next));
		this.setAttribute("aria-valuenow", String(next));
		this.setAttribute("aria-valuemin", String(this.min));
		this.setAttribute("aria-valuemax", String(this.max));
		this.setAttribute("aria-orientation", this.orientation);

		if (changed && !silent) this.dispatchEvent(new Event("input", { bubbles: true }));
	}

	/*
		`markers` accepte trois écritures : absent (aucune), nu (une graduation par pas),
		un nombre (ce nombre d'intervalles). On publie un COMPTE, et le CSS dessine —
		aucun nœud n'est créé, donc rien n'apparaît dans le DOM de l'auteur.
	*/
	#publishMarkers() {
		if (!this.hasAttribute("markers")) {
			this.style.removeProperty("--z-slider__markers");
			return;
		}
		const asked = parseFloat(this.getAttribute("markers"));
		const span = this.max - this.min;
		/* Nu : une graduation par pas. Un pas continu (`any`) n'a rien à graduer → 0. */
		const count = Number.isFinite(asked) ? asked : (this.step > 0 ? span / this.step : 0);
		this.style.setProperty("--z-slider__markers", String(Math.max(0, Math.round(count))));
	}

	/* Traduit un point de l'écran en valeur. Le vertical va de BAS en haut : monter,
	   c'est augmenter — l'inverse de l'axe Y de l'écran, d'où le 1 - ratio. */
	#seek(event) {
		const rect = this.getBoundingClientRect();
		const ratio = this.orientation === "vertical"
			? 1 - (event.clientY - rect.top) / rect.height
			: (event.clientX - rect.left) / rect.width;
		this.#apply(this.min + Math.min(1, Math.max(0, ratio)) * (this.max - this.min));
	}

	#onDown = (event) => {
		if (this.disabled) return;
		this.#sliding = true;
		/* Cliquer n'importe où sur la piste y emmène la poignée : l'utilisateur vise
		   une position, pas un objet. (Le socle a déjà capturé le pointeur.) */
		this.#seek(event);
	};

	#onMove = (event) => {
		if (this.#sliding && !this.disabled) this.#seek(event);
	};

	#onUp = () => {
		if (!this.#sliding) return;
		this.#sliding = false;
		this.dispatchEvent(new Event("change", { bubbles: true }));
	};

	/*
		Le clavier suit la convention native du range. En vertical comme en horizontal
		les quatre flèches marchent : personne ne devrait avoir à deviner l'orientation
		avant d'appuyer sur une touche.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		/* Un curseur continu n'a pas de pas : au clavier on avance quand même, par
		   centièmes de course — sinon la touche ne fait rien et le contrôle paraît mort. */
		const cran = this.step > 0 ? this.step : (this.max - this.min) / 100;
		const bond = {
			ArrowRight: cran, ArrowUp: cran,
			ArrowLeft: -cran, ArrowDown: -cran,
			PageUp: cran * PAGE_FACTOR, PageDown: -cran * PAGE_FACTOR
		}[event.key];

		if (bond !== undefined) {
			event.preventDefault();
			this.#apply(this.value + bond);
			return;
		}
		if (event.key === "Home") { event.preventDefault(); this.#apply(this.min); }
		if (event.key === "End") { event.preventDefault(); this.#apply(this.max); }
	};

	/* La touche relevée clôt le geste, comme le pointeur relâché. */
	#onKeyUp = (event) => {
		const clos = ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
		if (clos.includes(event.key)) this.dispatchEvent(new Event("change", { bubbles: true }));
	};
}

export function defineZSlider() {
	if (!customElements.get("z-slider")) customElements.define("z-slider", ZSlider);
}
defineZSlider();
