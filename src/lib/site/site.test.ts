import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_SETTINGS,
  REGISTRATION_MODES,
  SITE_SETTING_COPY,
  SITE_SETTING_KEYS,
  SITE_SETTING_SPECS,
} from "./site.constants";
import {
  acceptSiteSetting,
  isSiteSettingKey,
  maintenanceIsOn,
  mayJoin,
  siteSettingStates,
  siteSettingsFrom,
  valueFor,
} from "./site";

/**
 * The registry, and the one property everything else rests on: an empty table
 * behaves exactly as this site behaved before the table existed.
 */
describe("what the site does when nobody has said anything", () => {
  it("asks for an invite code, which is how the site has always worked", () => {
    expect(siteSettingsFrom([]).registration).toBe("invite-only");
    expect(DEFAULT_SITE_SETTINGS.registration).toBe("invite-only");
  });

  it("puts no line on the door", () => {
    expect(siteSettingsFrom([]).joinNotice).toBe("");
  });

  /*
   * The load-bearing one, said as its own case because it is the whole reason
   * nothing is seeded. A deployment that has never written a setting, a
   * deployment whose table was just created by the migration, and a deployment
   * whose database cannot be read are all the same site.
   */
  it("is the same site whether the table is empty or the rows are unreadable", () => {
    expect(siteSettingsFrom([])).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it("says nobody chose it, so a panel can tell a decision from an absence", () => {
    for (const state of siteSettingStates([])) {
      expect(state.chosen).toBe(false);
      expect(state.updatedAt).toBeNull();
      expect(state.updatedBy).toBe("");
    }
  });
});

describe("reading a stored value", () => {
  it("takes a mode the registry offers", () => {
    expect(siteSettingsFrom([{ key: "registration", value: "open" }]).registration).toBe("open");
    expect(siteSettingsFrom([{ key: "registration", value: "closed" }]).registration).toBe("closed");
  });

  /*
   * The property a registry exists for. A row holding a mode this version has
   * stopped offering must not open the door, must not throw, and must not take
   * the notice down with it.
   */
  it("falls back per setting, leaving the others exactly as they were", () => {
    const settings = siteSettingsFrom([
      { key: "registration", value: "everybody-welcome" },
      { key: "joinNotice", value: "Beta — ask John for a code" },
    ]);
    expect(settings.registration).toBe("invite-only");
    expect(settings.joinNotice).toBe("Beta — ask John for a code");
  });

  it("never reads an unrecognised mode as an open door", () => {
    for (const stored of ["open ", "OPEN", "Open", "opened", "true", "1", "", "yes"]) {
      expect(
        valueFor("registration", stored),
        `"${stored}" must not open the door`,
      ).toBe("invite-only");
    }
  });

  it("ignores a key the registry does not declare", () => {
    const settings = siteSettingsFrom([
      { key: "registration", value: "open" },
      { key: "somethingABranchAdded", value: "whatever" },
    ]);
    expect(settings).toEqual({ ...DEFAULT_SITE_SETTINGS, registration: "open" });
    expect(siteSettingStates([{ key: "somethingABranchAdded", value: "x" }]).every(
      (state) => !state.chosen,
    )).toBe(true);
  });

  it("reads a note longer than the registry allows as nothing, rather than showing it cut in half", () => {
    const tooLong = "x".repeat(SITE_SETTING_SPECS.joinNotice.maxLength + 1);
    expect(valueFor("joinNotice", tooLong)).toBe("");
    expect(valueFor("joinNotice", "x".repeat(SITE_SETTING_SPECS.joinNotice.maxLength))).toHaveLength(
      SITE_SETTING_SPECS.joinNotice.maxLength,
    );
  });

  it("says who wrote a setting and when, once somebody has", () => {
    const [registration] = siteSettingStates([
      {
        key: "registration",
        value: "open",
        updatedAt: new Date("2026-09-12T10:00:00Z"),
        updatedBy: "john@spxis.com",
      },
    ]);
    expect(registration.chosen).toBe(true);
    expect(registration.updatedBy).toBe("john@spxis.com");
    expect(registration.updatedAt).toBe("2026-09-12T10:00:00.000Z");
  });
});

describe("writing a setting", () => {
  it("takes every mode the registry offers", () => {
    for (const mode of REGISTRATION_MODES) {
      expect(acceptSiteSetting("registration", mode)).toEqual({
        ok: true,
        key: "registration",
        value: mode,
      });
    }
  });

  /*
   * Refused rather than cleaned, which is the asymmetry with reading. On the
   * control that decides who may enter the site, a write that quietly did
   * something other than what was asked is the worst outcome available:
   * believing the door is shut when it is open.
   */
  it("refuses a key the registry does not know, and names it", () => {
    const answer = acceptSiteSetting("maintenance", "on");
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.problem).toContain("maintenance");
  });

  it("refuses a mode this site does not offer", () => {
    for (const value of ["approval", "OPEN", "open ", "", "invite_only"]) {
      expect(acceptSiteSetting("registration", value).ok, `"${value}" must be refused`).toBe(false);
    }
  });

  it("refuses anything that is not a string, since a scalar is all a row holds", () => {
    for (const value of [1, true, {}, [], ["open"]]) {
      expect(acceptSiteSetting("registration", value).ok).toBe(false);
    }
  });

  it("refuses a note past its length, and says how long it was", () => {
    const answer = acceptSiteSetting(
      "joinNotice",
      "x".repeat(SITE_SETTING_SPECS.joinNotice.maxLength + 5),
    );
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.problem).toContain(String(SITE_SETTING_SPECS.joinNotice.maxLength));
  });

  it("forgets a setting on null, rather than pinning it to today's default", () => {
    expect(acceptSiteSetting("registration", null)).toEqual({
      ok: true,
      key: "registration",
      value: null,
    });
  });

  /*
   * An emptied field is a forgotten one. Keeping a row holding "" would say
   * somebody chose blankness — a judgement nobody made, written onto a row and
   * from then on indistinguishable from a real one.
   */
  it("treats an emptied note as forgotten rather than as a stored blank", () => {
    for (const value of ["", "   ", "\n\t "]) {
      expect(acceptSiteSetting("joinNotice", value)).toEqual({
        ok: true,
        key: "joinNotice",
        value: null,
      });
    }
  });

  it("trims a note, so a stray space is not stored as copy", () => {
    expect(acceptSiteSetting("joinNotice", "  Open to all this weekend  ")).toEqual({
      ok: true,
      key: "joinNotice",
      value: "Open to all this weekend",
    });
  });

  it("knows its own keys and nothing else", () => {
    for (const key of SITE_SETTING_KEYS) expect(isSiteSettingKey(key)).toBe(true);
    // `Object.hasOwn` rather than `in`, so nothing reaches a setting by
    // prototype: every object has a toString.
    for (const key of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      expect(isSiteSettingKey(key), `${key} is not a setting`).toBe(false);
    }
  });
});

