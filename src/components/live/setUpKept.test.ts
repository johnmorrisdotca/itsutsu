import { describe, expect, it } from "vitest";

import { BOT_MEMBER_LIST, botsFor, gamesPlayedBy } from "@/lib/bots/bots.constants";
import { HANDICAP_RULES, NO_HANDICAP, OBSTACLE_LAYOUTS, OPENING_RULES, STONES, boardSizesFor } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { MOVE_TIME_OPTIONS } from "@/lib/history/gameSettingsSchema";

import { ANYONE, againstFromAddress } from "./opponentOptions";
import { applyRulesChange, type RulesDraft } from "./rulesDraft";
import { readSetUpAsked } from "./setUpAsked";
import {
  keptBoardChosen,
  keptDraft,
  keptHref,
  keptParams,
  queryRecord,
  silentFor,
  unreadAsked,
} from "./setUpKept";
import type { KeptBase } from "./setUp.types";

/**
 * THE SET-UP SCREEN'S ADDRESS, BOTH WAYS.
 *
 * John: "We need Memory when viewing Gaming pages... a refresh loses the Checkers
 * selections..." The screen now writes every choice into its address and starts
 * from it. The property that rests on is the round trip: the choices written and
 * read back are the choices made. A choice left out of the address is one that
 * silence has to give back, so leaving out defaults is tested as hard as writing
 * the rest.
 */

const DEFAULTS = { size: 15, moveTimeMs: null };
const PACE = MOVE_TIME_OPTIONS.find((one) => one !== null) as number;

const plain = (over: Partial<KeptBase> = {}): KeptBase => ({
  asPlayed: null,
  forked: false,
  defaults: DEFAULTS,
  pathVariant: null,
  silentOpponent: null,
  ...over,
});

/** The address a screen would write, as the query the next page load receives. */
function written(base: KeptBase, rules: RulesDraft, extra: { boardChosen?: number | null; against?: string | null } = {}) {
  const params = keptParams(base, {
    rules,
    boardChosen: extra.boardChosen ?? null,
    against: extra.against ?? null,
    chooseGame: base.pathVariant === null,
  });
  return { params, query: Object.fromEntries(params) };
}

/** What a reload of that address starts the screen with. */
function reloaded(base: KeptBase, query: Record<string, string>) {
  const asked = readSetUpAsked(query);
  const draft = keptDraft(base, asked);
  return { asked, draft, board: keptBoardChosen(base, asked, draft) };
}

describe("a plain game stays a plain address", () => {
  it("writes nothing for the game silence opens at, so /games/new stays /games/new", () => {
    const base = plain();
    expect(written(base, silentFor(base, "freestyle")).params).toEqual([]);
  });

  it("writes only the game for a game chosen and nothing else changed", () => {
    const base = plain();
    const checkers = silentFor(base, "checkers");
    const { params, query } = written(base, checkers);
    expect(params).toEqual([["game", "checkers"]]);
    expect(reloaded(base, query).draft).toEqual(checkers);
  });

  it("never writes the game on a page whose path already names it", () => {
    const base = plain({ pathVariant: "reversi" });
    expect(written(base, silentFor(base, "reversi")).params).toEqual([]);
  });
});

describe("every setting survives the round trip", () => {
  it("brings back a draft with every rule changed", () => {
    const base = plain();
    const quiet = silentFor(base, "freestyle");
    const rules = applyRulesChange(quiet, {
      size: 13,
      obstacles: Object.values(OBSTACLE_LAYOUTS).find((one) => one !== OBSTACLE_LAYOUTS.none) ?? OBSTACLE_LAYOUTS.none,
      opening: OPENING_RULES.pro,
      moveTimeMs: PACE,
      clockMode: "game",
      timeoutPenalty: "game",
      rated: false,
      allowResign: false,
      handicap: { ...NO_HANDICAP, stone: STONES.black, [HANDICAP_RULES[0]]: true },
    });
    const { params, query } = written(base, rules);
    // Every rule that differs is named, and the game — silence's own — is not.
    expect(params.map(([name]) => name)).not.toContain("game");
    expect(params.length).toBeGreaterThanOrEqual(8);
    expect(reloaded(base, query).draft).toEqual(rules);
  });

  it("changes one setting at a time and brings each back, and writes only that one", () => {
    const base = plain();
    const quiet = silentFor(base, "freestyle");
    const changes: Partial<RulesDraft>[] = [
      { size: 19 },
      { opening: OPENING_RULES.pro },
      { moveTimeMs: PACE },
      { clockMode: "game" },
      { timeoutPenalty: "game" },
      { rated: false },
      { allowResign: false },
      { handicap: { ...NO_HANDICAP, stone: STONES.white, [HANDICAP_RULES[0]]: true } },
    ];
    for (const change of changes) {
      const rules = applyRulesChange(quiet, change);
      const { params, query } = written(base, rules);
      expect(params, JSON.stringify(change)).toHaveLength(1);
      expect(reloaded(base, query).draft, JSON.stringify(change)).toEqual(rules);
    }
  });

  it("keeps a clicked board as a choice, even the board silence would give", () => {
    const base = plain();
    const quiet = silentFor(base, "freestyle");
    const { params, query } = written(base, quiet, { boardChosen: quiet.size });
    expect(params).toEqual([["board", String(quiet.size)]]);
    expect(reloaded(base, query).board).toBe(quiet.size);
  });

  it("does not write a clicked board the chosen game does not have", () => {
    const base = plain();
    const checkers = silentFor(base, "checkers");
    expect(boardSizesFor("checkers")).not.toContain(19);
    expect(written(base, checkers, { boardChosen: 19 }).params).toEqual([["game", "checkers"]]);
  });

  it("carries the opponent by id and brings it back chosen", () => {
    const base = plain();
    const bot = botsFor("freestyle")[0];
    const { query } = written(base, silentFor(base, "freestyle"), { against: bot.id });
    expect(query.against).toBe(bot.id);
    const { asked, draft } = reloaded(base, query);
    const value = againstFromAddress(asked.against, {
      computers: botsFor(draft.variant as RuleVariant),
      opponents: [],
      named: null,
      absent: ANYONE,
    });
    expect(value).toBe(`c:${bot.id}`);
  });

  it("leaves out the game a named program opens at, and a reload still opens at it", () => {
    /*
     * A program named with no game opens at the first game it plays — the
     * server's rule, and `silentVariant`'s. Preferably one whose first game is
     * not the site's default, so leaving the game out is a claim with teeth.
     */
    const program =
      BOT_MEMBER_LIST.find((bot) => (gamesPlayedBy(bot.id)[0] ?? "freestyle") !== "freestyle") ?? BOT_MEMBER_LIST[0];
    const own = gamesPlayedBy(program.id)[0] ?? "freestyle";
    const base = plain();
    const rules = silentFor(base, own);
    const { params, query } = written(base, rules, { against: program.id });
    expect(params).toEqual([["against", program.id]]);
    expect(reloaded(base, query).draft.variant).toBe(own);
  });
});

