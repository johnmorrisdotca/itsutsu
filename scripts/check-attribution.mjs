/**
 * Refuses to push a commit that credits an AI.
 *
 * John, 2026-09-17: "No co-authoring or AI ever." Every commit that reaches
 * main is authored by a person and carries no AI co-author trailer, no
 * session link and no "Generated with" line. His own rule lives on his
 * machine, where a cloud agent never reads it, and on 2026-09-24 two docs pull
 * requests arrived with Claude as the author and a trailer on every commit.
 * AGENTS.md now says so at the top; this is the same sentence as a gate, run
 * by `pnpm preflight:prod` before every push to main.
 *
 * It reads the commits this push would add (`origin/main..HEAD`), their
 * authors, committers and messages. Only `git log`, so it takes a moment.
 *
 *   node scripts/check-attribution.mjs            the commits since origin/main
 *   node scripts/check-attribution.mjs <range>    any range, e.g. a branch to be landed
 */
import { execFileSync } from "node:child_process";

const range = process.argv[2] ?? "origin/main..HEAD";

/* What credits an AI, in an address or a line of a message. */
const AI_ADDRESS = /noreply@anthropic\.com|copilot@github\.com|[0-9]+\+Copilot@users\.noreply\.github\.com/i;
const AI_LINES = [
  /^co-authored-by:.*(claude|anthropic|copilot|openai|chatgpt|gemini)/im,
  /^claude-session:/im,
  /generated (with|by) \[?(claude|copilot)/i,
  /claude\.ai\/code\/(session|project)/i,
];

const SEP = "\u001e";
const log = execFileSync("git", ["log", `--format=%h%x1f%an <%ae>%x1f%cn <%ce>%x1f%B${SEP}`, range], { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
const offenders = log
  .split(SEP)
  .map((entry) => entry.trim())
  .filter(Boolean)
  .flatMap((entry) => {
    const [hash, author, committer, message = ""] = entry.split("\u001f");
    const why = [];
    if (AI_ADDRESS.test(author)) why.push(`authored by ${author}`);
    if (AI_ADDRESS.test(committer)) why.push(`committed by ${committer}`);
    for (const line of AI_LINES) {
      const found = message.match(line);
      if (found) why.push(`"${found[0].trim()}"`);
    }
    return why.length > 0 ? [`${hash}: ${why.join("; ")}`] : [];
  });

if (offenders.length > 0) {
  console.error(`${offenders.length} commit(s) in ${range} credit an AI, which John's rule forbids (AGENTS.md, "No AI Attribution"):`);
  for (const line of offenders) console.error(`  ${line}`);
  console.error("Land the work as one clean commit under a person's name: `git merge --squash <branch>`, then commit with a message of your own.");
  process.exit(1);
}
console.log(`No AI attribution in ${range}.`);
