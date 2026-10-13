/*
	============================================================
	z-pagination — la pagination SEO-correcte : vos liens, le sens de Zoé (Chemin A)
	------------------------------------------------------------
	Un composant de STRUCTURE : l'auteur écrit de VRAIS liens (<a href>), lus par les
	moteurs — c'est le contrat SEO (docs/contrat-seo.md) — et Zoé n'injecte RIEN
	(ADR-0018). Le composant apporte ce qui manque à une rangée de liens :

	  · le SENS — role="navigation" + un libellé (aria-label) ;
	  · la COURANTE — aria-current="page" + l'attribut `current` (la grammaire Zoé pour
	    « sélectionné »), trouvée par le TEXTE du lien (son nombre) égal à `page`, à
	    défaut par l'aria-current que l'auteur a écrit, à défaut la première ;
	  · les BORNES — [part=prev] mort sur la première page, [part=next] sur la dernière
	    (la dernière = le plus grand nombre lu dans les liens) ;
	  · la FENÊTRE — au-delà de `siblings` crans de la courante, hors première et
	    dernière, un lien reçoit `far` (le CSS le cache) ; un lien visible devant lequel
	    des pages manquent reçoit `gap` (le CSS dessine « … » devant lui) ;
	  · le CLAVIER — ← → déplacent le focus entre les liens visibles, Home/End aux
	    extrémités. Pas de roving : chaque lien reste un vrai lien, tabulable.

	    <z-pagination page="3" siblings="1" label="Pages des résultats">
	      <a part="prev" href="?p=2">Précédent</a>
	      <a href="?p=1">1</a> <a href="?p=2">2</a> … <a href="?p=12">12</a>
	      <a part="next" href="?p=4">Suivant</a>
	    </z-pagination>

	QUI PILOTE : au clic, le composant émet `change` (cancelable, detail.page). Si
	l'auteur fait preventDefault(), ou si l'élément cliqué n'a pas de `href` (un
	<button type="button">, par exemple), c'est l'APPLICATION qui pilote : le composant
	pose `page` lui-même. Sinon le lien navigue, et on ne touche à rien.

	Doc narrative : z-pagination.doc.md · API machine : `static api` ci-dessous.
	Styleguide 36.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

/* Les touches qui déplacent le focus, et de combien. Un seul axe : une pagination est
   une ligne. */
const STEP = { ArrowRight: 1, ArrowLeft: -1 };

