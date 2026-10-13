/*
	============================================================
	z-avatar-group — une pile d'avatars qui se chevauchent (Chemin A)
	------------------------------------------------------------
	Le niveau GROUPE de z-avatar : il ne redessine aucun avatar, il les fait se
	CHEVAUCHER et les détache d'un fin liseré de la couleur de page. L'auteur écrit ses
	<z-avatar> dedans ; Zoé n'injecte rien (ADR-0018), il ne fait que composer.

	    <z-avatar-group max="4" aria-label="L'équipe">
	      <z-avatar name="Ada Lovelace">AL</z-avatar>
	      <z-avatar name="Grace Hopper" src="/img/grace.jpg"></z-avatar>
	      <z-avatar name="Margaret Hamilton">MH</z-avatar>
	      <z-avatar name="3 autres personnes">+3</z-avatar>
	    </z-avatar-group>

	`max` est un REPÈRE pour l'auteur, pas un moteur : au-delà de `max` visages, il pose
	lui-même un dernier <z-avatar>+3</z-avatar> qui compte le reste. Zoé ne génère jamais
	ce nœud (ADR-0018) — il n'y a pas de « donnée » derrière un composant de vue.

	Doc narrative : z-avatar-group.doc.md · API machine : `static api` ci-dessous.
	Styleguide 23.0
	============================================================
*/

import { ZElement } from "../../core/z-element/z-element.js";
import "../z-avatar/z-avatar.js";

export class ZAvatarGroup extends ZElement {
	static api = {
		tag: "z-avatar-group",
		example: `<z-avatar-group max="3">
  <z-avatar name="Ada Lovelace">AL</z-avatar>
  <z-avatar name="Grace Hopper">GH</z-avatar>
  <z-avatar name="Margaret Hamilton">MH</z-avatar>
  <z-avatar name="4 autres personnes" tone="soft">+4</z-avatar>
</z-avatar-group>`,
		summary: {
			en: "A stack of overlapping z-avatar, each ringed in the page colour to stand out. On hover, the avatar lifts and comes to the front. Nothing injected.",
			fr: "Une pile de z-avatar qui se chevauchent, chacun cerné de la couleur de page pour se détacher. Au survol, l'avatar remonte et passe devant. Rien d'injecté.",
			es: "Una pila de z-avatar superpuestos, cada uno con un aro del color de página para destacar. Al pasar el cursor, el avatar sube y pasa al frente. Nada inyectado."
		},
		attributes: [
			{ name: "max", type: "number", description: { en: "Author's guide: past this many faces, add a final <z-avatar>+N</z-avatar> yourself (no node is generated).", fr: "Repère pour l'auteur : au-delà de ce nombre de visages, ajoutez vous-même un dernier <z-avatar>+N</z-avatar> (aucun nœud généré).", es: "Guía para el autor: pasado este número de caras, añada usted mismo un último <z-avatar>+N</z-avatar> (no se genera ningún nodo)." } }
		],
		events: [
			{ name: "z-state", description: { en: "Emitted on every state change. detail: { states, changed, on }.", fr: "Émis à chaque changement d'état. detail : { states, changed, on }.", es: "Emitido en cada cambio de estado. detail: { states, changed, on }." } }
		],
		states: ZElement.api.states,
		cssVars: [
			{ name: "--z-avatar-group__overlap", description: { en: "How much each avatar slides over the previous one (negative margin).", fr: "De combien chaque avatar recouvre le précédent (marge négative).", es: "Cuánto se solapa cada avatar sobre el anterior (margen negativo)." } },
			{ name: "--z-avatar-group__ring", description: { en: "Thickness of the separating ring (page colour).", fr: "L'épaisseur du liseré de séparation (couleur de page).", es: "El grosor del aro de separación (color de página)." } },
			{ name: "--z-avatar-group__lift", description: { en: "How high the hovered avatar rises.", fr: "De combien l'avatar survolé remonte.", es: "Cuánto sube el avatar al pasar el cursor." } }
		]
	};

	/*
		On donne le SENS de « un ensemble de personnes » : role="group". Le libellé
		(aria-label) reste à l'auteur — lui seul sait si c'est « l'équipe », « les
		participants »… On ne touche à rien s'il a déjà posé son propre role.
	*/
	connectedCallback() {
		if (!this.hasAttribute("role")) this.setAttribute("role", "group");
		super.connectedCallback();   /* z-element câble la grammaire d'états */
	}
}

export function defineZAvatarGroup() {
	if (!customElements.get("z-avatar-group")) customElements.define("z-avatar-group", ZAvatarGroup);
}
defineZAvatarGroup();
