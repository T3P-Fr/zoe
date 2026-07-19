/**
 * Démarrage de session → réinjecte l'ÉTAT du dernier arrêt dans le contexte de
 * Claude, tout seul. Christophe dit juste « salut » et Claude sait déjà où on
 * en est (branche, 8 derniers pas, travail en cours) sans rien réexpliquer.
 *
 * Le fichier .claude/ETAT.md est produit par on-stop.js à chaque fin de tour.
 * On le rend à Claude Code via le canal `additionalContext` prévu pour ça.
 *
 * @see https://docs.claude.com/claude-code/hooks
 */

import { readFileSync } from "node:fs";

/**
 * Lit un fichier sans jamais planter s'il n'existe pas encore.
 * @param {string} path
 * @returns {string}
 */
function readOrEmpty(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

/* Deux sources de reprise, complémentaires :
   - JOURNAL.md : le résumé RICHE écrit par la commande /fin (décisions, prochain
     pas). On n'injecte que le début (entrées récentes en haut) pour rester léger.
   - ETAT.md : le snapshot Git AUTO (derniers pas + travail en cours). */
const journal = readOrEmpty(".claude/JOURNAL.md").slice(0, 2000);
const etat = readOrEmpty(".claude/ETAT.md");

const blocs = [];
if (journal.trim()) {
  blocs.push("JOURNAL (décisions récentes, la plus récente en haut) :\n\n" + journal);
}
if (etat.trim()) {
  blocs.push("ÉTAT au dernier arrêt (snapshot Git auto) :\n\n" + etat);
}

if (blocs.length) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "Reprise automatique — voici où on en était :\n\n" + blocs.join("\n\n---\n\n"),
    },
  };
  process.stdout.write(JSON.stringify(payload));
}
