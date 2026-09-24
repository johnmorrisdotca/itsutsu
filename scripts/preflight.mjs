#!/usr/bin/env node
/**
 * THE RELEASE GATE, WITH ITS CHECKS SIDE BY SIDE.
 *
 * It was `pnpm quality:check && pnpm security:check && pnpm build`: lint, the
 * file size gate, types, the unit tests, the audit and the build, one after
 * another, about six minutes before every push. None of them waits on another's
 * answer, so they run at once here and the slowest sets the pace. John,
 * 2026-09-22: "we should have goal to have the fastest deploy times possible …
 * making sure things happen in parallel." See AGENTS.md, "Deploys Are Fast By
 * Design".
 *
 * ONE LANE IS KEPT IN ORDER: types, then the build. `next typegen` and
 * `next build` both write into `.next`, and two writers in one folder is how a
 * build corrupts — AGENTS.md records a Turbopack cache broken exactly that way.
 * Everything else is its own lane.
 *
 * Each lane's output is held and printed only if it fails, so a red gate shows
 * the one failure rather than six interleaved logs; the timings are printed
 * either way, which is how anybody tuning this knows where the minutes go.
 * Exits non-zero if any lane fails — the `&&` chain in front of `git push`
 * depends on that.
 */
import { spawn } from "node:child_process";

/** Each lane runs its commands in order; lanes run at the same time. */
const LANES = [
  { name: "lint", commands: ["pnpm lint"] },
  { name: "file sizes", commands: ["pnpm loc:check"] },
  { name: "unit tests", commands: ["pnpm test:unit"] },
  { name: "audit", commands: ["pnpm security:check"] },
  { name: "no AI attribution", commands: ["pnpm attribution:check"] },
  { name: "types, then build", commands: ["pnpm typecheck", "pnpm build"] },
];

function run(command) {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, env: process.env });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function lane({ name, commands }) {
  const started = Date.now();
  for (const command of commands) {
    const { code, output } = await run(command);
    if (code !== 0) return { name, ok: false, seconds: (Date.now() - started) / 1000, command, output };
  }
  return { name, ok: true, seconds: (Date.now() - started) / 1000 };
}

const started = Date.now();
const results = await Promise.all(LANES.map(lane));
for (const result of results) {
  console.log(`${result.ok ? "ok  " : "FAIL"}  ${result.name.padEnd(18)} ${result.seconds.toFixed(0).padStart(4)}s`);
}
console.log(`gate: ${((Date.now() - started) / 1000).toFixed(0)}s with the checks side by side`);
const failed = results.filter((result) => !result.ok);
for (const result of failed) {
  console.log(`\n──── ${result.name}: \`${result.command}\` failed ────\n${result.output}`);
}
process.exit(failed.length === 0 ? 0 : 1);
