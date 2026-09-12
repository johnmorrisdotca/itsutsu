import {
  DEFAULT_SITE_SETTINGS,
  MAINTENANCE_ON,
  SITE_SETTING_KEYS,
  SITE_SETTING_SPECS,
} from "./site.constants";
import type {
  SiteSettingKey,
  SiteSettingState,
  SiteSettings,
} from "./site.types";

/**
 * Site settings as they cross the database, and the one question the gate asks.
 *
 * Pure throughout: nothing here reads a row, a cookie or the clock, so all of
 * it is reachable from the gate as well as from a route, and all of it is
 * testable without a database. `siteStore.ts` is the half that talks to Prisma.
 *
 * Every stored value arrives as a string, because that is what the column
 * holds. Nothing here trusts it: a mode this version no longer offers, a
 * hand-edited row, a key written by a branch that has not merged — each is
 * checked on its own against its own spec, and anything unusable falls back to
 * that ONE setting's default rather than throwing away the others. This is
 * `cleanPreferences` again, one level up.
 */

/**
 * Whether the registry knows a key. `Object.hasOwn`, not `in`: `in` walks the
 * prototype chain, and every object has a `toString`.
 */
export function isSiteSettingKey(key: string): key is SiteSettingKey {
  return Object.hasOwn(SITE_SETTING_SPECS, key);
}

/**
 * What one setting is worth, given whatever is stored for it.
 *
 * Undefined for "no row", which reads as the default — the same answer as a row
 * holding something the registry does not offer. The two are not the same event
 * and `chosen` on `SiteSettingState` is what tells them apart; for the VALUE
 * they are deliberately identical, so that removing an option from the registry
 * cannot leave the site behaving in a way the code no longer describes.
 */
export function valueFor<K extends SiteSettingKey>(
  key: K,
  stored: string | undefined,
): SiteSettings[K] {
  const spec = SITE_SETTING_SPECS[key];
  if (stored === undefined) return DEFAULT_SITE_SETTINGS[key];
  if (spec.kind === "choice") {
    return (spec.options as readonly string[]).includes(stored)
      ? (stored as SiteSettings[K])
      : DEFAULT_SITE_SETTINGS[key];
  }
  // A note is measured, not enumerated. Something longer than the registry
  // allows was never accepted by `acceptSiteSetting`, so it got there by hand
  // or by an older version; it reads as nothing rather than being shown cut in
  // half on the door.
  return (stored.length <= spec.maxLength
    ? stored
    : DEFAULT_SITE_SETTINGS[key]) as SiteSettings[K];
}

/** One stored row, as the store hands it over. */
export type StoredSetting = {
  key: string;
  value: string;
  updatedAt?: Date | string | null;
  updatedBy?: string | null;
};

/** Rows keyed by name, ignoring any key the registry does not declare. */
function byKey(rows: readonly StoredSetting[]): Map<string, StoredSetting> {
  const found = new Map<string, StoredSetting>();
  for (const row of rows) if (isSiteSettingKey(row.key)) found.set(row.key, row);
  return found;
}

/**
 * Writes one setting under its own name. The generic is what makes it
 * typecheck: iterating the keys gives the whole union, and `settings[key] =
 * value` over a union key cannot be related to its own value type, while
 * inside a generic both sides are indexed by the same `K`. `preferences.ts`
 * carries the same helper for the same reason.
 */
function put<K extends SiteSettingKey>(
  into: SiteSettings,
  key: K,
  value: SiteSettings[K],
): void {
  into[key] = value;
}

/** Every setting from a set of stored rows: what is usable, and the default for the rest. */
export function siteSettingsFrom(rows: readonly StoredSetting[]): SiteSettings {
  const found = byKey(rows);
  const settings = { ...DEFAULT_SITE_SETTINGS };
  for (const key of SITE_SETTING_KEYS) {
    put(settings, key, valueFor(key, found.get(key)?.value));
  }
  return settings;
}

/**
 * Every setting with its provenance, for the panel.
 *
 * `chosen` is the whole point of this existing beside `siteSettingsFrom`. A
 * panel that cannot tell "the operator picked invite-only" from "nobody has
 * ever touched this" shows the same radio button for both, and the operator has
 * no way to know whether the site is behaving by decision or by default.
 */
