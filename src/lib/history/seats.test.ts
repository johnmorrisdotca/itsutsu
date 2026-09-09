import { describe, expect, it } from "vitest";

import { seatIsFree } from "./seats";
import { STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * Whether a seat is still to be given out.
 *
 * A seat's link is the whole credential — it plays that seat on its own — so
 * this decides both what is advertised on the noticeboard and whose
 * credential is printed on screen. It used to short-circuit on a posted seat
 * and answer "free" whatever else was on the row, which is how a game stayed
 * on offer while one person played both colours of it.
 */
describe("seatIsFree", () => {
  const empty = { openSeat: null, blackClaimedAt: null, whiteClaimedAt: null, moveCount: 0 };

  it("offers a seat nobody has taken", () => {
    expect(seatIsFree(empty, STONES.black)).toBe(true);
    expect(seatIsFree(empty, STONES.white)).toBe(true);
  });

  it("stops offering a seat once somebody has taken it", () => {
    const taken = { ...empty, whiteClaimedAt: new Date() };
    expect(seatIsFree(taken, STONES.white)).toBe(false);
    expect(seatIsFree(taken, STONES.black)).toBe(true);
  });

  it("stops offering a POSTED seat once somebody has taken it", () => {
    /*
     * The bug. A posted seat used to be read as untaken "by definition",
     * which meant its link stayed on screen and the game stayed on the
     * noticeboard after it had been sat in — so the person who posted it
     * could take it themselves and play both sides, and a stranger could
     * answer a game that was already under way.
     */
    const posted = { ...empty, openSeat: STONES.white };
    expect(seatIsFree(posted, STONES.white), "before anybody answers").toBe(true);

    const answered = { ...posted, whiteClaimedAt: new Date() };
    expect(seatIsFree(answered, STONES.white), "after somebody answers").toBe(false);
  });

  it("offers nothing once a stone is down, whatever the seats say", () => {
    // Past inviting anybody: a link on screen is only a credential to read
    // over a shoulder, and a computer player never stamps a seat at all.
    const started = { ...empty, openSeat: STONES.white, moveCount: 1 };
    expect(seatIsFree(started, STONES.white)).toBe(false);
    expect(seatIsFree(started, STONES.black)).toBe(false);
  });
});
