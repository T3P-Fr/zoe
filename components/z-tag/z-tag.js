/*
	============================================================
	z-tag — une étiquette, bâtie SUR z-element (Chemin A)
	------------------------------------------------------------
	La cousine du badge, mais pour ce que l'HUMAIN pose : un mot-clé, un filtre, une
	catégorie. `ZTag extends ZElement` → ton & taille gratuits (variants du socle).
	Elle ajoute une seule capacité : `removable`, une croix pour la retirer.

	    <z-tag>design</z-tag>
	    <z-tag tone="complement">urgent</z-tag>
	    <z-tag removable>à retirer</z-tag>

	REMOVABLE, fait proprement (Zoé n'injecte rien — ADR-0018) : la croix est peinte en
	CSS (::after), et le retrait s'active de DEUX façons, comme une puce d'e-mail —
	  · au CLIC dans la zone de la croix (le bord droit) ;
	  · au clavier, quand l'étiquette a le focus : Suppr ou Retour arrière.
	Le retrait émet `zoe:remove` ANNULABLE : l'auteur peut `preventDefault()` pour gérer
	lui-même (confirmation, refus) ; sinon l'étiquette JOUE sa sortie (état `exit`, le temps
	de --z-dur-exit) puis se détache — rien ne disparaît sec (loi Zoé, comme z-toast).

	Doc narrative : z-tag.doc.md · API machine : `static api` ci-dessous.
	Styleguide 7.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* La largeur de la zone cliquable de la croix, en em — accordée au CSS (::after). */
const REMOVE_ZONE_EM = 1.7;

export class ZTag extends ZElement {
	static api = {
		tag: "z-tag",
		example: `<z-tag>design</z-tag>
<z-tag tone="main" removable>filtre : rouge</z-tag>
<z-tag size="s" tone="soft">brouillon</z-tag>`,
		members: [
			{ kind: "field", name: "removable", type: "boolean", description: { en: "Mirrors the `removable` attribute.", fr: "Reflet de l'attribut `removable`.", es: "Reflejo del atributo `removable`." } },
			{ kind: "method", name: "remove()", type: "Promise<void>", description: { en: "Removes the tag: fires cancelable `zoe:remove`, then plays `exit` and detaches.", fr: "Retire l'étiquette : émet `zoe:remove` (annulable), puis joue `exit` et se détache.", es: "Quita la etiqueta: emite `zoe:remove` (cancelable), luego reproduce `exit` y se separa." } }
		],
		summary: {
			en: "A tag/chip for keywords, filters, categories — inherits tone & size; optionally removable.",
			fr: "Une étiquette pour mots-clés, filtres, catégories — hérite tone & size ; retirable en option.",
			es: "Una etiqueta para palabras clave, filtros, categorías — hereda tone y size; retirable opcionalmente."
		},
		attributes: [
			{ name: "removable", type: "boolean", description: { en: "Shows a × ; removes on click (on the ×) or Delete/Backspace when focused.", fr: "Affiche une × ; retire au clic (sur la ×) ou Suppr/Retour arrière au focus.", es: "Muestra una × ; retira al clic (en la ×) o Supr/Retroceso con foco." } },
			{ name: "tone", type: "\"main\" | \"complement\" | \"soft\" | \"success\" | \"danger\"", description: { en: "Importance/colour, from the socle variant.", fr: "L'importance/la couleur, via le variant du socle.", es: "La importancia/color, mediante el variante del zócalo." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant.", fr: "Le facteur de taille, via le variant du socle.", es: "El factor de tamaño, mediante el variante del zócalo." } }
		],
		events: [
			{ name: "zoe:remove", description: { en: "Cancelable — fired before removal. preventDefault() to handle it yourself.", fr: "Annulable — émis avant le retrait. preventDefault() pour le gérer soi-même.", es: "Cancelable — emitido antes del retiro. preventDefault() para gestionarlo uno mismo." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "background", description: { en: "The chip surface — carries tone and effects.", fr: "La surface de l'étiquette — porte le ton et les effets.", es: "La superficie de la etiqueta — lleva el tono y los efectos." } },
			{
				part: "infos",
				description: { en: "What informs — moved or animated as one block.", fr: "Ce qui informe — déplacé ou animé d'un bloc.", es: "Lo que informa — movido o animado en bloque." },
				children: [
					{ part: "icon", optional: true, description: { en: "Optional, before the label.", fr: "Optionnel, avant le label.", es: "Opcional, antes de la etiqueta." } },
					{ part: "label", description: { en: "Your text.", fr: "Votre texte.", es: "Su texto." } }
				]
			}
		]
	};

	/* Déjà en train de partir : on ne rejoue pas la sortie (un double clic sur la croix). */
	#removing = false;

	connectedCallback() {
		this.#removing = false;   /* re-monter (un « annuler ») redonne le droit de partir */
		this.#syncRemovable();
		this.addEventListener("pointerdown", this.#onPointer);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble la grammaire d'états */
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "removable") this.#syncRemovable();
	}

	/* Retirable ? @returns {boolean} */
	get removable() {
		return this.hasAttribute("removable");
	}

	/* @param {boolean} value */
	set removable(value) {
		this.toggleAttribute("removable", Boolean(value));
	}

	/*
		Le retrait — un seul chemin pour le clic, le clavier ET l'API (c'est le `remove()`
		natif, redéfini). On PRÉVIENT d'abord (`zoe:remove`, annulable) ; si personne ne
		s'y oppose, on JOUE la sortie puis on détache. Sans l'attente, disconnectedCallback
		arriverait trop tard pour animer (même raison que `exit` dans z-element / z-toast).
		@returns {Promise<void>} résolue une fois le nœud retiré (ou tout de suite si annulé)
	*/
	async remove() {
		if (this.#removing) return;
		const allowed = this.dispatchEvent(new CustomEvent("zoe:remove", { bubbles: true, cancelable: true }));
		if (!allowed) return;   /* l'auteur a pris la main (preventDefault) */
		this.#removing = true;
		await this.play("exit");   /* joue :state(exit) le temps de --z-dur-exit, puis rend la main */
		super.remove();
	}

	/* Une étiquette retirable est focusable (le clavier doit pouvoir l'atteindre). */
	#syncRemovable() {
		if (this.removable && !this.hasAttribute("tabindex")) this.tabIndex = 0;
	}

	/*
		Clic : on ne retire que si le pointeur tombe dans la ZONE de la croix (le bord
		droit), pas n'importe où sur l'étiquette — sinon cliquer le mot la supprimerait.
		La zone est accordée au CSS (REMOVE_ZONE_EM ↔ padding-right de ::after).
	*/
	#onPointer = (event) => {
		if (!this.removable) return;
		const rect = this.getBoundingClientRect();
		const em = parseFloat(getComputedStyle(this).fontSize) || 16;
		if (event.clientX >= rect.right - REMOVE_ZONE_EM * em) {
			event.preventDefault();
			this.remove();
		}
	};

	/* Clavier : Suppr ou Retour arrière retire l'étiquette focalisée (convention des puces). */
	#onKey = (event) => {
		if (!this.removable) return;
		if (event.key === "Delete" || event.key === "Backspace") {
			event.preventDefault();
			this.remove();
		}
	};
}

export function defineZTag() {
	if (!customElements.get("z-tag")) customElements.define("z-tag", ZTag);
}
defineZTag();
