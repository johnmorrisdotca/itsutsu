import type { SumilabuProjectKey, SumilabuScope, SumilabuTarget } from "./sumilabuProject.types.ts";

/**
 * Which Sumilabu project this process talks to, and with which token.
 *
 * THE SAFETY PROPERTY, the one `bots:play` and `bots:play:prod` keep: forgetting
 * something can only ever land on `itsutsu-dev`. The project comes from
 * `SUMILABU_PROJECT_KEY`, and when that is unset the answer is the dev project.
 * A LIVE project — `itsutsu`, and UmaKuma's `umakuma` beside it — is refused
 * unless one of two things says so out loud:
 *
 *  - `NODE_ENV=production` — the deployed site, which is the only thing that
 *    should ever read or write the live project in the ordinary course;
 *  - `SUMILABU_LIVE_OPT_IN` — set by a script whose own name ends in `:prod`,
 *    to that name, so the opt-in is typed as a command and never as a flag
 *    somebody forgot to take off.
 *
 * Each project has its own tokens and none borrows another's: the dev project
 * reads `SUMILABU_BOARD_DEV_TOKEN`, `SUMILABU_SETTINGS_DEV_TOKEN` and
 * `SUMILABU_REPORTS_DEV_TOKEN`, the live one the same three without `_DEV`, and
 * UmaKuma's two their own `…_UMAKUMA…` set. A checkout that holds only the dev pair cannot
 * reach a live project even by asking for it, which is how every worktree's
 * `.env` is meant to be — and it is why adding UmaKuma here hands nothing out:
 * a checkout without UmaKuma's tokens is refused by name at the last step.
 *
 * Plain module, no `server-only`: the site's server code, `pnpm task` and the
 * one-off scripts all decide the same way, from the same place.
 */

export const SUMILABU_PROJECTS = {
  live: "itsutsu",
  dev: "itsutsu-dev",
  umakuma: "umakuma",
  umakumaDev: "umakuma-dev",
} as const satisfies Record<string, SumilabuProjectKey>;

/**
 * The rehearsal boards: the projects a tool may reach with nobody saying so.
 *
 * NAMED FROM THE SAFE SIDE, and that is the whole of the decision. Everything
 * not on this list is live, so a project added to the map above arrives
 * guarded — it needs the opt-in, and every script that asks prints LIVE beside
 * it — until somebody puts it here on purpose. The other way round, a list of
 * live projects, would let a forgotten line hand out a live board silently,
 * which is the one failure this module exists to make impossible.
 */
const REHEARSAL: ReadonlySet<SumilabuProjectKey> = new Set([SUMILABU_PROJECTS.dev, SUMILABU_PROJECTS.umakumaDev]);

/** Whether this project is a site's real board, rather than the rehearsal one beside it. */
export function liveProject(key: SumilabuProjectKey): boolean {
  return !REHEARSAL.has(key);
}

/** Every project key, for a refusal that says what it would have accepted. */
const PROJECT_KEYS: readonly SumilabuProjectKey[] = Object.values(SUMILABU_PROJECTS);

export const SUMILABU_ENV = {
  url: "SUMILABU_BOARD_URL",
  projectKey: "SUMILABU_PROJECT_KEY",
  liveOptIn: "SUMILABU_LIVE_OPT_IN",
} as const;

const TOKEN_ENV: Record<SumilabuProjectKey, Record<SumilabuScope, string>> = {
  itsutsu: { board: "SUMILABU_BOARD_TOKEN", settings: "SUMILABU_SETTINGS_TOKEN", reports: "SUMILABU_REPORTS_TOKEN" },
  "itsutsu-dev": { board: "SUMILABU_BOARD_DEV_TOKEN", settings: "SUMILABU_SETTINGS_DEV_TOKEN", reports: "SUMILABU_REPORTS_DEV_TOKEN" },
  umakuma: { board: "SUMILABU_BOARD_UMAKUMA_TOKEN", settings: "SUMILABU_SETTINGS_UMAKUMA_TOKEN", reports: "SUMILABU_REPORTS_UMAKUMA_TOKEN" },
  "umakuma-dev": {
    board: "SUMILABU_BOARD_UMAKUMA_DEV_TOKEN",
    settings: "SUMILABU_SETTINGS_UMAKUMA_DEV_TOKEN",
    reports: "SUMILABU_REPORTS_UMAKUMA_DEV_TOKEN",
  },
} as const;

type Env = Record<string, string | undefined>;

export class SumilabuTargetError extends Error {}

/** Whether a string is one of the project names, narrowing it rather than casting it. */
function known(asked: string): asked is SumilabuProjectKey {
  return (PROJECT_KEYS as readonly string[]).includes(asked);
}

/** The project asked for, defaulting to the dev one; a name this checkout does not know is refused, not mapped. */
export function sumilabuProjectKey(env: Env = process.env): SumilabuProjectKey {
  const asked = env[SUMILABU_ENV.projectKey]?.trim() || SUMILABU_PROJECTS.dev;
  if (known(asked)) return asked;
  throw new SumilabuTargetError(
    `${SUMILABU_ENV.projectKey} is "${asked}"; the projects here are ${PROJECT_KEYS.join(", ")}.`,
  );
}

/** Named rather than negated: an unset or misspelled NODE_ENV is not production. */
function mayReachLive(env: Env): boolean {
  return env.NODE_ENV === "production" || Boolean(env[SUMILABU_ENV.liveOptIn]?.trim());
}

/** The live project's opt-in, when one was given: the `:prod` script that set it. */
export function liveOptIn(env: Env = process.env): string | null {
  return env[SUMILABU_ENV.liveOptIn]?.trim() || null;
}

export function sumilabuTarget(scope: SumilabuScope, env: Env = process.env): SumilabuTarget {
  const projectKey = sumilabuProjectKey(env);
  if (liveProject(projectKey) && !mayReachLive(env)) {
    throw new SumilabuTargetError(
      `${projectKey} is a live site's project on Sumilabu. Only the site itself (NODE_ENV=production) ` +
        `or a :prod script may use it; unset ${SUMILABU_ENV.projectKey} to work on ${SUMILABU_PROJECTS.dev}.`,
    );
  }
  const tokenEnv = TOKEN_ENV[projectKey][scope];
  const url = (env[SUMILABU_ENV.url] ?? "").trim().replace(/\/+$/, "");
  const token = (env[tokenEnv] ?? "").trim();
  if (!url || !token) {
    throw new SumilabuTargetError(`Sumilabu's ${scope} for ${projectKey} needs ${SUMILABU_ENV.url} and ${tokenEnv} in the environment.`);
  }
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    throw new SumilabuTargetError(`${SUMILABU_ENV.url} is not an address.`);
  }
  return { projectKey, scope, url, host, token, tokenEnv };
}

/** What a script prints before it writes: the project and the host, and never the token. */
export function targetLine(target: SumilabuTarget): string {
  return `${target.projectKey} on ${target.host}`;
}
