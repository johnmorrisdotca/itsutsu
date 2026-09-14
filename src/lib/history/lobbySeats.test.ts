import { describe, expect, it } from "vitest";

import { NO_HANDICAP, STONES } from "@/lib/gomoku/gomoku.constants";
import type { GameSummary } from "./gameHistory.types";
import { seatsTheSentenceOffers } from "./lobbySeats";
import { oneOfEachKind } from "./openGames";

const DAY = 24 * 60 * 60_000;

/** A seat exactly as the set-up screen's plain pre-fill would ask for it, with one thing changed. */
const seat = (over: Partial<GameSummary>): GameSummary =>
  ({
    id: "x",
    variant: "freestyle",
    size: 15,
    moveTimeMs: 3 * DAY,
    opening: "free",
    obstacles: "none",
    rated: true,
    allowResign: true,
    handicap: NO_HANDICAP,
    clockMode: "move",
    timeoutPenalty: "turn",
    openSeat: STONES.white,
    blackName: "Kyoko",
    whiteName: "",
    ...over,
  }) as GameSummary;

const ids = (games: readonly GameSummary[]) => games.map((game) => game.id);
const offers = (...games: GameSummary[]) => ids(seatsTheSentenceOffers(games));

/**
 * WHAT THE LOBBY SENTENCE MAY NAME.
 *
 * Its press leads to the set-up screen, pre-filled for the game, the board and
 * the pace it names — and otherwise Free, rated, a per-move clock that costs the
 * turn, no blocked points, no handicap. That screen offers a waiting seat only
 * when the seat's game is that game (`seatIsThisGame`), so the sentence names
 * only those: "Sit down with X" is a promise the next screen has to keep.
 */
describe("the seats the lobby sentence may name", () => {
  it("names a seat whose game is what the set-up screen would pre-fill", () => {
    expect(offers(seat({ id: "plain" }))).toEqual(["plain"]);
  });

  it("does not name a Pro seat, which the pre-filled set-up screen would not offer", () => {
    expect(offers(seat({ id: "pro", opening: "pro" }))).toEqual([]);
  });

  it("does not name a seat whose game differs in any other term", () => {
    expect(offers(seat({ rated: false }))).toEqual([]);
    expect(offers(seat({ obstacles: "hoshi" }))).toEqual([]);
    expect(offers(seat({ handicap: { ...NO_HANDICAP, stone: STONES.black } }))).toEqual([]);
    expect(offers(seat({ clockMode: "game" }))).toEqual([]);
    expect(offers(seat({ timeoutPenalty: "game" }))).toEqual([]);
  });

  it("names an untimed seat whatever clock settings it carries, and whatever its resign rule", () => {
    expect(offers(seat({ id: "untimed", moveTimeMs: null, clockMode: "game", timeoutPenalty: "game" }))).toEqual([
      "untimed",
    ]);
    expect(offers(seat({ id: "no-resign", allowResign: false }))).toEqual(["no-resign"]);
  });

  it("names a seat at a game whose only opening is Free", () => {
    expect(offers(seat({ id: "reversi", variant: "reversi", size: 8 }))).toEqual(["reversi"]);
  });

  it("does not name a seat on a board the set-up screen does not offer for that game", () => {
    expect(offers(seat({ size: 12 }))).toEqual([]);
  });

  /*
   * THE ORDER, which is the bug as it would be seen. The sentence keeps the
   * newest seat of each game, pace and board; cut first and narrowed after, a
   * newer Pro seat is the one kept, is then not offered, and the older Free seat
   * of the same kind — which would have been — is already gone.
   */
  it("narrows before one of each kind is kept, so a newer Pro seat does not hide an older Free one", () => {
    const newerPro = seat({ id: "pro", opening: "pro" });
    const olderFree = seat({ id: "free" });
    expect(ids(oneOfEachKind(seatsTheSentenceOffers([newerPro, olderFree])))).toEqual(["free"]);
  });
});
