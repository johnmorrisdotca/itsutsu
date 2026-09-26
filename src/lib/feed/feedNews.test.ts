import { describe, expect, it } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";
import { AGE_BANDS } from "@/lib/social/ageBand.constants";

import { FEED_KINDS } from "./feed.constants";
import type { FeedAddedEntry, FeedSeatStanding } from "./feed.types";
import { mayBeNamed } from "./feedEveryone";
import { addedEntries, gamesToldByNews, newsEntries, openingDay, type NewsGameSeats, type NewsPeople, type NewsRead } from "./feedNews";
import { SITE_NEWS } from "./siteNews.constants";

const TOP = BOT_TIER_LIST.at(-1) as keyof typeof BOT_MEMBERS;
const bot = BOT_MEMBERS[TOP];

/** Ann is an adult, Kid is 12, Teen is 15, Nobody-asked never said, Bot is a program. */
const STANDINGS: Record<string, FeedSeatStanding> = {
  ann: { ageBand: AGE_BANDS.adult, botTier: null },
  bo: { ageBand: AGE_BANDS.adult, botTier: null },
  kid: { ageBand: AGE_BANDS.under13, botTier: null },
  teen: { ageBand: AGE_BANDS.teen, botTier: null },
  unasked: { ageBand: null, botTier: null },
  [bot.id]: { ageBand: null, botTier: TOP },
};

const people: NewsPeople = {
  nameOf: (id) => ({ ann: "Ann", bo: "Bo", kid: "Kid", teen: "Teen", unasked: "Una" })[id] ?? bot.name,
  mayName: (id) => id !== null && mayBeNamed(STANDINGS[id] ?? null),
};

const AT = new Date("2026-09-20T10:00:00Z");

function row(over: Partial<NewsRead>): NewsRead {
  return { id: "n1", kind: SITE_NEWS.firstWin, memberId: "ann", variant: "", subject: "ann", gameId: "g1", createdAt: AT, ...over };
}

function seats(black: string, white: string, winner: string | null = "black"): Map<string, NewsGameSeats> {
  const name = (id: string) => people.nameOf(id);
  return new Map([
    ["g1", { id: "g1", variant: "reversi", winner, black: { memberId: black, name: name(black) }, white: { memberId: white, name: name(white) } }],
  ]);
}

describe("the site's news on the Everyone tab: THE AGE RULE", () => {
  it("names an adult in a first win", () => {
    const [line] = newsEntries([row({})], seats("ann", "bo"), people);
    expect(line).toMatchObject({ kind: FEED_KINDS.news, news: SITE_NEWS.firstWin, named: true, who: { memberId: "ann" }, variant: "reversi" });
  });

  it("draws no first win, first loss or first place for a child, a teenager or a member never asked", () => {
    for (const id of ["kid", "teen", "unasked"]) {
      const rows = [
        row({ id: "a", memberId: id, subject: id }),
        row({ id: "b", kind: SITE_NEWS.firstLoss, memberId: id, subject: id }),
        row({ id: "c", kind: SITE_NEWS.tookFirstPlace, memberId: id, variant: "reversi", subject: "g1" }),
      ];
      expect(newsEntries(rows, seats(id, "bo"), people), id).toEqual([]);
    }
  });

  it("names both players of a game's first game when both may be named", () => {
    const [line] = newsEntries([row({ kind: SITE_NEWS.firstGameOfGame, variant: "reversi", subject: "" })], seats("ann", bot.id), people);
    expect(line).toMatchObject({ named: true, who: { memberId: "ann" }, other: { memberId: bot.id }, outcome: "won" });
  });

  it("says a game's first game WITHOUT its players when either may not be named", () => {
    for (const [black, white] of [["kid", "ann"], ["ann", "teen"], ["unasked", "bo"]] as const) {
      const [line] = newsEntries([row({ kind: SITE_NEWS.firstGameOfGame, variant: "reversi", subject: "" })], seats(black, white, "white"), people);
      expect(line, `${black} v ${white}`).toMatchObject({ named: false, who: { memberId: null, name: "" }, other: null, variant: "reversi" });
    }
  });

  it("says a top grade was beaten without the child who beat it, naming only the program", () => {
    const [line] = newsEntries([row({ kind: SITE_NEWS.hardBotBeaten, memberId: "kid", variant: "reversi", subject: TOP })], new Map(), people);
    expect(line).toMatchObject({ named: false, who: { memberId: null }, other: { memberId: bot.id, name: bot.name } });
    const [named] = newsEntries([row({ kind: SITE_NEWS.hardBotBeaten, memberId: "ann", variant: "reversi", subject: TOP })], new Map(), people);
    expect(named).toMatchObject({ named: true, who: { memberId: "ann", name: "Ann" } });
  });

  it("says a best time without a teenager who set it, and with an adult who did", () => {
    const best = row({ kind: SITE_NEWS.bestTime, variant: "numberPlace", subject: "9:hard:192000", gameId: null });
    expect(newsEntries([{ ...best, memberId: "teen" }], new Map(), people)[0]).toMatchObject({ named: false, who: { memberId: null } });
    expect(newsEntries([{ ...best, memberId: "ann" }], new Map(), people)[0]).toMatchObject({ named: true, who: { memberId: "ann" } });
  });

  it("never names a person the page has marked unwelcome, whatever their age", () => {
    const strict: NewsPeople = { ...people, mayName: (id) => id !== bot.id && people.mayName(id) && id !== "ann" };
    expect(newsEntries([row({})], seats("ann", "bo"), strict)).toEqual([]);
  });
});

