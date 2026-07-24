/*
	============================================================
	z-segmented — un contrôle segmenté (pilule à indicateur glissant)
	------------------------------------------------------------
	Un choix unique parmi 2 à 5 options, en « pilule », avec un indicateur qui GLISSE
	sous l'option courante — le mouvement dit QUAND ça a changé, là où la couleur ne
	suffit pas. L'auteur écrit les segments lui-même (Zoé n'injecte rien — ADR-0018) :

	    <z-segmented>
	      <button part="segment" value="jour">Jour</button>
	      <button part="segment" value="mois" aria-current="true">Mois</button>
	      <button part="segment" value="an">Année</button>
	    </z-segmented>

	CE QUE CE FICHIER APPORTE, ET RIEN D'AUTRE (zéro logique métier) :
	  1. EXCLUSIVITÉ — un seul segment courant à la fois (aria-checked + aria-current).
	  2. CLAVIER — ← → se promènent et choisissent, Home / End vont aux extrémités
	     (convention ARIA radiogroup), avec un roving tabindex : UNE tabulation pour tout
	     le contrôle, pas une par segment.
	  3. INDICATEUR — on publie la position et la largeur du segment courant
	     (`--z-segmented__x`, `--z-segmented__w`) ; le CSS fait glisser un ::after, au
	     ressort. Aucune pièce n'est déplacée à la main, aucune balise injectée.
	  4. VALEUR — `.value` lit/écrit le choix ; `change` bulle avec la valeur choisie.

	`role="radiogroup"` sur l'hôte, `role="radio"` posé sur chaque segment : c'est bien
	un choix unique, et les lecteurs d'écran l'annoncent déjà bien.

	Doc narrative : z-segmented.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 26.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Les touches qui déplacent le choix, et de combien (convention ARIA radiogroup). Les
   deux axes marchent : l'auteur peut poser sa pilule en ligne, on ne présume rien. */
