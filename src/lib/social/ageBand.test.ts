import { describe, expect, it } from "vitest";

import { ageBandLabel, consentDecision, isAgeBand, needsConsent } from "./ageBand";
import { AGE_BANDS, AGE_BAND_LIST, AGE_BAND_PROBLEMS, PARENT_RELATIONSHIPS } from "./ageBand.constants";

describe("the age bands", () => {
  it("are the three UmaKuma uses, youngest first, and nothing else is one", () => {
    expect([...AGE_BAND_LIST]).toEqual(["under_13", "13_17", "18_plus"]);
    for (const band of AGE_BAND_LIST) expect(isAgeBand(band)).toBe(true);
    for (const not of [null, undefined, "", "child", "adult", "under13", 13]) expect(isAgeBand(not)).toBe(false);
  });

  it("need a parent only under 13, and never for a member who has not said", () => {
    expect(needsConsent(AGE_BANDS.under13)).toBe(true);
    expect(needsConsent(AGE_BANDS.teen)).toBe(false);
    expect(needsConsent(AGE_BANDS.adult)).toBe(false);
    expect(needsConsent(null)).toBe(false);
    expect(needsConsent(undefined)).toBe(false);
  });

  it("have a label and kanji each, and a member never asked has none", () => {
    for (const band of AGE_BAND_LIST) {
      const shown = ageBandLabel(band);
      expect(shown?.label.trim()).not.toBe("");
      expect(shown?.kanji.trim()).not.toBe("");
    }
    expect(ageBandLabel(null)).toBeNull();
    expect(ageBandLabel("adult")).toBeNull();
  });
});

describe("the consent decision", () => {
  const offer = { name: "  Pat   Example ", relationship: PARENT_RELATIONSHIPS.guardian, agreed: true };

  it("records nothing for a teen or an adult, and refuses a consent offered for one", () => {
    expect(consentDecision(AGE_BANDS.teen, null)).toEqual({ ok: true, consent: null });
    expect(consentDecision(AGE_BANDS.adult, null)).toEqual({ ok: true, consent: null });
    expect(consentDecision(AGE_BANDS.adult, offer)).toEqual({
      ok: false,
      needsParent: false,
      problem: AGE_BAND_PROBLEMS.notForBand,
    });
  });

  it("asks for a parent under 13 when nothing was offered, and says which form to open", () => {
    expect(consentDecision(AGE_BANDS.under13, null)).toEqual({
      ok: false,
      needsParent: true,
      problem: AGE_BAND_PROBLEMS.needsParent,
    });
  });

  it("wants a name, one of the two relationships, and agreement, in that order", () => {
    expect(consentDecision(AGE_BANDS.under13, { ...offer, name: "   " })).toMatchObject({
      ok: false,
      problem: AGE_BAND_PROBLEMS.noName,
    });
    expect(consentDecision(AGE_BANDS.under13, { ...offer, relationship: "uncle" })).toMatchObject({
      ok: false,
      problem: AGE_BAND_PROBLEMS.relationship,
    });
    expect(consentDecision(AGE_BANDS.under13, { ...offer, agreed: false })).toMatchObject({
      ok: false,
      problem: AGE_BAND_PROBLEMS.agree,
    });
  });

  it("keeps the name as given, with its spaces tidied, and the relationship", () => {
    expect(consentDecision(AGE_BANDS.under13, offer)).toEqual({
      ok: true,
      consent: { name: "Pat Example", relationship: "guardian" },
    });
  });

  it("cuts a name to the column, never refuses it for length", () => {
    const long = "x".repeat(500);
    const decided = consentDecision(AGE_BANDS.under13, { ...offer, name: long });
    expect(decided.ok).toBe(true);
    if (decided.ok) expect(decided.consent?.name.length).toBe(120);
  });

  it("needs no second parent when one is already on file", () => {
    expect(consentDecision(AGE_BANDS.under13, null, true)).toEqual({ ok: true, consent: null });
  });
});
