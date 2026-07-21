/*
	============================================================
	z-element — LA BASE VIVANTE de Zoé (états d'interaction en :state())
	------------------------------------------------------------
	Tout composant Zoé hérite de z-element. Il POSE nos états (:state()), les
	reflète en ARIA/attributs, et émet `z-state` à chaque changement. Il s'utilise
	de deux façons :
	  · comme BASE : `class ZButton extends ZElement { … }` → le composant hérite de
	    TOUS nos états, gratuitement, et n'a plus qu'à peindre le sien (son CSS) ;
	  · comme ENVELOPPE : `<z-element><button>…</button></z-element>` → ton propre
	    élément hérite des états, tu écris son CSS. (C'est ce qu'on appelait
	    « z-state » : c'était le même moteur — un seul nom désormais.)

	NOS états — la palette normée :
	  · interaction (transitoire) : over · press · release · releaseOut · drag · focus
	  · cycle de vie (transitoire): enter (posé par le socle) · exit (posé par QUI RETIRE)
	  · sélection                 : current (durable) · select · unselect (gestes)
	  · statut métier (durable)   : loading · disabled · error · success
	  · repos                     : default (posé tant qu'aucun statut n'est actif)

	`exit` n'est PAS posé par le socle : quand l'élément part, disconnectedCallback
	arrive trop tard pour animer. C'est celui qui RETIRE (tools/z-stager) qui fait
	`await el.play("exit")` puis retire le nœud. Le socle ne connaît pas z-stager :
	il rend seulement `play()` attendable.

	Deux mécaniques :
	  – TRANSITOIRE : posé par les événements ou play(word), retiré tout seul ;
	  – DURABLE : porté par un ATTRIBUT (<z-element loading>, el.setState("loading")) et
	    reflété en :state(). L'attribut est la source de vérité. Un composant AJOUTE les
	    siens via `static durableStates` (z-checkbox y ajoute `indeterminate`).

	Il est aussi ASSOCIABLE À UN FORMULAIRE (`static formAssociated`) : le socle porte la
	plomberie (form, name, validité, reset, <fieldset disabled>), le composant décide de
	ce qu'il envoie via `setFormValue()`. Un composant qui n'appelle jamais setFormValue
	n'envoie rien — z-button reste un bouton.

	La doc narrative est dans z-element.doc.md ; l'API machine dans `static api`
	ci-dessous (lue par scripts/z-manifest → autocomplétion VSCode + doc + llms.txt).

	Styleguide 0.1
	============================================================
*/

/* Au-delà de ce seuil (px) un appui devient un glissé (sinon un clic tremblé passe). */
const DRAG_THRESHOLD = 4;

/* Les états DURABLES du socle : pilotables par attribut, reflétés en :state().
   Un composant en AJOUTE via `static durableStates` (voir plus bas). */
const DURABLE = ["current", "loading", "disabled", "error", "success"];

/* Les STATUTS métier exclusifs du repos : tant qu'aucun n'est posé, l'élément est
   dans son état par DÉFAUT (nommé `default`, adressable comme les autres).
   Pas de `busy` : il doublonnait `loading` (même sens, même ARIA) et deux mots pour
   un seul visuel finissent toujours par diverger. Un seul mot : loading. */
const STATUS = ["loading", "disabled", "error", "success"];

/* Cache des états déclarés-en-CSS. Au niveau MODULE (pas un `static #privé` : un
   membre privé statique n'est pas lisible quand `this` est une sous-classe — le
   navigateur lit ZButton.observedAttributes et planterait). */
let discoveredCache = null;

