import { describe, expect, it } from "vitest";

import { DEFAULT_PREFERENCES } from "@/lib/preferences/preferences.constants";
import { preferencesFrom } from "@/lib/preferences/preferences";

import { DIRECTORY_WHO, NO_FILTER, type DirectoryFilter } from "./directoryFilter";
import {
  SHOW_EVERYBODY_HREF,
  addressSaysFilter,
  filterAsPreferences,
  filterFor,
  rememberedFilter,
} from "./rememberedFilter";

const narrowed: DirectoryFilter = { ...NO_FILTER, who: DIRECTORY_WHO.people, active: true };

/** What the account holds after a filter has been asked for and kept. */
const kept = (filter: DirectoryFilter) => preferencesFrom(filterAsPreferences(filter));

describe("remembering how somebody likes the players page narrowed", () => {
  it("tells an address that asked from one that said nothing", () => {
    // The whole of the difference between "show me everybody" and "I have not
    // said": only the second is where a remembered answer gets to speak.
    expect(addressSaysFilter({})).toBe(false);
    expect(addressSaysFilter({ who: "people" })).toBe(true);
    expect(addressSaysFilter({ settled: "1" })).toBe(true);
    expect(addressSaysFilter({ active: "1" })).toBe(true);
    // Something else entirely on the address is still not a filter.
    expect(addressSaysFilter({ view: "computers" })).toBe(false);
  });

  it("obeys the address over anything remembered", () => {
    expect(filterFor({ who: "computers" }, kept(narrowed)).who).toBe(DIRECTORY_WHO.computers);
  });

  it("falls back to what was last asked for when the address says nothing", () => {
    expect(filterFor({}, kept(narrowed))).toEqual(narrowed);
  });

  it("falls back to the ordinary page when nothing has ever been kept", () => {
    /*
     * The registry's fallbacks ARE the page's defaults, declared once: a
     * member who never chose and a member whose choices could not be read
     * both get the page everybody starts with.
     */
    expect(filterFor({}, DEFAULT_PREFERENCES)).toEqual(NO_FILTER);
    expect(rememberedFilter(preferencesFrom(null))).toEqual(NO_FILTER);
  });

  it("keeps a remembered default as something rather than as nothing", () => {
    // Asking for everyone must REPLACE a remembered People, or the way out of
    // a narrowing is a control that appears to do nothing.
    const patch = filterAsPreferences(NO_FILTER);
    expect(patch.playersWho).toBe(DIRECTORY_WHO.everyone);
    expect(patch.playersSettled).toBe(false);
    expect(patch.playersActive).toBe(false);
  });

  it("survives a value written by a version that offered something this one does not", () => {
    // A `who` this version has never heard of falls back on its own; the
    // "seen lately" the member also asked for is left standing. That is the
    // registry keeping the promise the cookie's reader used to keep.
    const stored = { playersWho: "robots", playersActive: true };
    expect(rememberedFilter(preferencesFrom(stored))).toEqual({ ...NO_FILTER, active: true });
  });

  it("reads back exactly what it wrote, for every combination", () => {
    for (const who of Object.values(DIRECTORY_WHO)) {
      for (const settled of [false, true]) {
        for (const active of [false, true]) {
          const filter = { who, settled, active };
          expect(rememberedFilter(kept(filter)), `${who}/${settled}/${active}`).toEqual(filter);
        }
      }
    }
  });

  it("offers a way back that actually goes back", () => {
    /*
     * THE TRAP THIS FEATURE CREATES. Once a bare /players means "whatever I
     * last asked for", a clear link pointing there would re-apply the very
     * narrowing it claims to remove and appear to do nothing. So the way back
     * says everyone out loud, and is then remembered as everyone.
     */
    expect(SHOW_EVERYBODY_HREF).not.toBe("/players");
    const asked = Object.fromEntries(new URLSearchParams(SHOW_EVERYBODY_HREF.split("?")[1]));
    expect(addressSaysFilter(asked)).toBe(true);
    expect(filterFor(asked, kept(narrowed))).toEqual(NO_FILTER);
    // And what that visit keeps is everyone, so the next bare visit agrees.
    expect(rememberedFilter(kept(filterFor(asked, kept(narrowed))))).toEqual(NO_FILTER);
  });
});
