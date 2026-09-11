import type { PREFERENCE_SPECS } from "./preferences.constants";

/**
 * What a preference may be worth: a scalar. A scalar survives a JSON column
 * unchanged and can be checked against a list with `includes`, which is the
 * whole of how the registry decides whether a stored value is still one it
 * offers. A preference shaped like an object is several preferences.
 */
export type PreferenceValue = string | number | boolean;

/**
 * One row of the registry: everything a preference may be, and what it is
 * when nothing usable is stored. The fallback is one of the options — the
 * type cannot say so, and `preferences.test.ts` checks it instead.
 */
export type PreferenceSpec<T extends PreferenceValue = PreferenceValue> = {
  readonly options: readonly T[];
  readonly fallback: T;
};

/** The name of a preference the registry knows. */
export type PreferenceName = keyof typeof PREFERENCE_SPECS;

/** Every preference, each holding one of its own options. */
export type Preferences = {
  [K in PreferenceName]: (typeof PREFERENCE_SPECS)[K]["options"][number];
};

/**
 * A change to some of them. A value keeps it; null forgets it, so that "never
 * said" can be got back to. The ordinary answer and no answer are not the
 * same thing, and a store that cannot tell them apart cannot let a member
 * take a choice back.
 */
export type PreferencePatch = { [K in PreferenceName]?: Preferences[K] | null };
