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

let etat = "";
try {
  etat = readFileSync(".claude/ETAT.md", "utf8");
} catch {
  /* Première session : pas encore d'état, ce n'est pas une erreur. */
}

if (etat.trim()) {
  const payload = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "Reprise automatique — voici l'état laissé au dernier arrêt :\n\n" + etat,
    },
  };
  process.stdout.write(JSON.stringify(payload));
}
