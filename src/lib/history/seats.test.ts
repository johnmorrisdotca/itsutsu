import { describe, expect, it } from "vitest";

import { rulesAreSettled, seatIsFree } from "./seats";
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

/**
 * The rules of a shared game settle when the other player arrives, not when
 * somebody plays. Between sitting down and moving there used to be a window
 * where one seat could change what the other had just agreed to.
 */
describe("rulesAreSettled", () => {
  const nobody = { openSeat: null, blackClaimedAt: null, whiteClaimedAt: null, moveCount: 0 };

  it("leaves a game nobody has answered open", () => {
    // A creator who posted the wrong clock can still fix it.
    expect(rulesAreSettled({ ...nobody, openSeat: "white", blackClaimedAt: new Date() })).toBe(false);
  });

  it("leaves a challenge open until the other player opens it", () => {
    expect(rulesAreSettled({ ...nobody, blackClaimedAt: new Date() })).toBe(false);
  });

  it("settles them once the other seat is taken", () => {
    // This is the window that used to be open: both sitting, nobody moved yet.
    expect(rulesAreSettled({ ...nobody, blackClaimedAt: new Date(), whiteClaimedAt: new Date() })).toBe(true);
  });

  it("settles them once a posted seat has been answered, whatever the poster did", () => {
    /*
     * The case that matters most and the one a both-seats-claimed rule gets
     * wrong: the poster never opened their own link, so nothing is stamped
     * for them, and the answerer would have had the rules changed under them.
     */
    const posted = { ...nobody, openedAt: new Date(), openSeat: "white" as string | null };
    expect(rulesAreSettled(posted)).toBe(false);
    expect(rulesAreSettled({ ...posted, openSeat: null, whiteClaimedAt: new Date() })).toBe(true);
  });

  it("settles them once a stone is down, whoever followed a link", () => {
    // A computer player never follows one, so its seat is never stamped.
    expect(rulesAreSettled({ ...nobody, moveCount: 1 })).toBe(true);
  });
});