export class ZPagination extends ZElement {
	static api = {
		tag: "z-pagination",
		example: `<z-pagination page="3" siblings="1" label="Pages des résultats">
  <a part="prev" href="?p=2">Précédent</a>
  <a href="?p=1">1</a>
  <a href="?p=2">2</a>
  <a href="?p=3">3</a>
  <a href="?p=4">4</a>
  <a href="?p=5">5</a>
  <a href="?p=12">12</a>
  <a part="next" href="?p=4">Suivant</a>
</z-pagination>`,
		members: [
			{ kind: "field", name: "page", type: "number", description: { en: "The current page number. Setting it moves the current mark and the window (no `change`).", fr: "Le numéro de la page courante. Le poser déplace la marque courante et la fenêtre (sans `change`).", es: "El número de la página actual. Asignarlo mueve la marca actual y la ventana (sin `change`)." } },
			{ kind: "field", name: "pages", type: "Element[]", description: { en: "The page links, in order — direct children without `part` (or part=page).", fr: "Les liens de page, dans l'ordre — les enfants directs sans `part` (ou part=page).", es: "Los enlaces de página, en orden — los hijos directos sin `part` (o part=page)." } },
			{ kind: "field", name: "last", type: "number", description: { en: "The last page: the largest number read in the links (0 when none).", fr: "La dernière page : le plus grand nombre lu dans les liens (0 s'il n'y en a pas).", es: "La última página: el mayor número leído en los enlaces (0 si no hay)." } }
		],
		summary: {
			en: "SEO-correct pagination: you write real links, Zoé poses the meaning, the current page, the bounds, the window and the keyboard. Nothing generated.",
			fr: "Une pagination SEO-correcte : vous écrivez de vrais liens, Zoé pose le sens, la page courante, les bornes, la fenêtre et le clavier. Rien n'est généré.",
			es: "Una paginación correcta para SEO: usted escribe enlaces reales, Zoé pone el sentido, la página actual, los límites, la ventana y el teclado. Nada generado."
		},
		attributes: [
			{ name: "page", type: "number", description: { en: "The current page: the link whose text is this number is marked current. Absent, the link carrying aria-current=\"page\" is, else the first.", fr: "La page courante : le lien dont le texte est ce nombre est marqué courant. Absent, c'est le lien portant aria-current=\"page\", sinon le premier.", es: "La página actual: el enlace cuyo texto es este número se marca como actual. Ausente, lo es el enlace con aria-current=\"page\", si no el primero." } },
			{ name: "siblings", type: "number", description: { en: "How many pages stay visible on each side of the current one (default 1). Farther ones get `far`, the first and last always stay.", fr: "Combien de pages restent visibles de chaque côté de la courante (défaut 1). Les plus lointaines reçoivent `far`, la première et la dernière restent toujours.", es: "Cuántas páginas quedan visibles a cada lado de la actual (por defecto 1). Las más lejanas reciben `far`, la primera y la última siempre quedan." } },
			{ name: "label", type: "string", description: { en: "The accessible name of the navigation (default « Pagination »).", fr: "Le nom accessible de la navigation (par défaut « Pagination »).", es: "El nombre accesible de la navegación (por defecto « Pagination »)." } },
			{ name: "disabled", type: "boolean", description: { en: "Freezes the whole navigation.", fr: "Gèle toute la navigation.", es: "Congela toda la navegación." } }
		],
		events: [
			{ name: "change", description: { en: "A page, prev or next was clicked. detail: { page }. Cancelable: preventDefault() and the component poses `page` itself instead of letting the link navigate.", fr: "Une page, prev ou next a été cliqué. detail : { page }. Annulable : preventDefault() et le composant pose `page` lui-même au lieu de laisser le lien naviguer.", es: "Se hizo clic en una página, prev o next. detail: { page }. Cancelable: preventDefault() y el componente pone `page` por sí mismo en lugar de dejar navegar el enlace." } },
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		layers: [
			{ part: "page", description: { en: "A page link — any direct child without `part` (writing part=\"page\" is allowed). Its text is its number. The current one carries aria-current + current; hidden ones carry far; one preceded by a hole carries gap.", fr: "Un lien de page — tout enfant direct sans `part` (écrire part=\"page\" est permis). Son texte est son numéro. Le courant porte aria-current + current ; les cachés portent far ; celui qui suit un trou porte gap.", es: "Un enlace de página — cualquier hijo directo sin `part` (escribir part=\"page\" está permitido). Su texto es su número. El actual lleva aria-current + current; los ocultos llevan far; el que sigue a un hueco lleva gap." } },
			{ part: "prev", optional: true, description: { en: "The « previous » link — disabled (aria-disabled + disabled) on the first page.", fr: "Le lien « précédent » — désactivé (aria-disabled + disabled) sur la première page.", es: "El enlace « anterior » — deshabilitado (aria-disabled + disabled) en la primera página." } },
			{ part: "next", optional: true, description: { en: "The « next » link — disabled on the last page.", fr: "Le lien « suivant » — désactivé sur la dernière page.", es: "El enlace « siguiente » — deshabilitado en la última página." } }
		]
	};

	/*
		`page`, `siblings` et `label` changent ce que le composant MARQUE, pas ce qu'il
		peint : on les intercepte avant le socle (sinon `:state(page)` naîtrait, et ne
		voudrait rien dire). Même règle que `value` sur z-tabs.
	*/
	static #BEHAVIOR_ATTRS = ["page", "siblings", "label"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZPagination.#BEHAVIOR_ATTRS];
	}

