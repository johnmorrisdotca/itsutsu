import type { SumilabuProjectKey, SumilabuScope, SumilabuTarget } from "./sumilabuProject.types.ts";

/**
 * Which Sumilabu project this process talks to, and with which token.
 *
 * THE SAFETY PROPERTY, the one `bots:play` and `bots:play:prod` keep: forgetting
 * something can only ever land on `itsutsu-dev`. The project comes from
 * `SUMILABU_PROJECT_KEY`, and when that is unset the answer is the dev project.
 * The live project, `itsutsu`, is refused unless one of two things says so out
 * loud:
 *
 *  - `NODE_ENV=production` — the deployed site, which is the only thing that
 *    should ever read or write the live project in the ordinary course;
 *  - `SUMILABU_LIVE_OPT_IN` — set by a script whose own name ends in `:prod`,
 *    to that name, so the opt-in is typed as a command and never as a flag
 *    somebody forgot to take off.
 *
 * Each project has its own tokens and neither borrows the other's: the dev
 * project reads `SUMILABU_BOARD_DEV_TOKEN` and `SUMILABU_SETTINGS_DEV_TOKEN`,
 * the live one `SUMILABU_BOARD_TOKEN` and `SUMILABU_SETTINGS_TOKEN`. A checkout
 * that holds only the dev pair cannot reach the live project even by asking
 * for it, which is how every worktree's `.env` is meant to be.
 *
 * Plain module, no `server-only`: the site's server code, `pnpm task` and the
 * one-off scripts all decide the same way, from the same place.
 */

export const SUMILABU_PROJECTS = { live: "itsutsu", dev: "itsutsu-dev" } as const satisfies Record<string, SumilabuProjectKey>;

export const SUMILABU_ENV = {
  url: "SUMILABU_BOARD_URL",
  projectKey: "SUMILABU_PROJECT_KEY",
  liveOptIn: "SUMILABU_LIVE_OPT_IN",
} as const;

const TOKEN_ENV: Record<SumilabuProjectKey, Record<SumilabuScope, string>> = {
  itsutsu: { board: "SUMILABU_BOARD_TOKEN", settings: "SUMILABU_SETTINGS_TOKEN" },
  "itsutsu-dev": { board: "SUMILABU_BOARD_DEV_TOKEN", settings: "SUMILABU_SETTINGS_DEV_TOKEN" },
};

type Env = Record<string, string | undefined>;

export class SumilabuTargetError extends Error {}

/** The project asked for, defaulting to the dev one; a key Itsutsu does not have is refused, not mapped. */
export function sumilabuProjectKey(env: Env = process.env): SumilabuProjectKey {
  const asked = env[SUMILABU_ENV.projectKey]?.trim() || SUMILABU_PROJECTS.dev;
  if (asked === SUMILABU_PROJECTS.live || asked === SUMILABU_PROJECTS.dev) return asked;
  throw new SumilabuTargetError(
    `${SUMILABU_ENV.projectKey} is "${asked}"; Itsutsu's projects are ${SUMILABU_PROJECTS.dev} and ${SUMILABU_PROJECTS.live}.`,
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
  if (projectKey === SUMILABU_PROJECTS.live && !mayReachLive(env)) {
    throw new SumilabuTargetError(
      `${SUMILABU_PROJECTS.live} is the live site's project on Sumilabu. Only the site itself (NODE_ENV=production) ` +
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
