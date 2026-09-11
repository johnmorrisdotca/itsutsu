import { DEFAULT_PREFERENCES, PREFERENCE_NAMES, PREFERENCE_SPECS } from "./preferences.constants";
import type { PreferenceName, PreferencePatch, Preferences } from "./preferences.types";

/**
 * Preferences as they cross the database.
 *
 * Stored as one column of JSON, so read back as whatever is in that column: a
 * choice this version no longer offers, a hand-edited row, a key written by a
 * version that had more preferences than this one. Nothing here trusts it.
 * Each declared preference is checked on its own against its options, and
 * anything unrecognised is left out, falling back to that ONE preference's
 * fallback rather than throwing away every other choice the member made.
 * This is `cleanAppearance` made general, and the property it keeps is the
 * reason a registry was asked for rather than a bag.
 *
 * Pure: every function returns a new object and leaves its input untouched.
 */

/** A stored value that could hold preferences at all: an object, not an array, not null. */
function isRow(stored: unknown): stored is Record<string, unknown> {
  return stored !== null && typeof stored === "object" && !Array.isArray(stored);
}

/**
 * Whether the registry knows a name. `Object.hasOwn`, not `in`: `in` walks the
 * prototype chain, and every object has a `toString`.
 */
export function isPreferenceName(name: string): name is PreferenceName {
  return Object.hasOwn(PREFERENCE_SPECS, name);
}

/**
 * Whether a value is one this preference may take. `includes` compares by
 * identity, so an object, a function or a near-miss string never matches.
 */
function offered<K extends PreferenceName>(name: K, value: unknown): value is Preferences[K] {
  return (PREFERENCE_SPECS[name].options as readonly unknown[]).includes(value);
}

/** Writes one preference under its own name; the generic lets a union of names through one at a time. */
function put<K extends PreferenceName>(into: PreferencePatch, name: K, value: PreferencePatch[K]): void {
  into[name] = value;
}

/** The parts of a stored value that name something this site still offers. */
export function cleanPreferences(stored: unknown): Partial<Preferences> {
  if (!isRow(stored)) return {};
  const clean: Partial<Preferences> = {};
  for (const name of PREFERENCE_NAMES) {
    // Own keys only, so a stored value cannot reach a preference by prototype.
    if (!Object.hasOwn(stored, name)) continue;
    const value = stored[name];
    if (offered(name, value)) put(clean, name, value);
  }
  return clean;
}

/** Every preference from a stored value: what is usable, and the fallback for the rest. */
export function preferencesFrom(stored: unknown): Preferences {
  return { ...DEFAULT_PREFERENCES, ...cleanPreferences(stored) };
}

export type Accepted = { ok: true; patch: PreferencePatch } | { ok: false; problem: string };

/**
 * What a caller asks to change, checked against the registry, or why not.
 *
 * Refused, not cleaned, and the asymmetry with reading is deliberate. Reading
 * drops what it cannot use because the row is already written and the member
 * in front of the page did nothing wrong. Writing is somebody asking, and an
 * unknown preference or a value the site does not offer is an answer they
 * should hear rather than have quietly thrown away.
 *
 * Null forgets a preference. A key present but undefined says nothing, as it
 * does everywhere else in JavaScript, and JSON cannot carry one anyway.
 */
export function acceptPreferences(asked: unknown): Accepted {
  if (!isRow(asked)) return { ok: false, problem: "Preferences must be an object of name: value." };
  const patch: PreferencePatch = {};
  for (const [name, value] of Object.entries(asked)) {
    if (!isPreferenceName(name)) return { ok: false, problem: `No such preference: ${name}.` };
    if (value === undefined) continue;
    if (value === null) {
      patch[name] = null;
      continue;
    }
    if (!offered(name, value)) return { ok: false, problem: `Not a choice this site offers for ${name}.` };
    put(patch, name, value);
  }
  return { ok: true, patch };
}

/**
 * A stored value with a patch laid over it: what goes back into the column.
 *
 * Over the stored value as it is, not over the cleaned one. A key this
 * version does not know is left exactly where it was — it may have been
 * written by a newer version during a deploy, or by a branch that has not
 * merged yet, and a write about the players page has no business deciding
 * anything about it. Reads drop it, and that is enough.
 *
 * The patch is typed, but a name the registry does not know is skipped
 * rather than trusted, so the type is not the only thing keeping the column
 * honest.
 */
export function mergePreferences(stored: unknown, patch: PreferencePatch): Record<string, unknown> {
  const merged: Record<string, unknown> = isRow(stored) ? { ...stored } : {};
  for (const [name, value] of Object.entries(patch)) {
    if (!isPreferenceName(name) || value === undefined) continue;
    if (value === null) delete merged[name];
    else merged[name] = value;
  }
  return merged;
}

/**
 * Whether writing `merged` back would leave the column as it is.
 *
 * So that saying again what is already kept — the same link followed twice,
 * a bar revisited — costs no write at all. `merged` is built by spreading the
 * stored row first, so the same keys come out in the same order and a plain
 * comparison of the two as JSON is exact. A column holding nothing usable is
 * "the same" as an empty change: forgetting what was never kept has nothing
 * to say either.
 */
export function sameStored(stored: unknown, merged: Record<string, unknown>): boolean {
  if (!isRow(stored)) return Object.keys(merged).length === 0;
  return JSON.stringify(stored) === JSON.stringify(merged);
}
