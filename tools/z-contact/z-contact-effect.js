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
	Le marqueur du SECOND temps. Un effet ordinaire naît puis meurt seul (un temps) ; un effet
	« à deux temps » vit tant que l'on APPUIE (phase="press") et se conclut au RELÂCHEMENT
	(phase="release"). Une recette signale ce second temps en posant `--z-contact__release--<nom>`
	— exactement comme `--z-contact__fx--<nom>` signale l'effet lui-même. Sa seule présence
	suffit : le moteur y lit « garde-moi vivant jusqu'au CURSOR-UP ». (Le premier temps,
	CURSOR-DOWN, est implicite — tout effet en a un.)
*/
const RELEASE_PREFIX = "--z-contact__release--";

/*
	Descend dans une liste de règles et récolte, dans `out`, les noms d'effets qui déclarent
	`<prefix><nom>`. Récursif car les recettes sont @importées par la peau → les `@property`
	vivent dans des feuilles IMBRIQUÉES, pas au niveau racine.
	@param {CSSRuleList} rules
	@param {string} prefix
	@param {(name: string) => void} keep  reçoit chaque nom trouvé (au consommateur de dédupliquer)
*/
function scanFor(rules, prefix, keep) {
	for (const rule of rules) {
		if (rule instanceof CSSPropertyRule && rule.name.startsWith(prefix)) {
			keep(rule.name.slice(prefix.length));
		} else if (rule instanceof CSSImportRule && rule.styleSheet) {
			try { scanFor(rule.styleSheet.cssRules, prefix, keep); } catch { /* feuille cross-origin : on passe */ }
		}
	}
}

/*
	Balaye toutes les feuilles chargées à la recherche des noms déclarés sous `prefix`.
	@param {string} prefix
	@param {(name: string) => void} keep
*/
function scanSheets(prefix, keep) {
	for (const sheet of document.styleSheets) {
		try { scanFor(sheet.cssRules, prefix, keep); } catch { /* cross-origin */ }
	}
}

/*
	Les effets fournis par la/les feuille(s) chargée(s), dans l'ordre de déclaration.
	@returns {string[]} les noms (implode · explode · morph · ink · charge…)
*/
export function discoverContactEffects() {
	const found = [];
	scanSheets(PREFIX, (name) => { if (!found.includes(name)) found.push(name); });
	return found;
}

/*
	Les effets à DEUX temps : ceux dont une recette déclare `--z-contact__release--<nom>`.
	Le moteur les garde vivants pendant l'appui (`phase="press"`) et bascule en `phase="release"`
	au relâchement (le CSS y peint l'explosion). Les effets sans ce marqueur restent à un temps.
	@returns {Set<string>} les noms des effets à deux temps découverts
*/
export function discoverHeldEffects() {
	const found = new Set();
	scanSheets(RELEASE_PREFIX, (name) => found.add(name));
	return found;
}
