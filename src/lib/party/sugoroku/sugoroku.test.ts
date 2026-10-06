import { VARIANTS, pipCount, replayRecord, seededDice, openingFrom } from "@johnmorrisdotca/sugoroku";
import { describe, expect, it } from "vitest";

import { SUGOROKU_KIND_LIST, SUGOROKU_LENGTHS, SUGOROKU_STRENGTHS, SUGOROKU_VARIANT_KEY, sugorokuComputerName, sugorokuStrengthOfName, type SugorokuKind } from "./sugoroku.constants";
import type { SugorokuMove, SugorokuTable } from "./sugoroku.types";
import { SUGOROKU_RULES } from "./sugorokuRules";
import {
  decodeSugoroku,
  encodeSugoroku,
  namedSugoroku,
  peekRoll,
  playSugoroku,
  readSugorokuMove,
  rolledGame,
  startSugoroku,
  sugorokuComputerMove,
  sugorokuMoveCount,
  sugorokuMoves,
  sugorokuOver,
  sugorokuToPlay,
  sugorokuWinners,
  viewOf,
} from "./sugorokuTable";
import { sugorokuEnding, sugorokuNews, sugorokuStanding, sugorokuStatus } from "./sugorokuWords";
import { speaker } from "@/lib/i18n/i18n";

/** The English speaker: these tests read the rules' English words. */
const EN = speaker("en");

/** A random number from a seed, the same every run: a test must never pass or fail by luck. */
function seeded(start: number): () => number {
  let seed = start;
  return () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
}

/** Plays a table out choosing among the moves offered at random; the table at its end. */
function playOut(table: SugorokuTable, random: () => number, most = 20_000, prefer?: (moves: SugorokuMove[]) => SugorokuMove[]): SugorokuTable {
  let at = table;
  for (let step = 0; step < most && !sugorokuOver(at); step += 1) {
    const offered = sugorokuMoves(at);
    const among = prefer === undefined ? offered : prefer(offered);
    const next = playSugoroku(at, among[Math.floor(random() * among.length)]!);
    if (next === null) throw new Error("the rules refused a move they offered");
    at = next;
  }
  return at;
}

const start = (kind: SugorokuKind, points = 1, seed = 1) => startSugoroku(kind, points, ["Ann", "Ben"], seed)!;

/** The table after its first turn: in a game opened with a roll-off the first roll is the opening throw, and the cube is first offered before the second. */
function afterOpening(table: SugorokuTable): SugorokuTable {
  const first = sugorokuMoves(table).find((move) => move.t === "play")!;
  return playSugoroku(table, first)!;
}

