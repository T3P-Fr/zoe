/*
	============================================================
	z-avatar — une pastille d'identité (image ou initiales), sur z-element (Chemin A)
	------------------------------------------------------------
	`ZAvatar extends ZElement` : tone/size hérités du socle. Il montre une IMAGE si on lui
	en donne une, sinon les INITIALES qu'il porte comme texte — jamais rien d'injecté
	(ADR-0018) : l'image est posée en `background-image` sur l'hôte (une propriété de
	style, pas une balise), les initiales sont le contenu que l'auteur a écrit.

	    <z-avatar name="Ada Lovelace">AL</z-avatar>
	    <z-avatar name="Grace Hopper" src="/img/grace.jpg"></z-avatar>
	    <z-avatar name="Inconnu" size="l">?</z-avatar>

	`name` = l'alternative textuelle (role="img" + aria-label) : une image d'identité doit
	toujours pouvoir se dire — même sans `src`, car role="img" ne lit pas ses enfants, donc
	les initiales seules ne nomment rien pour un lecteur d'écran.

	Doc narrative : z-avatar.doc.md · API machine : `static api` ci-dessous.
	Styleguide 11.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";

export class ZAvatar extends ZElement {
	static api = {
		tag: "z-avatar",
		example: `<z-avatar name="Ada Lovelace">AL</z-avatar>
<z-avatar name="Grace Hopper" src="/img/grace.jpg"></z-avatar>
<z-avatar name="Inconnu" size="l" tone="soft">?</z-avatar>`,
		members: [
			{ kind: "field", name: "src", type: "string", description: { en: "The image URL (mirrors the attribute).", fr: "L'URL de l'image (reflet de l'attribut).", es: "La URL de la imagen (reflejo del atributo)." } },
			{ kind: "field", name: "name", type: "string", description: { en: "The accessible name (mirrors the attribute).", fr: "Le nom accessible (reflet de l'attribut).", es: "El nombre accesible (reflejo del atributo)." } }
		],
		summary: {
			en: "An identity chip — an image if given, otherwise the initials. role=img with an alt from name. Inherits tone/size.",
			fr: "Une pastille d'identité — une image si fournie, sinon les initiales. role=img avec une alternative depuis name. Hérite tone/size.",
			es: "Una ficha de identidad — una imagen si se da, si no las iniciales. role=img con alternativa desde name. Hereda tone/size."
		},
		attributes: [
			{ name: "src", type: "url", description: { en: "Image URL — set as the host's background (no injected <img>).", fr: "L'URL de l'image — posée en fond de l'hôte (aucun <img> injecté).", es: "La URL de la imagen — puesta como fondo del host (ningún <img> inyectado)." } },
			{ name: "name", type: "string", description: { en: "The person/thing shown — becomes the accessible alt (role=img + aria-label).", fr: "La personne/chose montrée — devient l'alternative accessible (role=img + aria-label).", es: "La persona/cosa mostrada — se convierte en la alternativa accesible (role=img + aria-label)." } },
			{ name: "size", type: "\"xs\" | \"s\" | \"m\" | \"l\" | \"xl\"", description: { en: "Size factor, from the socle variant.", fr: "Le facteur de taille, via le variant du socle.", es: "El factor de tamaño, mediante el variante del zócalo." } }
		],
		events: [{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }],
		states: ZElement.api.states,
		layers: [
			{ part: "background", description: { en: "The disc — carries the image or the tone.", fr: "Le disque — porte l'image ou le ton.", es: "El disco — lleva la imagen o el tono." } },
			{ part: "label", description: { en: "The initials (fallback when there's no image).", fr: "Les initiales (repli quand il n'y a pas d'image).", es: "Las iniciales (repliegue cuando no hay imagen)." } }
		]
	};

	static #ATTRS = ["src", "name"];

	static get observedAttributes() {
		return [...super.observedAttributes, ...ZAvatar.#ATTRS];
	}

	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "img");
		this.#sync();
		super.connectedCallback();
	}

	attributeChangedCallback(name, previous, value) {
		if (ZAvatar.#ATTRS.includes(name)) { this.#sync(); return; }
		super.attributeChangedCallback(name, previous, value);
	}

	/* L'URL de l'image. @returns {string|null} */
	get src() {
		return this.getAttribute("src");
	}

	/* @param {string} v */
	set src(v) {
		this.setAttribute("src", v);
	}

	/* Le nom (alternative textuelle). @returns {string} */
	get name() {
		return this.getAttribute("name") || "";
	}

	/* @param {string} v */
	set name(v) {
		this.setAttribute("name", v);
	}

	/*
		Pose l'image en fond (pas d'<img> injecté) et l'alternative accessible. L'attribut
		`has-image` dit au CSS de masquer les initiales quand une image les recouvre.
	*/
	#sync() {
		if (this.name) this.setAttribute("aria-label", this.name);
		if (this.src) {
			/* on ne peut pas « échapper » une URL comme un identifiant (CSS.escape casserait
			   les / et :) ; on neutralise seulement ce qui sortirait de la chaîne url("…"). */
			const safe = this.src.replace(/["\\\n\r]/g, "");
			this.style.setProperty("--z-avatar__image", `url("${safe}")`);
			this.toggleAttribute("has-image", true);
		} else {
			this.style.removeProperty("--z-avatar__image");
			this.toggleAttribute("has-image", false);
		}
	}
}

export function defineZAvatar() {
	if (!customElements.get("z-avatar")) customElements.define("z-avatar", ZAvatar);
}
defineZAvatar();
