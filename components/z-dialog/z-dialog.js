/*
	============================================================
	z-dialog — une boîte modale, bâtie SUR le <dialog> NATIF et sur z-element
	------------------------------------------------------------
	L'auteur écrit le <dialog> DEDANS. C'est lui qui donne ce qu'aucun script ne
	réimplémente sans faute : le top layer, le piège de focus, la page rendue inerte,
	Échap, `<form method="dialog">`, `returnValue`, le retour du focus au déclencheur.
	z-dialog n'ajoute que ce que le natif n'a pas : des ÉTATS (`:state(open)`, `enter`,
	`exit`), l'ANIMATION d'entrée et de sortie, les DÉCLENCHEURS déclaratifs et le
	light-dismiss. Zéro balise injectée (ADR-0018) : le light DOM reste celui de l'auteur.

	    <z-dialog id="confirm" light-dismiss>
	      <dialog>
	        <header part="header"><h2>Supprimer ce fichier ?</h2></header>
	        <p part="body">Cette action est définitive.</p>
	        <footer part="footer">
	          <z-button type="button" command="close" tone="soft">Annuler</z-button>
	          <z-button type="button" command="close" value="delete" tone="danger">Supprimer</z-button>
	        </footer>
	      </dialog>
	    </z-dialog>
	    <z-button type="button" commandfor="confirm" command="show-modal">Supprimer…</z-button>

	DÉCLENCHEURS — le standard Invoker Commands (`commandfor` + `command`), polyfillé : un
	écouteur `click` délégué sur document lit `[commandfor="<mon id>"]` → `show-modal` ·
	`close` · `request-close` · `toggle` (ce dernier est propre à Zoé). DEDANS, tout
	`[command="close"]` sans `commandfor` ferme. `commandfor` vise le z-dialog (son id),
	JAMAIS le <dialog> interne : un navigateur qui connaît l'API native ignore une cible
	qui n'est pas un <dialog>, donc rien n'est joué deux fois — viser le <dialog> le
	ferait s'ouvrir sec, sans nous.

	FERMER = ANIMER PUIS FERMER : `close()` joue `exit` (await) PUIS appelle dialog.close().
	Dans l'autre ordre, la boîte disparaît avant d'avoir bougé. Échap passe par là aussi
	(l'événement natif `cancel` est intercepté), le light-dismiss aussi — tous deux via
	`requestClose()`, qui émet `cancel` (annulable) avant de fermer ; `<form
	method="dialog">` aussi (la soumission est interceptée, `returnValue` = la `value` du
	bouton, comme en natif).

	`open` est l'attribut SOURCE DE VÉRITÉ (durable → :state(open)) : <z-dialog open>
	ouvre, `el.open = false` ferme en animé, et un dialog fermé par un autre chemin
	(dialog.close() appelé à la main) le retire.

	Doc narrative : z-dialog.doc.md · API machine : `static api` ci-dessous.
	Styleguide 31.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;

export class ZDialog extends ZElement {
	static api = {
		tag: "z-dialog",
		example: `<z-dialog id="confirm" light-dismiss>
  <dialog>
    <header part="header"><h2>Supprimer ce fichier ?</h2></header>
    <p part="body">Cette action est définitive.</p>
    <footer part="footer">
      <z-button type="button" command="close" tone="soft">Annuler</z-button>
      <z-button type="button" command="close" value="delete" tone="danger">Supprimer</z-button>
    </footer>
  </dialog>
</z-dialog>
<z-button type="button" commandfor="confirm" command="show-modal">Supprimer…</z-button>`,
		members: [
			{ kind: "method", name: "show()", type: "void", description: { en: "Opens modally (dialog.showModal()) and plays `enter`. Same as setting the `open` attribute.", fr: "Ouvre en modal (dialog.showModal()) et joue `enter`. Équivaut à poser l'attribut `open`.", es: "Abre en modal (dialog.showModal()) y reproduce `enter`. Equivale a poner el atributo `open`." } },
			{ kind: "method", name: "close(returnValue?)", type: "Promise<void>", description: { en: "Plays `exit`, THEN calls dialog.close(returnValue). Resolves once closed; fires `close`.", fr: "Joue `exit`, PUIS appelle dialog.close(returnValue). Rend la main une fois fermé ; émet `close`.", es: "Reproduce `exit`, LUEGO llama a dialog.close(returnValue). Resuelve al cerrarse; emite `close`." } },
			{ kind: "method", name: "requestClose()", type: "void", description: { en: "Closes the way Escape does: fires cancelable `cancel` first — preventDefault() keeps the dialog open.", fr: "Ferme comme Échap : émet d'abord `cancel` (annulable) — preventDefault() garde la boîte ouverte.", es: "Cierra como Escape: emite primero `cancel` (cancelable) — preventDefault() mantiene el diálogo abierto." } },
			{ kind: "method", name: "toggle()", type: "void", description: { en: "Opens if closed, closes if open.", fr: "Ouvre si fermée, ferme si ouverte.", es: "Abre si está cerrado, cierra si está abierto." } },
			{ kind: "field", name: "open", type: "boolean", description: { en: "Open or closed — mirrors the attribute. Setting it goes through show() / close(), so it animates.", fr: "Ouverte ou fermée — reflet de l'attribut. La poser passe par show() / close(), donc ça s'anime.", es: "Abierto o cerrado — reflejo del atributo. Ponerlo pasa por show() / close(), así que se anima." } },
			{ kind: "field", name: "returnValue", type: "string", description: { en: "The native dialog's returnValue — the `value` of the trigger that closed it.", fr: "Le returnValue du dialog natif — la `value` du déclencheur qui a fermé.", es: "El returnValue del dialog nativo — el `value` del disparador que cerró." } },
			{ kind: "field", name: "placement", type: "\"center\" | \"top\" | \"bottom\" | \"left\" | \"right\"", description: { en: "Where the box sits (mirrors the attribute; default center).", fr: "Où la boîte se pose (reflet de l'attribut ; centre par défaut).", es: "Dónde se coloca la caja (reflejo del atributo; centro por defecto)." } },
			{ kind: "field", name: "dialog", type: "HTMLDialogElement | null", description: { en: "The author's native <dialog> inside.", fr: "Le <dialog> natif de l'auteur, à l'intérieur.", es: "El <dialog> nativo del autor, dentro." } }
		],
		summary: {
			en: "A modal box on the native <dialog> — adds states, animated open/close, declarative triggers (commandfor/command) and light-dismiss.",
			fr: "Une boîte modale sur le <dialog> natif — ajoute les états, l'ouverture/fermeture animées, les déclencheurs déclaratifs (commandfor/command) et le light-dismiss.",
			es: "Una caja modal sobre el <dialog> nativo — añade estados, apertura/cierre animados, disparadores declarativos (commandfor/command) y light-dismiss."
		},
		attributes: [
			{ name: "open", type: "boolean", description: { en: "Open (modal). The source of truth: set by the component, settable by hand.", fr: "Ouverte (en modal). La source de vérité : posée par le composant, posable à la main.", es: "Abierto (modal). La fuente de verdad: puesta por el componente, se puede poner a mano." } },
			{ name: "light-dismiss", type: "boolean", description: { en: "A click on the backdrop closes the box (through `cancel`, like Escape).", fr: "Un clic sur le fond ferme la boîte (via `cancel`, comme Échap).", es: "Un clic en el fondo cierra la caja (vía `cancel`, como Escape)." } },
			{ name: "placement", type: "\"center\" | \"top\" | \"bottom\" | \"left\" | \"right\"", description: { en: "Where the box sits — center (default) pops, the four edges slide in from their side.", fr: "Où la boîte se pose — center (défaut) surgit, les quatre bords glissent depuis leur côté.", es: "Dónde se coloca — center (por defecto) aparece, los cuatro bordes deslizan desde su lado." } }
		],
		events: [
			{ name: "open", description: { en: "Emitted once shown (bubbles).", fr: "Émis une fois ouverte (bulle).", es: "Emitido una vez abierto (burbujea)." } },
			{ name: "close", description: { en: "Emitted once closed, after the exit animation (bubbles). detail: { returnValue }.", fr: "Émis une fois fermée, après l'animation de sortie (bulle). detail : { returnValue }.", es: "Emitido una vez cerrado, tras la animación de salida (burbujea). detail: { returnValue }." } },
			{ name: "cancel", description: { en: "Escape, light-dismiss or request-close (bubbles, cancelable): preventDefault() keeps the box open.", fr: "Échap, light-dismiss ou request-close (bulle, annulable) : preventDefault() garde la boîte ouverte.", es: "Escape, light-dismiss o request-close (burbujea, cancelable): preventDefault() mantiene la caja abierta." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: [...ZElement.api.states, "open"],
		/*
			LES PIÈCES — pas des z-layer : des rôles que l'auteur pose sur SES éléments dans
			le <dialog> (header, div, footer…). Tous optionnels : la boîte peint aussi un
			<dialog> qui n'en a aucun.
		*/
		layers: [
			{ part: "header", optional: true, description: { en: "The title row — your heading, and a close button if you want one.", fr: "La ligne de titre — votre titre, et un bouton de fermeture si vous en voulez un.", es: "La fila de título — su encabezado, y un botón de cierre si lo desea." } },
			{ part: "body", optional: true, description: { en: "The content.", fr: "Le contenu.", es: "El contenido." } },
			{ part: "footer", optional: true, description: { en: "The actions — laid out in a row, pushed to the right.", fr: "Les actions — en ligne, poussées à droite.", es: "Las acciones — en fila, a la derecha." } }
		]
	};

	/*
		`open` s'ajoute aux durables du socle : pilotable par attribut (<z-dialog open>),
		par setState(), et stylable :state(open).
	*/
	static durableStates = [...ZElement.durableStates, "open"];

	/* Où la boîte se pose quand l'attribut `placement` manque. z-drawer change cette valeur. */
	static defaultPlacement = "center";

	#dialog = null;             /* le <dialog> câblé (null tant qu'il n'est pas là) */
	#shown = false;             /* l'entrée a été jouée pour l'ouverture en cours */
	#closing = false;           /* la sortie est en cours : on ne la rejoue pas */
	#pressedOnBackdrop = false; /* l'appui a commencé sur le fond (light-dismiss) */
	/* Le <dialog> peut arriver après nous, ou s'ouvrir par un chemin natif : on suit. */
	#watcher = new MutationObserver(() => { this.#wire(); this.#adopt(); });

	connectedCallback() {
		this.#watcher.observe(this, { childList: true, attributes: true, attributeFilter: ["open"], subtree: true });
		/* Délégué sur document : un déclencheur `commandfor` vit n'importe où dans la page. */
		document.addEventListener("click", this.#onDocumentClick);
		this.addEventListener("click", this.#onClick);
		this.addEventListener("submit", this.#onSubmit);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		/* APRÈS le socle, exprès : ce pointerdown doit passer après le sien (voir #onPointerDown). */
		this.addEventListener("pointerdown", this.#onPointerDown);
		this.#wire();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
		document.removeEventListener("click", this.#onDocumentClick);
		this.#unwire();
	}

	attributeChangedCallback(name, previous, value) {
		super.attributeChangedCallback(name, previous, value);
		if (name === "open") this.#sync();
	}

	/* ── API PUBLIQUE ── */

	/* Ouverte ? @returns {boolean} */
	get open() {
		return this.hasAttribute("open");
	}

	/* Ouvre ou ferme — en passant par show()/close(), donc en animé. @param {boolean} value */
	set open(value) {
		if (value) this.show();
		else this.close();
	}

	/* Le <dialog> natif de l'auteur. @returns {HTMLDialogElement|null} */
	get dialog() {
		return this.#dialog ?? this.querySelector(":scope > dialog");
	}

	/* Ce que la boîte a rendu en se fermant (la `value` du déclencheur). @returns {string} */
	get returnValue() {
		return this.#dialog?.returnValue ?? "";
	}

	/* @param {string} value */
	set returnValue(value) {
		if (this.#dialog) this.#dialog.returnValue = String(value);
	}

	/* Où la boîte se pose (l'attribut, sinon le défaut de la classe). @returns {string} */
	get placement() {
		return this.getAttribute("placement") ?? this.constructor.defaultPlacement;
	}

	/* @param {string} value */
	set placement(value) {
		this.setAttribute("placement", value);
	}

	/*
		Ouvre en modal. On ne touche pas le <dialog> ici : on pose l'ATTRIBUT (la source de
		vérité) et #sync fait le reste — ainsi <z-dialog open> dans le HTML et show() sont
		le même chemin.
	*/
	show() {
		if (this.open) return;
		this.toggleAttribute("open", true);
	}

	/*
		Ferme — ANIME d'abord (état `exit`, attendu), PUIS ferme le natif. Sans l'attente,
		dialog.close() cache la boîte avant qu'elle ait bougé (même raison que `exit` dans
		z-element : on ne peut pas animer ce qui n'est plus là).
		@param {string} [returnValue] sans argument, le returnValue courant est gardé (natif)
		@returns {Promise<void>}
	*/
	async close(returnValue) {
		const dialog = this.#dialog;
		if (!dialog?.open || this.#closing) return;
		this.#closing = true;
		await this.play("exit");   /* joue :state(exit) le temps de --z-dur-exit, puis rend la main */
		dialog.close(returnValue);
		this.#settle();
	}

	/*
		Ferme comme Échap le fait : on PRÉVIENT d'abord (`cancel`, annulable) — l'auteur
		peut refuser (un formulaire non enregistré) avec preventDefault().
	*/
	requestClose() {
		if (!this.#dialog?.open || this.#closing) return;
		const allowed = this.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
		if (allowed) this.close();
	}

	/* Ouvre si fermée, ferme si ouverte. */
	toggle() {
		if (this.open) this.close();
		else this.show();
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Câble le <dialog> de l'auteur (idempotent : rappelé à chaque mutation). Deux
		événements natifs ne BULLENT pas, il faut les écouter sur lui : `cancel` (Échap) et
		`close` (fermé, par n'importe quel chemin).
	*/
	#wire() {
		const dialog = this.querySelector(":scope > dialog");
		if (dialog === this.#dialog) return;
		this.#unwire();
		if (!dialog) return;
		this.#dialog = dialog;
		dialog.addEventListener("cancel", this.#onCancel);
		dialog.addEventListener("close", this.#onNativeClose);
		this.#adopt();
		this.#sync();
	}

	#unwire() {
		const dialog = this.#dialog;
		if (!dialog) return;
		dialog.removeEventListener("cancel", this.#onCancel);
		dialog.removeEventListener("close", this.#onNativeClose);
		this.#dialog = null;
	}

	/*
		Un <dialog> ouvert SANS nous (écrit `<dialog open>`, ou ouvert par un bouton natif
		qui le vise) : l'attribut `open` de l'hôte le rejoint — la source de vérité ne ment
		pas. La fermeture, elle, arrive par l'événement natif `close`.
	*/
	#adopt() {
		if (this.#dialog?.open && !this.open) this.toggleAttribute("open", true);
	}

	/* L'attribut `open` a changé (ou le dialog vient d'arriver) → le natif suit. */
	#sync() {
		const dialog = this.#dialog;
		if (!dialog) return;
		if (this.open) { if (!this.#shown) this.#reveal(dialog); }
		else if (dialog.open && !this.#closing) this.close();
	}

	/* Montre : nom accessible, showModal (sauf déjà ouvert), l'entrée, et on prévient. */
	#reveal(dialog) {
		this.#shown = true;
		this.#name(dialog);
		if (!dialog.open) dialog.showModal();
		this.play("enter");
		this.dispatchEvent(new Event("open", { bubbles: true }));
	}

	/*
		La fermeture est ACTÉE ici, d'où qu'elle vienne (close(), Échap, dialog.close() à
		la main) : l'attribut tombe, on prévient avec le returnValue. Appelé deux fois pour
		une même fermeture (par close() puis par l'événement natif) : la seconde ne fait rien.
	*/
	#settle() {
		if (!this.#shown && !this.#closing) return;
		this.#shown = false;
		this.#closing = false;
		this.toggleAttribute("open", false);
		this.dispatchEvent(new CustomEvent("close", { bubbles: true, detail: { returnValue: this.returnValue } }));
	}

	/*
		Le NOM de la boîte, pour les lecteurs d'écran : son premier titre (aria-labelledby),
		sauf si l'auteur en a donné un. Posé à l'OUVERTURE, pas au montage : c'est là qu'il
		sert, et le HTML affiché par les démos reste celui que l'auteur a tapé.
	*/
	#name(dialog) {
		if (dialog.hasAttribute("aria-label") || dialog.hasAttribute("aria-labelledby")) return;
		const title = dialog.querySelector("h1, h2, h3, h4, h5, h6");
		if (!title) return;
		if (!title.id) title.id = `z-dialog-label-${++uid}`;
		dialog.setAttribute("aria-labelledby", title.id);
	}

	/* Échap : le natif voudrait fermer sec — on prend la main pour fermer en animé. */
	#onCancel = (event) => {
		event.preventDefault();
		this.requestClose();
	};

	#onNativeClose = () => this.#settle();

	/*
		Le point d'appui, mémorisé : un light-dismiss ne vaut que si l'appui ET le relâché
		sont sur le fond. Sans ça, sélectionner du texte dans la boîte et lâcher dehors la
		fermerait — et un « clic » clavier (coordonnées 0,0) aussi.

		ET LA CAPTURE EST RENDUE. Le socle capture le pointeur sur l'hôte à chaque appui
		(pour voir un relâché dehors) ; Chrome adresse alors le `click` à l'élément qui
		capture — et un <button>, un <a>, un <input> natifs DANS la boîte ne reçoivent
		jamais le leur (sondé aux vrais clics, Chrome 154). Rendue avant de prendre
		(l'écouteur est câblé après celui du socle, donc passe après lui), la capture ne
		manque à rien ici : la boîte couvre l'écran, tout relâché arrive dedans.
	*/
	#onPointerDown = (event) => {
		this.#pressedOnBackdrop = this.#onBackdrop(event);
		try { this.releasePointerCapture(event.pointerId); } catch { /* pas de capture : rien à rendre */ }
	};

	/* Le clic sur le fond : la cible est le <dialog> lui-même, hors de son rectangle. Il
	   passe par `cancel`, comme Échap — l'auteur refuse les deux d'un seul écouteur. */
	#onClick = (event) => {
		const onBackdrop = this.#pressedOnBackdrop && this.#onBackdrop(event);
		this.#pressedOnBackdrop = false;
		if (onBackdrop && this.hasAttribute("light-dismiss")) this.requestClose();
	};

	/* @param {MouseEvent} event @returns {boolean} */
	#onBackdrop(event) {
		const dialog = this.#dialog;
		if (!dialog?.open || (event.target !== dialog && event.target !== this)) return false;
		const rect = dialog.getBoundingClientRect();
		return event.clientX < rect.left || event.clientX > rect.right
			|| event.clientY < rect.top || event.clientY > rect.bottom;
	}

	/*
		`<form method="dialog">` : le natif fermerait sec à la soumission. On l'intercepte
		APRÈS la validation (l'événement submit n'arrive que si le formulaire est valide),
		et on ferme en animé avec la même valeur que lui : la `value` du bouton soumetteur.
	*/
	#onSubmit = (event) => {
		const form = event.target;
		if (!(form instanceof HTMLFormElement) || form.method !== "dialog") return;
		if (form.closest("dialog") !== this.#dialog) return;
		event.preventDefault();
		const submitter = event.submitter;
		this.close(submitter?.hasAttribute("value") ? submitter.getAttribute("value") : undefined);
	};

	/*
		Le polyfill des Invoker Commands. Un déclencheur = n'importe quel élément cliqué
		portant `command` : un <button> natif comme un z-button (qui n'est pas un <button>,
		donc le navigateur ne lirait jamais ses attributs — c'est nous qui les lisons).
	*/
	#onDocumentClick = (event) => {
		const trigger = event.target instanceof Element ? event.target.closest("[command]") : null;
		if (!trigger || !this.#aimedBy(trigger)) return;
		const command = trigger.getAttribute("command");
		if (command === "show-modal") this.show();
		else if (command === "close") this.close(trigger.hasAttribute("value") ? trigger.getAttribute("value") : undefined);
		else if (command === "request-close") this.requestClose();
		else if (command === "toggle") this.toggle();
	};

	/*
		Ce déclencheur me vise-t-il ? Avec `commandfor` : si c'est mon id. Sans : seulement
		s'il est DANS ma boîte, et seulement pour fermer — un bouton d'ouverture sans cible
		ne veut rien dire.
		@param {Element} trigger @returns {boolean}
	*/
	#aimedBy(trigger) {
		const target = trigger.getAttribute("commandfor");
		if (target !== null) return this.id !== "" && target === this.id;
		const command = trigger.getAttribute("command");
		return (command === "close" || command === "request-close") && Boolean(this.#dialog?.contains(trigger));
	}
}

export function defineZDialog() {
	if (!customElements.get("z-dialog")) customElements.define("z-dialog", ZDialog);
}
defineZDialog();
