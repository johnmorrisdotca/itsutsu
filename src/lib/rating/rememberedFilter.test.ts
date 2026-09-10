import { describe, expect, it } from "vitest";

import { DIRECTORY_WHO, NO_FILTER } from "./directoryFilter";
import {
  SHOW_EVERYBODY_HREF,
  addressSaysFilter,
  filterFor,
  filterFromRemembered,
  rememberedValue,
} from "./rememberedFilter";

const narrowed = { ...NO_FILTER, who: DIRECTORY_WHO.people, active: true };

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
    expect(filterFor({ who: "computers" }, rememberedValue(narrowed)).who).toBe(DIRECTORY_WHO.computers);
  });

  it("falls back to what was last asked for when the address says nothing", () => {
    expect(filterFor({}, rememberedValue(narrowed))).toEqual(narrowed);
  });

  it("falls back to the default when nothing has been asked for at all", () => {
    expect(filterFor({}, undefined)).toEqual(NO_FILTER);
    expect(filterFor({}, "")).toEqual(NO_FILTER);
  });

  it("keeps a remembered default as something rather than as nothing", () => {
    /*
     * The empty string has to go on meaning "no preference", so a remembered
     * default must still be a value. Otherwise wanting everybody would be
     * indistinguishable from never having said, and the two behave differently
     * the moment anything else is remembered.
     */
    expect(rememberedValue(NO_FILTER)).not.toBe("");
    expect(filterFromRemembered(rememberedValue(NO_FILTER))).toEqual(NO_FILTER);
  });

  it("survives a value written by a version that offered something this one does not", () => {
    // Read through the same reader the address uses, so nonsense falls back
    // rather than narrowing somebody's page to nothing.
    expect(filterFromRemembered("who=robots")).toEqual({ ...NO_FILTER, who: NO_FILTER.who });
    expect(filterFromRemembered("nonsense")).toBeNull();
    expect(filterFromRemembered("   ")).toBeNull();
  });

  it("reads back exactly what it wrote, for every combination", () => {
    for (const who of Object.values(DIRECTORY_WHO)) {
      for (const settled of [false, true]) {
        for (const active of [false, true]) {
          const filter = { who, settled, active };
          expect(filterFromRemembered(rememberedValue(filter)), `${who}/${settled}/${active}`).toEqual(filter);
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
    expect(filterFor(asked, rememberedValue(narrowed))).toEqual(NO_FILTER);
  });
});
