/**
 * Barre du bas de Claude Code — la VUE d'abord.
 *
 * Affiche, toujours sous les yeux : la branche git · le modèle · le coût de la
 * session en cours · les lignes ajoutées/retirées. Claude Code envoie un JSON
 * sur l'entrée standard ; on en lit juste ce qui parle à l'œil de Christophe.
 *
 * @see https://docs.claude.com/claude-code/statusline
 */

import { execSync } from "node:child_process";

/**
 * Lance une commande shell sans jamais planter la barre (retourne "" si échec).
 * @param {string} command
 * @returns {string}
 */
function run(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

let stdin = "";
process.stdin.on("data", (chunk) => (stdin += chunk));
process.stdin.on("end", () => {
  let info = {};
  try {
    info = JSON.parse(stdin);
  } catch {
    /* pas de JSON : on affiche quand même la branche */
  }

  const model = info.model?.display_name || "Claude";
  const cost = info.cost?.total_cost_usd ?? 0;
  const added = info.cost?.total_lines_added ?? 0;
  const removed = info.cost?.total_lines_removed ?? 0;
  const branch = run("git rev-parse --abbrev-ref HEAD");

  /* Couleurs ANSI : chaque info a sa teinte pour que l'œil la retrouve d'un coup. */
  const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
  const magenta = (s) => `\x1b[35m${s}\x1b[0m`;
  const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
  const green = (s) => `\x1b[32m${s}\x1b[0m`;
  const red = (s) => `\x1b[31m${s}\x1b[0m`;
  const sep = "\x1b[2m · \x1b[0m";

  const parts = [
    branch ? cyan("⎇ " + branch) : "",
    magenta(model),
    yellow("$" + cost.toFixed(2)),
    green("+" + added) + "/" + red("-" + removed),
  ].filter(Boolean);

  process.stdout.write(parts.join(sep));
});
