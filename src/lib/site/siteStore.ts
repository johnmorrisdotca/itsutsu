import "server-only";

import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

import { DEFAULT_SITE_SETTINGS, SITE_SETTING_REMOTE_KEYS } from "./site.constants";
import { cachedSiteSettings } from "./liveBoardIntervals";
import { siteSettingStates, storedFromRemote } from "./site";
import { deleteRemoteSetting, putRemoteSetting, readRemoteSettings } from "./siteSettingsWire";
import type {
  RegistrationMode,
  SiteSettingKey,
  SiteSettingState,
  SiteSettings,
} from "./site.types";

/**
 * The half that talks to the settings store. Everything it decides is decided
 * in `site.ts`, which is pure; this reads settings, writes them, and hands them
 * over.
 *
 * THE STORE IS SUMILABU'S, one row per key under Itsutsu's project, which is
 * the shape this file was written in anticipation of: nothing that imports it
 * had to change when it moved. `sumilabuTarget("settings")` decides which
 * project — the live one only on the deployed site, itsutsu-dev everywhere
 * else — and the names are Sumilabu's (`SITE_SETTING_REMOTE_KEYS`). The old
 * `SiteSetting` table stays in the schema, read by nothing, until a later step
 * drops it with a Neon branch taken first.
 *
 * WHAT EACH READ COSTS. Nothing here may cost extra money, so a call is made
 * where a setting is needed and nowhere else, and nothing polls:
 *
 *  - The sign-up decision, `registrationMode`, and the door,
 *    `fetchSiteSettings`, read through `cachedSiteSettings`: one call to
 *    Sumilabu in ten minutes per server cache, however many strangers ask.
 *  - The panel reads everything, uncached, because the operator decides from
 *    it and must see what is stored now.
 *
 * THE DOOR IS CACHED ACROSS REQUESTS, and for a while it was not. A copy held
 * in this module could not hear the panel's write — the panel's route and the
 * door's page each get their own instance of this file — so the door read the
 * store every time instead. Every one of those reads is a function call on
 * Sumilabu that wakes its database for five minutes: in September 2026 settings
 * reads were 2.3K of Sumilabu's 2.8K calls in twelve hours and its database was
 * awake three quarters of the day, most of it for a browser suite signing in
 * strangers. Next's data cache lives outside the process and the panel's write
 * clears it by tag (`revalidateTag` in `/api/site`), so the objection to the
 * module's own copy does not hold for it. A setting changed anywhere but the
 * panel reaches the door within ten minutes.
 *
 * FAILING. A sign-up decision that cannot read the store answers `invite-only`,
 * and says why. That is both the registry's default and how the site behaved
 * before any of this existed, so a failed read, a missing row and a fresh
 * deployment are all the same behaviour: a store that cannot be read must not
 * be able to open the door. It is deliberately the opposite direction from
 * the maintenance shutter, which fails OPEN — a shutter that cannot measure
 * must not fire, or a hiccup takes the site down; a door that cannot measure
 * must stay shut, or a hiccup lets strangers in. Same principle, opposite
 * safe answer, because the dangerous mistake is the opposite one.
 *
 * The door that cannot read shows no notice and asks for a code. And the panel
 * does not pretend: a failed read is thrown, so the operator is told the
 * settings could not be read, rather than being shown the defaults as though
 * nobody had chosen.
 */

function why(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The one question the door asks.
 *
 * Its own function rather than a field read off an object, because it is the
 * only setting with a decision hanging on it and it should be greppable: every
 * caller of this is a place where a stranger either does or does not become a
 * member.
 */
export async function registrationMode(): Promise<RegistrationMode> {
  try {
    return (await cachedSiteSettings()).registration;
  } catch (error) {
    console.error(`Signing up is treated as ${DEFAULT_SITE_SETTINGS.registration}: the settings store could not be read. ${why(error)}`);
    return DEFAULT_SITE_SETTINGS.registration;
  }
}

/**
 * How the door is set up. It DESCRIBES the mode; the decision is
 * `registrationMode`, asked where a member is made.
 */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    return await cachedSiteSettings();
  } catch (error) {
    console.error(`The door asks for a code and shows no notice: the settings store could not be read. ${why(error)}`);
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

/** Every setting with when it was written and by whom, for the panel. Throws when the store cannot be read. */
export async function fetchSiteSettingStates(): Promise<SiteSettingState[]> {
  return siteSettingStates(storedFromRemote(await readRemoteSettings(sumilabuTarget("settings"))));
}

/**
 * Writes one setting, or forgets it.
 *
 * Null DELETES the row rather than storing the default, so that "nobody has
 * ever said" stays reachable — the state every deployment starts in, and the
 * one a stored default would be indistinguishable from. Sumilabu's settings
 * store makes the same decision: no row is its one representation of unset.
 */
export async function writeSiteSetting(
  key: SiteSettingKey,
  value: string | null,
  by: string,
): Promise<void> {
  const target = sumilabuTarget("settings");
  const remoteKey = SITE_SETTING_REMOTE_KEYS[key];
  if (value === null) await deleteRemoteSetting(target, remoteKey, by);
  else await putRemoteSetting(target, remoteKey, value, by);
}
