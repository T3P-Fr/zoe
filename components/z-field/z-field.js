/*
	============================================================
	z-field — le champ de formulaire, autour d'un contrôle NATIF (Chemin B)
	------------------------------------------------------------
	Zoé n'a PAS de « champ texte » à elle, et c'est voulu : le formulaire, le clavier,
	l'autocomplétion, la validation, le mobile — le navigateur fait déjà tout ça
	parfaitement avec un <input>. Ce que le web n'a jamais livré, c'est ce qu'il y a
	AUTOUR : le label relié au contrôle, l'aide, le message d'erreur, et des ÉTATS
	visibles (erreur, succès, rempli) qu'une peau peut peindre. C'est ÇA, z-field.

	    <z-field>
	      <label>Adresse e-mail</label>
	      <input type="email" name="email" required placeholder="vous@exemple.fr">
	      <small part="hint">Nous ne la partagerons jamais.</small>
	      <small part="error"></small>
	    </z-field>

	L'auteur écrit tout, en balises natives ; Zoé n'injecte AUCUN nœud (ADR-0018). Il
	RELIE (id, for, aria-describedby, aria-invalid) et il JUGE — en lisant la validité
	du contrôle (`validity`, `validationMessage`) et jamais en la recalculant :
	`required`, `type`, `minlength`, `pattern` restent sur le contrôle, une seule source.

	QUAND JUGER — la règle qui évite le formulaire agaçant :
	  · jamais pendant la première frappe ;
	  · à la SORTIE du champ (blur après une frappe, ou `change`) ;
	  · quand le formulaire REFUSE le contrôle (`invalid`, à la soumission) ;
	  · puis EN DIRECT : une fois le champ jugé, l'erreur s'efface dès qu'on la corrige.
	`success` n'apparaît que si le champ a été touché, est valide ET n'est pas vide.

	LE SEUL TEXTE QUE ZOÉ ÉCRIT : si l'auteur a laissé `[part="error"]` VIDE, on y écrit
	le `validationMessage` du navigateur (déjà traduit dans la langue de l'utilisateur)
	et on retient sa bulle (preventDefault sur `invalid`). S'il y a écrit son propre
	message, on n'y touche pas.

	DEUX NOMBRES posés sur l'hôte (`--z-field__length`, `--z-field__max`) : le CSS écrit
	« 12 / 80 » tout seul avec counter() quand l'attribut `counter` est là — le même
	tour que z-slider pour sa valeur, sans un nœud de plus.

	Doc narrative : z-field.doc.md · API machine : `static api` ci-dessous.
	Styleguide 30.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;

/* Les contrôles qu'un champ sait envelopper : ceux que le navigateur valide lui-même.
   Enfant DIRECT seulement : un champ dans un champ garde le sien. */
const CONTROL = ":scope > :is(input, textarea, select)";