/**
 * The door's one predicate. Every mode against both doors, written out, because
 * the matrix is six answers and a mode that meant different things at the two
 * doors would be a mode nobody could describe.
 */
describe("whether a stranger may join", () => {
  it("asks for a code under invite-only, and takes one", () => {
    expect(mayJoin("invite-only", true)).toBe(true);
    expect(mayJoin("invite-only", false)).toBe(false);
  });

  it("needs nothing when the door is open", () => {
    expect(mayJoin("open", true)).toBe(true);
    expect(mayJoin("open", false)).toBe(true);
  });

  it("takes nobody new when it is closed, code or no code", () => {
    expect(mayJoin("closed", true)).toBe(false);
    expect(mayJoin("closed", false)).toBe(false);
  });

  it("has an answer for every mode the registry offers", () => {
    for (const mode of REGISTRATION_MODES) {
      for (const withCode of [true, false]) {
        expect(typeof mayJoin(mode, withCode)).toBe("boolean");
      }
    }
  });
});

/**
 * The shutter's one question, which the gate asks on every request.
 *
 * NAMED RATHER THAN NEGATED, the way `isUnprotectedEnvironment` is. The
 * dangerous direction here is a site shut by a value nobody meant as a shutter:
 * the site is then unreachable, and the reason is a string comparison nobody can
 * see from outside.
 */
