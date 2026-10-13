/*
	============================================================
	z-popover — un panneau flottant ANCRÉ à son déclencheur, bâti SUR z-element (Chemin A)
	------------------------------------------------------------
	Des options, des filtres, une aide détaillée : un contenu qui s'ouvre À CÔTÉ de ce
	qu'on vient d'activer et se referme dès qu'on regarde ailleurs. `ZPopover extends
	ZElement` : la grammaire d'états héritée ; il ajoute l'ouverture, l'ancrage et
	l'accessibilité.

	    <z-popover placement="bottom">
	      <z-button part="trigger" type="button">Options</z-button>
	      <div part="panel">
	        <p>Contenu libre.</p>
	      </div>
	    </z-popover>

	DEUX pièces, écrites par l'auteur (Zoé n'injecte rien, ADR-0018) : `trigger` = ce
	qu'on active (n'importe quel élément focusable), `panel` = ce qui s'ouvre. `open` =
	ouvert (attribut durable, source de vérité, stylable `:state(open)`).

	BÂTI SUR L'API POPOVER NATIVE : le composant pose `popover="auto"` sur le panneau —
	le navigateur lui donne le top layer (rien ne passe au-dessus), la fermeture au clic
	dehors (light-dismiss), Échap, et un seul popover auto ouvert à la fois. Quand le
	navigateur ferme seul, `open` suit : l'attribut dit toujours la vérité. Sans API
	Popover (vieux navigateur), un REPLI fait le même travail avec `hidden` + un écouteur
	sur document.

	L'ANCRAGE EST EN JS (l'ancrage CSS natif n'est pas encore partout) : à l'ouverture, on
	mesure le déclencheur et le panneau, on choisit le côté (`placement`) et le bord
	(`align`), on RETOURNE le côté si ça déborde de la fenêtre (bottom→top, left→right…),
	et on pose DEUX NOMBRES NUS sur le panneau — `--z-popover__x` et `--z-popover__y`
	(des px sans unité, le CSS multiplie) — plus `data-placement`, le côté effectif,
	pour que le CSS oriente le mouvement d'entrée. Recalculé au scroll et au resize tant
	que c'est ouvert.

	ACCESSIBLE : le déclencheur annonce ouvert/fermé (aria-expanded) et pointe le panneau
	(aria-controls). Aucun rôle n'est imposé au panneau — un popover générique n'en a
	pas ; posez `role="dialog"` si votre contenu l'est. À la fermeture, le focus revient
	au déclencheur s'il était dans le panneau.

	Doc narrative : z-popover.doc.md · API machine : `static api` ci-dessous.
	Styleguide 33.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

let uid = 0;

/* Les côtés possibles, et le côté OPPOSÉ quand le choisi déborde de la fenêtre. */
const PLACEMENTS = ["bottom", "top", "left", "right"];
const OPPOSITE = { bottom: "top", top: "bottom", left: "right", right: "left" };
const ALIGNS = ["start", "center", "end"];

/* La marge gardée avec les bords de la fenêtre (px) : un panneau collé au bord se lit
   comme coupé. Sert aussi de réserve au test de débordement. */
const VIEWPORT_MARGIN = 8;

/*
	L'API Popover est-elle là ? Testé DANS une fonction, jamais au niveau du module :
	z-manifest importe ce fichier en Node avec un shim minimal (pas de prototype complet).
	@returns {boolean}
*/
function hasNativePopover() {
	return typeof HTMLElement !== "undefined" && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, "popover");
}

/*
	CE QUE LE DOIGT A VRAIMENT TOUCHÉ. PIÈGE vérifié (Chrome 154, 2026-10-13) : au
	pointerdown, z-element CAPTURE le pointeur sur l'hôte (c'est ce qui permet releaseOut) ;
	à partir de là le navigateur adresse pointerup ET click à l'élément capturant — l'hôte
	— et plus à l'enfant natif sous le doigt (Pointer Events niveau 3). Un <button> écrit
	par l'auteur dans un composant Zoé ne voit donc jamais son clic. On retrouve l'élément
	par la POSITION du clic. Un clic synthétique (`item.click()`, le clavier) vise déjà le
	bon élément et passe tel quel.
	@param {MouseEvent} event  @param {Element} host  le composant qui a reçu le clic
	@returns {EventTarget|null} l'élément visé
*/
export function pointerTarget(event, host) {
	if (event.target !== host || typeof event.clientX !== "number") return event.target;
	return document.elementFromPoint(event.clientX, event.clientY) ?? event.target;
}

