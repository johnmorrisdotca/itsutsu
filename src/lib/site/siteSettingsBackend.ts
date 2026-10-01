import { randomUUID } from "node:crypto";

import { suiteServerOwnsSettings } from "@/lib/suiteServer";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

import type { RemoteSetting } from "./siteSettingsRemote.types";
import { deleteRemoteSetting, putRemoteSetting, readRemoteSettings } from "./siteSettingsWire";

/**
 * Where the site's settings are kept for THIS server: Sumilabu, everywhere,
 * except on the browser suite's own server, where they are in its memory.
 *
 * WHY THE SUITE HAS ITS OWN, AND NOT A SLICE OF SUMILABU'S. Twelve CI shards
 * (and every developer running the suite) shared one `itsutsu-dev` project, and
 * a site setting is the one thing a spec changes that every other spec reads.
 * `site-settings.spec.ts` closes the door for a few seconds; a server on
 * another shard that read the store in that window answered "not taking new
 * members" to `control-names.spec.ts` and kept the answer for ten minutes in
 * its settings cache (the panel's `revalidateTag` clears only the server that
 * wrote). Two ways out were weighed:
 *
 *  1. A KEY PREFIX per run on Sumilabu. Its keys are free-form
 *     (`[a-z0-9_.-]{1,80}`), so it would work without a change there. But
 *     every shard would still send every settings read and write to another
 *     site's function (September 2026: settings reads were 2.3K of Sumilabu's
 *     2.8K calls in twelve hours, most of them a suite signing in strangers),
 *     every run would leave rows to be cleaned up in a project people also work
 *     in, a run killed half way would leave them for good, and the panel's list
 *     would have to learn to filter by prefix: production code changed to
 *     serve a test.
 *  2. MEMORY ON THE SUITE'S SERVER, chosen. The routes, the registry, the
 *     panel, the door, the intervals and the cache with its tag are the very
 *     code production runs; only the bottom three calls (list, put, delete)
 *     swap, and they swap behind `suiteServerOwnsSettings`, which is the
 *     guard every other suite relief uses and which refuses production and
 *     Vercel. A server is its own world, so two shards, or a shard and a
 *     laptop, cannot see each other's door, and a fresh server starts at
 *     "nobody has changed anything", which is the state the specs assume.
 *     What memory does not cover is the round trip to Sumilabu, and that stays
 *     tested twice: the wire and the store by their unit tests, and the real
 *     service by `e2e/sumilabu-settings.spec.ts`, which writes a key nobody
 *     else reads.
 *
 * ONE COPY PER PROCESS, ON `globalThis`. Next compiles the panel's route and
 * the door's page into separate bundles, each with its own instance of every
 * module (the note in `siteStore.ts`), so a Map in this module would be several
 * Maps and a write the panel made would be invisible to the door.
 *
 * THE CACHE IS SCOPED TOO. `unstable_cache` persists to `.next/cache` on disk,
 * which two servers started from one checkout share, and which a restarted
 * server reads again for ten minutes. `settingsScope()` is part of that cache's
 * key: a random id for each suite server, so neither another server's entry nor
 * an earlier run's can answer for this one. On Sumilabu it is a constant, and
 * the key is the one production always had.
 */

type SuiteSettings = { scope: string; rows: Map<string, RemoteSetting> };

const HELD = Symbol.for("itsutsu.suiteServerSettings");

function suiteSettings(): SuiteSettings {
  const holder = globalThis as unknown as Record<symbol, SuiteSettings | undefined>;
  return (holder[HELD] ??= { scope: `suite-${randomUUID()}`, rows: new Map() });
}

type Env = Readonly<Record<string, string | undefined>>;

/** Mixed into the settings cache's key, so a cache on disk is never one server's answer for another. */
export function settingsScope(env: Env = process.env): string {
  return suiteServerOwnsSettings(env) ? suiteSettings().scope : "sumilabu";
}

/** Every setting held, with who wrote each and when. */
export async function readSettings(env: Env = process.env): Promise<RemoteSetting[]> {
  if (suiteServerOwnsSettings(env)) return [...suiteSettings().rows.values()].map((row) => ({ ...row }));
  return readRemoteSettings(sumilabuTarget("settings", { ...env }));
}

export async function putSetting(remoteKey: string, value: string, by: string, env: Env = process.env): Promise<RemoteSetting> {
  if (suiteServerOwnsSettings(env)) {
    const row: RemoteSetting = { key: remoteKey, value, setBy: by, updatedAt: new Date().toISOString() };
    suiteSettings().rows.set(remoteKey, row);
    return { ...row };
  }
  return putRemoteSetting(sumilabuTarget("settings", { ...env }), remoteKey, value, by);
}

/** Back to the default. Whether anything was there. */
export async function deleteSetting(remoteKey: string, by: string, env: Env = process.env): Promise<boolean> {
  if (suiteServerOwnsSettings(env)) return suiteSettings().rows.delete(remoteKey);
  return deleteRemoteSetting(sumilabuTarget("settings", { ...env }), remoteKey, by);
}