const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export class ZSegmented extends ZElement {
	static api = {
		tag: "z-segmented",
		summary: {
			en: "A segmented control: single choice among 2–5 options, with an indicator that slides under the current one.",
			fr: "Un contrôle segmenté : choix unique parmi 2 à 5 options, avec un indicateur qui glisse sous la courante.",
			es: "Un control segmentado: elección única entre 2–5 opciones, con un indicador que se desliza bajo la actual."
		},
		attributes: [
			{ name: "value", type: "string", description: { en: "The chosen segment's value — set it to preselect, read it to know the choice.", fr: "La valeur du segment choisi — la poser présélectionne, la lire donne le choix.", es: "El valor del segmento elegido — ponerlo preselecciona, leerlo da la elección." } },
			{ name: "disabled", type: "boolean", description: { en: "Disables the whole control.", fr: "Désactive tout le contrôle.", es: "Deshabilita todo el control." } }
		],
		events: [
			{ name: "change", description: { en: "Emitted when the choice changes. detail: { value }; also read `.value`.", fr: "Émis quand le choix change. detail : { value } ; lire aussi `.value`.", es: "Emitido cuando cambia la elección. detail: { value }; leer también `.value`." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-segmented__x", description: { en: "Left offset (px) of the current segment — the indicator slides to it.", fr: "Décalage gauche (px) du segment courant — l'indicateur y glisse.", es: "Desplazamiento izquierdo (px) del segmento actual — el indicador se desliza a él." } },
			{ name: "--z-segmented__w", description: { en: "Width (px) of the current segment — the indicator matches it.", fr: "Largeur (px) du segment courant — l'indicateur l'épouse.", es: "Ancho (px) del segmento actual — el indicador lo iguala." } }
		],
		layers: [
			{ part: "segment", description: { en: "One option — the author writes as many as needed (2 to 5). Carries a `value`.", fr: "Une option — l'auteur en écrit autant que besoin (2 à 5). Porte un `value`.", es: "Una opción — el autor escribe cuantas necesite (2 a 5). Lleva un `value`." } }
		]
	};

	/* Le DOM peut arriver après nous (parsing) ou changer ; la pilule peut aussi être
	   redimensionnée : on resynchronise l'indicateur dans les deux cas. */
	#watcher = new MutationObserver(() => this.#sync());
	#resizer = new ResizeObserver(() => this.#place());

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
		this.addEventListener("click", this.#onClick);
		this.addEventListener("keydown", this.#onKey);
		this.#watcher.observe(this, { childList: true, subtree: true });
		this.#resizer.observe(this);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		this.#sync();
	}

	disconnectedCallback() {
		super.disconnectedCallback?.();
		this.#watcher.disconnect();
		this.#resizer.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.#sync();
	}

	/* ── API PUBLIQUE ── */

	/* Les segments de CE contrôle. @returns {HTMLElement[]} */
	get segments() {
		return [...this.querySelectorAll('[part="segment"]')]
			.filter((seg) => seg.closest("z-segmented") === this);
	}

	/* Le segment choisi, s'il y en a un. @returns {HTMLElement|null} */
	get selected() {
		return this.segments.find((seg) => seg.getAttribute("aria-checked") === "true") ?? null;
	}

	/* La valeur choisie (chaîne vide si aucun choix). @returns {string} */
	get value() {
		return this.selected?.getAttribute("value") ?? "";
	}

	/* Choisit par la valeur, SANS événement (c'est le programme qui parle, pas
	   l'utilisateur — même règle qu'une radio). @param {string} value */
	set value(value) {
		const target = this.segments.find((seg) => seg.getAttribute("value") === String(value));
		this.#select(target ?? null, { silent: true });
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Le clic sur un segment le choisit (et prévient). */
	#onClick = (event) => {
		if (this.disabled) return;
		const seg = event.target.closest('[part="segment"]');
		if (seg && this.segments.includes(seg)) this.#select(seg);
	};

	/*
		Flèches : on se promène ET on choisit (convention ARIA — dans un radiogroup,
		naviguer C'EST choisir). Home / End vont aux extrémités. Circulaire.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		const usable = this.segments.filter((seg) => !seg.disabled);
		if (!usable.length) return;
		const from = usable.indexOf(document.activeElement);
		let next;
		if (event.key === "Home") next = 0;
		else if (event.key === "End") next = usable.length - 1;
		else if (STEP[event.key] !== undefined) {
			next = from === -1
				? (STEP[event.key] > 0 ? 0 : usable.length - 1)
				: (from + STEP[event.key] + usable.length) % usable.length;
		} else return;

		event.preventDefault();          /* la page ne défile pas sous nos flèches */
		const seg = usable[next];
		seg.focus();
		this.#select(seg);
	};

	/*
		LE SEUL point qui change le choix : exclusivité (ARIA sur chaque segment), roving
		tabindex, indicateur replacé, PUIS on prévient — dans cet ordre, pour qu'un
		écouteur de `change` lise un `.value` déjà à jour.
		@param {HTMLElement|null} target
		@param {{silent?: boolean}} [options] silent : choisit sans émettre (montage, API)
	*/
	#select(target, { silent = false } = {}) {
		const before = this.selected;
		for (const seg of this.segments) {
			const on = seg === target;
			seg.setAttribute("role", "radio");
			seg.setAttribute("aria-checked", String(on));
			if (on) seg.setAttribute("aria-current", "true");
			else seg.removeAttribute("aria-current");
		}
		if (target && this.hasAttribute("value")) this.setAttribute("value", target.getAttribute("value") ?? "");
		this.#roving();
		this.#place();
		if (!silent && target && target !== before) {
			this.dispatchEvent(new CustomEvent("change", {
				detail: { value: this.value },
				bubbles: true
			}));
		}
	}

	/*
		ROVING TABINDEX : le contrôle est UN arrêt de tabulation. Le segment courant (ou,
		à défaut, le premier libre) porte le focus ; les autres sortent du chemin, on les
		rejoint aux flèches. Sans ça, 5 segments = 5 tabulations.
	*/
	#roving() {
		const usable = this.segments.filter((seg) => !seg.disabled);
		const stop = usable.find((seg) => seg.getAttribute("aria-checked") === "true") ?? usable[0];
		for (const seg of this.segments) {
			seg.tabIndex = (seg === stop && !this.disabled) ? 0 : -1;
		}
	}

	/*
		Place l'indicateur sous le segment courant : on publie sa position et sa largeur
		(mesurées, en px), le CSS fait glisser le ::after. offsetLeft/offsetWidth sont
		relatifs à l'hôte (position: relative) — aucune pièce déplacée à la main.
	*/
	#place() {
		const seg = this.selected;
		if (!seg) { this.style.setProperty("--z-segmented__w", "0px"); return; }
		this.style.setProperty("--z-segmented__x", `${seg.offsetLeft}px`);
		this.style.setProperty("--z-segmented__w", `${seg.offsetWidth}px`);
	}

	/*
		Resynchronise après tout mouvement du DOM : un seul choix vivant, le roving à jour,
		l'indicateur bien posé. `value` en HTML = présélection déclarative tant que rien
		n'est encore choisi ; sinon deux `aria-current` écrits à la main → le 1er gagne.
	*/
	#sync() {
		let chosen = this.segments.find((seg) => seg.getAttribute("aria-current") === "true")
			|| this.segments.find((seg) => seg.getAttribute("aria-checked") === "true");
		const wanted = this.getAttribute("value");
		if (!chosen && wanted !== null) chosen = this.segments.find((seg) => seg.getAttribute("value") === wanted);
		this.#select(chosen ?? null, { silent: true });
	}
}

export function defineZSegmented() {
	if (!customElements.get("z-segmented")) customElements.define("z-segmented", ZSegmented);
}
defineZSegmented();
