import { describe, expect, it } from "vitest";

import { outcomeOfGame, recordRivals, rivalryFrom, rivalryLine, seatedRivals } from "./rivalry";
import {
  RIVALRY_LONG_GAP_DAYS,
  RIVALRY_MOMENTS,
  RIVALRY_STREAK_WORTH_NAMING,
} from "./rivalry.constants";
import type { RivalryGame } from "./rivalry.types";

const JOHN = "member-john";
const DAN = "member-dan";
const NOW = new Date("2026-09-14T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

/**
 * A game between John and Dan, `daysAgo` before NOW, from JOHN's side:
 * "win" puts John on black and black winning, and so on. `seat` swaps the
 * colours without changing who won, so both colours are exercised.
 */
function game(
  outcome: "win" | "loss" | "draw",
  daysAgo: number,
  extra: Partial<RivalryGame> & { seat?: "black" | "white" } = {},
): RivalryGame {
  const { seat = "black", ...rest } = extra;
  const johnWon = outcome === "win";
  const winnerSeat = seat === "black" ? (johnWon ? "black" : "white") : johnWon ? "white" : "black";
  return {
    id: `game-${daysAgo}-${outcome}`,
    playedAt: new Date(NOW.getTime() - daysAgo * DAY),
    variant: "ninuki",
    status: "finished",
    result: outcome === "draw" ? "draw" : winnerSeat,
    blackMemberId: seat === "black" ? JOHN : DAN,
    whiteMemberId: seat === "black" ? DAN : JOHN,
    ...rest,
  };
}

describe("rivalryFrom", () => {
  it("counts wins, losses and draws from the named side, on both colours", () => {
    const rivalry = rivalryFrom({
      one: JOHN,
      other: DAN,
      games: [game("win", 5), game("win", 4, { seat: "white" }), game("loss", 3, { seat: "white" }), game("draw", 2)],
    });
    expect(rivalry?.all).toMatchObject({ wins: 2, losses: 1, draws: 1, total: 4 });
  });

  it("reads the same games from the other side as the mirror image", () => {
    const games = [game("win", 3), game("win", 2), game("loss", 1)];
    expect(rivalryFrom({ one: DAN, other: JOHN, games })?.all).toMatchObject({ wins: 1, losses: 2, draws: 0 });
  });

  it("says when they last played and the run they are on, whatever order the games arrive in", () => {
    const rivalry = rivalryFrom({
      one: JOHN,
      other: DAN,
      games: [game("loss", 1), game("win", 9), game("loss", 2), game("loss", 3)],
    });
    expect(rivalry?.all.lastPlayedAt).toEqual(new Date(NOW.getTime() - DAY));
    expect(rivalry?.all.streak).toEqual({ kind: "loss", count: 3 });
  });

  it("ignores abandoned and unfinished games entirely", () => {
    const rivalry = rivalryFrom({
      one: JOHN,
      other: DAN,
      games: [
        game("win", 1, { result: "abandoned" }),
        game("win", 0, { status: "active" }),
        game("loss", 5),
      ],
    });
    expect(rivalry?.all).toMatchObject({ wins: 0, losses: 1, total: 1 });
    // The newest game counted is five days old: neither ignored game moved it.
    expect(rivalry?.all.lastPlayedAt).toEqual(new Date(NOW.getTime() - 5 * DAY));
  });

  it("ignores games that are not between these two members", () => {
    const rivalry = rivalryFrom({
      one: JOHN,
      other: DAN,
      games: [game("win", 1, { whiteMemberId: "member-somebody-else" }), game("draw", 2)],
    });
    expect(rivalry?.all).toMatchObject({ draws: 1, total: 1 });
  });

  /*
   * A seat that is only a typed name. There is no rivalry to read, and the
   * answer is silence — not an empty record, which would claim two people had
   * never played.
   */
  it("gives nothing at all when either side has no member id", () => {
    expect(rivalryFrom({ one: JOHN, other: null, games: [game("win", 1)] })).toBeNull();
    expect(rivalryFrom({ one: "", other: DAN, games: [game("win", 1)] })).toBeNull();
    expect(rivalryFrom({ one: undefined, other: DAN, games: [] })).toBeNull();
  });

  it("does not count a game where a seat was a typed name, even beside a real member", () => {
    const rivalry = rivalryFrom({ one: JOHN, other: DAN, games: [game("win", 1, { whiteMemberId: null })] });
    expect(rivalry?.all.total).toBe(0);
  });

  it("gives nothing for one member against themselves", () => {
    expect(rivalryFrom({ one: JOHN, other: JOHN, games: [] })).toBeNull();
  });

  it("keeps one game's score beside the all-time one", () => {
    const rivalry = rivalryFrom({
      one: JOHN,
      other: DAN,
      variant: "ninuki",
      games: [game("win", 1), game("loss", 2, { variant: "go" }), game("loss", 3, { variant: "go" })],
    });
    expect(rivalry?.all).toMatchObject({ wins: 1, losses: 2, total: 3 });
    expect(rivalry?.game).toMatchObject({ variant: "ninuki", tally: { wins: 1, losses: 0, total: 1 } });
  });

  it("has no game score when no game was asked about", () => {
    expect(rivalryFrom({ one: JOHN, other: DAN, games: [] })?.game).toBeNull();
  });
});

describe("rivalryLine", () => {
  const line = (games: RivalryGame[], options: { variant?: string; moment?: "before" | "after" | "record"; thisGame?: "win" | "loss" | "draw" } = {}) => {
    const rivalry = rivalryFrom({ one: JOHN, other: DAN, variant: options.variant, games });
    if (rivalry === null) throw new Error("expected a rivalry");
    return rivalryLine(rivalry, { moment: options.moment ?? RIVALRY_MOMENTS.record, now: NOW, thisGame: options.thisGame });
  };

  it("says they have never played, when they have not", () => {
    expect(line([])).toEqual({ kind: "never" });
  });

  it("says never played at all rather than never played this game, when both are true", () => {
    expect(line([], { variant: "ninuki", moment: "before" })).toEqual({ kind: "never" });
  });

  it("says they have never played this game when they have played others", () => {
    expect(line([game("win", 3, { variant: "go" })], { variant: "ninuki", moment: "before" })).toEqual({
      kind: "neverGame",
      variant: "ninuki",
    });
  });

  it("says they are tied", () => {
    const games = [game("win", 1), game("loss", 2), game("win", 3), game("loss", 4)];
    expect(line(games)).toEqual({ kind: "tied", score: 2 });
  });

  it("says who leads, from either side", () => {
    expect(line([game("win", 1), game("loss", 2), game("win", 3)])).toEqual({
      kind: "lead",
      leader: "one",
      ahead: 2,
      behind: 1,
    });
    expect(line([game("loss", 1), game("win", 2), game("loss", 3)])).toEqual({
      kind: "lead",
      leader: "other",
      ahead: 2,
      behind: 1,
    });
  });

  it("names a run of three losses", () => {
    const games = [game("loss", 1), game("loss", 2), game("loss", 3), game("win", 4), game("win", 5), game("win", 6), game("win", 7)];
    expect(line(games)).toEqual({ kind: "streak", outcome: "loss", count: 3 });
  });

  it("does not name a run one short of the threshold", () => {
    const runs = Array.from({ length: RIVALRY_STREAK_WORTH_NAMING - 1 }, (_, index) => game("loss", index + 1));
    expect(line([...runs, game("win", 10)])).toEqual({ kind: "lead", leader: "other", ahead: 2, behind: 1 });
  });

  it("names a run of draws the same way", () => {
    expect(line([game("draw", 1), game("draw", 2), game("draw", 3), game("win", 4)])).toEqual({
      kind: "streak",
      outcome: "draw",
      count: 3,
    });
  });

  it("counts draws beside the score and does not let them tip a tie", () => {
    const rivalry = rivalryFrom({ one: JOHN, other: DAN, games: [game("win", 1), game("draw", 2), game("loss", 3)] });
    expect(rivalry?.all).toMatchObject({ wins: 1, losses: 1, draws: 1 });
    expect(line([game("win", 1), game("draw", 2), game("loss", 3)])).toEqual({ kind: "tied", score: 1 });
  });

  it("says nothing but draws, rather than 'tied 0–0'", () => {
    expect(line([game("draw", 1), game("draw", 2)])).toEqual({ kind: "allDrawn" });
  });

  it("says a long gap in months, from the threshold", () => {
    expect(line([game("win", RIVALRY_LONG_GAP_DAYS)], { moment: "before" })).toEqual({ kind: "gap", unit: "months", count: 6 });
  });

  it("does not call a gap one day short of the threshold long", () => {
    expect(line([game("win", RIVALRY_LONG_GAP_DAYS - 1)], { moment: "before" })).toEqual({
      kind: "lead",
      leader: "one",
      ahead: 1,
      behind: 0,
    });
  });

  it("says a gap of two years in years, and 364 days in months", () => {
    expect(line([game("win", 800)], { moment: "before" })).toEqual({ kind: "gap", unit: "years", count: 2 });
    expect(line([game("win", 364)], { moment: "before" })).toEqual({ kind: "gap", unit: "months", count: 12 });
  });

  it("says a gap before a streak, since a long absence is the fresher fact", () => {
    const games = [game("loss", 400), game("loss", 401), game("loss", 402)];
    expect(line(games, { moment: "before" })).toEqual({ kind: "gap", unit: "years", count: 1 });
  });

  it("reads the gap from every game, not only this one", () => {
    // Ninuki two years ago, Go yesterday: they have not been apart.
    const games = [game("win", 800), game("loss", 1, { variant: "go" })];
    expect(line(games, { variant: "ninuki", moment: "before" })).toEqual({ kind: "lead", leader: "one", ahead: 1, behind: 0 });
  });

  it("never says a gap after a game, whose own game is the last one", () => {
    expect(line([game("win", 400)], { moment: "after", thisGame: "win" })).toEqual({ kind: "firstWin", winner: "one" });
  });

  it("says a first win after the game that was one", () => {
    const games = [game("win", 0), game("loss", 1), game("loss", 2), game("loss", 3)];
    expect(line(games, { moment: "after", thisGame: "win" })).toEqual({ kind: "firstWin", winner: "one" });
  });

  it("says the other side's first win after a loss that was theirs", () => {
    expect(line([game("loss", 0), game("win", 1)], { moment: "after", thisGame: "loss" })).toEqual({
      kind: "firstWin",
      winner: "other",
    });
  });

  it("does not say a first win in the record, where no game was just played", () => {
    expect(line([game("win", 0), game("loss", 1)])).toEqual({ kind: "tied", score: 1 });
  });

  it("says the score after a game that was not a first", () => {
    const games = [game("loss", 0), game("win", 1), game("loss", 2)];
    expect(line(games, { moment: "after", thisGame: "loss" })).toEqual({ kind: "lead", leader: "other", ahead: 2, behind: 1 });
  });

  it("reads streaks and scores in the game asked about when it has been played", () => {
    const games = [game("win", 1), game("win", 2), game("win", 3), game("loss", 4, { variant: "go" })];
    expect(line(games, { variant: "ninuki" })).toEqual({ kind: "streak", outcome: "win", count: 3 });
    expect(line(games, { variant: "go" })).toEqual({ kind: "lead", leader: "other", ahead: 1, behind: 0 });
  });
});

describe("outcomeOfGame", () => {
  it("reads the game just filed from the named side", () => {
    expect(outcomeOfGame(game("win", 0, { seat: "white" }), JOHN, DAN)).toBe("win");
    expect(outcomeOfGame(game("win", 0, { seat: "white" }), DAN, JOHN)).toBe("loss");
    expect(outcomeOfGame(game("draw", 0), JOHN, DAN)).toBe("draw");
  });

  it("is null for a game that was never a result", () => {
    expect(outcomeOfGame(game("win", 0, { result: "abandoned" }), JOHN, DAN)).toBeNull();
  });
});

describe("recordRivals", () => {
  const between = { member: JOHN, against: DAN };

  it("is the pair a record was narrowed to, for anybody reading it", () => {
    expect(recordRivals({ between, member: null, readerId: "member-stranger" })).toEqual({ one: JOHN, other: DAN });
    expect(recordRivals({ between, member: null, readerId: null })).toEqual({ one: JOHN, other: DAN });
  });

  it("puts the reader first when they are the other half of the pair", () => {
    expect(recordRivals({ between, member: null, readerId: DAN })).toEqual({ one: DAN, other: JOHN });
  });

  it("sets one member against the signed-in reader", () => {
    expect(recordRivals({ between: null, member: DAN, readerId: JOHN })).toEqual({ one: JOHN, other: DAN });
  });

  it("is nobody's rivalry on your own games, with nobody signed in, or on the whole record", () => {
    expect(recordRivals({ between: null, member: JOHN, readerId: JOHN })).toBeNull();
    expect(recordRivals({ between: null, member: DAN, readerId: null })).toBeNull();
    expect(recordRivals({ between: null, member: null, readerId: JOHN })).toBeNull();
  });
});

describe("seatedRivals", () => {
  it("reads a match's seats black first, or the reader first when they hold white", () => {
    expect(seatedRivals({ black: JOHN, white: DAN, readerId: "member-watcher" })).toEqual({ one: JOHN, other: DAN });
    expect(seatedRivals({ black: JOHN, white: DAN, readerId: DAN })).toEqual({ one: DAN, other: JOHN });
  });

  it("is nothing for a seat with no member, or one member on both seats", () => {
    expect(seatedRivals({ black: JOHN, white: null, readerId: JOHN })).toBeNull();
    expect(seatedRivals({ black: JOHN, white: JOHN, readerId: JOHN })).toBeNull();
  });
});
