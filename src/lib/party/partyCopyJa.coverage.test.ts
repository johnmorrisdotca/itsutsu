import { describe, expect, it } from "vitest";

import { CASUAL_DISPLAY, CASUAL_KIND_LIST } from "@/lib/casual/casual.constants";
import { casualRulesPage } from "@/lib/casual/casualRulesPage";
import { looksLikeEnglish } from "../../../scripts/check-i18n-strings.mjs";
import { overlayLines } from "@/lib/i18n/copyTable";
import { orphaned, problemsWith, unanswered } from "@/lib/i18n/copyTableAudit";
import { PARTY_COPY_JA } from "@/lib/i18n/dictionaries/party.ja.constants";
import { speaker } from "@/lib/i18n/i18n";
import { casualCopy, partyCopy } from "./partyCopy";
import { PARTY_DISPLAY, PARTY_KIND_LIST } from "./party.constants";
import { partyRulesPage } from "./partyRulesPage";

/**
 * EVERY PARTY, CARD AND CASUAL GAME'S OWN WORDS, IN JAPANESE (ENJA-08): its tagline, origin, a line for each rule
 * bullet and the board's advice, each with an English back-translation and the day the reviewer agent read it. A
 * game's name is its kanji (the English row has one), so it is not translated here, and a rules page for a reader of
 * Japanese is Japanese all the way down: no sentence of it is English.
 */
const KINDS = [...PARTY_KIND_LIST, ...CASUAL_KIND_LIST] as const;
const JAPANESE = /[ぁ-ヿ一-鿿]/;

const english = (kind: (typeof KINDS)[number]) => (CASUAL_KIND_LIST.includes(kind as never) ? CASUAL_DISPLAY[kind as keyof typeof CASUAL_DISPLAY] : PARTY_DISPLAY[kind as keyof typeof PARTY_DISPLAY]);

describe("every party, card and casual game speaks Japanese", () => {
  it("has Japanese for exactly the games there are", () => {
    expect(Object.keys(PARTY_COPY_JA).sort()).toEqual([...KINDS].sort());
  });

  it.each(KINDS)("%s: every sentence has its Japanese, and no line answers nothing", (kind) => {
    const ja = Object.fromEntries(Object.entries(PARTY_COPY_JA[kind]).filter(([key]) => key !== "review" && key !== "ask")) as Record<string, unknown> & { rules?: readonly unknown[] };
    // The names and codes of a game are not sentences: another name for it, the page it is named after, the game it is inspired by.
    expect(unanswered(english(kind), ja as never, { skip: (path) => path.startsWith("alsoKnownAs") || path === "inspiredBy" || path === "wikipedia" })).toEqual([]);
    expect(orphaned(english(kind), ja)).toEqual([]);
    expect(ja.rules?.length, "a line for each rule bullet").toBe(english(kind).rules.length);
  });

  it.each(KINDS)("%s: every line is Japanese with a back-translation, and was read", (kind) => {
    const ja = PARTY_COPY_JA[kind];
    for (const { path, line } of overlayLines(ja)) expect(problemsWith(line), `${kind} ${path}`).toEqual([]);
    expect(ja.review, kind).toMatchObject({ by: "agent" });
    expect(ja.review.on, kind).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("keeps the English for a reader of English", () => {
    for (const kind of PARTY_KIND_LIST) expect(partyCopy(kind, "en").tagline).toBe(english(kind).tagline);
    for (const kind of CASUAL_KIND_LIST) expect(casualCopy(kind, "en").tagline).toBe(english(kind).tagline);
  });

  it.each(PARTY_KIND_LIST)("%s: a rules page for a reader of Japanese is Japanese", (kind) => {
    const ja = partyRulesPage(kind, speaker("ja"));
    for (const [where, text] of [["tagline", ja.tagline], ["origin", ja.origin], ...[...ja.object, ...ja.board, ...ja.play, ...ja.house].map((one, at) => [`line ${at}`, one] as const)]) {
      expect(JAPANESE.test(text), `${kind} ${where}: ${text.slice(0, 50)}`).toBe(true);
    }
    expect(looksLikeEnglish(partyRulesPage(kind, speaker("en")).tagline)).toBe(true);
  });

  it.each(CASUAL_KIND_LIST)("%s: its rules page speaks the reader's language", (kind) => {
    const ja = casualRulesPage(kind, speaker("ja"));
    for (const text of [ja.tagline, ja.origin, ...ja.object, ...ja.board, ...ja.play, ...ja.house]) expect(JAPANESE.test(text), `${kind}: ${text.slice(0, 50)}`).toBe(true);
    const en = casualRulesPage(kind, speaker("en"));
    expect(en.house.length).toBe(ja.house.length);
    for (const text of en.house) expect(JAPANESE.test(text)).toBe(false);
  });
});
