import { describe, expect, it } from "vitest";

import { DIRECTORY_WHO } from "@/lib/rating/directoryFilter";

import { DEFAULT_PREFERENCES, PREFERENCE_NAMES, PREFERENCE_SPECS } from "./preferences.constants";
import { acceptPreferences, cleanPreferences, mergePreferences, preferencesFrom } from "./preferences";

/**
 * A registry, not a bag.
 *
 * Every case here is one that has bitten a JSON column on this site already:
 * a value a previous version offered and this one does not, a row edited by
 * hand, a key nobody declared. The property under test is the one
 * `cleanAppearance` has and a general store could so easily lose — one bad
 * field falls back on its own and takes nothing else down with it.
 */
describe("the registry itself", () => {
  it("declares a fallback that is one of its own options, for every preference", () => {
    // The type cannot say this; a fallback outside the options would be a
    // default the read side could never have stored.
    for (const name of PREFERENCE_NAMES) {
      const spec = PREFERENCE_SPECS[name];
      expect(spec.options.length, name).toBeGreaterThan(0);
      expect((spec.options as readonly unknown[]).includes(spec.fallback), name).toBe(true);
    }
  });

  it("is the one place the defaults come from", () => {
    expect(Object.keys(DEFAULT_PREFERENCES)).toEqual([...PREFERENCE_NAMES]);
    for (const name of PREFERENCE_NAMES) {
      expect(DEFAULT_PREFERENCES[name]).toBe(PREFERENCE_SPECS[name].fallback);
    }
  });
});