describe("whether the site says it is being worked on", () => {
  it("is shut by the word, however it was pasted", () => {
    for (const value of ["on", "ON", "On", " on ", "\ton\n"]) {
      expect(maintenanceIsOn(value), `"${value}" means shut`).toBe(true);
    }
  });

  it("is up for anything else, including nothing at all", () => {
    for (const value of [undefined, "", "off", "OFF", "true", "1", "yes", "no", "onn", "o n"]) {
      expect(maintenanceIsOn(value), `${JSON.stringify(value)} means up`).toBe(false);
    }
  });
});

/**
 * The gate the registry itself has to pass. These are the invariants the types
 * cannot express, in the same spirit as `variants.coverage.test.ts`: a setting
 * with no copy has no control, and a control with no copy invents its own
 * labels.
 */
describe("the registry is complete", () => {
  it("gives every choice a fallback that is one of its own options", () => {
    for (const key of SITE_SETTING_KEYS) {
      const spec = SITE_SETTING_SPECS[key];
      if (spec.kind !== "choice") continue;
      expect(spec.options, `${key}'s fallback must be one of its options`).toContain(spec.fallback);
    }
  });

  it("gives every setting a label, a kanji and a sentence", () => {
    for (const key of SITE_SETTING_KEYS) {
      const copy = SITE_SETTING_COPY[key];
      expect(copy, `${key} has no copy`).toBeDefined();
      expect(copy.label.length, `${key} has no label`).toBeGreaterThan(0);
      expect(copy.kanji.length, `${key} has no kanji`).toBeGreaterThan(0);
      expect(copy.blurb.length, `${key} needs a sentence saying what it is`).toBeGreaterThan(20);
    }
  });

  it("gives every option a label and a sentence of its own", () => {
    for (const key of SITE_SETTING_KEYS) {
      const spec = SITE_SETTING_SPECS[key];
      if (spec.kind !== "choice") continue;
      for (const option of spec.options) {
        const words = SITE_SETTING_COPY[key].options[option];
        expect(words, `${key}/${option} has no copy`).toBeDefined();
        expect(words.label.length, `${key}/${option} has no label`).toBeGreaterThan(0);
        expect(words.blurb.length, `${key}/${option} needs a sentence`).toBeGreaterThan(20);
      }
    }
  });

  /*
   * Every move AWAY from the default asks first. The default is how the site
   * already behaves, so choosing it back is not a change anybody needs warning
   * about; everything else changes who can get into somebody's site, and the
   * panel must say so in a sentence before it happens rather than after.
   */
  it("asks before any option that is not the way the site already behaves", () => {
    for (const key of SITE_SETTING_KEYS) {
      const spec = SITE_SETTING_SPECS[key];
      if (spec.kind !== "choice") continue;
      for (const option of spec.options) {
        if (option === spec.fallback) continue;
        const words = SITE_SETTING_COPY[key].options[option];
        expect(
          words.confirm,
          `${key}/${option} changes who can get in and must ask first`,
        ).toBeDefined();
        expect(words.confirm?.length ?? 0).toBeGreaterThan(40);
      }
    }
  });

  it("keeps a note's copy to a placeholder, since it has no options to label", () => {
    for (const key of SITE_SETTING_KEYS) {
      const spec = SITE_SETTING_SPECS[key];
      if (spec.kind !== "note") continue;
      expect(Object.keys(SITE_SETTING_COPY[key].options)).toHaveLength(0);
      expect(SITE_SETTING_COPY[key].placeholder?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
