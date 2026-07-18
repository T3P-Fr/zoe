/*
	============================================================
	z-element — LA BASE VIVANTE de Zoé (états d'interaction en :state())
	------------------------------------------------------------
	Tout composant Zoé hérite de z-element. Il POSE nos états (:state()), les
	reflète en ARIA/attributs, et émet `z-state` à chaque changement. Il s'utilise
	de deux façons :
	  · comme BASE : `class ZButton extends ZElement { … }` → le composant hérite de
	    TOUS nos états, gratuitement, et n'a plus qu'à peindre le sien (son CSS) ;
	  · comme TOOL (voir tools/z-state) : `<z-state>` décore un élément quelconque.
	  Même moteur, deux usages — « z-state, dans son concept, EST le z-element ».

	NOS états — la palette normée :
	  · interaction (transitoire) : over · press · release · releaseOut · drag · focus
	  · cycle de vie (transitoire): enter · exit
	  · sélection                 : current (durable) · select · unselect (gestes)
	  · statut métier (durable)   : loading · busy · disabled · error · success
	  · repos                     : default (posé tant qu'aucun statut n'est actif)

	Deux mécaniques :
	  – TRANSITOIRE : posé par les événements ou play(word), retiré tout seul ;
	  – DURABLE : porté par un ATTRIBUT (<z-element busy>, el.setState("busy")) et
	    reflété en :state(). L'attribut est la source de vérité.

	La doc narrative est dans z-element.doc.md ; l'API machine dans `static api`
	ci-dessous (lue par scripts/z-manifest → autocomplétion VSCode + doc + llms.txt).

	Styleguide 0.1
	============================================================
*/

/* Au-delà de ce seuil (px) un appui devient un glissé (sinon un clic tremblé passe). */
const DRAG_THRESHOLD = 4;

/* Les états DURABLES : pilotables par attribut, reflétés en :state(). */
const DURABLE = ["current", "loading", "busy", "disabled", "error", "success"];

/* Les STATUTS métier exclusifs du repos : tant qu'aucun n'est posé, l'élément est
   dans son état par DÉFAUT (nommé `default`, adressable comme les autres). */
const STATUS = ["loading", "busy", "disabled", "error", "success"];

/* L'ARIA que chaque statut reflète (quand il s'applique). */
const STATUS_ARIA = {
	loading: "aria-busy",
	busy: "aria-busy",
	disabled: "aria-disabled",
	error: "aria-invalid"
	// success : pas d'ARIA standard — c'est un retour visuel.
};

export class ZElement extends HTMLElement {
	/*
		L'API MACHINE, déclarée (option B) : scripts/z-manifest la lit pour générer
		l'autocomplétion VSCode, le Custom Elements Manifest et llms.txt. Une source.
	*/
	static api = {
		tag: "z-element",
		summary: "La base vivante : porte les états d'interaction en :state() et émet z-state.",
		attributes: [
			{ name: "current", type: "boolean", description: "Sélection durable (coché, onglet actif) — posée par un composant sélectionnable." },
			{ name: "loading", type: "boolean", description: "Statut : en chargement." },
			{ name: "busy", type: "boolean", description: "Statut : occupé / traitement en cours." },
			{ name: "disabled", type: "boolean", description: "Désactivé : coupe l'interaction." },
			{ name: "error", type: "boolean", description: "Statut : en erreur." },
			{ name: "success", type: "boolean", description: "Statut : validé." }
		],
		events: [
			{ name: "z-state", description: "Émis à chaque changement d'état. detail : { states, changed, on }." }
		],
		states: [
			"default", "over", "press", "release", "releaseOut", "drag", "focus",
			"enter", "exit", "current", "select", "unselect",
			"loading", "busy", "disabled", "error", "success"
		],
		cssVars: [
			{ name: "--z-dur-enter", description: "Durée de l'état transitoire `enter` (lue dans la cascade)." },
			{ name: "--z-dur-release", description: "Durée de l'onde `release`." }
		]
	};