describe("rows the news cannot read", () => {
  it("leaves out a kind this deploy does not know, a grade it does not know, and a best time it cannot read", () => {
    const rows = [
      row({ kind: "somethingNew" }),
      row({ kind: SITE_NEWS.hardBotBeaten, variant: "reversi", subject: "retired" }),
      row({ kind: SITE_NEWS.bestTime, variant: "numberPlace", subject: "garbled", gameId: null }),
    ];
    expect(newsEntries(rows, seats("ann", "bo"), people)).toEqual([]);
  });

  it("leaves out a first win whose game has gone, since it cannot say which game", () => {
    expect(newsEntries([row({})], new Map(), people)).toEqual([]);
  });

  it("says a game's first game with its game alone when the game row has gone", () => {
    const [line] = newsEntries([row({ kind: SITE_NEWS.firstGameOfGame, variant: "hex", subject: "" })], new Map(), people);
    // And leads to no game: a link to a row that has gone would be a dead end.
    expect(line).toMatchObject({ named: false, variant: "hex", gameId: null });
    const [beaten] = newsEntries([row({ kind: SITE_NEWS.hardBotBeaten, variant: "reversi", subject: TOP, gameId: "gone" })], new Map(), people);
    expect(beaten?.gameId).toBeNull();
  });
});

describe("the games a named line already tells", () => {
  it("is a game's first game and a top grade beaten, when named", () => {
    const lines = newsEntries(
      [
        row({ id: "a", kind: SITE_NEWS.firstGameOfGame, variant: "reversi", subject: "" }),
        row({ id: "b" }),
      ],
      seats("ann", "bo"),
      people,
    );
    expect([...gamesToldByNews(lines)]).toEqual(["g1"]);
    const nameless = newsEntries([row({ kind: SITE_NEWS.firstGameOfGame, variant: "reversi", subject: "" })], seats("kid", "bo"), people);
    expect(gamesToldByNews(nameless).size).toBe(0);
  });
});

describe("the games that arrived", () => {
  const added = { freestyle: "2026-09-07", renju: "2026-09-07", reversi: "2026-09-14", hex: "2026-09-14", gomojiWort: "2026-09-25", go: "2026-06-01" };
  const now = new Date("2026-09-26T08:00:00Z");

  it("is one line a day, naming every game that arrived that day, in the catalogue's order", () => {
    const lines = addedEntries({ ...added, go: "2026-09-01" }, now, 60) as FeedAddedEntry[];
    const day = lines.find((line) => line.id === "added:2026-09-14");
    expect(day?.variants).toEqual(["reversi", "hex"]);
    expect(day?.at).toBe("2026-09-14T12:00:00.000Z");
  });

  it("leaves out the first day, which is the catalogue the site opened with", () => {
    const table = { ...added, go: "2026-09-07" };
    expect(openingDay(table)).toBe("2026-09-07");
    expect(addedEntries(table, now, 60).map((line) => line.id)).toEqual(["added:2026-09-14", "added:2026-09-25"]);
  });

  it("leaves out days older than the window and days not yet come", () => {
    const table = { go: "2026-01-01", freestyle: "2026-06-01", reversi: "2026-09-14", hex: "2026-10-02" };
    expect(addedEntries(table, now, 60).map((line) => line.id)).toEqual(["added:2026-09-14"]);
  });
});
