/*
	============================================================
	z-radio-group — le niveau GROUPE : l'exclusivité et le clavier
	------------------------------------------------------------
	Une z-radio seule ne sait que s'allumer. Le groupe apporte les trois choses qu'un
	choix unique exige, et RIEN d'autre (zéro logique métier) :

	  1. EXCLUSIVITÉ — une s'allume, les autres s'éteignent (elles ne peuvent pas le
	     faire elles-mêmes : c'est la loi de la radio).
	  2. CLAVIER — ← ↑ → ↓ · Home · End se promènent et choisissent (convention ARIA),
	     avec un roving tabindex : UNE tabulation pour tout le groupe, pas une par choix.
	  3. VALEUR — `.value` lit/écrit le choix courant.

	    <z-radio-group value="en">
	      <z-radio value="fr">Français</z-radio>
	      <z-radio value="en">English</z-radio>
	    </z-radio-group>

	Il n'invente PAS d'événement : le `change` de la radio choisie bulle à travers lui,
	déjà à jour (on écoute en capture). `group.addEventListener("change", …)` suffit.

	SCOPÉ : un groupe ne voit que les z-radio dont il est le groupe LE PLUS PROCHE —
	imbriquer des groupes ne les fait pas se voler leurs radios (même loi que #owns
	dans z-element).

	Doc narrative : z-radio-group.doc.md · API machine : `static api` ci-dessous.
	Styleguide 2.6
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";
import "../z-radio/z-radio.js";

/* Les touches qui déplacent le choix, et de combien (convention ARIA radiogroup :
   les deux axes marchent — l'auteur peut poser ses radios en ligne ou en colonne). */