export class ZField extends ZElement {
	static api = {
		tag: "z-field",
		example: `<z-field>
  <label>Adresse e-mail</label>
  <input type="email" name="email" required placeholder="vous@exemple.fr">
  <small part="hint">Nous ne la partagerons jamais.</small>
  <small part="error"></small>
</z-field>`,
		members: [
			{ kind: "field", name: "control", type: "HTMLElement | null", description: { en: "The native <input>, <textarea> or <select> the field wraps (read-only).", fr: "Le <input>, <textarea> ou <select> natif que le champ enveloppe (lecture seule).", es: "El <input>, <textarea> o <select> nativo que el campo envuelve (solo lectura)." } },
			{ kind: "field", name: "valid", type: "boolean", description: { en: "The control's native validity, right now (read-only).", fr: "La validité native du contrôle, à l'instant (lecture seule).", es: "La validez nativa del control, ahora mismo (solo lectura)." } },
			{ kind: "method", name: "validate()", type: "boolean", description: { en: "Judges the field now — poses error/success and the message — and returns its validity.", fr: "Juge le champ maintenant — pose error/success et le message — et rend sa validité.", es: "Juzga el campo ahora — pone error/success y el mensaje — y devuelve su validez." } }
		],
		summary: {
			en: "A form field around a NATIVE control: links label, hint and error, mirrors its validity into error/success, poses filled. Nothing replaced, nothing injected.",
			fr: "Un champ de formulaire autour d'un contrôle NATIF : relie label, aide et erreur, reflète sa validité en error/success, pose filled. Rien remplacé, rien injecté.",
			es: "Un campo de formulario alrededor de un control NATIVO: enlaza etiqueta, ayuda y error, refleja su validez en error/success, pone filled. Nada reemplazado, nada inyectado."
		},
		attributes: [
			{ name: "disabled", type: "boolean", description: { en: "Disables the field: propagated to the native control (and removed with it).", fr: "Désactive le champ : propagé au contrôle natif (et retiré avec lui).", es: "Deshabilita el campo: propagado al control nativo (y retirado con él)." } },
			{ name: "counter", type: "boolean", description: { en: "Writes « length / maxlength » at the end of [part=hint], in pure CSS (the hint must exist, empty is fine).", fr: "Écrit « longueur / maxlength » au bout de [part=hint], en CSS pur (l'aide doit exister, vide suffit).", es: "Escribe « longitud / maxlength » al final de [part=hint], en CSS puro (la ayuda debe existir, vacía basta)." } },
			{ name: "filled", type: "boolean", description: { en: "Posed by the field: the control has a non-empty value (for a floating label in CSS).", fr: "Posé par le champ : le contrôle a une valeur non vide (pour un label flottant en CSS).", es: "Puesto por el campo: el control tiene un valor no vacío (para una etiqueta flotante en CSS)." } },
			{ name: "error", type: "boolean", description: { en: "Posed by the field once judged and invalid — you may also set it by hand with your own [part=error] text.", fr: "Posé par le champ une fois jugé et invalide — vous pouvez aussi le poser à la main, avec votre texte dans [part=error].", es: "Puesto por el campo una vez juzgado e inválido — también puede ponerlo a mano, con su texto en [part=error]." } },
			{ name: "success", type: "boolean", description: { en: "Posed by the field once judged, valid and non-empty.", fr: "Posé par le champ une fois jugé, valide et non vide.", es: "Puesto por el campo una vez juzgado, válido y no vacío." } }
		],
		events: [
			{ name: "input", description: { en: "The native control's — it bubbles through the field untouched.", fr: "Celui du contrôle natif — il bulle à travers le champ, intact.", es: "El del control nativo — burbujea a través del campo, intacto." } },
			{ name: "change", description: { en: "The native control's — it bubbles through the field untouched.", fr: "Celui du contrôle natif — il bulle à travers le champ, intact.", es: "El del control nativo — burbujea a través del campo, intacto." } },
			{ name: "z-state", description: { en: "Emitted on every state change (error, success, filled…). detail: { states, changed, on }.", fr: "Émis à chaque changement d'état (error, success, filled…). detail : { states, changed, on }.", es: "Emitido en cada cambio de estado (error, success, filled…). detail: { states, changed, on }." } }
		],
		states: [...ZElement.api.states, "filled"],
		/*
			LES PIÈCES du champ — écrites par l'auteur, en balises NATIVES (pas en z-layer :
			ici le natif est le sujet). Toutes optionnelles sauf le contrôle.
		*/
		layers: [
			{ part: "label", description: { en: "A native <label> — linked to the control (for/id) by the field.", fr: "Un <label> natif — relié au contrôle (for/id) par le champ.", es: "Un <label> nativo — enlazado al control (for/id) por el campo." } },
			{ part: "control", description: { en: "The native <input>, <textarea> or <select>, direct child — the only required piece, and the single source of truth (name, required, type, maxlength live on it).", fr: "Le <input>, <textarea> ou <select> natif, enfant direct — la seule pièce obligatoire, et l'unique source de vérité (name, required, type, maxlength vivent sur lui).", es: "El <input>, <textarea> o <select> nativo, hijo directo — la única pieza obligatoria, y la única fuente de verdad (name, required, type, maxlength viven en él)." } },
			{ part: "hint", optional: true, description: { en: "Help text under the control (aria-describedby); the counter is written at its end.", fr: "L'aide sous le contrôle (aria-describedby) ; le compteur s'écrit à son bout.", es: "La ayuda bajo el control (aria-describedby); el contador se escribe al final." } },
			{ part: "error", optional: true, description: { en: "The error message — shown only in :state(error). Left empty, the field writes the browser's validationMessage in it.", fr: "Le message d'erreur — visible seulement en :state(error). Laissé vide, le champ y écrit le validationMessage du navigateur.", es: "El mensaje de error — visible solo en :state(error). Dejado vacío, el campo escribe en él el validationMessage del navegador." } }
		],
		cssVars: [
			{ name: "--z-field__length", description: { en: "Posed by the field: the value's length (an integer, for counter()).", fr: "Posée par le champ : la longueur de la valeur (un entier, pour counter()).", es: "Puesta por el campo: la longitud del valor (un entero, para counter())." } },
			{ name: "--z-field__max", description: { en: "Posed by the field: the control's maxlength (0 when none).", fr: "Posée par le champ : le maxlength du contrôle (0 s'il n'en a pas).", es: "Puesta por el campo: el maxlength del control (0 si no tiene)." } }
		]
	};

