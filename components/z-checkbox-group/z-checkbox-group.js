/*
	============================================================
	z-checkbox-group — le niveau GROUPE des cases : la liste, la maîtresse, l'exigence
	------------------------------------------------------------
	Une z-checkbox seule sait se cocher. Le groupe apporte ce qu'un choix MULTIPLE
	exige, et rien d'autre (zéro logique métier) :

	  1. UNE VALEUR — `.value` est la LISTE des `value` cochées ; l'attribut
	     `value="design code"` présélectionne (espace = séparateur, comme `channel`).
	  2. LA MAÎTRESSE — une case `[part="all"]` qui coche/décoche tout, et qui reflète
	     la liste : cochée si toutes, indéterminée si certaines, rien si aucune.
	  3. L'EXIGENCE — `required` = au moins une case ; le groupe est associé au
	     formulaire, il bloque la soumission même sans `name`.
	  4. LE NOM — si le groupe a un `name` et qu'une case n'en a pas, il lui pose le sien :
	     c'est ainsi que FormData reçoit `topics=design&topics=code`. Un `name` écrit
	     par l'auteur sur une case n'est jamais touché.

	    <z-checkbox-group name="topics" required>
	      <span part="label">Vos centres d'intérêt</span>
	      <z-checkbox part="all">Tout cocher</z-checkbox>
	      <z-checkbox value="design">Design</z-checkbox>
	      <z-checkbox value="code" current>Code</z-checkbox>
	      <z-checkbox value="motion">Motion</z-checkbox>
	    </z-checkbox-group>

	Il n'invente PAS d'événement : le `change` d'une case bulle à travers lui, déjà à
	jour (on écoute en capture). Seule la maîtresse fait exception : son `change` est
	arrêté, et le groupe en émet UN, le sien — l'auteur voit une liste qui change, pas
	une case qui se coche.

	SCOPÉ : un groupe ne voit que les z-checkbox dont il est le groupe LE PLUS PROCHE —
	imbriquer des groupes ne les fait pas se voler leurs cases (même loi que #owns dans
	z-element). Le groupe n'injecte rien et ne fait pas de roving : une case est un arrêt
	de tabulation à elle, comme la case native.

	Doc narrative : z-checkbox-group.doc.md · API machine : `static api` ci-dessous.
	Styleguide 35.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";
import "../z-checkbox/z-checkbox.js";

let uid = 0;

export class ZCheckboxGroup extends ZElement {
	static api = {
		tag: "z-checkbox-group",
		example: `<z-checkbox-group name="topics" required>
  <span part="label">Vos centres d'intérêt</span>
  <z-checkbox part="all">Tout cocher</z-checkbox>
  <z-checkbox value="design">Design</z-checkbox>
  <z-checkbox value="code" current>Code</z-checkbox>
  <z-checkbox value="motion">Motion</z-checkbox>
</z-checkbox-group>`,
		members: [
			{ kind: "field", name: "value", type: "string[]", description: { en: "The checked values, in DOM order. Set it with an array or a space-separated string — silently (no `change`).", fr: "Les valeurs cochées, dans l'ordre du DOM. Se pose avec un tableau ou une chaîne à espaces — en silence (pas de `change`).", es: "Los valores marcados, en orden del DOM. Se asigna con un array o una cadena con espacios — en silencio (sin `change`)." } },
			{ kind: "field", name: "checkboxes", type: "Element[]", description: { en: "The z-checkbox of this group — not the master, not those of a nested group.", fr: "Les z-checkbox de ce groupe — sans la maîtresse, sans celles d'un groupe imbriqué.", es: "Las z-checkbox de este grupo — sin la maestra, sin las de un grupo anidado." } },
			{ kind: "field", name: "all", type: "Element | null", description: { en: "The master box ([part=all]), if any.", fr: "La maîtresse ([part=all]), s'il y en a une.", es: "La maestra ([part=all]), si la hay." } },
			{ kind: "field", name: "count", type: "number", description: { en: "How many boxes are checked.", fr: "Le nombre de cases cochées.", es: "El número de casillas marcadas." } }
		],
		summary: {
			en: "A group of z-checkbox: a list value, a 'check all' master, 'at least one' required, one name for FormData.",
			fr: "Un groupe de z-checkbox : une valeur-liste, une maîtresse « tout cocher », « au moins une » en required, un seul name pour FormData.",
			es: "Un grupo de z-checkbox: un valor-lista, una maestra «marcar todo», «al menos una» con required, un solo name para FormData."
		},
		attributes: [
			{ name: "value", type: "string", description: { en: "Space-separated values to preselect (honoured once, only if no box is checked by hand); then kept up to date by the group.", fr: "Les valeurs à présélectionner, séparées par des espaces (honoré une fois, seulement si aucune case n'est cochée à la main) ; tenu à jour ensuite par le groupe.", es: "Los valores a preseleccionar, separados por espacios (honrado una vez, solo si ninguna casilla está marcada a mano); luego el grupo lo mantiene al día." } },
			{ name: "name", type: "string", description: { en: "Given to every box that has none: the values are submitted under this name.", fr: "Donné à chaque case qui n'en a pas : les valeurs partent sous ce nom.", es: "Dado a cada casilla que no tiene: los valores se envían bajo este nombre." } },
			{ name: "required", type: "boolean", description: { en: "At least one box must be checked, or the form refuses to submit.", fr: "Au moins une case doit être cochée, sinon le formulaire refuse la soumission.", es: "Al menos una casilla debe estar marcada, o el formulario rechaza el envío." } },
			{ name: "disabled", type: "boolean", description: { en: "Disables the whole group — descended on every box and the master.", fr: "Désactive tout le groupe — descendu sur chaque case et la maîtresse.", es: "Deshabilita todo el grupo — descendido a cada casilla y la maestra." } },
			{ name: "error", type: "boolean", description: { en: "The requirement is not met and the form refused to submit (posed by the group, cleared by the next check).", fr: "L'exigence n'est pas remplie et le formulaire a refusé la soumission (posé par le groupe, levé à la prochaine coche).", es: "La exigencia no se cumple y el formulario rechazó el envío (puesto por el grupo, quitado al marcar de nuevo)." } },
			{ name: "success", type: "boolean", description: { en: "The requirement is met, after a gesture.", fr: "L'exigence est remplie, après un geste.", es: "La exigencia se cumple, tras un gesto." } }
		],
		events: [
			{ name: "change", description: { en: "Bubbles from the toggled box (the group's `.value` is already up to date) — or is emitted by the group itself when the master toggles everything.", fr: "Bulle depuis la case basculée (le `.value` du groupe est déjà à jour) — ou est émis par le groupe lui-même quand la maîtresse bascule tout.", es: "Burbujea desde la casilla cambiada (el `.value` del grupo ya está al día) — o lo emite el propio grupo cuando la maestra cambia todo." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "label", optional: true, description: { en: "The group's title, any native tag — it names the group (aria-labelledby).", fr: "L'intitulé du groupe, en balise native — il nomme le groupe (aria-labelledby).", es: "El título del grupo, en etiqueta nativa — nombra al grupo (aria-labelledby)." } },
			{ part: "all", optional: true, description: { en: "The master z-checkbox: toggles every box, reflects the list (checked / indeterminate / none). Never submitted, never counted.", fr: "La z-checkbox maîtresse : bascule toutes les cases, reflète la liste (cochée / indéterminée / rien). Jamais envoyée, jamais comptée.", es: "La z-checkbox maestra: cambia todas las casillas, refleja la lista (marcada / indeterminada / nada). Nunca enviada, nunca contada." } }
		],
		cssVars: [
			{ name: "--z-checkbox-group__count", description: { en: "Posed by the group: how many boxes are checked (an integer, for counter()).", fr: "Posée par le groupe : le nombre de cases cochées (un entier, pour counter()).", es: "Puesta por el grupo: el número de casillas marcadas (un entero, para counter())." } },
			{ name: "--z-checkbox-group__total", description: { en: "Posed by the group: how many boxes it holds (master excluded).", fr: "Posée par le groupe : le nombre de cases qu'il tient (maîtresse exclue).", es: "Puesta por el grupo: el número de casillas que contiene (maestra excluida)." } }
		]
	};

	/*
		`value`, `name` et `required` changent ce que le groupe TIENT ou ENVOIE, pas ce qu'il
		peint : on les intercepte avant le socle (sinon `:state(value)` naîtrait, et ne
		voudrait rien dire). Même règle que `value` sur z-checkbox.
	*/
	static #BEHAVIOR_ATTRS = ["value", "name", "required"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZCheckboxGroup.#BEHAVIOR_ATTRS];
	}

	#wired = false;
	#preselected = false;
	#defaultValue = null;       /* l'attribut `value` d'origine — ce que le reset restaure */
	#written = null;            /* la dernière valeur qu'on a écrite dans `value` : on ne se relit pas */
	#named = new WeakSet();     /* les cases qu'on a nommées (jamais le name d'un auteur) */
	#locked = new WeakSet();    /* les cases qu'on a verrouillées (jamais le disabled d'un auteur) */
	/* Le DOM peut arriver APRÈS nous (au parsing, le parent est connecté avant ses
	   enfants) ou changer en cours de route : on resynchronise à chaque mouvement. */
	#watcher = new MutationObserver(() => this.#sync());

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "group");
		/* capture : on passe AVANT l'écouteur de l'auteur posé sur nous → quand son
		   `change` arrive, `.value`, la maîtresse et la validité sont déjà faits. */
		this.addEventListener("change", this.#onChange, true);
		this.addEventListener("invalid", this.#onInvalid);
		this.#watcher.observe(this, { childList: true, subtree: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		if (!this.#wired) {
			this.#wired = true;
			this.#defaultValue = this.getAttribute("value");
		}
		this.#sync();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZCheckboxGroup.#BEHAVIOR_ATTRS.includes(name)) {
			if (!this.#wired) return;   /* au parsing, les enfants ne sont pas là : #sync les lira au montage */
			/* `value` écrit par le PROGRAMME → on sélectionne ; écrit par nous → on ne se relit pas. */
			if (name === "value") { if (value !== null && value !== this.#written) this.value = value; return; }
			this.#sync();
			return;
		}
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled" && this.#wired) this.#sync();
	}

	/* ── API PUBLIQUE ── */

	/* Les cases de CE groupe : pas la maîtresse, pas celles d'un groupe imbriqué. @returns {Element[]} */
	get checkboxes() {
		return [...this.querySelectorAll("z-checkbox")]
			.filter((box) => box.closest("z-checkbox-group") === this && box.getAttribute("part") !== "all");
	}

	/* La maîtresse, s'il y en a une. @returns {Element|null} */
	get all() {
		return [...this.querySelectorAll('z-checkbox[part="all"]')]
			.find((box) => box.closest("z-checkbox-group") === this) ?? null;
	}

	/* Les valeurs cochées, dans l'ordre du DOM. @returns {string[]} */
	get value() {
		return this.checkboxes.filter((box) => box.checked).map((box) => box.value);
	}

	/* Coche exactement ces valeurs — en silence (c'est le programme qui parle, pas
	   l'utilisateur ; même règle que `checked` sur une case). @param {string[]|string} list */
	set value(list) {
		this.#check(list);
		this.#sync();
	}

	/* Le nombre de cases cochées. @returns {number} */
	get count() {
		return this.checkboxes.filter((box) => box.checked).length;
	}

	/*
		Le formulaire est remis à zéro : les cases reviennent à leur HTML d'origine juste
		APRÈS nous (ordre du DOM) — d'où le micro-délai ; puis la présélection d'origine
		reprend si rien n'est coché, et le groupe redevient muet.
	*/
	formResetCallback() {
		this.setState("error", false);
		this.setState("success", false);
		queueMicrotask(() => {
			if (this.#defaultValue !== null && !this.checkboxes.some((box) => box.checked)) this.#check(this.#defaultValue);
			this.#sync();
		});
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Coche les cases dont la valeur est dans `list`, décoche les autres — par la
	   propriété, qui n'émet pas. @param {string[]|string} list */
	#check(list) {
		const wanted = new Set(Array.isArray(list) ? list.map(String) : String(list ?? "").split(/\s+/).filter(Boolean));
		for (const box of this.checkboxes) box.checked = wanted.has(box.value);
	}

	/*
		Une case a bougé. La MAÎTRESSE : toutes les cases libres suivent (par la propriété,
		sans événement), son propre `change` s'arrête ici, et le groupe émet LE SIEN — un
		seul, avec le groupe pour cible. Une CASE : on remet tout d'accord, puis son
		`change` continue de buller, déjà à jour.
	*/
	#onChange = (event) => {
		const box = event.target;
		const all = this.all;
		if (box === all) {
			event.stopPropagation();
			for (const one of this.checkboxes) if (!one.disabled) one.checked = all.checked;
			this.#sync();
			this.#judge();
			this.dispatchEvent(new Event("change", { bubbles: true }));
			return;
		}
		if (!this.checkboxes.includes(box)) return;   /* un groupe imbriqué gère les siennes */
		this.#sync();
		this.#judge();
	};

	/* Le formulaire refuse le groupe (soumission) : l'erreur est celle du GROUPE. */
	#onInvalid = () => {
		this.setState("error", true);
		this.setState("success", false);
	};

	/*
		Après un GESTE : succès si l'exigence est remplie ; l'erreur (posée par un refus de
		soumission) s'efface dès qu'une case est cochée — un geste ne la pose jamais.
	*/
	#judge() {
		if (!this.required) return;
		const met = this.count > 0;
		this.setState("success", met);
		if (met) this.setState("error", false);
	}

	/* Remet tout d'accord après tout mouvement : présélection, intitulé, nom et verrou
	   descendus, maîtresse, validité, nombres, attribut `value`. Idempotent. */
	#sync() {
		const boxes = this.checkboxes;
		const wanted = this.getAttribute("value");
		/* `value` en HTML = présélection déclarative, honorée UNE fois et seulement si rien
		   n'est coché à la main (un `current` écrit sur une case gagne). */
		if (wanted !== null && boxes.length && !this.#preselected) {
			this.#preselected = true;
			if (!boxes.some((box) => box.checked)) this.#check(wanted);
		}
		this.#label();
		this.#descend(boxes);
		this.#master(boxes);
		this.#validity();
		this.#numbers(boxes);
		this.#reflect(wanted, boxes);
	}

	/* L'intitulé nomme le groupe — sauf si l'auteur l'a déjà nommé lui-même. */
	#label() {
		const label = this.querySelector(':scope > [part="label"]');
		if (!label || this.hasAttribute("aria-label")) return;
		if (!label.id) label.id = `z-checkbox-group-${++uid}-label`;
		if (this.getAttribute("aria-labelledby") !== label.id) this.setAttribute("aria-labelledby", label.id);
	}

	/*
		Ce qui DESCEND du groupe sur ses cases : le `name` (sur celles qui n'en ont pas —
		c'est ainsi que FormData reçoit la liste sous un seul nom) et le verrou (sur celles
		qui ne l'étaient pas déjà). On se souvient de ce qu'on a posé pour ne retirer que ça.
		@param {Element[]} boxes
	*/
	#descend(boxes) {
		const name = this.getAttribute("name");
		for (const box of boxes) {
			if (name && (!box.hasAttribute("name") || this.#named.has(box))) {
				if (box.getAttribute("name") !== name) box.setAttribute("name", name);
				this.#named.add(box);
			} else if (!name && this.#named.has(box)) {
				box.removeAttribute("name");
				this.#named.delete(box);
			}
		}
		const locked = this.disabled;
		for (const box of [...boxes, this.all].filter(Boolean)) {
			if (locked && !box.disabled) { box.setAttribute("disabled", ""); this.#locked.add(box); }
			else if (!locked && this.#locked.has(box)) { box.removeAttribute("disabled"); this.#locked.delete(box); }
		}
	}

	/*
		La maîtresse reflète les cases LIBRES (une case verrouillée par l'auteur ne compte
		pas : elle ne peut pas suivre) : toutes → cochée · certaines → indéterminée · aucune
		→ rien. Deux lignes, parce que `checked` ne lève jamais `indeterminate` (z-checkbox).
		@param {Element[]} boxes
	*/
	#master(boxes) {
		const all = this.all;
		if (!all) return;
		const free = boxes.filter((box) => !box.disabled || this.#locked.has(box));
		const checked = free.filter((box) => box.checked).length;
		all.indeterminate = checked > 0 && checked < free.length;
		all.checked = free.length > 0 && checked === free.length;
	}

	/* L'exigence : au moins une case. Le groupe est associé au formulaire : il bloque la
	   soumission lui-même, même sans `name`. Message en anglais comme le reste de l'API ;
	   l'auteur le remplace par `group.setValidity("Cochez-en au moins une")`. */
	#validity() {
		const missing = this.required && this.count === 0;
		this.setValidity(missing ? "Please select at least one option." : "");
		if (this.required) this.setAttribute("aria-required", "true");
		else this.removeAttribute("aria-required");
	}

	/* Les deux nombres publiés : cochées et total (maîtresse exclue). @param {Element[]} boxes */
	#numbers(boxes) {
		this.style.setProperty("--z-checkbox-group__count", String(boxes.filter((box) => box.checked).length));
		this.style.setProperty("--z-checkbox-group__total", String(boxes.length));
	}

	/* L'attribut `value`, quand il est écrit, suit la sélection : le DOM dit vrai.
	   @param {string|null} wanted  @param {Element[]} boxes */
	#reflect(wanted, boxes) {
		if (wanted === null || !boxes.length) return;
		const joined = this.value.join(" ");
		if (joined === wanted) return;
		this.#written = joined;
		this.setAttribute("value", joined);
	}
}

export function defineZCheckboxGroup() {
	if (!customElements.get("z-checkbox-group")) customElements.define("z-checkbox-group", ZCheckboxGroup);
}
defineZCheckboxGroup();