describe("the seven are the package's variants, and each is a game of its own", () => {
  it.each(SUGOROKU_KIND_LIST)("%s starts on its variant's own board", (kind) => {
    const table = start(kind);
    const { settings, game } = viewOf(table);
    expect(settings.variant.key).toBe(SUGOROKU_VARIANT_KEY[kind]);
    expect(game).not.toBeNull();
    // The opening throw is made at once, from the seed: a side is to play, never "nobody".
    expect(game!.phase === "before-roll" || game!.phase === "playing").toBe(true);
    expect(sugorokuToPlay(table)).not.toBeNull();
  });

  it("backgammon starts as the classic: fifteen each, two on the 24 point, five on the 13, three on the 8, five on the 6", () => {
    const { game } = viewOf(start("backgammon"));
    const own = game!.position.points[0];
    expect([own[23], own[12], own[7], own[5]]).toEqual([2, 5, 3, 5]);
    expect(pipCount(game!.position, "white")).toBe(167);
  });

  it("nackgammon starts with four checkers back each: two on the 24, two on the 23, four on the 13, three on the 8, four on the 6", () => {
    const own = viewOf(start("nackgammon")).game!.position.points[0];
    expect([own[23], own[22], own[12], own[7], own[5]]).toEqual([2, 2, 4, 3, 4]);
  });

  it("longGammon starts with all fifteen on the 24 point", () => {
    const own = viewOf(start("longGammon")).game!.position.points[0];
    expect(own[23]).toBe(15);
  });

  it("hypergammon plays with three checkers each, on the 24, 23 and 22 points", () => {
    const own = viewOf(start("hypergammon")).game!.position.points[0];
    expect([own[23], own[22], own[21]]).toEqual([1, 1, 1]);
    expect(VARIANTS.hypergammon.checkers).toBe(3);
  });

  it("backgammonRace starts with every checker off the board, still to enter, and a hit still sends a checker to the bar", () => {
    const { game } = viewOf(start("backgammonRace"));
    expect(game!.position.reserve).toEqual([15, 15]);
    expect(game!.position.points[0].every((count) => count === 0)).toBe(true);
  });

  it("tabula throws three dice and has no special doubles; both sides go the same way round", () => {
    expect(VARIANTS.tabula.dice).toBe(3);
    expect(VARIANTS.tabula.doubles).toBe("none");
    expect(VARIANTS.tabula.direction).toBe("same");
    const roll = peekRoll(start("tabula", 1, 3)) ?? viewOf(start("tabula", 1, 3)).game!.dice;
    expect(roll).toHaveLength(3);
  });

  it("antiBackgammon is played to lose: the side that bears off first loses, and a game is a single point with no cube", () => {
    expect(VARIANTS["anti-backgammon"].goal).toBe("last-off");
    expect(VARIANTS["anti-backgammon"].drawAfter).toBe(500);
    const end = playOut(start("antiBackgammon", 1, 5), seeded(5));
    const { last } = viewOf(end);
    expect(last).not.toBeNull();
    const [white, black] = last!.position.off;
    // Whoever bore off all fifteen first is the one that LOST.
    const first = white === 15 ? "white" : "black";
    expect(last!.result.winner).not.toBeNull();
    expect(last!.result.winner).not.toBe(first);
    expect(white === 15 || black === 15).toBe(true);
    expect(viewOf(start("antiBackgammon")).settings.rules).toMatchObject({ cube: false, gammons: false });
  });

  it("offers exactly the match lengths the two sites printed in names, and a game they only offered single stays single", () => {
    expect(SUGOROKU_LENGTHS.backgammon).toEqual([1, 3, 5, 7, 9]);
    expect(SUGOROKU_LENGTHS.nackgammon).toEqual([1, 3, 5, 7, 9]);
    expect(SUGOROKU_LENGTHS.longGammon).toEqual([1, 3, 5, 7, 9]);
    expect(SUGOROKU_LENGTHS.hypergammon).toEqual([1, 3, 5]);
    expect(SUGOROKU_LENGTHS.backgammonRace).toEqual([1, 5]);
    expect(SUGOROKU_LENGTHS.antiBackgammon).toEqual([1]);
    expect(SUGOROKU_LENGTHS.tabula).toEqual([1]);
    expect(startSugoroku("tabula", 5, ["A", "B"], 1)).toBeNull();
    expect(startSugoroku("hypergammon", 7, ["A", "B"], 1)).toBeNull();
  });
});

describe("a table is its record, and the dice are its seed's", () => {
  it.each(SUGOROKU_KIND_LIST)("%s plays out to its end at every length it offers, and what is kept replays to the same match", (kind) => {
    for (const points of SUGOROKU_LENGTHS[kind]) {
      const end = playOut(start(kind, points, 11 + points), seeded(points));
      expect(sugorokuOver(end)).toBe(true);
      expect(sugorokuWinners(end).length).toBeGreaterThan(0);
      const replay = replayRecord(end.text);
      expect(replay.ok, replay.ok ? "" : replay.reason).toBe(true);
      if (replay.ok) {
        expect(replay.match.over).toBe(true);
        expect(replay.match.score).toEqual(viewOf(end).match.score);
      }
      expect(decodeSugoroku(encodeSugoroku(end))).toEqual(end);
    }
  });

  it("the same seed throws the same dice, a different seed does not, and the opening is the seed's own", () => {
    const a = start("backgammon", 1, 42);
    const b = start("backgammon", 1, 42);
    expect(a).toEqual(b);
    expect(start("backgammon", 1, 43).text).not.toBe(a.text);
    const opening = openingFrom(seededDice(42));
    expect(viewOf(a).game!.opening).toEqual(opening[0] === opening[1] ? viewOf(a).game!.opening : opening);
  });

  it("the roll is not a move of its own: a turn is the roll as the seed makes it and the play made with it", () => {
    const table = start("backgammon", 1, 7);
    const rolled = rolledGame(table)!;
    expect(rolled.dice).not.toBeNull();
    const offered = sugorokuMoves(table).filter((move) => move.t === "play");
    expect(offered.length).toBeGreaterThan(0);
    const after = playSugoroku(table, offered[0]!)!;
    expect(sugorokuMoveCount(after)).toBe(sugorokuMoveCount(table) + 1);
    const line = after.text.trim().split("\n").at(-1)!;
    // "white 31: 8/5 6/5": the side, the dice as thrown, the play.
    expect(line).toMatch(/^(white|black) \d{2}: /);
  });

  it("refuses a play that leaves a die unplayed, a step that is not legal, and a double the cube does not allow", () => {
    const table = start("backgammon", 3, 9);
    const offered = sugorokuMoves(table).filter((move) => move.t === "play") as (SugorokuMove & { t: "play" })[];
    const first = offered[0]!;
    // Half a turn: one step of a two-step play is not a played turn.
    const full = offered.find((move) => move.steps.length >= 2);
    if (full !== undefined) expect(playSugoroku(table, { t: "play", steps: [full.steps[0]!] })).toBeNull();
    expect(playSugoroku(table, { t: "play", steps: [[24, 1]] })).toBeNull();
    expect(playSugoroku(table, { t: "take" })).toBeNull();
    expect(playSugoroku(table, first)).not.toBeNull();
    // The table given is left untouched.
    expect(table.text).toBe(start("backgammon", 3, 9).text);
  });

  it("reads a move only in its own shape", () => {
    expect(readSugorokuMove({ t: "double" })).toEqual({ t: "double" });
    expect(readSugorokuMove({ t: "play", steps: [[24, 20], [13, 11]] })).toEqual({ t: "play", steps: [[24, 20], [13, 11]] });
    for (const bad of [null, 7, "play", {}, { t: "play" }, { t: "play", steps: [[1]] }, { t: "play", steps: [[0, 3]] }, { t: "play", steps: [[3, 99]] }, { t: "play", steps: [[1.5, 2]] }, { t: "play", steps: new Array(9).fill([6, 5]) }, { t: "roll" }]) {
      expect(readSugorokuMove(bad)).toBeNull();
    }
  });

  it("names are the seats', not the record's: written in for a page, kept apart from the dice", () => {
    const table = start("backgammon");
    const named = namedSugoroku(table, ["Chibi", "Kuma"]);
    expect(named.players).toEqual(["Chibi", "Kuma"]);
    expect(named.text).toBe(table.text);
    expect(viewOf(named).game).toBe(viewOf(table).game);
  });

  it("refuses a record it cannot play out", () => {
    expect(decodeSugoroku(null)).toBeNull();
    expect(decodeSugoroku("not a game")).toBeNull();
    const kept = encodeSugoroku(start("hypergammon"));
    expect(decodeSugoroku(kept)).not.toBeNull();
    expect(decodeSugoroku(kept.replace("kind hypergammon", "kind tabula"))).toBeNull();
    expect(decodeSugoroku(`${kept}white 66: 24/18\n`)).toBeNull();
  });
});

