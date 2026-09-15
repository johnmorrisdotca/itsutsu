import type { SumilabuTarget } from "../sumilabu/sumilabuProject.types.ts";

import type { RemoteSetting } from "./siteSettingsRemote.types";

/**
 * Sumilabu's settings routes, one function each, for `siteStore.ts` and the
 * cut-over copy report. Plain `fetch`, no `server-only`, so the report can run
 * it too. Which project and which token are `sumilabuTarget("settings")`'s
 * decision and never this file's.
 *
 * EVERY CALL GIVES UP AFTER `SETTINGS_TIMEOUT_MS`. A sign-up waits on one of
 * these, and a service that hangs has to read as a service that cannot answer,
 * which the store turns into its safe default, rather than a door that neither
 * opens nor shuts.
 *
 * Every answer it does not recognise is thrown, not read as "nothing stored":
 * a 404 is null only when Sumilabu says `missing`. A route that has moved and
 * a setting nobody wrote are different facts, and only one of them is safe to
 * read as the default.
 */

export const SETTINGS_TIMEOUT_MS = 3000;

/** Sumilabu reads an actor past this as nobody, and refuses the write. */
const ACTOR_MAX = 80;

type Json = Record<string, unknown>;

async function call(
  target: SumilabuTarget,
  path: string,
  init: { method?: string; body?: unknown; actor?: string } = {},
): Promise<{ status: number; body: Json }> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { authorization: `Bearer ${target.token}`, accept: "application/json" };
  if (init.actor) headers["x-board-actor"] = init.actor.slice(0, ACTOR_MAX);
  if (init.body !== undefined) headers["content-type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${target.url}/api/v1/projects/${target.projectKey}/settings${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`Sumilabu's settings did not answer ${method} settings${path}: ${(error as Error).message}`);
  }
  const text = await response.text();
  let body: Json = {};
  try {
    body = text ? (JSON.parse(text) as Json) : {};
  } catch {
    body = { error: text.slice(0, 200) };
  }
  if (response.status === 401) throw new Error(`Sumilabu refused ${target.tokenEnv} for ${target.projectKey}'s settings (401).`);
  if (response.status >= 500) throw new Error(`Sumilabu's settings answered ${response.status} to ${method} settings${path}.`);
  return { status: response.status, body };
}

function setting(body: Json): RemoteSetting {
  return {
    key: String(body.key),
    value: String(body.value),
    setBy: typeof body.setBy === "string" ? body.setBy : null,
    updatedAt: String(body.updatedAt),
  };
}

const one = (key: string) => `/${encodeURIComponent(key)}`;

/** Every setting the project holds, with who wrote each and when. */
export async function readRemoteSettings(target: SumilabuTarget): Promise<RemoteSetting[]> {
  const { status, body } = await call(target, "");
  if (status !== 200 || !Array.isArray(body.entries)) throw new Error(`Could not read ${target.projectKey}'s settings (${status}).`);
  return (body.entries as Json[]).map(setting);
}

/** One setting, or null when Sumilabu says nobody has written it. */
export async function readRemoteSetting(target: SumilabuTarget, key: string): Promise<RemoteSetting | null> {
  const { status, body } = await call(target, one(key));
  if (status === 404 && body.error === "missing") return null;
  if (status !== 200) throw new Error(`Could not read ${target.projectKey}'s setting ${key} (${status}).`);
  return setting(body);
}

export async function putRemoteSetting(target: SumilabuTarget, key: string, value: string, actor: string): Promise<RemoteSetting> {
  const { status, body } = await call(target, one(key), { method: "PUT", body: { value }, actor });
  if (status !== 200) throw new Error(`Sumilabu refused ${key} (${status}): ${String(body.error ?? "no reason given")}.`);
  return setting(body);
}

/** Back to the default. Deleting what is not there is not an error; the answer says whether anything was. */
export async function deleteRemoteSetting(target: SumilabuTarget, key: string, actor: string): Promise<boolean> {
  const { status, body } = await call(target, one(key), { method: "DELETE", actor });
  if (status !== 200) throw new Error(`Sumilabu refused to forget ${key} (${status}): ${String(body.error ?? "no reason given")}.`);
  return body.deleted === true;
}