/* L'ARIA que chaque statut reflète (quand il s'applique). */
const STATUS_ARIA = {
	loading: "aria-busy",
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
		summary: {
			en: "The living base: carries interaction states as :state() and emits z-state.",
			fr: "La base vivante : porte les états d'interaction en :state() et émet z-state.",
			es: "La base viva: lleva los estados de interacción como :state() y emite z-state."
		},
		attributes: [
			{ name: "current", type: "boolean", description: { en: "Durable selection (checked, active tab) — set by a selectable component.", fr: "Sélection durable (coché, onglet actif) — posée par un composant sélectionnable.", es: "Selección duradera (marcado, pestaña activa) — puesta por un componente seleccionable." } },
			{ name: "loading", type: "boolean", description: { en: "Status: loading / processing.", fr: "Statut : en chargement / traitement.", es: "Estado: cargando / procesando." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: blocks interaction.", fr: "Désactivé : coupe l'interaction.", es: "Deshabilitado: bloquea la interacción." } },
			{ name: "error", type: "boolean", description: { en: "Status: error.", fr: "Statut : en erreur.", es: "Estado: error." } },
			{ name: "success", type: "boolean", description: { en: "Status: valid / done.", fr: "Statut : validé.", es: "Estado: válido / hecho." } },
			{ name: "name", type: "string", description: { en: "Form field name — used only by components that submit a value.", fr: "Nom du champ dans le formulaire — utilisé par les composants qui envoient une valeur.", es: "Nombre del campo en el formulario — usado por los componentes que envían un valor." } },
			{ name: "required", type: "boolean", description: { en: "The form is invalid until this control has a value.", fr: "Le formulaire est invalide tant que ce contrôle n'a pas de valeur.", es: "El formulario es inválido mientras este control no tenga valor." } }
		],
		events: [
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: [
			"default", "over", "press", "release", "releaseOut", "drag", "focus",
			"enter", "exit", "current", "select", "unselect",
			"loading", "disabled", "error", "success"
		],
		cssVars: [
			{ name: "--z-dur-enter", description: { en: "Duration of the transient `enter` state (read from the cascade).", fr: "Durée de l'état transitoire `enter` (lue dans la cascade).", es: "Duración del estado transitorio `enter` (leída en la cascada)." } },
			{ name: "--z-dur-release", description: { en: "Duration of the `release` ripple.", fr: "Durée de l'onde `release`.", es: "Duración de la onda `release`." } }
		]
	};

	/*
		ÉTATS DÉCLARÉS EN CSS : un auteur ANNONCE un état via `@property --z-state__X {}`,
		Zoé le MATÉRIALISE — pilotable par attribut `<z-element x>` / setState("x"), et
		stylable `:state(x)`. Le CSS crée le JS.
	*/
	static discoveredStates() {
		if (discoveredCache) return discoveredCache;
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
		return (discoveredCache = found);
	}

	/*
		LES DURABLES DE CETTE CLASSE. Un composant y ajoute les siens sans toucher au
		socle : `static durableStates = [...ZElement.durableStates, "indeterminate"]`.
		Pourquoi une liste de classe et pas la découverte-en-CSS : un état qui fait
		partie du CONTRAT du composant doit exister même si sa feuille n'est pas
		chargée. La découverte-en-CSS reste la porte de l'AUTEUR, pas celle du composant.
	*/
	static durableStates = DURABLE;

	/* Attributs observés = les durables de la classe + les états déclarés-en-CSS
	   découverts à la définition (mettre le CSS avant le script du composant). */
	static get observedAttributes() {
		return [...this.durableStates, ...this.discoveredStates()];
	}

	/*
		FORMULAIRE. Tout élément Zoé est associable à un `<form>` : c'est de la plomberie
		standard, pas de la logique métier. Le socle porte le branchement (form, name,
		validité, reset, désactivation par <fieldset>) ; c'est le COMPOSANT qui décide de
		ce qu'il ENVOIE, en appelant `setFormValue()` — une case envoie sa valeur si elle
		est cochée, un slider envoie son nombre, un bouton n'envoie rien du tout.
	*/
	static formAssociated = true;

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
		<z-element loading> pose :state(loading), tout comme el.setState("loading").
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
		if (this.constructor.durableStates.includes(name) || ZElement.discoveredStates().includes(name)) {
			this.toggleAttribute(name, on);
		} else {
			this.#set(name, on);
		}
	}

	/* Bascule un état (connu ou arbitraire). @param {string} name */
	toggleState(name) {
		this.setState(name, !this.#internals.states.has(name));
	}

	/*
		Joue un état TRANSITOIRE à la demande (enter, exit, release…) et REND LA MAIN
		quand il est retiré. C'est ce qui rend `exit` utilisable : celui qui retire
		l'élément (tools/z-stager) fait `await el.play("exit")` PUIS `el.remove()` —
		sinon la sortie ne peut pas s'animer (disconnectedCallback arrive trop tard).
		@param {string} word
		@returns {Promise<void>} résolue à la fin de l'état (durée --z-dur-<mot>)
	*/
	play(word) {
		return this.#flash(word);
	}

	/* Désactivé ? (coupe l'interaction). @returns {boolean} */
	get disabled() {
		return this.hasAttribute("disabled");
	}

	/* Les états actifs à l'instant (pour qu'un écouteur tardif se synchronise). @returns {string[]} */
	get states() {
		return [...this.#internals.states];
	}

	/* ── FORMULAIRE (plomberie standard, le composant décide de la valeur) ── */

	/* Le <form> qui m'englobe, s'il y en a un. @returns {HTMLFormElement|null} */
	get form() { return this.#internals.form; }

	/* Le nom sous lequel je pars dans le formulaire. @returns {string} */
	get name() { return this.getAttribute("name") ?? ""; }

	/* Champ requis ? @returns {boolean} */
	get required() { return this.hasAttribute("required"); }

	/* @returns {ValidityState} */
	get validity() { return this.#internals.validity; }
	/* @returns {string} */
	get validationMessage() { return this.#internals.validationMessage; }
	/* @returns {boolean} */
	get willValidate() { return this.#internals.willValidate; }
	/* @returns {boolean} */
	checkValidity() { return this.#internals.checkValidity(); }
	/* @returns {boolean} */
	reportValidity() { return this.#internals.reportValidity(); }

	/*
		Ce que j'envoie au formulaire. `null` = je n'envoie RIEN (une case décochée
		n'apparaît pas dans les données — c'est la sémantique native, pas un oubli).
		@param {string|File|FormData|null} value
	*/
	setFormValue(value) {
		this.#internals.setFormValue(value);
	}

	/*
		Déclare ma validité. Sans message, je suis valide.
		@param {string} [message] le motif du refus, montré par le navigateur
		@param {{valueMissing?: boolean, customError?: boolean}} [flags]
	*/
	setValidity(message, flags = { valueMissing: true }) {
		if (!message) this.#internals.setValidity({});
		else this.#internals.setValidity(flags, message, this.#validationAnchor());
	}

	/* Où le navigateur accroche sa bulle « Veuillez cocher… » : le calque qui reçoit le
	   geste s'il existe (LOI DE LA VUE : le message naît sur la case, pas sur la ligne). */
	#validationAnchor() {
		return this.querySelector(':scope > z-layer[part="marker"]') ?? this;
	}

	/* Le formulaire a été remis à zéro → le composant reprend son état d'origine. */
	formResetCallback() {
		/* Rien par défaut : seul un composant qui a une valeur sait ce qu'est « son
		   origine ». Il surcharge. */
	}

	/* Un <fieldset disabled> (ou form.disabled) m'atteint → je le porte comme mon
	   propre `disabled`, donc tous mes visuels d'état suivent sans une ligne de plus. */
	formDisabledCallback(isDisabled) {
		this.toggleAttribute("disabled", isDisabled);
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Allume/éteint UN état + émet. Seul point qui touche internals.states. */
	#set(name, on) {
		if (on) this.#internals.states.add(name);
		else this.#internals.states.delete(name);
		this.#emit(name, on);
	}

	/* Joue un état TRANSITOIRE : posé puis retiré après `ms` (ou la durée lue dans la
	   cascade --z-dur-<word>). Une seule horloge pour l'anim ET le retrait du mot.
	   Rend une promesse : les appels internes l'ignorent, `play()` la propage. */
	#flash(word, ms) {
		this.#set(word, true);
		return new Promise((done) => {
			setTimeout(() => { this.#set(word, false); done(); }, ms ?? this.#dur(word, 300));
		});
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
