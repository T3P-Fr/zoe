/*
	============================================================
	z-contact-effect — LA DÉCOUVERTE DES EFFETS FOURNIS PAR LA PEAU
	------------------------------------------------------------
	Un effet de clic se déclare comme un état : chaque recette pose
	`@property --z-contact__fx--<nom>` (ex. `--z-contact__fx--implode`). Ce module scanne
	les feuilles chargées et rend la liste des noms trouvés — exactement comme z-element
	scanne `--z-state__` pour les états. On ne connaît pas d'avance ce qu'une peau (ou un
	user) déclare : on le DÉCOUVRE.

	Conséquence : chaque peau ne charge que SES recettes → seuls ses effets sont découverts,
	donc disponibles. Les règles de chaque recette sont scopées par `[fx="<nom>"]`, si bien
	que plusieurs coexistent sans jamais se mélanger. La doc (sélecteur + tableau) se remplit
	à partir de cette découverte : elle change avec la peau.
	============================================================
*/

const PREFIX = "--z-contact__fx--";

/*
	Les effets fournis par la/les feuille(s) chargée(s), dans l'ordre de déclaration.
	@returns {string[]} les noms (implode · explode · morph · ink…)
*/
export function discoverContactEffects() {
	const found = [];
	/* Récursif : les recettes sont @importées par la peau (et par zoe.css) → les @property
	   vivent dans des feuilles IMBRIQUÉES, pas au niveau racine. On descend dans les @import. */
	const scan = (rules) => {
		for (const rule of rules) {
			if (rule instanceof CSSPropertyRule && rule.name.startsWith(PREFIX)) {
				const name = rule.name.slice(PREFIX.length);
				if (!found.includes(name)) found.push(name);
			} else if (rule instanceof CSSImportRule && rule.styleSheet) {
				try { scan(rule.styleSheet.cssRules); } catch { /* feuille cross-origin : on passe */ }
			}
		}
	};
	for (const sheet of document.styleSheets) {
		try { scan(sheet.cssRules); } catch { /* cross-origin */ }
	}
	return found;
}
