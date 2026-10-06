import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { JA_DRAFTED } from "./dictionaries/ja.drafted.constants";
import { JA_ALREADY_SAID } from "./dictionaries/ja.site.constants";
import { placeholdersIn } from "./i18n";
import { PHRASES, PHRASE_KEYS } from "./i18n.constants";
import { awaitsPerson, japaneseReview } from "./japaneseReview";
import { renderedSource, withoutComments } from "./rendered";

/**
 * The Japanese gate.
 *
 * The site's owner does not read Japanese, and Japanese is the site's own
 * voice and his family's. That makes one distinction load-bearing above every
 * other check here: **which of these words are his, and which did a machine
 * write?** His are already published, already read, and carry no risk. A
 * machine's are text he would be putting out in a language he cannot check.
 *
 * So the two live in separate files and this refuses to let them blur — a key
 * claimed by both, or by neither, fails the build. And because the only way
 * he can act on the risky half is to hand somebody a page, the review sheet is
 * generated from the same modules the site renders from and checked here, so
 * the page he hands over is the text that actually ships rather than a copy of
 * it that somebody was supposed to keep current.
 *
 * Regenerate with: `WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n`
 */

const REVIEW_FILE = "docs/japanese-review.md";

/**
 * What a reader could actually be shown — the site's source with its comments
 * taken out. It lives in `rendered.ts` now, because the phrase-key gate in
 * `i18n.coverage.test.ts` needed exactly the same thing and did not have it:
 * it read the raw source and could be satisfied by a key named in a comment.
 * The tests below are still here, because this is the file whose argument
 * depends on it.
 */
const RENDERED_SOURCE = renderedSource();

describe("the comment stripper the gate below leans on", () => {
  it("takes out both kinds of comment", () => {
    expect(withoutComments("a // 遊ぶ\nb")).toBe("a \nb");
    expect(withoutComments("a /* 遊ぶ */ b")).toBe("a  b");
  });

  /*
   * The case that matters: a word must not count as published because
   * somebody wrote it into a note about having removed it.
   */
  it("does not count a kanji that survives only in prose about it", () => {
    expect(withoutComments('/* Play carried 遊ぶ once */\nconst x = "Play";')).not.toContain("遊ぶ");
  });

  it("keeps the strings the kanji actually lives in", () => {
    expect(withoutComments('const k = "管理"; // gone')).toContain("管理");
    expect(withoutComments('<span>管理</span>')).toContain("管理");
  });

  /* A `//` inside a string is not a comment, and a URL must not eat the line. */
  it("does not let a slash inside a string start a comment", () => {
    expect(withoutComments('const u = "https://example.com"; const k = "規則";')).toContain("規則");
  });
});

describe("the two kinds of Japanese stay apart", () => {
  it("gives every phrase exactly one of the two, never both", () => {
    const both = PHRASE_KEYS.filter(
      (key) => JA_DRAFTED[key] !== undefined && JA_ALREADY_SAID[key] !== undefined,
    );
    expect(both, "a phrase cannot be both John's own word and a machine's").toEqual([]);
  });

  it("leaves no phrase without Japanese at all", () => {
    const neither = PHRASE_KEYS.filter(
      (key) => JA_DRAFTED[key] === undefined && JA_ALREADY_SAID[key] === undefined,
    );
    expect(neither, "these phrases have no Japanese in either file").toEqual([]);
  });
});

describe("Japanese that claims to be already on the site", () => {
  const already = PHRASE_KEYS.filter((key) => JA_ALREADY_SAID[key] !== undefined);

  it("says where it already appears", () => {
    for (const key of already) {
      expect(JA_ALREADY_SAID[key]?.where.trim(), `${key} does not say where`).not.toBe("");
    }
  });

  /*
   * The claim checked rather than trusted, the way the release history is
   * parsed from the real changelog rather than copied.
   *
   * WHEN THIS FAILS: the site has stopped showing that word somewhere, so it
   * is no longer "already there" — it has quietly become a translation. Move
   * the entry to `ja.drafted.constants.ts`, with a back-translation, so it
   * joins the text somebody still has to read. Do not delete the check, and do
   * not satisfy it by writing the word into a comment: comments are stripped
   * first, precisely so that cannot work.
   */
  it("is genuinely rendered somewhere else, not just mentioned in a comment", () => {
    for (const key of already) {
      const word = JA_ALREADY_SAID[key]?.text ?? "";
      expect(
        RENDERED_SOURCE.includes(word),
        `${key}: "${word}" is not rendered anywhere else in src/ — only, at most, in a comment`,
      ).toBe(true);
    }
  });
});

