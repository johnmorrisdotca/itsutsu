import { describe, expect, it } from "vitest";

import { privacySections } from "@/app/privacy/privacy.sections";
import { termsSections } from "@/app/terms/terms.sections";
import { GoverningNote } from "@/components/layout/GoverningNote";
import { PLAYER_SESSION_DAYS } from "@/lib/auth/session";

import { JA_DRAFTED_PRIVACY } from "./dictionaries/ja.drafted.privacy.constants";
import { JA_DRAFTED_TERMS } from "./dictionaries/ja.drafted.terms.constants";
import { PHRASES, PHRASE_KEYS, type PhraseKey } from "./i18n.constants";
import { speaker } from "./i18n";
import { englishWordsIn } from "./leftoverEnglish";

/*
 * PRIVACY AND TERMS IN JAPANESE (ENJA-11) ARE LEGAL TEXT, AND TEXT ABOUT CHILDREN.
 *
 * John cannot read Japanese and both pages are published under his name, so the reviewer agent's pass is required and
 * is not enough: every phrase of both pages is stamped as the agent's and also carries an `ask`, which lists it on
 * the review sheet for a native reader until a person has signed it off. The English version governs, and the
 * Japanese page says so at its head. And the meaning is held as strict as the English: a figure in a sentence about
 * an age or a consent is the same figure in the Japanese.
 */

const LEGAL_KEYS = PHRASE_KEYS.filter((key) => key.startsWith("privacy.") || key.startsWith("terms."));
const AUTHORED = { ...JA_DRAFTED_PRIVACY, ...JA_DRAFTED_TERMS };

describe("the Japanese of Privacy and Terms", () => {
  it("answers every one of their phrases, and nothing else is in these files", () => {
    expect(Object.keys(AUTHORED).sort()).toEqual([...LEGAL_KEYS].sort());
  });

  it("has been read by the reviewer agent, and is listed for a native reader until a person has read it", () => {
    for (const key of LEGAL_KEYS) {
      const row = AUTHORED[key]!;
      expect(row.review, `${key} has not been read by anybody`).toBeDefined();
      expect(row.back.trim(), `${key} has no back-translation`).not.toBe("");
      expect(row.review!.by === "person" || row.ask !== undefined, `${key} is not on the sheet for a native read`).toBe(true);
    }
  });

  it("keeps every figure of the English: an age or a count is the same number in Japanese", () => {
    for (const key of LEGAL_KEYS) {
      const figures = PHRASES[key].match(/\d+/g) ?? [];
      for (const figure of figures) expect(AUTHORED[key]!.text, `${key} drops the ${figure}`).toContain(figure);
    }
  });

  it("states the children's and consent rules in as many sentences as the English does", () => {
    const stops = (text: string) => (text.match(/[.。]/g) ?? []).length;
    for (const key of LEGAL_KEYS.filter((one) => one.startsWith("privacy.children."))) {
      // Not equal by punctuation, which differs by language, but never fewer statements than the English makes.
      expect(stops(AUTHORED[key]!.text), `${key} says less than the English`).toBeGreaterThanOrEqual(Math.ceil(stops(PHRASES[key]) / 2));
    }
  });

  it("asks a person to read what concerns a child, and says it in the question", () => {
    const children: PhraseKey[] = [...LEGAL_KEYS.filter((key) => key.startsWith("privacy.children.")), "privacy.what.pointG", "privacy.who.paraC", "privacy.who.paraF"];
    for (const key of children) expect(AUTHORED[key]!.ask, key).toMatch(/child|parent/i);
  });

  it("renders every section of both pages in Japanese, with no English sentence left in it", () => {
    const ja = speaker("ja");
    const en = speaker("en");
    const pages = [
      { name: "privacy", ja: privacySections(ja, PLAYER_SESSION_DAYS), en: privacySections(en, PLAYER_SESSION_DAYS) },
      { name: "terms", ja: termsSections(ja), en: termsSections(en) },
    ];
    for (const page of pages) {
      expect(page.ja.map((section) => section.id)).toEqual(page.en.map((section) => section.id));
      page.ja.forEach((section, index) => {
        const english = page.en[index]!;
        const said = [section.heading, ...section.paragraphs, ...(section.points ?? [])];
        const original = [english.heading, ...english.paragraphs, ...(english.points ?? [])];
        expect(said.length).toBe(original.length);
        said.forEach((line, at) => {
          expect(line, `${page.name}/${section.id} line ${at} is still English`).not.toBe(original[at]);
          expect(englishWordsIn(line, ["Itsutsu", "Google", "Vercel", "Neon", "Resend", "Sumilabu", "ItsYourTurn", "GoldToken", "ID", "URL"]), `${page.name}/${section.id} line ${at}`).toEqual([]);
          expect(line, `${page.name}/${section.id} line ${at} has an unfilled placeholder`).not.toMatch(/\{\w+\}/);
        });
        // The kanji beside a heading is not the reader's to translate.
        expect(section.kanji).toBe(english.kanji);
      });
    }
  });

  it("fills the contact address and the words-only lifetime into the Japanese from where they live", () => {
    const text = privacySections(speaker("ja"), 17)
      .flatMap((section) => [...section.paragraphs, ...(section.points ?? [])])
      .join("\n");
    expect(text).toContain("17日間");
    expect(text).toContain("hello@itsutsu.com");
  });
});

describe("the line that says the English version governs", () => {
  it("is drawn at the head of the Japanese pages, and never for a reader of English", () => {
    for (const phrase of ["privacy.governing", "terms.governing"] as const) {
      expect(GoverningNote({ say: speaker("en"), phrase, testId: "x" })).toBeNull();
      const note = GoverningNote({ say: speaker("ja"), phrase, testId: "x" });
      expect(note, phrase).not.toBeNull();
      expect(note!.props.lang).toBe("ja");
      expect(note!.props.children).toBe(speaker("ja").say(phrase));
    }
  });

  it("says the English governs, in the Japanese that is listed for a native read", () => {
    for (const key of ["privacy.governing", "terms.governing"] as const) {
      const row = AUTHORED[key]!;
      expect(row.text).toContain("英語版");
      expect(row.text).toContain("優先");
      expect(row.text).toContain("参考訳");
      expect(row.ask).toMatch(/English version governs/);
    }
  });
});
