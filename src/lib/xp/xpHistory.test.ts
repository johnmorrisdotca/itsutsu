import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";

import { XP_EVENTS, XP_EVENT_SPECS, XP_SUBJECTS } from "./xp.constants";
import {
  XP_SUBJECT_KIND_OF,
  xpAboutFor,
  xpLedgerRowFor,
  xpMoreHref,
  xpParamsFrom,
} from "./xpHistory";
import { XP_SUBJECT_KINDS } from "./xpHistory.types";
import type { XpEventType } from "./xp.types";

const TYPES = Object.keys(XP_EVENT_SPECS) as XpEventType[];

/**
 * THE LEDGER READS BACK WHAT THE AWARDER WROTE.
 *
 * `XpEvent.subject` is one opaque column whose meaning is decided by the row's
 * type, and this is the first module on the site that has to read it rather than
 * write it. Getting it wrong is silent in both directions — a game id read as a
 * variant links to a game that does not exist, and a variant read as a game id
 * looks up a match nobody played — so the mapping is checked against the
 * catalogue's own prose rather than against itself.
 */
describe("what each kind of subject refers to", () => {
  it("decides for every award in the catalogue", () => {
    // Record<XpEventType, …> says this at compile time; a run-time case is what
    // catches a row whose value was written as a cast or a spread.
    for (const type of TYPES) {
      expect(XP_SUBJECT_KIND_OF[type], type).toBeTruthy();
    }
    expect(TYPES.length).toBe(40);
  });

  /*
   * `XP_SUBJECTS` is the catalogue's OWN statement of what each subject is, in
   * prose, written for whoever wires an award. This table is the machine-
   * readable twin of it, and two tables saying one thing is exactly the risk
   * AGENTS.md warns about — so they are checked against each other rather than
   * kept in step by hope. A new award that is wired with the game id and read
   * back as a variant fails here.
   */
  it("agrees with the prose in XP_SUBJECTS, phrase by phrase", () => {
    const disagreements: string[] = [];
    for (const type of TYPES) {
      const said = XP_SUBJECTS[type];
      const kind = XP_SUBJECT_KIND_OF[type];
      const expected =
        said === ""
          ? XP_SUBJECT_KINDS.nobody
          : /opponent's member id/.test(said)
            ? XP_SUBJECT_KINDS.rivalry
            : /game id/.test(said)
              ? XP_SUBJECT_KINDS.match
              : /RuleVariant key/.test(said)
                ? XP_SUBJECT_KINDS.game
                : /family title/.test(said)
                  ? XP_SUBJECT_KINDS.family
                  : /BotTier|member id/.test(said)
                    ? XP_SUBJECT_KINDS.person
                    : /day key|ISO week|date/.test(said)
                      ? XP_SUBJECT_KINDS.when
                      : "unmatched";
      if (kind !== expected) disagreements.push(`${type}: read as ${kind}, prose says ${expected}`);
    }
    expect(disagreements).toEqual([]);
  });

  it("an award about nobody but the member is about nobody", () => {
    expect(xpAboutFor(XP_EVENTS.joined, "")).toEqual({ of: "nobody" });
    expect(xpAboutFor(XP_EVENTS.everyVariantPlayed, "")).toEqual({ of: "nobody" });
    // And a subject-keyed award whose subject is somehow blank is not a link to
    // nothing: an empty game id would build /games/…/match/ and 404.
    expect(xpAboutFor(XP_EVENTS.gameFinished, "")).toEqual({ of: "nobody" });
  });
});

describe("a game, and a match of one", () => {
  it("a game-keyed award is a match, with its game still to be read", () => {
    // Null, and not a variant that happens to be in range. The subject carries
    // the id alone; the address needs the game, and only the database has it.
    expect(xpAboutFor(XP_EVENTS.gameWon, "game-abc")).toEqual({
      of: "match",
      gameId: "game-abc",
      variant: null,
    });
  });

  it("a variant-keyed award is that game", () => {
    expect(xpAboutFor(XP_EVENTS.firstOfVariant, RULE_VARIANTS.renju)).toEqual({
      of: "game",
      variant: "renju",
    });
    expect(xpAboutFor(XP_EVENTS.firstWinAtVariant, RULE_VARIANTS.ninuki)).toEqual({
      of: "game",
      variant: "ninuki",
    });
  });

  it("a variant this deploy has never heard of is said in words, not guessed", () => {
    /*
     * The dangerous alternative is the first variant in the list, which would
     * be a link that works and means something false. A withdrawn variant key
     * is a real award about a game we no longer have, and saying so is the only
     * honest answer.
     */
    expect(xpAboutFor(XP_EVENTS.firstOfVariant, "quintuple-connect")).toEqual({
      of: "words",
      said: "quintuple-connect",
      stale: true,
    });
  });
});

describe("a family", () => {
  it("reaches the family's page through one of its games", () => {
    const family = GAME_FAMILIES[0];
    expect(xpAboutFor(XP_EVENTS.firstOfFamily, family.title)).toEqual({
      of: "family",
      title: family.title,
      through: family.games[0],
    });
  });

  it("a retitled family keeps its words and loses its link", () => {
    /*
     * The design flags this as the honest cost of a display string being the
     * identity: `GAME_FAMILIES` has no key, so a retitled family re-awards and
     * the old row names a family nothing answers to. It still happened.
     */
    expect(xpAboutFor(XP_EVENTS.firstOfFamily, "The Old Name")).toEqual({
      of: "family",
      title: "The Old Name",
      through: null,
    });
  });
});