describe("Japanese a machine wrote", () => {
  const drafted = PHRASE_KEYS.filter((key) => JA_DRAFTED[key] !== undefined);

  /*
   * The back-translation is the whole mechanism by which somebody who cannot
   * read Japanese can still tell whether the Japanese says the right thing.
   * A drafted phrase without one is unreviewable by the only person who has
   * to approve it.
   */
  it("says what it means back in English", () => {
    for (const key of drafted) {
      expect(JA_DRAFTED[key]?.back.trim(), `${key} has no back-translation`).not.toBe("");
    }
  });

  it("keeps every name the English sentence was going to fill in", () => {
    for (const key of drafted) {
      const wanted = [...placeholdersIn(PHRASES[key])].sort();
      const got = [...placeholdersIn(JA_DRAFTED[key]?.text ?? "")].sort();
      expect(got, `${key} changed the placeholders`).toEqual(wanted);
    }
  });

  /*
   * A back-translation that still names {game} is one somebody can read as a
   * sentence; one that has lost it is describing a different sentence from the
   * one being shipped.
   */
  it("keeps those names in the back-translation too", () => {
    for (const key of drafted) {
      const wanted = [...placeholdersIn(PHRASES[key])].sort();
      const got = [...placeholdersIn(JA_DRAFTED[key]?.back ?? "")].sort();
      expect(got, `${key}'s back-translation dropped a placeholder`).toEqual(wanted);
    }
  });

  it("is actually in Japanese", () => {
    for (const key of drafted) {
      const text = JA_DRAFTED[key]?.text ?? "";
      const stripped = text.replace(/\{\w+\}/g, "");
      expect(/[぀-ヿ一-鿿]/.test(stripped), `${key} has no Japanese in it`).toBe(true);
    }
  });
});