export class ZPopover extends ZElement {
	static api = {
		tag: "z-popover",
		example: `<z-popover placement="bottom">
  <z-button part="trigger" type="button">Options</z-button>
  <div part="panel">
    <p>Contenu libre.</p>
  </div>
</z-popover>`,
		members: [
			{ kind: "field", name: "open", type: "boolean", description: { en: "Open or closed — mirrors the attribute.", fr: "Ouvert ou fermé — reflet de l'attribut.", es: "Abierto o cerrado — reflejo del atributo." } },
			{ kind: "field", name: "placement", type: "\"bottom\" | \"top\" | \"left\" | \"right\"", description: { en: "The requested side (mirrors the attribute; default bottom). The effective side is `data-placement` on the panel.", fr: "Le côté demandé (reflet de l'attribut ; défaut bottom). Le côté effectif est `data-placement` sur le panneau.", es: "El lado pedido (reflejo del atributo; por defecto bottom). El lado efectivo es `data-placement` en el panel." } },
			{ kind: "field", name: "align", type: "\"start\" | \"center\" | \"end\"", description: { en: "Which edge of the trigger the panel lines up with (mirrors the attribute; default start).", fr: "Le bord du déclencheur sur lequel le panneau s'aligne (reflet de l'attribut ; défaut start).", es: "El borde del disparador con el que se alinea el panel (reflejo del atributo; por defecto start)." } },
			{ kind: "field", name: "trigger · panel", type: "Element | null", description: { en: "The `[part=trigger]` and `[part=panel]` children, resolved on connect.", fr: "Les enfants `[part=trigger]` et `[part=panel]`, résolus à la connexion.", es: "Los hijos `[part=trigger]` y `[part=panel]`, resueltos al conectar." } },
			{ kind: "method", name: "show()", type: "void", description: { en: "Opens (sets `open`).", fr: "Ouvre (pose `open`).", es: "Abre (pone `open`)." } },
			{ kind: "method", name: "hide()", type: "void", description: { en: "Closes (clears `open`); focus returns to the trigger if it was inside.", fr: "Ferme (retire `open`) ; le focus revient au déclencheur s'il était dedans.", es: "Cierra (quita `open`); el foco vuelve al disparador si estaba dentro." } },
			{ kind: "method", name: "toggle()", type: "void", description: { en: "Opens or closes.", fr: "Ouvre ou ferme.", es: "Abre o cierra." } }
		],
		summary: {
			en: "A floating panel anchored to its trigger — native Popover API (top layer, light-dismiss, Escape), JS anchoring that flips when it overflows, animated in and out.",
			fr: "Un panneau flottant ancré à son déclencheur — API Popover native (top layer, fermeture au clic dehors, Échap), ancrage JS qui se retourne s'il déborde, animé à l'entrée et à la sortie.",
			es: "Un panel flotante anclado a su disparador — API Popover nativa (top layer, cierre al clic fuera, Escape), anclaje JS que se invierte si desborda, animado al entrar y salir."
		},
		attributes: [
			{ name: "open", type: "boolean", description: { en: "Open: the panel is shown. The source of truth — set by click, show()/hide(), and synced when the browser closes it (light-dismiss, Escape).", fr: "Ouvert : le panneau est montré. La source de vérité — posé par le clic, show()/hide(), et resynchronisé quand le navigateur ferme seul (clic dehors, Échap).", es: "Abierto: el panel se muestra. La fuente de verdad — puesto por el clic, show()/hide(), y resincronizado cuando el navegador cierra solo (clic fuera, Escape)." } },
			{ name: "placement", type: "\"bottom\" | \"top\" | \"left\" | \"right\"", description: { en: "The side of the trigger the panel opens on (default bottom). Flipped to the opposite side when it would overflow the viewport.", fr: "Le côté du déclencheur où le panneau s'ouvre (défaut bottom). Retourné du côté opposé s'il déborderait de la fenêtre.", es: "El lado del disparador donde se abre el panel (por defecto bottom). Invertido al lado opuesto si desbordara la ventana." } },
			{ name: "align", type: "\"start\" | \"center\" | \"end\"", description: { en: "Which edge of the trigger the panel lines up with (default start).", fr: "Le bord du déclencheur sur lequel le panneau s'aligne (défaut start).", es: "El borde del disparador con el que se alinea el panel (por defecto start)." } },
			{ name: "disabled", type: "boolean", description: { en: "Disabled: the trigger no longer opens it.", fr: "Désactivé : le déclencheur n'ouvre plus.", es: "Deshabilitado: el disparador ya no abre." } }
		],
		events: [
			{ name: "toggle", description: { en: "Emitted on every open/close, whoever caused it (click, API, light-dismiss, Escape). Bubbles. detail: { open }.", fr: "Émis à chaque ouverture/fermeture, quelle qu'en soit la cause (clic, API, clic dehors, Échap). Bulle. detail : { open }.", es: "Emitido en cada apertura/cierre, sea cual sea la causa (clic, API, clic fuera, Escape). Burbujea. detail: { open }." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: [...ZElement.api.states, "open"],
		layers: [
			{ part: "trigger", description: { en: "What opens it — any focusable element (a z-button, a button). Gets aria-expanded + aria-controls.", fr: "Ce qui l'ouvre — n'importe quel élément focusable (un z-button, un button). Reçoit aria-expanded + aria-controls.", es: "Lo que lo abre — cualquier elemento enfocable (un z-button, un button). Recibe aria-expanded + aria-controls." } },
			{ part: "panel", description: { en: "What opens — your content. Gets popover=\"auto\", an id, and data-placement (the effective side).", fr: "Ce qui s'ouvre — votre contenu. Reçoit popover=\"auto\", un id, et data-placement (le côté effectif).", es: "Lo que se abre — su contenido. Recibe popover=\"auto\", un id y data-placement (el lado efectivo)." } }
		],
		cssVars: [
			{ name: "--z-popover__x", description: { en: "Set by z-popover on the panel — its left edge in the viewport, a bare number of px (the CSS multiplies: `calc(var(--z-popover__x) * 1px)`).", fr: "Posée par z-popover sur le panneau — son bord gauche dans la fenêtre, un nombre nu de px (le CSS multiplie : `calc(var(--z-popover__x) * 1px)`).", es: "Puesta por z-popover en el panel — su borde izquierdo en la ventana, un número sin unidad en px (el CSS multiplica: `calc(var(--z-popover__x) * 1px)`)." } },
			{ name: "--z-popover__y", description: { en: "Set by z-popover on the panel — its top edge in the viewport, a bare number of px.", fr: "Posée par z-popover sur le panneau — son bord haut dans la fenêtre, un nombre nu de px.", es: "Puesta por z-popover en el panel — su borde superior en la ventana, un número sin unidad en px." } }
		]
	};

	/* `open` s'ajoute aux durables du socle : pilotable par attribut, setState(), et :state(open). */
	static durableStates = [...ZElement.durableStates, "open"];

	/*
		`placement` et `align` changent OÙ le panneau se pose, pas ce que l'hôte peint : on
		les intercepte avant le socle, sinon il en ferait des :state() qui ne veulent rien
		dire (même règle que `value` sur z-tabs).
	*/
	static #BEHAVIOR_ATTRS = ["placement", "align"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZPopover.#BEHAVIOR_ATTRS];
	}

	#trigger = null;
	#panel = null;
	#native = false;      /* l'API Popover porte l'affichage (sinon : repli `hidden`) */
	#wasOpen = false;     /* le dernier état annoncé — `toggle` n'est émis qu'au CHANGEMENT */

	connectedCallback() {
		this.#trigger = this.querySelector(":scope > [part=trigger]");
		this.#panel = this.querySelector(":scope > [part=panel]");
		if (this.#panel) {
			if (!this.#panel.id) this.#panel.id = `z-popover-panel-${++uid}`;
			this.#native = hasNativePopover();
			if (this.#native) {
				if (!this.#panel.hasAttribute("popover")) this.#panel.setAttribute("popover", "auto");
				/* Le navigateur ferme seul (clic dehors, Échap, un autre popover s'ouvre) : son
				   `toggle` (qui ne bulle pas) resynchronise notre attribut. */
				this.#panel.addEventListener("toggle", this.#onNativeToggle);
			}
			if (this.#trigger) this.#trigger.setAttribute("aria-controls", this.#panel.id);
		}
		this.addEventListener("click", this.#onClick);
		this.addEventListener("keydown", this.#onKey);
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		/* Un `open` écrit dans le HTML est déjà passé par attributeChangedCallback — sans
		   panneau résolu. On applique maintenant, sans annoncer : naître ouvert n'est pas basculer. */
		this.#wasOpen = this.open;
		this.#sync();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#track(false);
		this.#listenDocument(false);
	}

	attributeChangedCallback(name, previous, value) {
		if (ZPopover.#BEHAVIOR_ATTRS.includes(name)) {
			if (this.open && this.#panel) this.#place();   /* déplacé en cours d'ouverture : on repose */
			return;
		}
		super.attributeChangedCallback(name, previous, value);
		if (name === "open") this.#sync();
	}

	/* ── API PUBLIQUE ── */

	/* Ouvert ? @returns {boolean} */
	get open() {
		return this.hasAttribute("open");
	}

	/* @param {boolean} value */
	set open(value) {
		this.setState("open", Boolean(value));
	}

	/* Le côté demandé (bottom par défaut). @returns {"bottom"|"top"|"left"|"right"} */
	get placement() {
		const written = this.getAttribute("placement");
		return PLACEMENTS.includes(written) ? written : "bottom";
	}

	/* @param {string} value */
	set placement(value) {
		this.setAttribute("placement", value);
	}

	/* Le bord du déclencheur sur lequel le panneau s'aligne (start par défaut). @returns {"start"|"center"|"end"} */
	get align() {
		const written = this.getAttribute("align");
		return ALIGNS.includes(written) ? written : "start";
	}

	/* @param {string} value */
	set align(value) {
		this.setAttribute("align", value);
	}

	/* Le déclencheur écrit par l'auteur (résolu à la connexion). @returns {Element|null} */
	get trigger() {
		return this.#trigger;
	}

	/* Le panneau écrit par l'auteur (résolu à la connexion). @returns {Element|null} */
	get panel() {
		return this.#panel;
	}

	/* Ouvre. */
	show() {
		this.open = true;
	}

	/* Ferme ; le focus revient au déclencheur s'il était dans le panneau. */
	hide() {
		this.open = false;
	}

	/* Ouvre ou ferme. */
	toggle() {
		this.open = !this.open;
	}

	/* ── MÉCANIQUE INTERNE ── */

	/*
		Reflète `open` partout : aria-expanded sur le déclencheur, le panneau montré ou
		caché, et UN `toggle` par changement — quelle qu'en soit la cause. C'est l'unique
		point d'émission : clic, API et fermetures du navigateur passent tous par l'attribut.
	*/
	#sync() {
		const open = this.open;
		if (this.#trigger) this.#trigger.setAttribute("aria-expanded", String(open));
		if (!this.#panel || !this.isConnected) return;
		if (open) this.#reveal();
		else this.#conceal();
		if (open === this.#wasOpen) return;
		this.#wasOpen = open;
		this.dispatchEvent(new CustomEvent("toggle", { bubbles: true, detail: { open } }));
	}

	/* Montre le panneau (natif ou repli), le pose, et suit la page tant qu'il est ouvert. */
	#reveal() {
		if (this.#native) {
			/* showPopover lève si le panneau est déjà en train de basculer : rien à faire alors. */
			if (!this.#panel.matches(":popover-open")) { try { this.#panel.showPopover(); } catch { /* déjà en cours */ } }
		} else {
			this.#panel.hidden = false;
			this.#listenDocument(true);
		}
		this.#place();
		this.#track(true);
	}

	/*
		Cache le panneau. Le focus était dedans → il revient au déclencheur : sinon il
		tombe sur <body> et un utilisateur clavier repart de zéro (le popover natif le
		fait aussi, mais vers l'élément focalisé AVANT l'ouverture — pas forcément le nôtre).
	*/
	#conceal() {
		const focusInside = this.#panel.contains(document.activeElement);
		if (this.#native) {
			if (this.#panel.matches(":popover-open")) { try { this.#panel.hidePopover(); } catch { /* déjà en cours */ } }
		} else {
			this.#panel.hidden = true;
			this.#listenDocument(false);
		}
		this.#track(false);
		if (focusInside) (this.#trigger ?? this).focus();
	}

	/*
		L'ANCRAGE. On mesure le déclencheur (l'ancre) et le panneau, on choisit le côté
		demandé — ou son opposé s'il manque de place ET que l'opposé en a plus —, on aligne
		sur le bord demandé, puis on garde le panneau DANS la fenêtre. Deux nombres nus
		partent sur le panneau ; le mouvement, lui, est en CSS (comme z-tabs : la mesure
		est en JS, jamais l'animation).
	*/
	#place() {
		const panel = this.#panel;
		const anchor = (this.#trigger ?? this).getBoundingClientRect();
		/* offsetWidth/Height et pas getBoundingClientRect : le panneau est peut-être en
		   plein mouvement d'entrée (translate), et on veut sa boîte, pas son image. */
		const width = panel.offsetWidth;
		const height = panel.offsetHeight;
		const viewWidth = window.innerWidth;
		const viewHeight = window.innerHeight;

		const side = this.#sideThatFits(anchor, width, height, viewWidth, viewHeight);
		const vertical = side === "top" || side === "bottom";
		let x, y;
		if (vertical) {
			y = side === "bottom" ? anchor.bottom : anchor.top - height;
			x = this.#alongEdge(anchor.left, anchor.width, width);
		} else {
			x = side === "right" ? anchor.right : anchor.left - width;
			y = this.#alongEdge(anchor.top, anchor.height, height);
		}
		x = clamp(x, VIEWPORT_MARGIN, viewWidth - width - VIEWPORT_MARGIN);
		y = clamp(y, VIEWPORT_MARGIN, viewHeight - height - VIEWPORT_MARGIN);

		/* Arrondis : un panneau posé à demi-pixel rend son texte flou. */
		panel.style.setProperty("--z-popover__x", String(Math.round(x)));
		panel.style.setProperty("--z-popover__y", String(Math.round(y)));
		panel.dataset.placement = side;
	}

	/*
		Le côté effectif : celui demandé, sauf s'il manque de place et que l'opposé en
		offre davantage. On ne retourne jamais « pour rien » : un panneau qui change de
		côté à chaque pixel de scroll est pire qu'un panneau un peu coupé.
		@returns {"bottom"|"top"|"left"|"right"}
	*/
	#sideThatFits(anchor, width, height, viewWidth, viewHeight) {
		const room = {
			bottom: viewHeight - anchor.bottom,
			top: anchor.top,
			right: viewWidth - anchor.right,
			left: anchor.left
		};
		const wanted = this.placement;
		const needed = (wanted === "top" || wanted === "bottom" ? height : width) + VIEWPORT_MARGIN;
		const opposite = OPPOSITE[wanted];
		return room[wanted] < needed && room[opposite] > room[wanted] ? opposite : wanted;
	}

	/* La coordonnée le long du bord d'ancrage, selon `align` (start · center · end).
	   @param {number} start le bord de l'ancre @param {number} anchorSize @param {number} panelSize @returns {number} */
	#alongEdge(start, anchorSize, panelSize) {
		if (this.align === "end") return start + anchorSize - panelSize;
		if (this.align === "center") return start + (anchorSize - panelSize) / 2;
		return start;
	}

	/*
		Tant que c'est ouvert, la page peut bouger sous l'ancre : on suit le scroll (en
		capture — un conteneur qui défile ne bulle pas jusqu'à window) et le resize. Passif :
		on ne bloque jamais le défilement.
	*/
	#track(on) {
		const method = on ? "addEventListener" : "removeEventListener";
		window[method]("resize", this.#onReflow);
		window[method]("scroll", this.#onReflow, { capture: true, passive: true });
	}

	/* Le REPLI sans API Popover : fermer au clic dehors et à Échap, depuis document. */
	#listenDocument(on) {
		const method = on ? "addEventListener" : "removeEventListener";
		document[method]("pointerdown", this.#onOutside, true);
		document[method]("keydown", this.#onDocumentKey);
	}

	#onReflow = () => { if (this.open) this.#place(); };

	#onOutside = (event) => { if (!this.contains(event.target)) this.open = false; };

	#onDocumentKey = (event) => {
		if (event.key === "Escape" && this.open) { event.preventDefault(); this.open = false; }
	};

	/* Le navigateur a basculé le popover de lui-même : l'attribut suit (puis #sync annonce). */
	#onNativeToggle = (event) => {
		const open = event.newState === "open";
		if (this.open !== open) this.setState("open", open);
	};

	/* Le clic sur le DÉCLENCHEUR bascule (pas un clic dans le panneau, qui appartient au
	   contenu). `pointerTarget` : un <button> natif en déclencheur ne reçoit pas son clic
	   (le piège est documenté sur ce helper, plus haut), on retrouve ce qui a été touché. */
	#onClick = (event) => {
		if (this.disabled || !this.#trigger) return;
		if (this.#trigger.contains(pointerTarget(event, this))) this.toggle();
	};

	/*
		Échap ferme et rend le focus au déclencheur, dans les deux modes. En natif le
		navigateur le ferait aussi, mais on prend la main (preventDefault) pour que le
		focus revienne CHEZ NOUS et qu'un dialogue parent ne se ferme pas du même coup.
	*/
	#onKey = (event) => {
		if (event.key === "Escape" && this.open) { event.preventDefault(); this.open = false; }
	};
}

/* Borne `value` entre min et max ; si la boîte dépasse la fenêtre, on colle au bord haut/gauche. */
function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}

export function defineZPopover() {
	if (!customElements.get("z-popover")) customElements.define("z-popover", ZPopover);
}
defineZPopover();