	/* Le DOM peut arriver APRÈS nous ou changer (une page relue du serveur) : on remarque
	   tout à chaque mouvement, y compris quand le TEXTE d'un lien change (c'est son numéro). */
	#watcher = new MutationObserver(() => this.#wire());

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
		this.#name();
		this.addEventListener("click", this.#onClick);
		this.addEventListener("keydown", this.#onKey);
		this.#watcher.observe(this, { childList: true, characterData: true, subtree: true });
		super.connectedCallback();   /* z-element câble toute la grammaire d'états */
		this.#wire();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#watcher.disconnect();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZPagination.#BEHAVIOR_ATTRS.includes(name)) {
			if (name === "label") this.#name();
			else if (this.isConnected) this.#wire();
			return;
		}
		super.attributeChangedCallback(name, previous, value);
	}

	/* ── API PUBLIQUE ── */

	/* Les liens de page, dans l'ordre : les enfants directs sans `part` (ou part=page).
	   @returns {Element[]} */
	get pages() {
		return [...this.children].filter((el) => !el.hasAttribute("part") || el.getAttribute("part") === "page");
	}

	/* La dernière page : le plus grand nombre lu dans les liens (0 s'il n'y en a aucun). @returns {number} */
	get last() {
		return this.#scan().last || 0;
	}

	/* Le numéro de la page courante (0 si rien ne permet de le dire). @returns {number} */
	get page() {
		return this.#current(this.#scan()) || 0;
	}

	/* Pose la page courante — l'attribut est la source de vérité, le reste suit. @param {number} n */
	set page(n) {
		this.setAttribute("page", String(n));
	}

	/* ── MÉCANIQUE INTERNE ── */