	/* `filled` s'ajoute aux durables du socle : attribut, setState(), :state(filled). */
	static durableStates = [...ZElement.durableStates, "filled"];

	#control = null;
	#captured = false;    /* le HTML d'origine, lu UNE fois : re-monter n'est pas re-naître */
	#describedBy = "";    /* l'aria-describedby écrit par l'auteur — on le garde devant les nôtres */
	#touched = false;     /* le champ a été quitté après une frappe, ou refusé : on peut juger */
	#dirty = false;       /* une frappe a eu lieu depuis le repos */
	#wrote = false;       /* le texte de [part=error] est de nous : on peut le réécrire */
	#warned = false;
	/* Le contrôle peut arriver APRÈS nous (createElement puis append) : on le recherche. */
	#watcher = new MutationObserver(() => this.#find());

	connectedCallback() {
		/* Pas de rôle ARIA : un champ est un morceau de formulaire, pas un widget — ce
		   qu'un lecteur d'écran lit, c'est le contrôle natif, et c'est lui qu'on relie. */
		this.#find();
		/* `invalid` ne bulle pas : la CAPTURE est la seule phase où un ancêtre le voit. */
		this.addEventListener("invalid", this.#onInvalid, true);
		this.addEventListener("input", this.#onInput);
		this.addEventListener("change", this.#onLeave);
		this.addEventListener("focusout", this.#onLeave);
		this.#watcher.observe(this, { childList: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
	}

	/* Le verrou du champ DESCEND sur le contrôle : c'est lui que le clavier et le
	   formulaire regardent, pas l'hôte. */
	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "disabled" && this.#control) this.#control.disabled = value !== null;
	}

	/* ── API PUBLIQUE ── */

	/* Le contrôle natif enveloppé. @returns {HTMLElement|null} */
	get control() {
		return this.#control;
	}

	/* La validité native du contrôle, à l'instant (un champ sans contrôle est valide). @returns {boolean} */
	get valid() {
		return this.#control ? this.#control.validity.valid : true;
	}

	/*
		Juge le champ maintenant, comme si l'utilisateur venait de le quitter : pose
		error/success, écrit le message, et rend la validité.
		@returns {boolean}
	*/
	validate() {
		this.#touched = true;
		this.#judge();
		return this.valid;
	}

	/*
		Le formulaire est remis à zéro : le champ revient au repos. Le contrôle, lui, est
		remis par le navigateur juste APRÈS nous (ordre du DOM) — d'où le micro-délai pour
		relire sa valeur.
	*/
	formResetCallback() {
		this.#touched = false;
		this.#dirty = false;
		this.setState("error", false);
		this.setState("success", false);
		this.#control?.removeAttribute("aria-invalid");
		this.#describe(false);
		queueMicrotask(() => this.#measure());
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Trouve le contrôle (enfant direct) et le relie ; prévient, une fois, s'il manque. */
	#find() {
		const control = this.querySelector(CONTROL);
		if (!control) {
			if (!this.#warned) {
				this.#warned = true;
				console.warn("<z-field> : aucun <input>, <textarea> ou <select> en enfant direct — le champ n'a rien à envelopper.", this);
			}
			return;
		}
		if (control === this.#control) return;
		this.#control = control;
		this.#wire();
		this.#measure();
	}

	/*
		Le CÂBLAGE que l'auteur oublie toujours : un id sur le contrôle, le `for` du label,
		des ids sur l'aide et l'erreur pour aria-describedby. On n'écrase jamais ce qu'il
		a écrit lui-même.
	*/
	#wire() {
		const control = this.#control;
		if (!control.id) control.id = `z-field-${++uid}`;
		const label = this.querySelector(":scope > label");
		if (label && !label.hasAttribute("for")) label.htmlFor = control.id;
		const hint = this.#part("hint");
		if (hint && !hint.id) hint.id = `${control.id}-hint`;
		const error = this.#part("error");
		if (error && !error.id) error.id = `${control.id}-error`;
		if (!this.#captured) {
			this.#captured = true;
			this.#describedBy = control.getAttribute("aria-describedby") ?? "";
		}
		if (this.disabled) control.disabled = true;
		this.#describe(false);
	}

	/* Une pièce écrite par l'auteur, enfant direct. @param {string} name @returns {Element|null} */
	#part(name) {
		return this.querySelector(`:scope > [part="${name}"]`);
	}

	/* Ce que le lecteur d'écran lit APRÈS le label : l'aide toujours, l'erreur quand elle
	   est affichée — derrière ce que l'auteur avait déjà relié. @param {boolean} withError */
	#describe(withError) {
		const control = this.#control;
		if (!control) return;
		const ids = [this.#describedBy, this.#part("hint")?.id, withError ? this.#part("error")?.id : ""].filter(Boolean);
		if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
		else control.removeAttribute("aria-describedby");
	}

	/*
		LE JUGE. Il lit la validité NATIVE et pose les états — il ne recalcule rien. Il
		ne parle que si le champ a été touché : juger une page blanche est le défaut n°1
		des formulaires.
	*/
	#judge() {
		const control = this.#control;
		if (!control) return;
		const valid = control.validity.valid;
		const error = this.#touched && !valid;
		this.setState("error", error);
		this.setState("success", this.#touched && valid && control.value !== "");
		/* aria-invalid sur le CONTRÔLE : c'est lui que le lecteur d'écran lit, pas l'hôte
		   (le socle le pose aussi sur l'hôte — ça ne gêne pas, ça ne suffit pas). */
		if (error) control.setAttribute("aria-invalid", "true");
		else control.removeAttribute("aria-invalid");
		if (error) this.#message();
		this.#describe(error);
	}

	/*
		Le message : celui de l'auteur s'il en a écrit un ; sinon celui du navigateur, écrit
		dans un [part=error] laissé VIDE. La seule fois que Zoé écrit du texte — et
		seulement là où on lui a fait de la place.
	*/
	#message() {
		const slot = this.#part("error");
		if (!slot) return;
		if (slot.textContent.trim() !== "" && !this.#wrote) return;
		slot.textContent = this.#control.validationMessage;
		this.#wrote = true;
	}

	/* Les deux nombres publiés + l'état `filled`, relus à chaque frappe. */
	#measure() {
		const control = this.#control;
		if (!control) return;
		const length = control.value.length;
		/* maxLength vaut -1 quand l'attribut manque (et n'existe pas sur <select>) : 0 = « sans borne ». */
		const max = control.maxLength > 0 ? control.maxLength : 0;
		this.style.setProperty("--z-field__length", String(length));
		this.style.setProperty("--z-field__max", String(max));
		this.setState("filled", length > 0);
	}

	/* Une frappe : on mesure toujours ; on ne JUGE en direct qu'un champ déjà jugé. */
	#onInput = (event) => {
		if (event.target !== this.#control) return;
		this.#dirty = true;
		this.#measure();
		if (this.#touched) this.#judge();
	};

	/* Quitter le champ (ou `change`) : le premier vrai moment pour juger. Sortir d'un
	   champ qu'on n'a pas touché n'est pas un geste — on ne dit rien. */
	#onLeave = (event) => {
		if (event.target !== this.#control) return;
		if (event.type === "focusout" && !this.#dirty) return;
		this.#touched = true;
		this.#judge();
	};

	/*
		Le formulaire REFUSE le contrôle (soumission, reportValidity). S'il y a une place
		pour le message, on retient la bulle du navigateur et on montre le nôtre ; et on
		focalise le contrôle — sauf si un autre champ refusé l'a déjà pris : la soumission
		doit mener l'œil au PREMIER problème, pas au dernier.
	*/
	#onInvalid = (event) => {
		if (event.target !== this.#control) return;
		this.#touched = true;
		this.#judge();
		if (!this.#part("error")) return;   /* pas de place pour le message : la bulle native reste */
		event.preventDefault();
		const active = document.activeElement;
		const taken = active && active !== this.#control && active.matches(":invalid");
		if (!taken) this.#control.focus();
	};
}

export function defineZField() {
	if (!customElements.get("z-field")) customElements.define("z-field", ZField);
}
defineZField();