describe("who has read the Japanese a machine wrote", () => {
  const drafted = PHRASE_KEYS.filter((key) => JA_DRAFTED[key] !== undefined);

  /*
   * A phrase is either read (`review`) or an open question (`ask`, nobody has
   * read it). One that is neither is DRAFTED and unaccounted for: it ships
   * unread and nothing says so, which is the state this field exists to end.
   *
   * WHEN THIS FAILS for a phrase you just added: run `japanese-reviewer` over
   * it, apply its fixes, and stamp the entry with `review: { by: "agent", on }`
   * (today's date). If the reviewer cannot decide, leave `review` out and give
   * the entry an `ask` that tells John what he has to choose.
   */
  it("leaves no phrase drafted without a question to answer", () => {
    const unaccounted = drafted.filter((key) => {
      const row = JA_DRAFTED[key];
      return row?.review === undefined && row?.ask === undefined;
    });
    expect(unaccounted, "these phrases are unread and ask nothing: review them, or ask").toEqual([]);
  });

  it("dates each review as a real day, by the agent or by a person", () => {
    for (const key of drafted) {
      const review = JA_DRAFTED[key]?.review;
      if (review === undefined) continue;
      expect(["agent", "person"], `${key} was read by somebody unknown`).toContain(review.by);
      expect(review.on, `${key} has no real date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(review.on)), `${key}'s date does not exist`).toBe(false);
    }
  });

  it("never stamps a phrase that is still a question for John", () => {
    /*
     * An `ask` with no `review` is an open decision; the same phrase read by
     * the agent carries an `ask` only to recommend a native read. What is not
     * allowed is a note with nothing in it.
     */
    for (const key of drafted) {
      const ask = JA_DRAFTED[key]?.ask;
      if (ask !== undefined) expect(ask.trim(), `${key} asks nothing`).not.toBe("");
    }
  });

  it("drops the note once a person has read the phrase", () => {
    for (const key of drafted) {
      const row = JA_DRAFTED[key];
      if (row?.review?.by === "person") {
        expect(row.ask, `${key} has been read by a person: take its ask out`).toBeUndefined();
      }
    }
  });
});

describe("the review sheet somebody is handed", () => {
  const wanted = japaneseReview();

  if (process.env.WRITE_JAPANESE_REVIEW === "1") {
    it("is written out", () => {
      writeFileSync(REVIEW_FILE, wanted, "utf8");
      expect(existsSync(REVIEW_FILE)).toBe(true);
    });
    return;
  }

  it("exists", () => {
    expect(existsSync(REVIEW_FILE), `${REVIEW_FILE} is missing`).toBe(true);
  });

  /*
   * The point of the whole file: what he hands a Japanese reader has to be
   * what the site actually says. A sheet that has drifted is worse than none,
   * because it gets approved and the site keeps saying something else.
   */
  it("is the text that actually ships", () => {
    expect(
      readFileSync(REVIEW_FILE, "utf8"),
      "the review sheet is out of date — regenerate with WRITE_JAPANESE_REVIEW=1 pnpm vitest run src/lib/i18n",
    ).toBe(wanted);
  });

  /*
   * The check that was missing, and it shipped a sheet with "Rules 規則" and
   * "Board 盤" each printed twice.
   *
   * It was invisible to every test here because none of them looked at the
   * sheet as a table — they asked whether each phrase appeared in it, and a
   * duplicated row answers yes twice. What a reviewer is owed is one line per
   * thing to decide about; a line they have already read is a line that costs
   * them the effort of working out what they missed. The generator folds rows
   * on what they show and merges the places into one cell, and this is what
   * holds it to that.
   */
  it("never asks a reviewer to read the same row twice", () => {
    const rows = readFileSync(REVIEW_FILE, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("|") && !/^\|\s*-+/.test(line));
    const seen = new Set<string>();
    const twice: string[] = [];
    for (const row of rows) {
      if (seen.has(row)) twice.push(row);
      seen.add(row);
    }
    expect(twice, "these rows appear more than once in the review sheet").toEqual([]);
  });

  /*
   * The same rule one level down: two rows that differ only in where the word
   * is met are the duplicate this is about, and folding is what prevents
   * them. Compared on the reviewable columns — the English, the Japanese and
   * the reading back — because those are what a reviewer is deciding about.
   */
  it("says each distinct wording once, however many places use it", () => {
    const wordings = readFileSync(REVIEW_FILE, "utf8")
      .split("\n")
      .filter((line) => line.startsWith("| ") && line.includes("**"))
      .map((line) => line.split("|").slice(2, 5).join("|").trim());
    expect(new Set(wordings).size, "a wording is shown more than once").toBe(wordings.length);
  });

  /*
   * The Review column, and the lines a person has to act on first. The sheet is
   * the only thing John can hand a reader, so what is unread, who read what,
   * and what waits for a decision have to be on it and at the top of it.
   */
  it("shows who read each phrase, and lists what waits for a person first", () => {
    const sheet = readFileSync(REVIEW_FILE, "utf8");
    expect(sheet).toContain("| Review |");
    const waiting = PHRASE_KEYS.filter((key) => {
      const row = JA_DRAFTED[key];
      return row !== undefined && awaitsPerson(row);
    });
    const firstWaiting = sheet.indexOf("## 1. Waiting for a decision or a native read");
    const firstRest = sheet.indexOf("## 2. Written by a machine");
    expect(firstWaiting, "the waiting section is missing").toBeGreaterThan(-1);
    expect(firstRest).toBeGreaterThan(firstWaiting);
    for (const key of waiting) {
      const at = sheet.indexOf(JA_DRAFTED[key]?.text ?? "\0");
      expect(at, `${key} is not in the sheet`).toBeGreaterThan(-1);
      expect(at, `${key} waits for a person and must come before the rest`).toBeLessThan(firstRest);
    }
    for (const key of PHRASE_KEYS) {
      const row = JA_DRAFTED[key];
      if (row === undefined || awaitsPerson(row)) continue;
      const wording = `**${row.text}**`;
      if (!sheet.includes(wording)) continue;
      expect(sheet.indexOf(wording), `${key} is not waiting and must come after the waiting section`).toBeGreaterThan(firstRest);
    }
  });

  it("names every phrase a machine wrote", () => {
    const sheet = readFileSync(REVIEW_FILE, "utf8");
    for (const key of PHRASE_KEYS.filter((one) => JA_DRAFTED[one] !== undefined)) {
      expect(sheet, `${key} is missing from the review sheet`).toContain(
        JA_DRAFTED[key]?.text ?? "",
      );
    }
  });
});