	/* Le numéro d'un lien : son texte. Un texte qui n'est pas un nombre vaut null.
	   @param {Element} el @returns {number|null} */
	#numberOf(el) {
		const n = parseInt(el.textContent.trim(), 10);
		return Number.isNaN(n) ? null : n;
	}

	/* Une pièce nommée, enfant direct. @param {string} name @returns {Element|null} */
	#part(name) {
		return [...this.children].find((el) => el.getAttribute("part") === name) ?? null;
	}

	/* Une lecture des liens : leurs numéros, la première et la dernière page (NaN si
	   aucun lien ne porte un nombre). @returns {{pages: Element[], numbers: (number|null)[], first: number, last: number}} */
	#scan() {
		const pages = this.pages;
		const numbers = pages.map((el) => this.#numberOf(el));
		const known = numbers.filter((n) => n !== null);
		return {
			pages, numbers,
			first: known.length ? Math.min(...known) : NaN,
			last: known.length ? Math.max(...known) : NaN
		};
	}

	/*
		La courante : l'attribut `page` s'il est écrit (même si aucun lien ne le porte — on
		ne marque alors personne : l'attribut dit vrai, pas le DOM) ; sinon le lien que
		l'auteur a marqué aria-current ; sinon la première.
		@param {{pages: Element[], numbers: (number|null)[], first: number}} scan @returns {number}
	*/
	#current({ pages, numbers, first }) {
		if (this.hasAttribute("page")) return Number(this.getAttribute("page"));
		const marked = pages.findIndex((el) => el.getAttribute("aria-current") === "page");
		return marked !== -1 && numbers[marked] !== null ? numbers[marked] : first;
	}

	/* Le libellé : `label` s'il est écrit ; sinon un défaut, sauf si l'auteur a nommé la
	   navigation lui-même (aria-label ou aria-labelledby). */
	#name() {
		const label = this.getAttribute("label");
		if (label !== null) this.setAttribute("aria-label", label);
		else if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-label", "Pagination");
	}

	/*
		Marque tout ce que l'auteur n'a pas à écrire : la courante (aria-current + current),
		la fenêtre (far, gap), les bornes (prev / next). Idempotent — appelé à chaque
		mutation sans rien casser. Ne touche jamais aux href.
	*/
	#wire() {
		const scan = this.#scan();
		if (!scan.pages.length) return;
		const current = this.#current(scan);
		for (const [i, el] of scan.pages.entries()) {
			const here = scan.numbers[i] !== null && scan.numbers[i] === current;
			el.toggleAttribute("current", here);
			if (here) el.setAttribute("aria-current", "page");
			else el.removeAttribute("aria-current");
		}
		this.#window(scan, current);
		this.#bound(this.#part("prev"), current <= scan.first);
		this.#bound(this.#part("next"), current >= scan.last);
	}

	/*
		LA FENÊTRE. Loin de la courante (au-delà de `siblings`), hors première et dernière
		→ `far` (le CSS cache). Un lien visible dont le numéro ne suit pas le précédent
		visible → `gap` (le CSS dessine « … » devant) : que les pages manquantes soient
		cachées par la fenêtre ou absentes de la liste de l'auteur, le trou se voit.
		@param {{pages: Element[], numbers: (number|null)[], first: number, last: number}} scan
		@param {number} current
	*/
	#window({ pages, numbers, first, last }, current) {
		const raw = parseInt(this.getAttribute("siblings") ?? "1", 10);
		const siblings = Number.isFinite(raw) ? Math.max(0, raw) : 1;
		let previous = null;   /* le dernier numéro VISIBLE */
		pages.forEach((el, i) => {
			const n = numbers[i];
			const far = n !== null && n !== first && n !== last && Math.abs(n - current) > siblings;
			el.toggleAttribute("far", far);
			if (far) { el.removeAttribute("gap"); return; }
			el.toggleAttribute("gap", previous !== null && n !== null && n > previous + 1);
			if (n !== null) previous = n;
		});
	}

	/*
		Une borne atteinte : le lien reste écrit (le crawler le lit), mais il ne se clique
		ni ne se tabule plus — aria-disabled pour le sens, `disabled` pour le CSS,
		tabindex -1 pour le clavier (un <a href> reste focusable sinon).
		@param {Element|null} el @param {boolean} dead
	*/
	#bound(el, dead) {
		if (!el) return;
		el.toggleAttribute("disabled", dead);
		if (dead) {
			el.setAttribute("aria-disabled", "true");
			el.setAttribute("tabindex", "-1");
		} else {
			el.removeAttribute("aria-disabled");
			el.removeAttribute("tabindex");
		}
	}

	/* La destination d'un lien : prev / next comptent depuis la courante, une page lit son
	   numéro. @param {Element} link @returns {number|null} */
	#destination(link) {
		const part = link.getAttribute("part");
		if (part === "prev") return this.page - 1;
		if (part === "next") return this.page + 1;
		return this.#numberOf(link);
	}

	/*
		Le clic : on prévient (`change`, annulable, detail.page). L'auteur a dit non, ou le
		lien n'a pas de href → c'est l'application qui pilote, on pose `page` nous-mêmes.
		Sinon le lien navigue : on ne touche à rien. Cliquer la courante ne change rien —
		le lien fait sa vie.
	*/
	#onClick = (event) => {
		if (this.disabled) { event.preventDefault(); return; }
		const link = [...this.children].find((el) => el.contains(event.target));
		if (!link) return;
		if (link.hasAttribute("disabled")) { event.preventDefault(); return; }
		const n = this.#destination(link);
		if (n === null || n === this.page) return;
		const go = this.dispatchEvent(new CustomEvent("change", { bubbles: true, cancelable: true, detail: { page: n } }));
		if (!go || !link.hasAttribute("href")) {
			event.preventDefault();
			this.page = n;
		}
	};

	/*
		← → : le focus se promène entre les liens VISIBLES et vivants (confort — pas une
		obligation : chaque lien est déjà tabulable), Home/End aux extrémités. Pas de
		boucle : une pagination a deux bouts.
	*/
	#onKey = (event) => {
		if (this.disabled) return;
		const usable = [...this.children].filter((el) => !el.hasAttribute("far") && el.tabIndex >= 0);
		const from = usable.indexOf(event.target);
		if (from === -1) return;
		let next;
		if (event.key === "Home") next = 0;
		else if (event.key === "End") next = usable.length - 1;
		else if (STEP[event.key] !== undefined) next = Math.min(usable.length - 1, Math.max(0, from + STEP[event.key]));
		else return;
		event.preventDefault();   /* la page ne défile pas sous nos flèches */
		usable[next].focus();
	};
}

export function defineZPagination() {
	if (!customElements.get("z-pagination")) customElements.define("z-pagination", ZPagination);
}
defineZPagination();
