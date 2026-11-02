import { describe, expect, it } from "vitest";

import { speaker } from "@/lib/i18n/i18n";

import { inReadersLanguage } from "./guestName";
import { shownName } from "./shownName";

describe("a member who has not chosen a name", () => {
  it("is shown as Guest to a reader of English, and ゲスト to a reader of Japanese", () => {
    const shown = shownName("Guest 4F2K");
    expect(shown).toBe("Guest 4.");
    expect(inReadersLanguage(shown, speaker("en"))).toBe("Guest 4.");
    expect(inReadersLanguage(shown, speaker("ja"))).toBe("ゲスト 4.");
    expect(inReadersLanguage("Guest 4F2K", speaker("ja"))).toBe("ゲスト 4F2K");
  });

  it("leaves every other name as it is, even one that begins with the word", () => {
    for (const name of ["Hanako M.", "Guestimate", "Guest Star", "Kenji"]) expect(inReadersLanguage(name, speaker("ja"))).toBe(name);
  });
});