describe("a rematch and a fork: silence is the game as played", () => {
  const asPlayed: RulesDraft = {
    ...silentFor(plain(), "renju"),
    rated: false,
    moveTimeMs: PACE,
    open: false,
  };

  it("writes nothing for a rematch nobody has changed, and the changed rule alone after a change", () => {
    const base = plain({ asPlayed, silentOpponent: "m-bob" });
    expect(written(base, asPlayed, { against: "m-bob" }).params).toEqual([]);
    const rated = { ...asPlayed, rated: true };
    const { params, query } = written(base, rated, { against: "m-bob" });
    expect(params).toEqual([["rated", "rated"]]);
    expect(reloaded(base, query).draft).toEqual(rated);
  });

  it("says anyone out loud when a rematch is offered to nobody in particular", () => {
    const base = plain({ asPlayed, silentOpponent: "m-bob" });
    const { query } = written(base, asPlayed, { against: null });
    expect(query.against).toBe(ANYONE);
    const asked = readSetUpAsked(query);
    expect(
      againstFromAddress(asked.against, { computers: [], opponents: [], named: null, absent: "m:m-bob" }),
    ).toBe(ANYONE);
  });

  it("writes only a fork's own settings, never the board or the game of the position", () => {
    const base = plain({ asPlayed, forked: true, pathVariant: "renju" });
    const moved = { ...asPlayed, allowResign: false, size: 19, opening: OPENING_RULES.free };
    const { params, query } = written(base, moved, { boardChosen: 19, against: "m-bob" });
    expect(params).toEqual([["resign", "no"]]);
    const back = reloaded(base, query);
    expect(back.draft.allowResign).toBe(false);
    expect(back.draft.size).toBe(asPlayed.size);
    expect(back.board).toBeNull();
  });
});

describe("the address written", () => {
  it("keeps what the screen was opened from, drops what it could not read, and is bare when nothing is chosen", () => {
    const search = "?rematch=abc&from=g1&move=4&board=99&game=nonsense";
    expect(keptHref("/games/new", search, [["rated", "friendly"]])).toBe(
      "/games/new?rematch=abc&from=g1&move=4&rated=friendly",
    );
    expect(keptHref("/games/new", "?board=13", [])).toBe("/games/new");
  });

  it("reads a browser's query the way a page receives one, repeated keys and all", () => {
    expect(queryRecord(new URLSearchParams("game=go&board=9&board=13"))).toEqual({ game: "go", board: ["9", "13"] });
  });
});

describe("an address the screen cannot use all of says so", () => {
  const base = plain();

  function unread(query: Record<string, string>, forked = false) {
    const want = readSetUpAsked(query);
    return unreadAsked(query, want, keptDraft(forked ? { ...base, asPlayed: silentFor(base, "renju"), forked } : base, want), forked);
  }

  it("names nothing for an address it read in full", () => {
    expect(unread({ game: "checkers", rated: "friendly" })).toEqual([]);
  });

  it("names a board the game does not have, rather than opening at a plausible one in silence", () => {
    expect(unread({ game: "checkers", board: "19" })).toEqual(["board"]);
    expect(unread({ board: "99" })).toEqual(["board"]);
  });

  it("names each value that is not one the site offers", () => {
    expect(unread({ game: "nonsense" })).toEqual(["game"]);
    expect(unread({ pace: "7" })).toEqual(["pace"]);
    expect(unread({ clock: "sometimes", rated: "maybe", resign: "perhaps" })).toEqual(["clock", "rated", "resign"]);
    expect(unread({ handicap: "purple-overline" })).toEqual(["handicap"]);
  });

  it("names an opening the chosen game does not offer, which did not become the draft", () => {
    expect(unread({ game: "reversi", opening: OPENING_RULES.pro })).toEqual(["opening"]);
  });

  it("does not name the rules a fork ignores on purpose", () => {
    expect(unread({ board: "99", game: "checkers" }, true)).toEqual([]);
  });
});
