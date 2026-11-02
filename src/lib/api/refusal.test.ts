import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { PHRASES } from "@/lib/i18n/i18n.constants";
import { speaker } from "@/lib/i18n/i18n";
import { no, reasonValue } from "@/lib/puzzles/puzzleReasons";
import { checkSolution } from "@/lib/puzzles/puzzleCheck";

import { english, isRefusalCode, issueCode, partOf, said } from "./refusal";
import { refusalOr, refusalText, sayRefusal } from "./refusalText";

describe("a refusal as a key and its values", () => {
  it("is the sentence in English beside the key, for a caller that is not a page", () => {
    expect(said("err.signIn")).toEqual({ error: "Sign in first.", code: "err.signIn" });
    expect(said("err.me.awayAllowance", { days: 3, used: 2 })).toEqual({
      error: "Only 3 away days a year; 2 used.",
      code: "err.me.awayAllowance",
      values: { days: 3, used: 2 },
    });
  });

  it("says a refusal inside a refusal in English too", () => {
    const inner = partOf("chk.noMoveMade");
    expect(english("err.puzzle.notSolved", { reason: inner })).toBe("Not solved: no move was made.");
  });

  it("does not end twice when the refusal inside already has its full stop", () => {
    const inner = partOf("chk.hachinosu.notHive");
    expect(english("err.puzzle.notSolved", { reason: inner })).toBe("Not solved: The givens are not a hive.");
    const body = said("err.puzzle.notSolved", { reason: inner });
    expect(refusalOr(body, speaker("ja"), "")).not.toMatch(/。。/);
  });

  it("has English for every key it is asked for, and nothing in it is a blank", () => {
    for (const key of Object.keys(PHRASES).filter((one) => one.startsWith("err.") || one.startsWith("chk."))) {
      expect(isRefusalCode(key)).toBe(true);
      expect(english(key as Parameters<typeof english>[0]).trim(), key).not.toBe("");
    }
  });

  it("reads a schema's message as the key it is, and falls back for one that is not", () => {
    expect(issueCode([{ message: "err.name.short" }], "err.name.wontDo")).toBe("err.name.short");
    expect(issueCode([{ message: "Required" }], "err.name.wontDo")).toBe("err.name.wontDo");
    expect(issueCode([], "err.name.wontDo")).toBe("err.name.wontDo");
  });
});

describe("what a page shows for a refusal", () => {
  const ja = speaker("ja");
  const en = speaker("en");

  it("says the key in the reader's own language", () => {
    const body = said("err.game.none");
    expect(refusalText(body, en, "err.wrong")).toBe("No such game.");
    expect(refusalText(body, ja, "err.wrong")).toBe("その対局は見つかりません。");
  });

  it("fills the values, and says a refusal inside one in the same language", () => {
    const body = said("err.puzzle.notSolved", { reason: partOf("chk.noMoveMade") });
    expect(refusalText(body, en, "err.wrong")).toBe("Not solved: no move was made.");
    expect(refusalText(JSON.parse(JSON.stringify(body)), ja, "err.wrong")).toBe("解けていません：1手も動かしていません。");
  });

  it("falls back to the English the server sent for a key this page does not know, then to the page's own words", () => {
    expect(refusalText({ error: "Because.", code: "err.never.heard" }, ja, "err.wrong")).toBe("Because.");
    expect(refusalText({ code: "err.never.heard" }, ja, "err.wrong")).toBe("問題が発生しました。");
    expect(refusalText(null, ja, "err.wrong")).toBe("問題が発生しました。");
    expect(refusalOr(undefined, en, "Try again.")).toBe("Try again.");
  });

  it("says a library's refusal that has only a key and values", () => {
    expect(sayRefusal(ja, partOf("err.table.capYou", { most: 20 }))).toContain("20");
  });
});

describe("a puzzle's check, read by a reader of any language", () => {
  it("gives its reason as a key and values, with the English clause beside them", () => {
    const refused = checkSolution("cube", 3, "x", "");
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.code).toBe("chk.noMoveMade");
      expect(refused.reason).toBe("no move was made");
      expect(refused.reason).toBe(english(refused.code!));
    }
  });

  it("carries the figures a reason names", () => {
    const refused = no("chk.columnTwoStones", { n: 4 });
    expect(refused).toEqual({ ok: false, reason: "column 4 has two stones", code: "chk.columnTwoStones", values: { n: 4 } });
    expect(reasonValue(refused)).toEqual({ code: "chk.columnTwoStones", values: { n: 4 } });
  });

  it("hands a package's reason on as the English it gave, since that has no key", () => {
    expect(reasonValue({ reason: "a package said so" })).toBe("a package said so");
  });
});

describe("a puzzle's check", () => {
  it("says no with a key, so a reader of Japanese is told in Japanese", () => {
    const root = join(process.cwd(), "src/lib/puzzles");
    const checks = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, entry.name, "check.ts"))
      .filter((path) => {
        try {
          readFileSync(path);
          return true;
        } catch {
          return false;
        }
      });
    expect(checks.length).toBeGreaterThan(5);
    const typed = checks.filter((path) => /speaker\(DEFAULT_LOCALE\)|ok: false, reason:/.test(readFileSync(path, "utf8")));
    expect(typed, 'return no("chk.<game>.<why>") instead').toEqual([]);
  });
});
