import { describe, expect, it } from "vitest";

import { keptRecordTail } from "./LegacyRecord";

/*
 * Chibi and Kyokosan share one real, finished Itsutsu game — freestyle, 37
 * moves, 2026-09-08, id cmtsqwy3i0000jr04pvpajq7i — found by name because
 * neither seat has a memberId. `keptRecordTail` is the sentence their pages
 * show under their name, and it used to say "Never played on Itsutsu"
 * unconditionally: true of every OTHER kept record, false of these two.
 */
describe("keptRecordTail", () => {
  it("says a remembered player never played here, when they never did", () => {
    expect(keptRecordTail("remembered", 0)).toBe(
      "Never played on Itsutsu — this record is kept, not earned here.",
    );
  });

  it("does not say Chibi never played here — one finished game says otherwise", () => {
    const tail = keptRecordTail("remembered", 1);
    expect(tail).not.toContain("Never played");
    expect(tail).toMatch(/before Itsutsu/);
  });

  it("says an honorary member never played here, when they never did", () => {
    expect(keptRecordTail("honorary", 0)).toBe(
      "Never played on Itsutsu — kept here as an honorary member, in her own right.",
    );
  });

  it("does not say Kyokosan never played here either", () => {
    const tail = keptRecordTail("honorary", 1);
    expect(tail).not.toContain("Never played");
    expect(tail).toMatch(/honorary member/);
  });

  it("still leads with the honest, unconditional fact: kept from before Itsutsu", () => {
    // Whatever the count, the record's origin is not in question — only
    // whether the same name has ALSO played a real game here.
    for (const games of [0, 1, 2, 7]) {
      expect(keptRecordTail("remembered", games)).toMatch(/Itsutsu/);
      expect(keptRecordTail("honorary", games)).toMatch(/Itsutsu/);
    }
  });
});
