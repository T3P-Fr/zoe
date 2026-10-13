/*
	============================================================
	z-tooltip — une bulle d'aide, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	Un déclencheur + une bulle qui apparaît au survol ET au focus clavier. `ZTooltip
	extends ZElement` pour la cohérence de la famille ; l'essentiel ici est l'accessibilité.

	    FORME ACCESSIBLE — la bulle est une pièce, reliée au déclencheur :
	    <z-tooltip>
	      <button>?</button>
	      <z-layer part="tip">On habille le natif, on ne le remplace pas.</z-layer>
	    </z-tooltip>

	    FORME COURTE — le texte en attribut (visuel ; a11y plus limitée) :
	    <z-tooltip tip="Explication rapide"><button>?</button></z-tooltip>

	ACCESSIBLE : la pièce `[part=tip]` reçoit un id + `role="tooltip"`, et le premier
	élément focusable la référence via `aria-describedby` — un lecteur d'écran lit donc
	l'aide en atteignant le déclencheur. Échap masque la bulle (on retire le focus). Le
	montré/caché au survol et au focus se fait en CSS (:hover / :focus-within).

	Doc narrative : z-tooltip.doc.md (à venir) · API machine : `static api` ci-dessous.
	Styleguide 14.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;
const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

export class ZTooltip extends ZElement {
	static api = {
		tag: "z-tooltip",
		example: `<z-tooltip>
  <button>?</button>
  <z-layer part="tip">On habille le natif, on ne le remplace pas.</z-layer>
</z-tooltip>
<z-tooltip tip="Explication rapide" placement="bottom"><button>?</button></z-tooltip>`,
		summary: {
			en: "A hint bubble shown on hover and keyboard focus — accessible via a [part=tip] piece wired with aria-describedby.",
			fr: "Une bulle d'aide montrée au survol et au focus clavier — accessible via une pièce [part=tip] reliée par aria-describedby.",
			es: "Una burbuja de ayuda mostrada al pasar el ratón y con foco de teclado — accesible mediante una pieza [part=tip] enlazada con aria-describedby."
		},
		attributes: [
			{ name: "tip", type: "string", description: { en: "Short form: the bubble text as an attribute (visual; prefer a [part=tip] piece for full a11y).", fr: "Forme courte : le texte de la bulle en attribut (visuel ; préférez une pièce [part=tip] pour l'a11y complète).", es: "Forma corta: el texto de la burbuja como atributo (visual; prefiera una pieza [part=tip] para a11y completa)." } },
			{ name: "placement", type: "\"top\" | \"bottom\"", description: { en: "Where the bubble sits (default top).", fr: "Où se place la bulle (défaut : au-dessus).", es: "Dónde se sitúa la burbuja (predeterminado: arriba)." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		layers: [{ part: "tip", description: { en: "The bubble content (accessible form).", fr: "Le contenu de la bulle (forme accessible).", es: "El contenido de la burbuja (forma accesible)." } }]
	};

	connectedCallback() {
		const tip = this.querySelector(":scope > [part=tip]");
		if (tip) {
			if (!tip.id) tip.id = `z-tooltip-${++uid}`;
			if (!tip.hasAttribute("role")) tip.setAttribute("role", "tooltip");
			/* Le premier élément focusable RÉFÉRENCE la bulle : le lecteur d'écran la lit
			   en atteignant le déclencheur. À défaut, on rend l'hôte lui-même atteignable. */
			const trigger = this.querySelector(FOCUSABLE) || this;
			if (trigger === this && !this.hasAttribute("tabindex")) this.tabIndex = 0;
			const described = trigger.getAttribute("aria-describedby");
			if (!described) trigger.setAttribute("aria-describedby", tip.id);
		}
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();
	}

	/* Échap masque la bulle : on retire le focus de l'intérieur (le CSS se referme). */
	#onKey = (event) => {
		if (event.key === "Escape" && this.contains(document.activeElement)) {
			document.activeElement.blur();
		}
	};
}

export function defineZTooltip() {
	if (!customElements.get("z-tooltip")) customElements.define("z-tooltip", ZTooltip);
}
defineZTooltip();