describe("a person", () => {
  it("a computer grade is that player, by name, for nothing", () => {
    // BOT_MEMBERS is a constant with fixed ids, so the name and the address are
    // both free — which is why a bot's row is drawn with a name and a buddy's
    // is not. No query is spent on a name.
    const meijin = BOT_MEMBERS.meijin;
    expect(xpAboutFor(XP_EVENTS.gradeBeaten, "meijin")).toEqual({
      of: "person",
      memberId: meijin.id,
      name: meijin.name,
    });
  });

  it("a specialist is a player too", () => {
    expect(xpAboutFor(XP_EVENTS.specialistBeaten, "tamenoki")).toEqual({
      of: "person",
      memberId: BOT_MEMBERS.tamenoki.id,
      name: BOT_MEMBERS.tamenoki.name,
    });
  });

  it("a buddy is their page, with no name and no query for one", () => {
    // /players/<id> IS the subject, so the link costs nothing. The name would
    // cost a read, and the row says "the person you added" instead.
    expect(xpAboutFor(XP_EVENTS.buddyAdded, "cm0buddy")).toEqual({
      of: "person",
      memberId: "cm0buddy",
      name: null,
    });
  });
});

describe("a rivalry", () => {
  it("is an opponent at one game, from both halves of the subject", () => {
    expect(xpAboutFor(XP_EVENTS.revengeWin, "cm0rival:renju")).toEqual({
      of: "rivalry",
      memberId: "cm0rival",
      variant: "renju",
    });
  });

  it("splits on the LAST colon, so an id holding one survives", () => {
    expect(xpAboutFor(XP_EVENTS.revengeWin, "odd:id:caro")).toEqual({
      of: "rivalry",
      memberId: "odd:id",
      variant: "caro",
    });
  });

  it("refuses half a rivalry rather than inventing the other half", () => {
    /*
     * Each of these would otherwise become a link: an empty opponent id reaches
     * /players/, and an unknown variant reaches a game that is not there. A
     * rivalry is two facts and one of them missing is not a rivalry.
     */
    for (const subject of ["cm0rival", ":renju", "cm0rival:", "cm0rival:nosuchgame"]) {
      expect(xpAboutFor(XP_EVENTS.revengeWin, subject), subject).toEqual({
        of: "words",
        said: subject,
        stale: true,
      });
    }
  });
});

describe("a date", () => {
  it("a daily award's subject is the row's own day, so it is not said twice", () => {
    // dailyVisit is the most numerous row on any ledger, and its subject is the
    // day key the row already carries. Printing both would be the same string
    // in two columns on every line.
    expect(xpAboutFor(XP_EVENTS.dailyVisit, "2026-09-12")).toEqual({ of: "nobody" });
    expect(xpAboutFor(XP_EVENTS.dayStreak30, "2026-09-12")).toEqual({ of: "nobody" });
  });

  it("a weekend and the end of an absence say something the row's date does not", () => {
    expect(xpAboutFor(XP_EVENTS.weekendGame, "2026-W37")).toEqual({
      of: "words",
      said: "2026-W37",
    });
    expect(xpAboutFor(XP_EVENTS.backFromAway, "2026-09-05")).toEqual({
      of: "words",
      said: "2026-09-05",
    });
  });
});

describe("one stored event as a row", () => {
  const event = {
    id: "xp1",
    type: XP_EVENTS.gameWon as string,
    points: 20,
    subject: "game-abc",
    dayKey: "2026-09-12",
    createdAt: new Date("2026-09-12T10:00:00.000Z"),
  };

  it("takes its words from the catalogue and its points from the row", () => {
    const row = xpLedgerRowFor({ ...event, points: 15 });
    expect(row?.label).toBe(XP_EVENT_SPECS.gameWon.label);
    expect(row?.kanji).toBe(XP_EVENT_SPECS.gameWon.kanji);
    expect(row?.blurb).toBe(XP_EVENT_SPECS.gameWon.blurb);
    /*
     * FIFTEEN, not the catalogue's twenty. `points` is what was paid at the
     * time, and repricing an award must never rewrite anybody's history — so the
     * row is the authority on the number and the catalogue only on the words.
     */
    expect(row?.points).toBe(15);
  });

  it("drops a type this deploy cannot explain rather than printing undefined", () => {
    expect(xpLedgerRowFor({ ...event, type: "wonAtSomethingElse" })).toBeNull();
  });
});

describe("the address of the next page", () => {
  it("keeps every other parameter, and replaces the cursor", () => {
    const params = new URLSearchParams("view=xp&sort=earned%3Aasc&cursor=older");
    const href = xpMoreHref("/me", params, "newer");
    // The tab above all: a "more" link that dropped `view` would navigate away
    // from the ledger it sits under.
    expect(href).toContain("view=xp");
    expect(href).toContain("sort=earned%3Aasc");
    expect(href).toContain("cursor=newer");
    expect(href).not.toContain("cursor=older");
  });
});

describe("a render's search parameters", () => {
  it("carries a repeated parameter through rather than losing one", () => {
    const params = xpParamsFrom({ view: "xp", cursor: ["a", "b"], missing: undefined });
    expect(params.get("view")).toBe("xp");
    expect(params.getAll("cursor")).toEqual(["a", "b"]);
    expect(params.has("missing")).toBe(false);
  });
});
