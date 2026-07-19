/**
 * Fin de tour de Claude → deux gestes automatiques, pour que Christophe n'ait
 * JAMAIS à penser à Git ni à « où on en était ».
 *
 *   1. SNAPSHOT — si le travail a changé quelque chose, on commite tout de suite
 *      un point de sauvegarde daté (préfixe `snapshot:`). Jamais de push :
 *      c'est un filet, squashable plus tard. Rien changé = rien commité.
 *
 *   2. ÉTAT — on réécrit `.claude/ETAT.md` (les 8 derniers pas + le travail en
 *      cours). Ce fichier est réinjecté tout seul au prochain démarrage
 *      (voir session-start.js), donc la reprise ne coûte plus rien.
 *
 * ETAT.md est ignoré par Git (voir .gitignore) : c'est un cache local, pas de
 * l'historique — sinon chaque tour créerait un commit inutile.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

/**
 * Lance une commande git sans jamais faire échouer le hook.
 * @param {string} command
 * @returns {string}
 */
function git(command) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/* Horodatage court « 2026-07-19 14:30 » — lisible d'un coup d'œil. */
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

/* 1) Snapshot : on ne commite que s'il y a vraiment quelque chose. */
git("git add -A");
const staged = git("git diff --cached --name-only");
if (staged) {
  git(`git commit -m "snapshot: ${stamp}"`);
}

/* 2) On réécrit l'état pour la reprise de la prochaine session. */
const branch = git("git rev-parse --abbrev-ref HEAD") || "—";

/* Pas de pipe shell ici : sur Windows, git() passe par cmd.exe (ni `sed` ni
   `|` Unix). On récupère les sujets bruts et on préfixe « - » côté JavaScript. */
const rawSteps = git("git log -8 --pretty=format:%s");
const lastSteps = rawSteps
  ? rawSteps.split("\n").map((line) => "- " + line).join("\n")
  : "";

const working = git("git status --short");

const etat = `# ÉTAT — reprise automatique

_Écrit le ${stamp} · branche \`${branch}\`_

## Les 8 derniers pas
${lastSteps || "—"}

## En cours (non commité au moment du snapshot)
${working ? "```\n" + working + "\n```" : "rien — tout est sauvegardé"}
`;

writeFileSync(".claude/ETAT.md", etat);