describe("reading stored preferences", () => {
  it("gives every declared default when nothing at all is stored", () => {
    for (const stored of [null, undefined, {}]) {
      expect(preferencesFrom(stored)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  it("keeps a valid value as itself, for every option of every preference", () => {
    for (const name of PREFERENCE_NAMES) {
      for (const option of PREFERENCE_SPECS[name].options) {
        expect(cleanPreferences({ [name]: option }), `${name}=${String(option)}`).toEqual({ [name]: option });
        expect(preferencesFrom({ [name]: option })[name]).toBe(option);
      }
    }
  });

  it("drops a key it has never heard of", () => {
    expect(cleanPreferences({ nonsense: 1, playersWho: DIRECTORY_WHO.people })).toEqual({
      playersWho: DIRECTORY_WHO.people,
    });
    expect(preferencesFrom({ nonsense: 1 })).toEqual(DEFAULT_PREFERENCES);
    expect(preferencesFrom({ nonsense: 1 })).not.toHaveProperty("nonsense");
  });

  it("falls back for a known key holding a value the site does not offer", () => {
    expect(cleanPreferences({ playersWho: "robots" })).toEqual({});
    expect(preferencesFrom({ playersWho: "robots" }).playersWho).toBe(DEFAULT_PREFERENCES.playersWho);
  });

  it("does not let one bad field discard the valid fields beside it", () => {
    // THE CASE THE REGISTRY EXISTS FOR. A `who` this version no longer offers
    // must not throw away the "seen lately" the member also asked for.
    expect(cleanPreferences({ playersWho: "robots", playersActive: true, playersSettled: true })).toEqual({
      playersActive: true,
      playersSettled: true,
    });
    const whole = preferencesFrom({ playersWho: "robots", playersActive: true });
    expect(whole.playersWho).toBe(DEFAULT_PREFERENCES.playersWho);
    expect(whole.playersActive).toBe(true);
    expect(whole.playersSettled).toBe(DEFAULT_PREFERENCES.playersSettled);
  });

  it("falls back quietly for a value a previous version offered and this one does not", () => {
    // Written when the directory called people "members"; read by a version
    // that does not. Not an error, not a broken page: the ordinary answer.
    expect(() => preferencesFrom({ playersWho: "members" })).not.toThrow();
    expect(preferencesFrom({ playersWho: "members" })).toEqual(DEFAULT_PREFERENCES);
  });

  it("refuses a switch that is not a switch", () => {
    expect(cleanPreferences({ playersActive: "yes", playersSettled: 1 })).toEqual({});
    expect(cleanPreferences({ playersActive: "true" })).toEqual({});
  });

  it("refuses anything that is not a set of preferences at all", () => {
    for (const stored of [null, undefined, 7, "people", true, [], [{ playersWho: "people" }]]) {
      expect(cleanPreferences(stored), String(stored)).toEqual({});
      expect(preferencesFrom(stored), String(stored)).toEqual(DEFAULT_PREFERENCES);
    }
  });

  it("will not be talked into a value by prototype", () => {
    // "toString" is on every object; it is not a kind of player. And a key
    // inherited rather than owned is not something this member stored.
    expect(cleanPreferences({ playersWho: "toString", playersActive: "constructor" })).toEqual({});
    expect(cleanPreferences(Object.create({ playersWho: DIRECTORY_WHO.people }))).toEqual({});
  });

  it("leaves what it was given untouched, and hands back something new each time", () => {
    const stored = { playersWho: "robots", playersActive: true, nonsense: 1 };
    const before = JSON.stringify(stored);
    preferencesFrom(stored);
    cleanPreferences(stored);
    expect(JSON.stringify(stored)).toBe(before);
    expect(preferencesFrom(null)).not.toBe(DEFAULT_PREFERENCES);
  });
});

describe("accepting a change", () => {
  it("takes a value the registry offers", () => {
    expect(acceptPreferences({ playersWho: DIRECTORY_WHO.computers, playersActive: true })).toEqual({
      ok: true,
      patch: { playersWho: DIRECTORY_WHO.computers, playersActive: true },
    });
  });

  it("refuses a preference the registry does not know, by name", () => {
    const answer = acceptPreferences({ nonsense: 1 });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.problem).toMatch(/nonsense/);
    // And on a prototype name, which a bag would have let straight through.
    expect(acceptPreferences({ toString: "x" }).ok).toBe(false);
  });

  it("refuses a value the site does not offer, rather than dropping it", () => {
    // Reading drops; writing is somebody asking, and they should hear no.
    const answer = acceptPreferences({ playersWho: "robots" });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.problem).toMatch(/playersWho/);
    expect(acceptPreferences({ playersActive: "yes" }).ok).toBe(false);
  });

  it("refuses the whole change when any part of it is wrong", () => {
    // A change is one request. Keeping the good half would write something
    // the caller did not ask for, which is a bag's habit.
    expect(acceptPreferences({ playersActive: true, playersWho: "robots" }).ok).toBe(false);
  });

  it("takes null as forgetting, and undefined as saying nothing", () => {
    expect(acceptPreferences({ playersWho: null })).toEqual({ ok: true, patch: { playersWho: null } });
    expect(acceptPreferences({ playersWho: undefined })).toEqual({ ok: true, patch: {} });
  });

  it("refuses anything that is not an object of preferences", () => {
    for (const asked of [null, undefined, 7, "people", [], [{ playersWho: "people" }]]) {
      expect(acceptPreferences(asked).ok, String(asked)).toBe(false);
    }
    expect(acceptPreferences({})).toEqual({ ok: true, patch: {} });
  });
});

describe("laying a change over what is stored", () => {
  it("changes what was asked and keeps the rest", () => {
    const stored = { playersWho: DIRECTORY_WHO.people, playersActive: true };
    expect(mergePreferences(stored, { playersWho: DIRECTORY_WHO.computers })).toEqual({
      playersWho: DIRECTORY_WHO.computers,
      playersActive: true,
    });
  });

  it("forgets a preference on null, so the ordinary answer can be got back to", () => {
    expect(mergePreferences({ playersWho: DIRECTORY_WHO.people, playersActive: true }, { playersWho: null })).toEqual({
      playersActive: true,
    });
    // Forgetting what was never there is not an error.
    expect(mergePreferences({}, { playersWho: null })).toEqual({});
  });

  it("leaves a stored key it does not know exactly where it was", () => {
    // Written by a newer version, or by a branch not merged yet. A write
    // about the players page has no business deciding anything about it.
    expect(mergePreferences({ theirs: "kept" }, { playersActive: true })).toEqual({
      theirs: "kept",
      playersActive: true,
    });
  });

  it("starts from nothing when the column holds nothing usable", () => {
    for (const stored of [null, undefined, 7, "people", []]) {
      expect(mergePreferences(stored, { playersActive: true }), String(stored)).toEqual({ playersActive: true });
    }
  });

  it("cannot be made to smuggle a name in through the type", () => {
    expect(mergePreferences({}, { nonsense: 1 } as never)).toEqual({});
  });

  it("leaves what it was given untouched", () => {
    const stored = { playersWho: DIRECTORY_WHO.people };
    const patch = { playersWho: null } as const;
    mergePreferences(stored, patch);
    expect(stored).toEqual({ playersWho: DIRECTORY_WHO.people });
    expect(patch).toEqual({ playersWho: null });
  });
});
