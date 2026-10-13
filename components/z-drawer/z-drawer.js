/*
	============================================================
	z-drawer — un panneau latéral modal : un z-dialog collé à un bord
	------------------------------------------------------------
	`ZDrawer extends ZDialog` : même <dialog> natif dedans (top layer, piège de focus,
	page inerte, Échap), même attribut `open` source de vérité, mêmes déclencheurs
	(commandfor/command), même fermeture ANIMÉE puis fermée, même light-dismiss. Ce fichier
	ne change que le DÉFAUT de `placement` (right) et la fiche d'API ; tout le reste est
	hérité — jusqu'au CSS du socle, écrit pour les deux balises dans z-dialog.css. La
	géométrie du tiroir (collé au bord, toute la hauteur, il GLISSE) est dans z-drawer.css.

	    <z-drawer id="menu" light-dismiss>
	      <dialog>
	        <header part="header">
	          <h2>Menu</h2>
	          <z-button type="button" command="close" tone="soft">Fermer</z-button>
	        </header>
	        <nav part="body">…</nav>
	      </dialog>
	    </z-drawer>
	    <z-button type="button" commandfor="menu" command="show-modal">Menu</z-button>

	Doc narrative : z-drawer.doc.md · API machine : `static api` ci-dessous.
	Styleguide 32.0
	============================================================
*/

import { ZDialog } from "../z-dialog/z-dialog.js";

/* Les bords d'où un tiroir peut sortir — pas de `center` : ce serait un z-dialog. */
const PLACEMENTS = "\"right\" | \"left\" | \"top\" | \"bottom\"";

export class ZDrawer extends ZDialog {
	/*
		La fiche de z-dialog, reprise telle quelle (mêmes attributs, événements, états,
		pièces, membres) : seuls la balise, l'exemple, le résumé et le `placement` changent.
	*/
	static api = {
		...ZDialog.api,
		tag: "z-drawer",
		example: `<z-drawer id="menu" light-dismiss>
  <dialog>
    <header part="header">
      <h2>Menu</h2>
      <z-button type="button" command="close" tone="soft">Fermer</z-button>
    </header>
    <nav part="body">
      <a href="#">Accueil</a>
      <a href="#">Catalogue</a>
      <a href="#">Contact</a>
    </nav>
  </dialog>
</z-drawer>
<z-button type="button" commandfor="menu" command="show-modal">Menu</z-button>`,
		summary: {
			en: "A modal side panel — a z-dialog glued to an edge: full height, slides in from its side. Same API, same triggers.",
			fr: "Un panneau latéral modal — un z-dialog collé à un bord : toute la hauteur, il glisse depuis son côté. Même API, mêmes déclencheurs.",
			es: "Un panel lateral modal — un z-dialog pegado a un borde: toda la altura, desliza desde su lado. Misma API, mismos disparadores."
		},
		attributes: ZDialog.api.attributes.map((attribute) => (attribute.name === "placement"
			? { ...attribute, type: PLACEMENTS, description: { en: "The edge the panel is glued to (default right).", fr: "Le bord auquel le panneau est collé (right par défaut).", es: "El borde al que se pega el panel (right por defecto)." } }
			: attribute)),
		members: ZDialog.api.members.map((member) => (member.name === "placement"
			? { ...member, type: PLACEMENTS, description: { en: "The edge the panel is glued to (mirrors the attribute; default right).", fr: "Le bord auquel le panneau est collé (reflet de l'attribut ; right par défaut).", es: "El borde al que se pega el panel (reflejo del atributo; right por defecto)." } }
			: member))
	};

	/* Un tiroir sort d'un bord : à droite si l'auteur ne dit rien. */
	static defaultPlacement = "right";
}

export function defineZDrawer() {
	if (!customElements.get("z-drawer")) customElements.define("z-drawer", ZDrawer);
}
defineZDrawer();