const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export class ZRadioGroup extends ZElement {
	static api = {
		tag: "z-radio-group",
		example: `<z-radio-group value="en" name="lang">
  <z-radio value="fr">Français</z-radio>
  <z-radio value="en">English</z-radio>
  <z-radio value="es">Español</z-radio>
</z-radio-group>`,
		members: [
			{ kind: "field", name: "value", type: "string", description: { en: "The chosen radio's value (empty when none). Setting it selects without firing `change`.", fr: "La valeur de la radio choisie (vide si aucune). La poser choisit sans émettre `change`.", es: "El valor de la radio elegida (vacío si ninguna). Ponerlo elige sin emitir `change`." } },
			{ kind: "field", name: "radios", type: "Element[]", description: { en: "The z-radio of this group (not those of a nested group).", fr: "Les z-radio de ce groupe (pas celles d'un groupe imbriqué).", es: "Las z-radio de este grupo (no las de un grupo anidado)." } },
			{ kind: "field", name: "selected", type: "Element | null", description: { en: "The chosen radio.", fr: "La radio choisie.", es: "La radio elegida." } }
		],
		summary: {
			en: "A group of z-radio: single choice, arrow-key navigation, roving tabindex, one value.",
			fr: "Un groupe de z-radio : choix unique, navigation aux flèches, roving tabindex, une valeur.",
			es: "Un grupo de z-radio: elección única, navegación con flechas, roving tabindex, un valor."
		},
		attributes: [
			{ name: "value", type: "string", description: { en: "The selected radio's value — set it to preselect, read it to know the choice.", fr: "La valeur de la radio choisie — la poser présélectionne, la lire donne le choix.", es: "El valor de la radio elegida — ponerlo preselecciona, leerlo da la elección." } },
			{ name: "disabled", type: "boolean", description: { en: "Disables the whole group.", fr: "Désactive tout le groupe.", es: "Deshabilita todo el grupo." } },
			{ name: "error", type: "boolean", description: { en: "The group's choice is invalid (e.g. required and empty).", fr: "Le choix du groupe est invalide (ex. requis et vide).", es: "La elección del grupo es inválida (p. ej. requerida y vacía)." } },
			{ name: "success", type: "boolean", description: { en: "The group's choice is valid.", fr: "Le choix du groupe est validé.", es: "La elección del grupo es válida." } }
		],
		events: [
			{ name: "change", description: { en: "Bubbles from the chosen radio; the group's `.value` is already up to date.", fr: "Bulle depuis la radio choisie ; le `.value` du groupe est déjà à jour.", es: "Burbujea desde la radio elegida; el `.value` del grupo ya está actualizado." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-radio-group__gap", description: { en: "Space between the radios.", fr: "L'écart entre les radios.", es: "El espacio entre las radios." } },
			{ name: "--z-radio-group__direction", description: { en: "Layout direction: column (default) or row.", fr: "Sens de mise en page : column (défaut) ou row.", es: "Dirección de disposición: column (predeterminado) o row." } },
			{ name: "--z-radio-group__align", description: { en: "Cross-axis alignment of the choices.", fr: "L'alignement transversal des choix.", es: "La alineación transversal de las opciones." } }
		]
	};

	/* Le DOM peut arriver APRÈS nous (au parsing, le parent est connecté avant ses
	   enfants) ou changer en cours de route : on resynchronise à chaque mouvement. */
	#watcher = new MutationObserver(() => this.#sync());

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
		/* capture : on passe AVANT l'écouteur de l'auteur posé sur nous → quand son
		   `change` arrive, `.value` et l'exclusivité sont déjà faits. */
		this.addEventListener("change", this.#onChange, true);
		this.addEventListener("keydown", this.#onKey);
		this.#watcher.observe(this, { childList: true, subtree: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		this.#sync();
	}

	disconnectedCallback() {
		this.#watcher.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled") this.#sync();
	}

	/* ── API PUBLIQUE ── */

	/* Les radios de CE groupe (pas celles d'un groupe imbriqué). @returns {Element[]} */
	get radios() {
		return [...this.querySelectorAll("z-radio")]
			.filter((radio) => radio.closest("z-radio-group") === this);
	}

	/* La radio choisie, s'il y en a une. @returns {Element|null} */
	get selected() {
		return this.radios.find((radio) => radio.checked) ?? null;
	}

	/* La valeur choisie (chaîne vide si aucun choix). @returns {string} */
	get value() {
		return this.selected?.value ?? "";
	}

	/* Choisit par la valeur (sans événement : c'est le programme qui parle, pas
	   l'utilisateur — même règle que `checked` sur une case). @param {string} value */
	set value(value) {
		const target = this.radios.find((radio) => radio.value === String(value));
		this.#exclusive(target ?? null);
		this.#roving();
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Une radio vient de s'allumer → on éteint les autres. On n'éteint JAMAIS via un
		geste : `checked = false` est l'API, réservée au programme. Voilà pourquoi la
		radio ne peut pas le faire seule et pourquoi ce composant existe.
	*/
	#onChange = (event) => {
		const radio = event.target;
		if (!this.radios.includes(radio)) return;   /* un groupe imbriqué gère les siennes */
		this.#exclusive(radio);
		this.#roving();
	};

	/* N'allume que `keep` (ou éteint tout si null). @param {Element|null} keep */
	#exclusive(keep) {
		for (const radio of this.radios) radio.checked = radio === keep;
		if (this.hasAttribute("value") && keep) this.setAttribute("value", keep.value);
	}

	/*
		Flèches : on se promène ET on choisit (convention ARIA — dans un radiogroup,
		naviguer C'EST choisir). Home/End vont aux extrémités. Circulaire : après la
		dernière, la première.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		/* SCOPE : la touche bulle depuis une radio. Si elle n'est pas des nôtres, elle
		   appartient à un groupe imbriqué qui l'a déjà traitée — on ne s'en mêle pas
		   (sinon le groupe du dessus déplacerait AUSSI son propre choix). */
		const mine = this.radios;
		if (event.target !== this && !mine.includes(event.target)) return;
		const usable = mine.filter((radio) => !radio.disabled);
		if (!usable.length) return;

		const from = usable.indexOf(event.target);
		let next;
		if (event.key === "Home") next = 0;
		else if (event.key === "End") next = usable.length - 1;
		else if (STEP[event.key] !== undefined) {
			/* Hors du groupe (aucune radio focalisée) : la flèche entre par le bout logique. */
			next = from === -1
				? (STEP[event.key] > 0 ? 0 : usable.length - 1)
				: (from + STEP[event.key] + usable.length) % usable.length;
		} else return;

		event.preventDefault();          /* la page ne défile pas sous nos flèches */
		const radio = usable[next];
		radio.focus();
		if (!radio.checked) radio.click();   /* le clic = LE geste de choix, un seul chemin */
	};

	/* Resynchronise après tout mouvement du DOM : un seul choix vivant, un seul arrêt
	   de tabulation, et le verrou du groupe descendu sur chaque radio. */
	#sync() {
		const chosen = this.selected;
		const wanted = this.getAttribute("value");
		/* `value` en HTML = présélection déclarative, tant que rien n'est encore choisi. */
		if (!chosen && wanted !== null) this.#exclusive(this.radios.find((r) => r.value === wanted) ?? null);
		else if (chosen) this.#exclusive(chosen);   /* deux `current` écrits à la main : le 1er gagne */
		this.#roving();
	}

	/*
		ROVING TABINDEX : le groupe est UN arrêt de tabulation. Le choix courant (ou, à
		défaut, la première radio libre) porte le focus ; les autres sortent du chemin —
		on les rejoint aux flèches. Sans ça, 6 choix = 6 tabulations.
	*/
	#roving() {
		const usable = this.radios.filter((radio) => !radio.disabled);
		const stop = usable.find((radio) => radio.checked) ?? usable[0];
		for (const radio of this.radios) {
			radio.tabIndex = (radio === stop && !this.disabled) ? 0 : -1;
		}
	}
}

export function defineZRadioGroup() {
	if (!customElements.get("z-radio-group")) customElements.define("z-radio-group", ZRadioGroup);
}
defineZRadioGroup();