describe("the cube, gammons and the match", () => {
  /** The first table, over seeds, whose game has gone as the test needs. */
  function find(kind: SugorokuKind, points: number, want: (table: SugorokuTable) => boolean, prefer?: (moves: SugorokuMove[]) => SugorokuMove[]): SugorokuTable {
    for (let seed = 1; seed < 400; seed += 1) {
      const end = playOut(start(kind, points, seed), seeded(seed), 20_000, prefer);
      if (want(end)) return end;
    }
    throw new Error("no seed made the game this test needs");
  }
  const noCube = (moves: SugorokuMove[]) => moves.filter((move) => move.t !== "double");

  it("a match turns the cube for one side, who holds it, at twice the value, and the doubler may not redouble it back", () => {
    const table = afterOpening(start("backgammon", 5, 3));
    expect(viewOf(table).game!.cube).toEqual({ value: 1, owner: null });
    const doubled = playSugoroku(table, { t: "double" })!;
    expect(sugorokuStatus(doubled, EN)).toMatch(/doubles to 2/);
    expect(sugorokuToPlay(doubled)).not.toBe(sugorokuToPlay(table));
    expect(playSugoroku(doubled, { t: "double" })).toBeNull();
    const taken = playSugoroku(doubled, { t: "take" })!;
    const { game } = viewOf(taken);
    expect(game!.cube.value).toBe(2);
    expect(game!.cube.owner).toBe(viewOf(doubled).game!.turn === "white" ? "black" : "white");
    // The doubler rolls on; the taker holds the cube, so the doubler cannot double again.
    expect(sugorokuMoves(taken).some((move) => move.t === "double")).toBe(false);
  });

  it("a dropped double ends the game for the doubler, at the value before it, and the match goes on", () => {
    const table = afterOpening(start("backgammon", 5, 3));
    const dropped = playSugoroku(playSugoroku(table, { t: "double" })!, { t: "drop" })!;
    const { match, game } = viewOf(dropped);
    expect(match.score.reduce((a, b) => a + b, 0)).toBe(1);
    expect(match.over).toBe(false);
    expect(game!.phase === "before-roll" || game!.phase === "playing").toBe(true);
    expect(sugorokuNews(dropped, EN)).toMatch(/dropped|begins/);
  });

  it("a single game has no cube to offer, and a match to five has one", () => {
    expect(sugorokuMoves(afterOpening(start("backgammon", 1, 3))).some((move) => move.t === "double")).toBe(false);
    // Nor before the opening roll, which a roll-off makes the first turn; and the Crawford game has none either.
    expect(sugorokuMoves(start("backgammon", 5, 3)).some((move) => move.t === "double")).toBe(false);
    expect(sugorokuMoves(afterOpening(start("backgammon", 5, 3))).some((move) => move.t === "double")).toBe(true);
  });

  it("a match is won at its length, by scoring gammons double, and says so", () => {
    const end = find("hypergammon", 3, (table) => viewOf(table).match.results.some((result) => result.kind === "gammon" && result.how === "bear-off"), noCube);
    const gammon = viewOf(end).match.results.find((result) => result.kind === "gammon")!;
    expect(gammon.multiplier).toBe(2);
    expect(gammon.points).toBe(2);
    const { match } = viewOf(end);
    expect(Math.max(...match.score)).toBeGreaterThanOrEqual(3);
    expect(sugorokuEnding(end, EN)).toMatch(/wins the match \d+ to \d+\./);
    expect(sugorokuStanding(end, 0, EN)).toMatch(/points?$/);
  });

  it("a single game says how it was won, and a gammon in it is still one point", () => {
    const end = playOut(start("hypergammon", 1, 4), seeded(4), 20_000, noCube);
    expect(sugorokuOver(end)).toBe(true);
    expect(viewOf(end).match.score.reduce((a, b) => a + b, 0)).toBe(1);
    expect(sugorokuEnding(end, EN)).toMatch(/wins\b/);
    expect(sugorokuNews(end, EN)).toMatch(/won the game/);
  });

  it("giving up ends the game at the most the position could cost, and a match goes on", () => {
    const table = start("backgammon", 5, 12);
    const gave = playSugoroku(table, { t: "concede" })!;
    const { match } = viewOf(gave);
    expect(match.score.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(2);
    expect(sugorokuNews(gave, EN)).toMatch(/gave up/);
    const single = playSugoroku(start("backgammon", 1, 12), { t: "concede" })!;
    expect(sugorokuOver(single)).toBe(true);
    expect(sugorokuWinners(single)).toEqual([viewOf(start("backgammon", 1, 12)).game!.turn === "white" ? 1 : 0]);
  });
});

describe("the computer's four strengths play the table's own moves", () => {
  it("names a seat for each strength, and reads the strength back from the name", () => {
    for (const strength of SUGOROKU_STRENGTHS) expect(sugorokuStrengthOfName(sugorokuComputerName(strength))).toBe(strength);
    expect(sugorokuStrengthOfName("Computer")).toBeNull();
    // One word, so the site's shortening of a name with a space in it (`shownName`) cannot cut the strength off; said to the players with the space.
    expect(sugorokuComputerName("careful")).not.toMatch(/\s/);
    expect(namedSugoroku(start("backgammon"), ["Ann", sugorokuComputerName("careful")]).players).toEqual(["Ann", "Computer (Careful)"]);
    expect(sugorokuStrengthOfName("Ann")).toBeNull();
  });

  it.each(SUGOROKU_STRENGTHS)("%s answers every phase with a move the rules take", (strength) => {
    for (const kind of ["backgammon", "tabula", "backgammonRace"] as const) {
      let table = start(kind, kind === "tabula" ? 1 : 5, 21);
      const random = seeded(8);
      for (let turn = 0; turn < 40 && !sugorokuOver(table); turn += 1) {
        const move = sugorokuComputerMove(table, strength, random)!;
        expect(move).not.toBeNull();
        const next = playSugoroku(table, move);
        expect(next, `${kind} ${strength} turn ${turn}: ${JSON.stringify(move)}`).not.toBeNull();
        table = next!;
      }
    }
  });

  it("two computers finish a match to three between them, each strength against the one above", () => {
    for (let at = 0; at < SUGOROKU_STRENGTHS.length - 1; at += 1) {
      const lower = SUGOROKU_STRENGTHS[at]!;
      const higher = SUGOROKU_STRENGTHS[at + 1]!;
      let table = start("hypergammon", 3, 31 + at);
      const random = seeded(31 + at);
      for (let step = 0; step < 4000 && !sugorokuOver(table); step += 1) {
        const strength = sugorokuToPlay(table) === 0 ? lower : higher;
        table = playSugoroku(table, sugorokuComputerMove(table, strength === "careful" || strength === "strong" ? "greedy" : strength, random)!)!;
      }
      expect(sugorokuOver(table)).toBe(true);
    }
  });
});

describe("the party contract's table", () => {
  it.each(SUGOROKU_KIND_LIST)("%s starts only for two, and offers a move until it is over", (kind) => {
    const rules = SUGOROKU_RULES[kind];
    expect(rules.start(1, [""])).toBeNull();
    expect(rules.start(1, ["", "", ""])).toBeNull();
    const table = rules.start(1, ["", ""], undefined, 5)!;
    expect(rules.over(table)).toBe(false);
    expect(rules.moves(table).length).toBeGreaterThan(0);
  });
});
