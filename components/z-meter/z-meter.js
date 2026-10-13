/*
	============================================================
	z-meter — une jauge de MESURE (pas une progression), bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Une valeur SCALAIRE dans une plage connue, avec des SEUILS : niveau de batterie, place
	disque, note, stock. À ne pas confondre avec z-progress — celui-ci mesure une avancée
	dans le temps (0 → fini), z-meter mesure un ÉTAT (bas / bon / haut). C'est la
	différence entre `role="progressbar"` et `role="meter"`, et on la respecte.

	    <z-meter value="72"></z-meter>
	    <z-meter value="15" low="20" high="80" optimum="100"></z-meter>  (batterie faible → danger)
	    <z-meter value="3" max="5"></z-meter>

	`value` sur [`min`…`max`] → un pourcentage, posé dans `--z-meter__value` : le CSS en
	fait une largeur (comme z-progress). La COULEUR du remplissage suit les seuils, calculée
	ici et exposée en état :state(low|high|optimum) que le CSS peint. Zoé n'injecte rien
	(ADR-0018) : la jauge est peinte (::before ou calque `marker`), jamais ajoutée.

	Les seuils découpent la plage comme ceux de <meter> HTML : `low` et `high` font trois
	zones (basse, moyenne, haute) ; `optimum` désigne la zone idéale. Une valeur sous `low`
	est :state(low) (danger), au-dessus de `high` :state(high) (success) ; une valeur dans
	la zone de `optimum` est :state(optimum) (le ton) et gagne sur les deux autres. Ce
	n'est PAS la coloration complète du <meter> natif (optimum / sub-optimum / even less
	good) : la zone haute reste peinte en success quel que soit l'idéal — pour une échelle
	inversée (« bas = bon »), l'auteur repeint `:state(high)` via le pacte.

	Doc narrative : z-meter.doc.md · API machine : `static api` ci-dessous.
	Styleguide 20.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZMeter extends ZElement {
	static api = {
		tag: "z-meter",
		example: `<z-meter value="72"></z-meter>
<z-meter value="15" low="20" high="80" optimum="100"></z-meter>
<z-meter value="3" max="5"></z-meter>`,
		members: [
			{ kind: "field", name: "value", type: "number", description: { en: "The measured amount.", fr: "La quantité mesurée.", es: "La cantidad medida." } },
			{ kind: "field", name: "min · max", type: "number", description: { en: "The bounds (mirror the attributes).", fr: "Les bornes (reflets des attributs).", es: "Los límites (reflejos de los atributos)." } }
		],
		summary: {
			en: "A gauge (role=meter): a scalar measurement within a range, coloured by low/high/optimum thresholds. Not a progress bar — it shows a state, not an advance.",
			fr: "Une jauge (role=meter) : une mesure scalaire dans une plage, colorée par les seuils low/high/optimum. Pas une barre de progression — elle montre un état, pas une avancée.",
			es: "Un indicador (role=meter): una medición escalar dentro de un rango, coloreada por los umbrales low/high/optimum. No es una barra de progreso — muestra un estado, no un avance."
		},
		attributes: [
			{ name: "value", type: "number", description: { en: "The measured amount (min…max).", fr: "La quantité mesurée (min…max).", es: "La cantidad medida (min…max)." } },
			{ name: "min", type: "number", description: { en: "Lower bound (default 0).", fr: "Borne basse (défaut 0).", es: "Límite inferior (predeterminado 0)." } },
			{ name: "max", type: "number", description: { en: "Upper bound (default 100).", fr: "Borne haute (défaut 100).", es: "Límite superior (predeterminado 100)." } },
			{ name: "low", type: "number", description: { en: "Below this, the value is in the low segment.", fr: "En dessous, la valeur est dans le segment bas.", es: "Por debajo, el valor está en el segmento bajo." } },
			{ name: "high", type: "number", description: { en: "Above this, the value is in the high segment.", fr: "Au-dessus, la valeur est dans le segment haut.", es: "Por encima, el valor está en el segmento alto." } },
			{ name: "optimum", type: "number", description: { en: "Where the ideal sits — a value in the same zone is `optimum` (painted with the tone) instead of low/high.", fr: "Où se situe l'idéal — une valeur dans la même zone est `optimum` (peinte avec le ton) au lieu de low/high.", es: "Dónde está el ideal — un valor en la misma zona es `optimum` (pintado con el tono) en lugar de low/high." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: [...ZElement.api.states, "low", "high", "optimum"],
		layers: [
			{ part: "background", description: { en: "The track (the empty rail).", fr: "La piste (le rail vide).", es: "La pista (el riel vacío)." } },
			{ part: "marker", description: { en: "The fill — its width is the measurement, its colour follows the threshold.", fr: "Le remplissage — sa largeur est la mesure, sa couleur suit le seuil.", es: "El relleno — su ancho es la medición, su color sigue el umbral." } }
		]
	};

	/*
		`low`/`high`/`optimum` sont des ATTRIBUTS numériques (des seuils), PAS des états
		durables : on ne les ajoute donc SURTOUT pas à durableStates, sinon setState("low",
		false) retirerait l'attribut `low="20"` de l'auteur. Les états de segment portent les
		mêmes noms mais vivent en :state() seul (posés par #set via setState pour un nom
		non-durable) — aucune collision : `[low]` (l'attribut/seuil) ≠ `:state(low)` (la zone).
	*/
	static #NUM_ATTRS = ["value", "min", "max", "low", "high", "optimum"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZMeter.#NUM_ATTRS];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "meter");
		this.#sync();
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		/* Les nombres pilotent le rendu, pas le socle : on recalcule et on rend la main. */
		if (ZMeter.#NUM_ATTRS.includes(name)) { this.#sync(); return; }
		super.attributeChangedCallback(name, previous, value);
	}

	/* La valeur mesurée. @returns {number} */
	get value() {
		return Number(this.getAttribute("value")) || 0;
	}

	/* @param {number} v */
	set value(v) {
		this.setAttribute("value", String(v));
	}

	/* Borne basse. @returns {number} */
	get min() {
		return Number(this.getAttribute("min")) || 0;
	}

	/* @param {number} v */
	set min(v) {
		this.setAttribute("min", String(v));
	}

	/* Borne haute (défaut 100). @returns {number} */
	get max() {
		const m = Number(this.getAttribute("max"));
		return this.hasAttribute("max") && m > this.min ? m : 100;
	}

	/* @param {number} v */
	set max(v) {
		this.setAttribute("max", String(v));
	}

	/*
		Publie le pourcentage pour le CSS, tient l'ARIA à jour, et pose l'état de SEGMENT
		(low/high/optimum) que le CSS colore — voir #applySegment pour la règle.
	*/
	#sync() {
		const { min, max, value } = this;
		const clamped = Math.max(min, Math.min(max, value));
		const ratio = max > min ? (clamped - min) / (max - min) : 0;
		this.style.setProperty("--z-meter__value", `${(ratio * 100).toFixed(2)}%`);

		this.setAttribute("aria-valuemin", String(min));
		this.setAttribute("aria-valuemax", String(max));
		this.setAttribute("aria-valuenow", String(clamped));

		this.#applySegment(clamped);
	}

	/*
		Pose l'état de segment que le CSS colore. `low`/`high` (facultatifs) découpent la
		plage en trois zones : basse, moyenne, haute. On expose la zone où tombe la valeur :
		  · :state(low)  = sous `low`  → z-meter.css la peint en danger ;
		  · :state(high) = au-dessus de `high` → en success ;
		  · :state(optimum) = la valeur est dans la MÊME zone que `optimum` → l'idéal, peint
		    avec le ton (--z-tone__fill, accent par défaut). optimum GAGNE sur low/high : une
		    batterie pleine (optimum="100") n'est donc pas « success » mais « idéale ».
		Les deux autres zones gardent leur couleur de POSITION (bas = danger, haut =
		success) quel que soit l'idéal : pour une échelle inversée (« bas = bon »), l'auteur
		repeint `:state(high)` via --z-meter--fill__color.
		Sans aucun seuil, aucun état de segment : la jauge reste neutre (accent).
		@param {number} value la valeur déjà bornée à [min…max]
	*/
	#applySegment(value) {
		const low = this.hasAttribute("low") ? Number(this.getAttribute("low")) : null;
		const high = this.hasAttribute("high") ? Number(this.getAttribute("high")) : null;
		const optimum = this.hasAttribute("optimum") ? Number(this.getAttribute("optimum")) : null;

		/* Dans quelle zone tombe une valeur : 0 = basse, 1 = moyenne, 2 = haute. */
		const zoneOf = (n) => {
			if (low !== null && n < low) return 0;
			if (high !== null && n > high) return 2;
			return 1;
		};

		const zone = zoneOf(value);
		/* L'idéal marque SA zone comme « bonne » ; la valeur y est optimum si elle partage. */
		const isOptimum = optimum !== null && zone === zoneOf(optimum);

		this.setState("optimum", isOptimum);
		this.setState("low", !isOptimum && zone === 0);
		this.setState("high", !isOptimum && zone === 2);
	}
}

export function defineZMeter() {
	if (!customElements.get("z-meter")) customElements.define("z-meter", ZMeter);
}
defineZMeter();