	/*
		ÉTATS DÉCLARÉS EN CSS : un auteur ANNONCE un état via `@property --z-state__X {}`,
		Zoé le MATÉRIALISE — pilotable par attribut `<z-element x>` / setState("x"), et
		stylable `:state(x)`. Le CSS crée le JS.
	*/
	static #discovered = null;
	static discoveredStates() {
		if (this.#discovered) return this.#discovered;
		const found = [];
		const PREFIX = "--z-state__";
		for (const sheet of document.styleSheets) {
			let rules;
			try { rules = sheet.cssRules; } catch { continue; }   /* feuille cross-origin : on passe */
			for (const rule of rules) {
				if (rule instanceof CSSPropertyRule && rule.name.startsWith(PREFIX)) {
					found.push(rule.name.slice(PREFIX.length));
				}
			}
		}
		return (this.#discovered = found);
	}

	/* Attributs observés = les durables + les états déclarés-en-CSS découverts à la
	   définition (mettre le CSS avant le script du composant). */
	static get observedAttributes() {
		return [...DURABLE, ...this.discoveredStates()];
	}

	#internals = this.attachInternals();
	#wired = false;
	#prevStatus = null;   /* dernier statut métier actif — pour poser `from-<X>` à la transition */
	#pressed = false;
	#dragging = false;
	#startX = 0;
	#startY = 0;
	#releaseTimer = 0;
	#keyboard = false;

	connectedCallback() {
		if (this.#wired) { this.#flash("enter"); return; }
		this.#wired = true;
		this.addEventListener("pointerenter", this.#onEnter);
		this.addEventListener("pointerleave", this.#onLeave);
		this.addEventListener("pointerdown", this.#onDown);
		this.addEventListener("pointermove", this.#onMove);
		this.addEventListener("pointerup", this.#onUp);
		this.addEventListener("focusin", this.#onFocusIn);
		this.addEventListener("focusout", this.#onFocusOut);
		this.addEventListener("pointerdown", () => { this.#keyboard = false; }, true);
		window.addEventListener("keydown", () => { this.#keyboard = true; }, true);

		/* default : l'état de REPOS, posé tant qu'aucun statut métier ne prend la main. */
		this.#syncDefault();
		/* enter : transitoire, au montage (loi Zoe : rien ne pope). */
		this.#flash("enter");
	}

	/* Pose `default` ⟺ aucun statut métier n'est actif. Le repos est un état à part
	   entière, jamais juste « l'absence de ». */
	#syncDefault() {
		this.#set("default", !STATUS.some((s) => this.hasAttribute(s)));
	}

	/*
		Un attribut durable a changé → on reflète l'état + l'ARIA. Pont DÉCLARATIF :
		<z-element busy> pose :state(busy), tout comme el.setState("busy").
	*/
	attributeChangedCallback(name, _old, value) {
		const on = value !== null;
		this.#set(name, on);
		const aria = STATUS_ARIA[name];
		if (aria) {
			if (on) this.setAttribute(aria, "true");
			else this.removeAttribute(aria);
		}
		/* current change (sélection posée par un composant) → on joue le geste. */
		if (name === "current") this.#flash(on ? "select" : "unselect");
		/*
			SÉQUENCE TEMPORELLE : quand un STATUT change, on pose un transitoire
			`from-<précédent>`. Le CSS combine présent + passé → `:state(success):state(
			from-loading)` = « success, arrivé de loading ». La séquence = une combinaison.
		*/
		if (STATUS.includes(name)) {
			if (on) {
				/* prevStatus ne suit QUE les allumages : il survit au passage par le repos,
				   pour que « loading puis success » (même avec un reset entre) soit vu. */
				if (this.#prevStatus && this.#prevStatus !== name) this.#flash(`from-${this.#prevStatus}`, 600);
				this.#prevStatus = name;
			}
			if (this.isConnected) this.#syncDefault();
		}
	}

	/* ── API PUBLIQUE ── */

	/*
		Pose/retire un état. Un état CONNU (durable ou déclaré-en-CSS) passe par
		l'attribut → reflet en :state() ET pilotable en HTML. Un nom ARBITRAIRE est
		posé DIRECTEMENT en :state(). Ainsi setState marche pour N'IMPORTE quel nom.
		@param {string} name
		@param {boolean} [on]
	*/
	setState(name, on = true) {
		if (DURABLE.includes(name) || ZElement.discoveredStates().includes(name)) {
			this.toggleAttribute(name, on);
		} else {
			this.#set(name, on);
		}
	}

	/* Bascule un état (connu ou arbitraire). @param {string} name */
	toggleState(name) {
		this.setState(name, !this.#internals.states.has(name));
	}

	/* Rejoue un état TRANSITOIRE à la demande (enter, exit, release…). @param {string} word */
	play(word) {
		this.#flash(word);
	}

	/* Désactivé ? (coupe l'interaction). @returns {boolean} */
	get disabled() {
		return this.hasAttribute("disabled");
	}

	/* Les états actifs à l'instant (pour qu'un écouteur tardif se synchronise). @returns {string[]} */
	get states() {
		return [...this.#internals.states];
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Allume/éteint UN état + émet. Seul point qui touche internals.states. */
	#set(name, on) {
		if (on) this.#internals.states.add(name);
		else this.#internals.states.delete(name);
		this.#emit(name, on);
	}

	/* Joue un état TRANSITOIRE : posé puis retiré après `ms` (ou la durée lue dans la
	   cascade --z-dur-<word>). Une seule horloge pour l'anim ET le retrait du mot. */
	#flash(word, ms) {
		this.#set(word, true);
		setTimeout(() => this.#set(word, false), ms ?? this.#dur(word, 300));
	}

	/* Émet `z-state` avec la liste COMPLÈTE des états actifs + ce qui a changé. */
	#emit(changed, on) {
		this.dispatchEvent(new CustomEvent("z-state", {
			detail: { states: [...this.#internals.states], changed, on },
			bubbles: true
		}));
	}

	/* Durée d'un état transitoire, lue dans la cascade (--z-dur-<mot>). */
	#dur(word, fallback) {
		const raw = getComputedStyle(this).getPropertyValue(`--z-dur-${word}`).trim();
		if (!raw) return fallback;
		return raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000;
	}

	/*
		IMBRICATION : un événement bulle depuis sa cible. On ne le traite que si le
		z-element (ou sous-classe) le PLUS PROCHE de la cible est SOI — sinon il
		appartient à un z-element imbriqué. Sans ça, l'extérieur volerait press au clic
		sur l'intérieur. On lit le composedPath pour couvrir toutes les ZElement.
	*/
	#owns(event) {
		for (const node of event.composedPath()) {
			if (node instanceof ZElement) return node === this;
			if (node === this) return true;
		}
		return false;
	}

	#onEnter = () => { if (!this.disabled) this.#set("over", true); };
	#onLeave = () => { this.#set("over", false); };

	#onDown = (event) => {
		if (this.disabled || !this.#owns(event)) return;
		this.#pressed = true;
		this.#dragging = false;
		this.#startX = event.clientX;
		this.#startY = event.clientY;
		clearTimeout(this.#releaseTimer);
		this.#set("release", false);
		this.#set("releaseOut", false);
		this.#set("press", true);
		/* CAPTURE : le pointerup reviendra à CET élément même lâché dehors → releaseOut
		   émis, press/drag refermés proprement. (try : setPointerCapture lève si le
		   pointeur n'est plus actif — événements synthétiques.) */
		try { this.setPointerCapture?.(event.pointerId); } catch { /* pas grave */ }
	};

	#onMove = (event) => {
		if (!this.#pressed || this.#dragging) return;
		if (Math.hypot(event.clientX - this.#startX, event.clientY - this.#startY) < DRAG_THRESHOLD) return;
		this.#dragging = true;
		this.#set("drag", true);
	};

	#onUp = (event) => {
		if (!this.#pressed) return;
		this.#pressed = false;
		const rect = this.getBoundingClientRect();
		const inside = event.clientX >= rect.left && event.clientX <= rect.right
			&& event.clientY >= rect.top && event.clientY <= rect.bottom;
		this.#set("press", false);
		this.#set("over", inside);
		if (this.#dragging) { this.#dragging = false; this.#set("drag", false); }

		/* Lâché DEDANS = release (l'onde) ; DEHORS = releaseOut (annulé) — l'état que le
		   web a oublié, enfin émis. */
		const word = inside ? "release" : "releaseOut";
		this.#set(word, true);
		clearTimeout(this.#releaseTimer);
		this.#releaseTimer = setTimeout(() => this.#set(word, false), this.#dur(word, 320));
	};

	/*
		PAS DE current AU CLIC : le cycle d'un contrôle est default ⇄ over → press →
		release (dedans) / releaseOut (dehors). Rien ne « reste » cliqué. `current` est
		une SÉLECTION durable posée EXPRÈS par un composant sélectionnable — jamais par
		le socle. Le geste select/unselect se joue quand `current` change (voir plus haut).
	*/

	/* focus clavier seulement (comme :focus-visible), et seulement SUR soi. */
	#onFocusIn = (event) => { if (this.#keyboard && this.#owns(event)) this.#set("focus", true); };
	#onFocusOut = () => this.#set("focus", false);
}

/* Enregistre <z-element> (garde-fou contre la double définition). Les sous-classes
   et le tool z-state s'enregistrent de leur côté. */
export function defineZElement() {
	if (!customElements.get("z-element")) customElements.define("z-element", ZElement);
}
defineZElement();
