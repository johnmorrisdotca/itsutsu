import { describe, expect, it } from "vitest";

import { DEFAULT_PREFERENCES } from "@/lib/preferences/preferences.constants";
import { preferencesFrom } from "@/lib/preferences/preferences";

import { DIRECTORY_WHO, NO_FILTER, type DirectoryFilter } from "./directoryFilter";
import {
  SHOW_EVERYBODY_HREF,
  addressSaysFilter,
  addressSaysWho,
  filterAsPreferences,
  filterFor,
  rememberedFilter,
  whoFromMemory,
} from "./rememberedFilter";

/** Everything the bar can switch on at once. */
const narrowed: DirectoryFilter = { who: DIRECTORY_WHO.people, settled: true, active: true };

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

  it("obeys the address over anything remembered, switches included", () => {
    expect(filterFor({ who: "computers" }, kept(narrowed)).who).toBe(DIRECTORY_WHO.computers);
    expect(filterFor({ who: "people", settled: "1", active: "1" }, DEFAULT_PREFERENCES)).toEqual(narrowed);
  });

  it("opens with the kind of player last chosen, and never with a switch left on", () => {
    /*
     * JOHN'S PAGE AT 0.187.3. "Settled ratings" and "Seen lately" had been
     * pressed on some earlier visit, were kept on his account, and a bare
     * /players opened with both on: "0 of 11 listed" over empty headings, and
     * "no player standings". Either switch alone can empty the list on a site
     * this size, so neither is kept; who is.
     */
    expect(filterFor({}, kept(narrowed))).toEqual({ ...NO_FILTER, who: DIRECTORY_WHO.people });
  });

  it("does not reopen a switch an account kept before switches stopped being kept", () => {
    // John's column as it stands on production, written by 0.187.3 and earlier.
    const stored = { playersWho: DIRECTORY_WHO.everyone, playersSettled: true, playersActive: true };
    expect(filterFor({}, preferencesFrom(stored))).toEqual(NO_FILTER);
  });

  it("keeps who and nothing else", () => {
    expect(filterAsPreferences(narrowed)).toEqual({ playersWho: DIRECTORY_WHO.people });
  });

  it("remembers only an address that names who", () => {
    // A hand-typed ?settled=1 is obeyed and says nothing about the kind of
    // player this reader likes, so it must not overwrite that.
    expect(addressSaysWho({ who: "people" })).toBe(true);
    expect(addressSaysWho({ settled: "1", active: "1" })).toBe(false);
    expect(addressSaysWho({})).toBe(false);
  });

  it("falls back to the ordinary page when nothing has ever been kept", () => {
    expect(filterFor({}, DEFAULT_PREFERENCES)).toEqual(NO_FILTER);
    expect(rememberedFilter(preferencesFrom(null))).toEqual(NO_FILTER);
  });

  it("keeps a remembered Everyone as something rather than as nothing", () => {
    // Asking for everyone must REPLACE a remembered People, or the way out of
    // a narrowing is a control that appears to do nothing.
    expect(filterAsPreferences(NO_FILTER)).toEqual({ playersWho: DIRECTORY_WHO.everyone });
  });

  it("survives a who written by a version that offered something this one does not", () => {
    expect(rememberedFilter(preferencesFrom({ playersWho: "robots" }))).toEqual(NO_FILTER);
  });

  it("reads back exactly the who it wrote, whatever the switches were", () => {
    for (const who of Object.values(DIRECTORY_WHO)) {
      for (const settled of [false, true]) {
        for (const active of [false, true]) {
          expect(rememberedFilter(kept({ who, settled, active })), `${who}/${settled}/${active}`).toEqual({
            ...NO_FILTER,
            who,
          });
        }
      }
    }
  });

  it("says when the kind of player shown came from memory, so the page can say so", () => {
    expect(whoFromMemory({}, kept(narrowed))).toBe(DIRECTORY_WHO.people);
    expect(whoFromMemory({}, kept({ ...NO_FILTER, who: DIRECTORY_WHO.computers }))).toBe(DIRECTORY_WHO.computers);
    // The address said it: nothing was remembered about this page.
    expect(whoFromMemory({ who: "people" }, kept(narrowed))).toBeNull();
    expect(whoFromMemory({ settled: "1" }, kept(narrowed))).toBeNull();
    // Everyone is not a narrowing, remembered or not.
    expect(whoFromMemory({}, kept(NO_FILTER))).toBeNull();
    expect(whoFromMemory({}, DEFAULT_PREFERENCES)).toBeNull();
  });

  it("offers a way back that actually goes back", () => {
    expect(SHOW_EVERYBODY_HREF).not.toBe("/players");
    const asked = Object.fromEntries(new URLSearchParams(SHOW_EVERYBODY_HREF.split("?")[1]));
    expect(addressSaysWho(asked)).toBe(true);
    expect(filterFor(asked, kept(narrowed))).toEqual(NO_FILTER);
    // And what that visit keeps is everyone, so the next bare visit agrees.
    expect(rememberedFilter(kept(filterFor(asked, kept(narrowed))))).toEqual(NO_FILTER);
  });
});