export function siteSettingStates(rows: readonly StoredSetting[]): SiteSettingState[] {
  const found = byKey(rows);
  return SITE_SETTING_KEYS.map((key) => {
    const row = found.get(key);
    const at = row?.updatedAt ?? null;
    return {
      key,
      value: valueFor(key, row?.value),
      chosen: row !== undefined,
      updatedAt: at === null ? null : new Date(at).toISOString(),
      updatedBy: row?.updatedBy ?? "",
    };
  });
}

export type Accepted =
  | { ok: true; key: SiteSettingKey; value: string | null }
  | { ok: false; problem: string };

/**
 * One change the operator asks for, checked against the registry, or why not.
 *
 * Refused, not cleaned, and the asymmetry with reading is deliberate — the same
 * one `acceptPreferences` makes. Reading drops what it cannot use because the
 * row is already written and whoever is looking at the page did nothing wrong.
 * Writing is somebody asking, and an unknown key or a value this site does not
 * offer is an answer they should hear rather than have quietly discarded. On a
 * control that decides who may enter the site, a write that silently did
 * something other than what was asked is the worst available outcome:
 * believing the door is shut when it is open.
 *
 * Null forgets the setting, putting the site back on the registry's default
 * rather than pinning it to today's.
 */
export function acceptSiteSetting(key: string, value: unknown): Accepted {
  if (!isSiteSettingKey(key)) return { ok: false, problem: `No such setting: ${key}.` };
  if (value === null) return { ok: true, key, value: null };
  if (typeof value !== "string") {
    return { ok: false, problem: `${key} is set to a string, or to null to forget it.` };
  }

  const spec = SITE_SETTING_SPECS[key];
  if (spec.kind === "choice") {
    if (!(spec.options as readonly string[]).includes(value)) {
      return { ok: false, problem: `Not a setting this site offers for ${key}.` };
    }
    return { ok: true, key, value };
  }

  if (value.length > spec.maxLength) {
    return {
      ok: false,
      problem: `${key} is at most ${spec.maxLength} characters; that one is ${value.length}.`,
    };
  }
  /*
   * Emptied means forgotten. The operator clearing the field and the operator
   * never having written one are the same intent, and keeping a row holding ""
   * would say somebody chose blankness — a judgement nobody made, written onto
   * a row and indistinguishable from a real one.
   */
  const trimmed = value.trim();
  return { ok: true, key, value: trimmed.length === 0 ? null : trimmed };
}

/**
 * Whether a stranger may become a member right now.
 *
 * ONE PREDICATE, imported by every door, rather than each door deriving the
 * answer from the mode itself. UmaKuma arrived at the same shape for who may
 * not come in and says why in its own source: a second list of the same rule
 * always drifts from the first. There are two doors here — a Google identity
 * arriving with nothing, and one arriving with a code — and a mode that meant
 * different things at each would be a mode nobody could describe.
 *
 * `withCode` is whether a valid invite code has just been redeemed. It is the
 * only thing that separates the two doors, and `invite-only` is the only mode
 * that cares.
 *
 * IT IS ASKED ABOUT STRANGERS ONLY. No caller consults this about somebody who
 * already has a member row, so no setting here can lock out a member already
 * admitted, and none of them touches a code's own validity — the codes in
 * circulation stay exactly as valid as they were. UmaKuma's backlog records the
 * version of this that went wrong: a lockdown setting which, deployed without
 * its row seeded, would have shut out every account already holding an invite.
 * The operator is not asked about either; `isAdminEmail` is checked before this
 * on the one path that could reach it, so the operator's own address becomes a
 * member whatever the door is set to.
 */
export function mayJoin(
  mode: SiteSettings["registration"],
  withCode: boolean,
): boolean {
  if (mode === "closed") return false;
  if (mode === "open") return true;
  return withCode;
}

/**
 * Whether the deployment says it is being worked on.
 *
 * Takes the value rather than reading `process.env` itself, so the gate's one
 * decision is a pure function of a string and `proxy.test.ts` can state it
 * without stubbing anything. See `MAINTENANCE_ENV` for why this is an
 * environment variable and not a row in the table.
 *
 * NAMED RATHER THAN NEGATED, the way `isUnprotectedEnvironment` is: exactly one
 * value shuts the site, and everything else — unset, empty, "true", "1",
 * "ON ", a typo — leaves it up. The dangerous direction here is a site shut by
 * a value nobody meant as a shutter, since the site is then unreachable and
 * the reason is a string comparison nobody can see. Trimmed and lowercased, so
 * a variable pasted with a trailing space still means what it says.
 */
export function maintenanceIsOn(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === MAINTENANCE_ON;
}
