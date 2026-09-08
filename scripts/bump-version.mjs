/**
 * Bumps package.json's version and opens a CHANGELOG entry for it.
 *
 *   pnpm version:bump minor "A new game a player would notice."
 *   pnpm version:bump patch
 *
 * A minor is something a player would notice; a patch is a fix or a chore.
 * The major is reserved for the grand opening and is not offered here.
 */
import { readFileSync, writeFileSync } from "node:fs";

const [kind, ...words] = process.argv.slice(2);
if (kind !== "minor" && kind !== "patch") {
  console.error("Usage: pnpm version:bump minor|patch [one-line summary]");
  process.exit(1);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);
const next = kind === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
writeFileSync("package.json", readFileSync("package.json", "utf8").replace(`"version": "${pkg.version}"`, `"version": "${next}"`));

const summary = words.join(" ").trim();
if (kind === "minor" || summary !== "") {
  const log = readFileSync("CHANGELOG.md", "utf8");
  const marker = "\n## ";
  const at = log.indexOf(marker);
  const entry = `\n## ${next}\n- ${summary || "…"}\n`;
  writeFileSync("CHANGELOG.md", at === -1 ? log + entry : log.slice(0, at) + entry + log.slice(at));
}
console.log(`${pkg.version} → ${next}`);
